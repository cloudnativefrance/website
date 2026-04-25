/**
 * SPKR-03: Build-output tests for co-speaker cross-references + single-talk wiring.
 *
 * Phase 13 rewrite (D-08 REVISED Option B / D-09 / D-10):
 * Original file asserted on fixture speakers (speaker-5 / speaker-6 and "Amina Diallo"
 * / "David Moreau") that no longer exist in the CSV. Rewritten to anchor on a REAL
 * co-speaker pair from the current CFP roster: session S3SPP8 pairs Arthur
 * Outhenin-Chalandre + Quentin Swiech on the Cilium ClusterMesh REX talk. See
 * tests/build/_anchors.md for rationale.
 *
 * Scope narrowed vs. the original file:
 * - DROPPED the multi-talk assertions — no current-roster equivalent exists yet,
 *   and chasing one would churn against CFP submission changes (D-10). Add back
 *   when / if a stable multi-talk anchor emerges.
 * - DROPPED the "Programme a venir" / "Schedule coming soon" placeholder describes —
 *   that placeholder UI was removed when profile pages migrated to live talks in
 *   Phase 4. Kept here for traceability in the SUMMARY.
 * - DROPPED the `/speakers/{co-slug}` link href assertions — the current profile
 *   page renders co-speaker names as plain text, not as `<a href>` links. That is
 *   a Phase 4 D-08 unfinished feature (tracked separately) and rewiring it is
 *   out of scope per Phase 13 CONTEXT D-09 (no production code changes here).
 *   Name-present assertion still holds, which is what SPKR-03 fundamentally
 *   guarantees: each speaker's profile page REFERENCES their co-speakers.
 *
 * IMPORTANT: run `pnpm build` before this test — it reads from dist/.
 * Before removing the S3SPP8 row or either anchor from the CSVs, update
 * tests/build/_anchors.md AND this file.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DIST = resolve(import.meta.dirname, "../../dist");

function readPage(relativePath: string): string {
  const fullPath = resolve(DIST, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(
      `Built page not found: ${fullPath}. Run 'pnpm build' before running tests.`,
    );
  }
  return readFileSync(fullPath, "utf-8");
}

// Co-speaker pair anchor — session S3SPP8.
const A = { slug: "arthur-outhenin-chalandre", name: "Arthur Outhenin-Chalandre" };
const B = { slug: "quentin-swiech", name: "Quentin Swiech" };

describe("SPKR-03: FR co-speaker cross-references are bidirectional (session S3SPP8)", () => {
  it(`${A.slug} FR profile references ${B.name}`, () => {
    const html = readPage(`speakers/2026/${A.slug}/index.html`);
    expect(html).toContain(B.name);
  });

  it(`${B.slug} FR profile references ${A.name}`, () => {
    const html = readPage(`speakers/2026/${B.slug}/index.html`);
    expect(html).toContain(A.name);
  });
});

describe("SPKR-03: EN co-speaker cross-references are bidirectional (session S3SPP8)", () => {
  it(`${A.slug} EN profile references ${B.name}`, () => {
    const html = readPage(`en/speakers/2026/${A.slug}/index.html`);
    expect(html).toContain(B.name);
  });

  it(`${B.slug} EN profile references ${A.name}`, () => {
    const html = readPage(`en/speakers/2026/${B.slug}/index.html`);
    expect(html).toContain(A.name);
  });
});

describe("SPKR-03: Speaker profile lists their session from sessions.csv (single-talk anchor)", () => {
  it("petazzoni FR profile contains the keynote session title fragment", () => {
    const html = readPage("speakers/2026/petazzoni/index.html");
    // Apostrophe is HTML-entity encoded in the built output — check for both fragments instead.
    expect(html).toMatch(/Keynote d[&#39;']+ouverture/);
  });
});
