/**
 * Source-shape guards on how the Pretalx token reaches the build.
 *
 * These exist because the failure they prevent is invisible: a build-arg works
 * exactly as well as a secret, produces an identical site, and passes every
 * other test — while writing the token into image history, where anyone who can
 * pull from the registry can read it back with `docker history`.
 *
 * There is no container runtime in CI's test job, so this asserts on the source
 * rather than on a built image. It is a tripwire against a plausible "fix",
 * not a substitute for building the image.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const dockerfile = readFileSync("Dockerfile", "utf8");
const workflow = readFileSync(".github/workflows/build-image.yml", "utf8");

describe("Dockerfile", () => {
  it("mounts the token as a BuildKit secret", () => {
    expect(dockerfile).toMatch(/--mount=type=secret,id=pretalx_token/);
  });

  it("never declares the token as an ARG", () => {
    // ARG values are recorded in image history. PUBLIC_SITE_URL is fine there —
    // it is a public URL — but a credential is not.
    expect(dockerfile).not.toMatch(/^\s*ARG\s+PRETALX_API_TOKEN/m);
    expect(dockerfile).not.toMatch(/^\s*ENV\s+PRETALX_API_TOKEN\s*=/m);
  });

  it("points the build at the mounted secret file, not an inline value", () => {
    expect(dockerfile).toMatch(/PRETALX_API_TOKEN_FILE=\/run\/secrets\/pretalx_token/);
  });

  it("requires the token, so a missing secret fails instead of shipping a stripped site", () => {
    expect(dockerfile).toMatch(/PRETALX_TOKEN_REQUIRED=1/);
  });
});

describe("build workflow", () => {
  it("passes the token through `secrets:`", () => {
    expect(workflow).toMatch(/secrets:\s*\|\s*\n\s*pretalx_token=\$\{\{\s*secrets\.PRETALX_API_TOKEN\s*\}\}/);
  });

  it("does not put the token in `build-args:`", () => {
    const buildArgs = workflow.slice(
      workflow.indexOf("build-args:"),
      workflow.indexOf("secrets:"),
    );
    expect(buildArgs).not.toMatch(/PRETALX/);
  });
});
