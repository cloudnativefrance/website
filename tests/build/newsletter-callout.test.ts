/**
 * Newsletter callout band guards.
 *
 * Three invariants:
 *   1. The six newsletter.* keys resolve in both locales.
 *   2. The six keys orphaned by the CTA consolidation are gone — leaving them
 *      behind would let a future edit resurrect a second entry point.
 *   3. The band renders exactly once on content pages and not at all on the
 *      opted-out ones (legal pages, ComingSoonLayout).
 *
 * Invariants 1-2 read the source dictionary and always run. Invariant 3 reads
 * built dist/ HTML and skips when dist is missing (run `pnpm build` first),
 * matching the other tests/build/ specs.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ui } from "@/i18n/ui";
import { NEWSLETTER_URL } from "@/lib/event";

const DIST = resolve(import.meta.dirname, "../../dist");
const HEADING_ID = "newsletter-callout-heading";

const NEW_KEYS = [
  "newsletter.heading",
  "newsletter.body",
  "newsletter.cta",
  "newsletter.cta_aria",
  "newsletter.note",
] as const;

/** Keys the consolidation orphaned; each had exactly one consumer, now deleted. */
const REMOVED_KEYS = [
  "hero.cta.newsletter",
  "hero.cta.newsletter_aria",
  "footer.newsletter.heading",
  "tickets.coming_soon.cta",
  "cfp.closed_for_now.cta",
  "cfp.closed_for_now.notify_text",
] as const;

/** Routes that must carry the band. One per layout family. */
const WITH_BAND = [
  "index.html",
  "en/index.html",
  "decouvrir/index.html",
  "cfp/index.html",
  "billetterie/index.html",
] as const;

/** Routes that opt out: legal pages, and ComingSoonLayout which is itself a newsletter appeal. */
const WITHOUT_BAND = [
  "privacy/index.html",
  "terms/index.html",
  "code-of-conduct/index.html",
  "en/privacy/index.html",
  "programme/2027/index.html",
] as const;

const distExists = existsSync(resolve(DIST, "index.html"));

function readPage(relative: string): string {
  return readFileSync(resolve(DIST, relative), "utf8");
}

describe("newsletter i18n keys", () => {
  for (const key of NEW_KEYS) {
    it(`${key} resolves in both locales`, () => {
      expect(ui.fr).toHaveProperty(key);
      expect(ui.en).toHaveProperty(key);
      expect((ui.fr as Record<string, string>)[key].length).toBeGreaterThan(0);
      expect((ui.en as Record<string, string>)[key].length).toBeGreaterThan(0);
    });
  }

  for (const key of REMOVED_KEYS) {
    it(`${key} is gone from both locales`, () => {
      expect(ui.fr).not.toHaveProperty(key);
      expect(ui.en).not.toHaveProperty(key);
    });
  }
});

describe("newsletter callout distribution", () => {
  for (const page of WITH_BAND) {
    it.skipIf(!distExists)(`${page} carries the band exactly once`, () => {
      const html = readPage(page);
      const occurrences = html.split(`id="${HEADING_ID}"`).length - 1;
      expect(occurrences).toBe(1);
    });
  }

  for (const page of WITHOUT_BAND) {
    it.skipIf(!distExists)(`${page} opts out of the band`, () => {
      expect(readPage(page)).not.toContain(HEADING_ID);
    });
  }
});

describe("newsletter callout CTA", () => {
  it.skipIf(!distExists)("links to the hosted signup form", () => {
    expect(readPage("index.html")).toContain(NEWSLETTER_URL);
  });

  it.skipIf(!distExists)("carries rel=noopener noreferrer on the outbound link", () => {
    const html = readPage("index.html");
    const anchor = html.slice(html.indexOf(NEWSLETTER_URL) - 200, html.indexOf(NEWSLETTER_URL) + 600);
    expect(anchor).toContain('rel="noopener noreferrer"');
    expect(anchor).toContain('target="_blank"');
  });

  it.skipIf(!distExists)("is the only newsletter entry point left on the homepage", () => {
    // Before consolidation the homepage carried two: the hero button and the
    // footer link. The band replaces both.
    const html = readPage("index.html");
    const occurrences = html.split(NEWSLETTER_URL).length - 1;
    expect(occurrences).toBe(1);
  });
});
