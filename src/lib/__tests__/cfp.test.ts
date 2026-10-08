import { describe, it, expect, vi } from "vitest";

// The demo gate reads CFP_DEMO from astro:env, which only exists under the
// Astro runtime. Unset here; every gate case passes its own `toggle`.
vi.mock("astro:env/server", () => ({ CFP_DEMO: undefined }));

import { CFP } from "@/config/cfp";
import { ui, type Locale } from "@/i18n/ui";
import {
  DEMO_PHASES,
  cfpDemosEnabled,
  demoPath,
  demoStaticPaths,
} from "@/lib/cfp/demo";

describe("cfp phase registry", () => {
  it("ships a phase the dispatcher knows how to render", () => {
    expect(DEMO_PHASES).toContain(CFP.currentPhase);
  });

  it("routes every phase copy through the phase system's own keys", () => {
    const LOCALES: Locale[] = ["fr", "en"];
    const PHASE_KEYS = [
      "cfp.coming_soon.title",
      "cfp.coming_soon.body",
      "cfp.closed.title",
      "cfp.closed.body",
      "cfp.meta.title",
      "cfp.meta.description",
    ] as const;
    for (const locale of LOCALES) {
      for (const key of PHASE_KEYS) {
        expect(ui[locale][key], `${key} missing in ${locale}`).toBeTruthy();
      }
    }
    // The cfp namespace stays curated: only the legacy UI keys (cfp.status.*,
    // cfp.cta.*, …) and the phase keys above. A resurrection of a retired
    // flag-era key (or a locale-drifted addition) trips this.
    const ALLOWED = new Set<string>([
      ...PHASE_KEYS,
      "cfp.heading",
      "cfp.status.coming_soon",
      "cfp.status.open",
      "cfp.status.closed",
      "cfp.description.coming_soon",
      "cfp.description.open",
      "cfp.closed.note",
      "cfp.cta.notify",
      "cfp.cta.submit",
      "cfp.deadline",
    ]);
    for (const locale of LOCALES) {
      for (const key of Object.keys(ui[locale])) {
        if (key.startsWith("cfp.")) {
          expect(ALLOWED.has(key), `unexpected cfp key "${key}" in ${locale}`).toBe(
            true,
          );
        }
      }
    }
  });
});

describe("demo gate", () => {
  const prod = { PUBLIC_SITE_URL: "" };
  const staging = { PUBLIC_SITE_URL: "https://staging.cloudnativedays.fr" };

  it("is off in any build without CFP_DEMO, on under astro dev unless CFP_DEMO=false", () => {
    for (const env of [prod, staging])
      expect(cfpDemosEnabled({ env, dev: false })).toBe(false);
    expect(cfpDemosEnabled({ env: prod, dev: true })).toBe(true);
    expect(cfpDemosEnabled({ toggle: false, env: prod, dev: true })).toBe(
      false,
    );
  });

  it("is on for a staging build with CFP_DEMO=true", () => {
    expect(cfpDemosEnabled({ toggle: true, env: staging, dev: false })).toBe(
      true,
    );
  });

  it("refuses CFP_DEMO=true on a production-origin build, the empty PUBLIC_SITE_URL of CI included", () => {
    for (const env of [
      prod,
      {},
      { PUBLIC_SITE_URL: "https://cloudnativedays.fr" },
    ]) {
      expect(() => cfpDemosEnabled({ toggle: true, env, dev: false })).toThrow(
        /CFP_DEMO/,
      );
    }
  });

  it("uses URL-safe, unaccented slugs under /cfp/demo/ and /en/cfp/demo/ — the sitemap filter keeps the demo pages out of the index", () => {
    expect(DEMO_PHASES.map((p) => demoPath(p, "fr"))).toEqual([
      "/cfp/demo/avant-ouverture/",
      "/cfp/demo/ouvert/",
      "/cfp/demo/cloture/",
    ]);
    for (const { props } of demoStaticPaths()) {
      expect(demoPath(props.phase, "fr")).toMatch(/^\/cfp\/demo\/[a-z-]+\/$/);
      expect(demoPath(props.phase, "en")).toMatch(
        /^\/en\/cfp\/demo\/[a-z-]+\/$/,
      );
    }
  });
});
