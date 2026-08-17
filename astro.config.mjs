// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Use relative import to resolve @ alias at config load time
import { generateFlagEnvSchema } from "./src/config/flags-env.ts";
import { PROD_ORIGIN } from "./src/lib/site-env.ts";

// https://astro.build/config
// Build is fully static; bump this file to force a CI rebuild that
// re-fetches the upstream Google Sheets at compile time.
export default defineConfig({
  // Driven by PUBLIC_SITE_URL so staging builds advertise their own origin in
  // canonical URLs, hreflang, OG image URLs and the sitemap. Defaults to
  // production (`||`, not `??`, so an empty string also falls back), so every
  // existing build path is unchanged.
  site: process.env.PUBLIC_SITE_URL || PROD_ORIGIN,
  redirects: {
    "/programme":    "/programme/2026",
    "/sponsors":     "/sponsors/2026",
    "/speakers":     "/speakers/2026",
    // The FR slugs need their own entries: nginx rewrites /sponsors ->
    // /partenaires and /speakers -> /intervenants before Astro's redirects
    // above ever run, and with no year in the path that lands on a bare
    // /partenaires or /intervenants, which the build does not emit. Both were
    // a 404 on production — /speakers has been a dead link, first behind a
    // wrong port and then behind a missing page.
    "/partenaires":  "/partenaires/2026",
    "/intervenants": "/intervenants/2026",
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
