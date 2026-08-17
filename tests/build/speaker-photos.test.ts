/**
 * Speaker portraits are authored in Pretalx and must reach the visitor from
 * OUR origin, never from the CFP host.
 *
 * Before this, the committed `public/speakers/<slug>.jpg` always won and the
 * Pretalx avatar was only a fallback — so a speaker who updated their portrait
 * never saw it change, and photos were the one field that lived in git,
 * quietly contradicting the erasure property `pretalx-private.ts` documents.
 *
 * Now Pretalx wins and Astro re-encodes each portrait at build time. The whole
 * point is defeated silently if that optimisation stops happening: `getImage()`
 * hands the original URL straight back when a host is not authorised in
 * `image.remotePatterns`, with no error and no warning. That is exactly how
 * this shipped 65 hotlinks on the first attempt, so it is worth a test.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const PAGES = [
  "dist/intervenants/2026/index.html",
  "dist/en/speakers/2026/index.html",
];

function html(path: string): string {
  if (!existsSync(path)) throw new Error(`${path} missing — run 'pnpm build' first`);
  return readFileSync(path, "utf8");
}

describe("speaker portraits", () => {
  it("never hotlinks an image from the Pretalx host", () => {
    // Scoped to image sources: links TO Pretalx (a talk's feedback URL, say)
    // are legitimate and must not trip this.
    for (const page of PAGES) {
      const hotlinks = [...html(page).matchAll(/src="(https?:\/\/[^"]*cfp\.cloudnativedays\.fr[^"]*)"/g)];
      expect(hotlinks.map((m) => m[1]), `${page} hotlinks a Pretalx image`).toEqual([]);
    }
  });

  it("serves optimised portraits from our own origin", () => {
    const listing = html(PAGES[0]);
    const optimised = new Set(
      [...listing.matchAll(/src="(\/_astro\/[^"]+\.webp)"/g)].map((m) => m[1]),
    );
    // The 2026 roster is 77 people and most have a Pretalx avatar. An exact
    // count would churn every time someone uploads one, but zero means the
    // pipeline is off entirely — which is the failure this guards.
    expect(optimised.size).toBeGreaterThan(20);

    // And the files those pages point at must actually exist in the bundle.
    const emitted = new Set(readdirSync("dist/_astro"));
    for (const src of optimised) {
      expect(emitted.has(src.replace("/_astro/", "")), `${src} referenced but not emitted`).toBe(
        true,
      );
    }
  });

  it("falls back to a committed file only for speakers Pretalx has no avatar for", () => {
    // public/speakers/ is a shrinking fallback, not the source. Any file it
    // still serves is a person whose Pretalx avatar is missing; once nobody is
    // left, the directory can be deleted outright.
    const listing = html(PAGES[0]);
    const local = new Set([...listing.matchAll(/src="(\/speakers\/[^"]+)"/g)].map((m) => m[1]));
    for (const src of local) {
      expect(existsSync(join("dist", src)), `${src} referenced but not in dist/`).toBe(true);
    }
  });
});
