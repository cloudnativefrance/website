import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The demo gate reads CFP_DEMO from astro:env, which only exists under the
// Astro runtime.
vi.mock("astro:env/server", () => ({ CFP_DEMO: undefined }));

import { ui, type Locale } from "@/i18n/ui";
import { PROGRAMME_PHASES } from "@/lib/programme-phase";
import {
  programmeDemoPath,
  programmeDemoStaticPaths,
} from "@/lib/programme/demo";

const ASTRO_CONFIG = readFileSync(
  resolve(import.meta.dirname, "../../../astro.config.mjs"),
  "utf-8",
);

describe("programme demo", () => {
  it("has one page per phase, at URL-safe slugs under /programme/demo/", () => {
    expect(PROGRAMME_PHASES.map((p) => programmeDemoPath(p, "fr"))).toEqual([
      "/programme/demo/cfp-avant-ouverture/",
      "/programme/demo/cfp-ouvert/",
      "/programme/demo/cfp-cloture/",
      "/programme/demo/annonce/",
    ]);
    expect(programmeDemoStaticPaths().map(({ props }) => props.phase)).toEqual(
      PROGRAMME_PHASES,
    );
    expect(programmeDemoPath("announced", "en")).toBe(
      "/en/programme/demo/annonce/",
    );
  });

  it("keeps the demo pages out of the sitemap, both locales", () => {
    expect(ASTRO_CONFIG).toContain(
      String.raw`!/\/programme\/demo(\/|$)/.test(page)`,
    );
    expect(ASTRO_CONFIG).toContain(
      String.raw`!/\/en\/programme\/demo(\/|$)/.test(page)`,
    );
  });
});

describe("programme 'being built' copy", () => {
  it("exists for every pre-announcement phase, in both locales", () => {
    for (const lang of Object.keys(ui) as Locale[]) {
      for (const phase of ["coming_soon", "open", "closed"] as const) {
        // Array form: a dotted string would be read as a nested path.
        expect(ui[lang]).toHaveProperty([`programme.building.${phase}.title`]);
        expect(ui[lang]).toHaveProperty([`programme.building.${phase}.body`]);
      }
    }
  });
});
