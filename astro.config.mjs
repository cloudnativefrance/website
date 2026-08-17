// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Use relative import to resolve @ alias at config load time
import { generateFlagEnvSchema } from "./src/config/flags-env.ts";
import { PROD_ORIGIN } from "./src/lib/site-env.ts";
import { loadLocalEnv } from "./scripts/load-local-env.mjs";

// Astro surfaces .env values through import.meta.env, not process.env, and the
// Pretalx reads use process.env so the same code works with a Docker secret
// file. Load them here so `pnpm dev` and `pnpm build` pick up .env.local with no
// shell ceremony. A real env var still wins, so CI is unaffected.
loadLocalEnv();

// Speaker portraits are authored in Pretalx, so Astro has to be told that host
// is allowed to have its images optimised. Without this entry `getImage()`
// refuses the URL and every portrait silently falls back to a hotlink.
// Derived from the same env var the rest of the Pretalx code reads, so pointing
// a build at a different instance does not need a second edit here.
const pretalxUrl = new URL(process.env.PRETALX_BASE_URL || "https://cfp.cloudnativedays.fr");

// https://astro.build/config
// Build is fully static; bump this file to force a CI rebuild that
// re-fetches the upstream Google Sheets at compile time.
export default defineConfig({
  image: {
    remotePatterns: [
      { protocol: pretalxUrl.protocol.replace(":", ""), hostname: pretalxUrl.hostname },
    ],
  },
  // Driven by PUBLIC_SITE_URL so staging builds advertise their own origin in
  // canonical URLs, hreflang, OG image URLs and the sitemap. Defaults to
  // production (`||`, not `??`, so an empty string also falls back), so every
  // existing build path is unchanged.
  site: process.env.PUBLIC_SITE_URL || PROD_ORIGIN,
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
