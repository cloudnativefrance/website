import { defineConfig } from "vitest/config";
import { resolve } from "path";
// Vitest does not read astro.config.mjs, so the same loader runs here — without
// it, `pnpm test` would skip every token-dependent test while `pnpm build`
// succeeded, which reads as "those tests pass" rather than "never ran".
import { loadLocalEnv } from "./scripts/load-local-env.mjs";

loadLocalEnv();

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
