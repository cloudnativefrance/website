import { configDefaults, defineConfig } from "vitest/config";
import { getViteConfig } from "astro/config";
import { resolve } from "path";
// Vitest does not read astro.config.mjs, so the same loader runs here — without
// it, `pnpm test` would skip every token-dependent test while `pnpm build`
// succeeded, which reads as "those tests pass" rather than "never ran".
import { loadLocalEnv } from "./scripts/load-local-env.mjs";

loadLocalEnv();

// Two projects share one `pnpm test` run:
// - "unit": the original plain-Node project, unchanged, for every existing
//   *.test.ts file (none of which import a `.astro` file).
// - "astro-components": only for tests that render an `.astro` component via
//   the container API. Those need Astro's own Vite plugin (`getViteConfig`)
//   to parse `.astro` files at all — the plain project's `vite:import-analysis`
//   otherwise rejects them as invalid JS. Scoped narrowly so the heavier
//   Astro-aware pipeline doesn't run for the other ~350 tests.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
          },
        },
        test: {
          name: "unit",
          environment: "node",
          // Keep Vitest's own defaults (node_modules, .git) and additionally
          // hand off anything under a component's __tests__ dir to the
          // "astro-components" project below.
          exclude: [...configDefaults.exclude, "src/components/**/__tests__/**"],
        },
      },
      getViteConfig({
        test: {
          name: "astro-components",
          environment: "node",
          include: ["src/components/**/__tests__/*.test.ts"],
        },
      }),
    ],
  },
});
