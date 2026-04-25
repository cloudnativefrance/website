// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Use relative import to resolve @ alias at config load time
import { generateFlagEnvSchema } from "./src/config/flags-env.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://cloudnativedays.fr",
  redirects: {
    "/programme":    "/programme/2026",
    "/sponsors":     "/sponsors/2026",
    "/speakers":     "/speakers/2026",
    "/en/programme": "/en/programme/2026",
    "/en/sponsors":  "/en/sponsors/2026",
    "/en/speakers":  "/en/speakers/2026",
    // Slug renames — keep old URLs alive for SEO + inbound links.
    "/venue":            "/informations-utiles",
    "/en/venue":         "/en/informations-utiles",
    "/about":            "/decouvrir",
    "/en/about":         "/en/decouvrir",
  },
  integrations: [
    react(),
    sitemap({
      // Phase 8 / D-07: /replays is invisible pre-event. We ship static HTML
      // and don't redeploy post-event just to add routes to the sitemap, so
      // these routes are excluded permanently. Post-event inbound links come
      // from CountdownTimer and the conditional nav entry.
      filter: (page) =>
        !/\/replays\/?$/.test(page) && !/\/en\/replays\/?$/.test(page),
      i18n: {
        defaultLocale: "fr",
        locales: { fr: "fr-FR", en: "en-US" },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    fallback: {
      en: "fr",
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: ["sans-serif"],
    },
  ],
  env: {
    schema: Object.fromEntries(
      Object.entries(generateFlagEnvSchema()).map(([key, entry]) => [
        key,
        envField.enum(entry),
      ]),
    ),
  },
});
