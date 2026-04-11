import Client, { connect } from "@dagger.io/dagger";

/**
 * Build the Astro site in a Node 22 container and return the dist output.
 */
async function buildSite(client: Client) {
  const source = client.host().directory(".", {
    exclude: ["node_modules", "dist", ".git", ".astro", "dagger"],
  });

  const buildContainer = client
    .container()
    .from("node:22-alpine")
    .withExec(["corepack", "enable", "pnpm"])
    .withDirectory("/app", source)
    .withWorkdir("/app")
    .withExec(["pnpm", "install", "--frozen-lockfile"])
    .withExec(["pnpm", "run", "build"]);

  return buildContainer.directory("/app/dist");
}

/**
 * Build the final nginx container image with the Astro static output.
 */
async function build(client: Client) {
  const dist = await buildSite(client);

  const nginxConf = client
    .host()
    .directory(".", { include: ["nginx/nginx.conf"] });

  const container = client
    .container()
    .from("alpine:3.21")
    .withExec(["apk", "add", "--no-cache", "nginx"])
    .withFile("/etc/nginx/nginx.conf", nginxConf.file("nginx/nginx.conf"))
    .withDirectory("/usr/share/nginx/html", dist)
    .withExposedPort(8080)
    .withEntrypoint(["nginx", "-g", "daemon off;"]);

  return container;
}

/**
 * Test that the built container serves HTTP 200 on port 8080.
 */
async function test(client: Client) {
  const container = await build(client);

  const service = container.asService();

  const result = await client
    .container()
    .from("alpine:3.21")
    .withExec(["apk", "add", "--no-cache", "curl"])
    .withServiceBinding("web", service)
    .withExec([
      "sh",
      "-c",
      "curl -sf http://web:8080/ | grep -q 'Cloud Native'",
    ])
    .stdout();

  console.log("Test passed: container serves Cloud Native content");
  return result;
}

connect(
  async (client: Client) => {
    const args = process.argv.slice(2);
    const command = args[0] || "build";

    switch (command) {
      case "build": {
        const container = await build(client);
        await container.sync();
        console.log("Build completed successfully");
        break;
      }
      case "test": {
        await test(client);
        break;
      }
      case "publish": {
        const registry = args[1];
        if (!registry) {
          console.error("Usage: publish <registry/image:tag>");
          process.exit(1);
        }
        const container = await build(client);
        const digest = await container.publish(registry);
        console.log(`Published: ${digest}`);
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  },
  { LogOutput: process.stderr },
);
