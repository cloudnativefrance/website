/**
 * SPKR-02: Build-output tests for individual speaker profile pages.
 *
 * Phase 13 rewrite (D-08 REVISED Option B / D-09 / D-10):
 * Original file asserted on fixture speakers (speaker-1..6, "Marie Laurent" etc)
 * that no longer exist — the CSV now holds 65 real CFP speakers. Rewritten to
 * anchor on a documented subset of real speakers (see tests/build/_anchors.md).
 *
 * Scope: proves each FR + EN anchor profile page is generated, renders the
 * speaker's name, and wires the locale-appropriate back-nav. Bio/company/photo
 * /social are covered by UI-SPEC checks elsewhere; we only need SPKR-02's
 * "page exists per speaker, wired to i18n" signal here.
 *
 * IMPORTANT: run `pnpm build` before this test — it reads from dist/.
 * Before removing any anchor row from speakers.csv, update tests/build/_anchors.md AND this file.
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

// See tests/build/_anchors.md for rationale. Names MUST match speakers.csv verbatim (diacritics included).
const ANCHORS: ReadonlyArray<{ slug: string; name: string }> = [
  { slug: "petazzoni", name: "Jérôme Petazzoni" },
  { slug: "arthur-outhenin-chalandre", name: "Arthur Outhenin-Chalandre" },
  { slug: "quentin-swiech", name: "Quentin Swiech" },
  { slug: "vache", name: "Aurélie Vache" },
];

describe("SPKR-02: FR speaker profile pages exist for each anchor", () => {
  for (const anchor of ANCHORS) {
    it(`${anchor.slug}: FR page contains speaker name`, () => {
      const html = readPage(`speakers/2026/${anchor.slug}/index.html`);
      expect(html).toContain(anchor.name);
    });

    it(`${anchor.slug}: FR page contains back-nav "Retour aux speakers"`, () => {
      const html = readPage(`speakers/2026/${anchor.slug}/index.html`);
      expect(html).toContain("Retour aux speakers");
    });
  }
});

describe("SPKR-02: EN speaker profile pages exist for each anchor", () => {
  for (const anchor of ANCHORS) {
    it(`${anchor.slug}: EN page contains speaker name`, () => {
      const html = readPage(`en/speakers/2026/${anchor.slug}/index.html`);
      expect(html).toContain(anchor.name);
    });

    it(`${anchor.slug}: EN page contains back-nav "Back to speakers"`, () => {
      const html = readPage(`en/speakers/2026/${anchor.slug}/index.html`);
      expect(html).toContain("Back to speakers");
    });
  }
});
