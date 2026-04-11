/**
 * SPKR-01: Build-output tests for the speaker grid pages.
 *
 * Verifies that /speakers/ (FR) and /en/speakers/ (EN) are generated with:
 * - All 6 speaker names present
 * - Responsive grid CSS classes present
 * - Keynote speakers appear in the HTML before non-keynote speakers
 * - Keynote badge rendered for keynote speakers
 * - Page heading rendered in the correct locale
 */

import { describe, it, expect, beforeAll } from "vitest";
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

// Speaker names as they appear in the sample content
const ALL_SPEAKER_NAMES = [
  "Marie Laurent",
  "Thomas Nguyen",
  "Sarah Chen",
  "Lucas Martin",
  "Amina Diallo",
  "David Moreau",
];
const KEYNOTE_NAMES = ["Marie Laurent", "Thomas Nguyen"];
const NON_KEYNOTE_NAMES = ["Sarah Chen", "Lucas Martin", "Amina Diallo", "David Moreau"];

describe("SPKR-01: FR speaker grid page (/speakers/index.html)", () => {
  let html: string;

  beforeAll(() => {
    html = readPage("speakers/index.html");
  });

  it("generates the FR speaker grid page", () => {
    expect(html).toBeTruthy();
  });

  it("renders all 6 speaker names", () => {
    for (const name of ALL_SPEAKER_NAMES) {
      expect(html, `Expected speaker name "${name}" in FR grid`).toContain(name);
    }
  });

  it("includes responsive grid CSS classes (4/3/2/1 column breakpoints)", () => {
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("xl:grid-cols-4");
  });

  it("renders keynote badge for keynote speakers", () => {
    // The badge text 'Keynote' must appear at least twice (once per keynote speaker)
    const matches = html.match(/Keynote/g);
    expect(matches, "Expected at least 2 Keynote badges in FR grid").not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("places keynote speakers before non-keynote speakers in the document", () => {
    const firstKeynotePos = Math.min(
      ...KEYNOTE_NAMES.map((n) => html.indexOf(n)),
    );
    const firstNonKeynotePos = Math.min(
      ...NON_KEYNOTE_NAMES.map((n) => html.indexOf(n)),
    );
    expect(firstKeynotePos).toBeLessThan(firstNonKeynotePos);
  });

  it("renders the FR page heading 'Nos Speakers'", () => {
    expect(html).toContain("Nos Speakers");
  });
});

describe("SPKR-01: EN speaker grid page (/en/speakers/index.html)", () => {
  let html: string;

  beforeAll(() => {
    html = readPage("en/speakers/index.html");
  });

  it("generates the EN speaker grid page", () => {
    expect(html).toBeTruthy();
  });

  it("renders all 6 speaker names in EN grid", () => {
    for (const name of ALL_SPEAKER_NAMES) {
      expect(html, `Expected speaker name "${name}" in EN grid`).toContain(name);
    }
  });

  it("includes responsive grid CSS classes in EN grid", () => {
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("xl:grid-cols-4");
  });

  it("renders the EN page heading 'Our Speakers'", () => {
    expect(html).toContain("Our Speakers");
  });

  it("places keynote speakers before non-keynote speakers in EN grid", () => {
    const firstKeynotePos = Math.min(
      ...KEYNOTE_NAMES.map((n) => html.indexOf(n)),
    );
    const firstNonKeynotePos = Math.min(
      ...NON_KEYNOTE_NAMES.map((n) => html.indexOf(n)),
    );
    expect(firstKeynotePos).toBeLessThan(firstNonKeynotePos);
  });
});
