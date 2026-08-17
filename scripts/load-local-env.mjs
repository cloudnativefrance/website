import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load `.env.local` (then `.env`) into `process.env` for local development.
 *
 * Astro exposes `.env` values through `import.meta.env`, NOT through
 * `process.env` — verified, not assumed. The Pretalx code reads `process.env`
 * because it also has to work inside a Docker build where the token arrives as a
 * mounted secret file, so without this the file would sit there looking correct
 * while every build silently produced a site with no speaker affiliations and no
 * level chips. Failing that way is worse than not supporting `.env` at all.
 *
 * Rules:
 * - A real environment variable always wins. CI sets the token by other means,
 *   and a shell `PRETALX_API_TOKEN=… pnpm build` must still override the file.
 * - `.env.local` wins over `.env`.
 * - Only used locally. Nothing here runs in the production image, which mounts
 *   the token as a BuildKit secret instead.
 */
export function loadLocalEnv(cwd = process.cwd()) {
  // Merge the files FIRST, then apply. Writing straight into process.env as we
  // read meant .env.local could never override .env: once .env had set a key,
  // the "is it already set?" guard below could no longer tell a value the shell
  // exported from one this function had just written a moment earlier, so it
  // declined to overwrite its own work. The documented precedence was inverted
  // in exactly the case it exists for — both files present, disagreeing.
  const fromFiles = new Map();
  // Later file wins: .env.local overrides .env.
  for (const name of [".env", ".env.local"]) {
    const path = join(cwd, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Strip one layer of matching quotes, as dotenv-style files often carry them.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      fromFiles.set(key, value);
    }
  }

  const loaded = [];
  for (const [key, value] of fromFiles) {
    // A real env var wins — never clobber what the shell or CI already set.
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded.push(key);
    }
  }
  return loaded;
}
