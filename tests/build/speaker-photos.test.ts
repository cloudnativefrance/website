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
 *
 * 2026 is frozen (`access: "frozen"`) — its archive carries committed
 * `/speakers/*.jpg` for every portrait, so for that edition the committed rung
 * IS the source and the optimised count is what the pipeline guard reads.
 * Never hotlinking stays the invariant either way.
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

  it("serves portraits from our own origin", () => {
    const listing = html(PAGES[0]);
    const optimised = new Set(
      [...listing.matchAll(/src="(\/_astro\/[^"]+\.webp)"/g)].map((m) => m[1]),
    );
    const committed = new Set(
      [...listing.matchAll(/src="(\/speakers\/[^"]+)"/g)].map((m) => m[1]),
    );
    // 2026 is frozen: every portrait comes from the committed rung, so the
    // committed count is the one under test. For a live-fetched edition the
    // optimised count is what this would guard. Zero of both means the
    // portrait pipeline is off entirely — which is the failure this guards.
    expect(Math.max(optimised.size, committed.size)).toBeGreaterThan(20);

    // And the files those pages point at must actually exist in the bundle.
    const emitted = new Set(readdirSync("dist/_astro"));
    for (const src of optimised) {
      expect(
        emitted.has(src.replace("/_astro/", "")),
        `${src} referenced but not emitted`,
      ).toBe(true);
    }
    for (const src of committed) {
      expect(
        existsSync(join("dist", src)),
        `${src} referenced but not in dist/`,
      ).toBe(true);
    }
  });

  it("keeps the frozen archive 100% local — no Pretalx URL may be committed", () => {
    // The freeze (scripts/freeze-edition.ts) promises the archive never puts
    // Pretalx back on a page's critical path. Assert the DATA, not just one
    // build's HTML: an absolute URL that slips into the archive is a leak
    // waiting for the next rebuild, dist or no dist.
    const archive = JSON.parse(
      readFileSync("src/content/schedule/speakers-2026.json", "utf8"),
    ) as { slug: string; photo_url: string }[];
    const remote = archive
      .filter((r) => /^https?:\/\//.test(r.photo_url))
      .map((r) => r.slug);
    expect(remote, `Pretalx URLs committed for: ${remote.join(", ")}`).toEqual(
      [],
    );
  });
});
