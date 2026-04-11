/**
 * SPKR-02: Build-output tests for individual speaker profile pages.
 *
 * Verifies that all 6 FR and 6 EN speaker profile pages are generated and that
 * each page contains the speaker's name, their talk title, and back navigation.
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

// Speaker slugs matching the sample content
const SPEAKER_SLUGS = [
  "speaker-1",
  "speaker-2",
  "speaker-3",
  "speaker-4",
  "speaker-5",
  "speaker-6",
];

const SPEAKER_DATA: Record<string, { name: string; talkTitle: string }> = {
  "speaker-1": { name: "Marie Laurent", talkTitle: "Crossplane" },
  "speaker-2": { name: "Thomas Nguyen", talkTitle: "GitOps" },
  "speaker-3": { name: "Sarah Chen", talkTitle: "OpenTelemetry" },
  "speaker-4": { name: "Lucas Martin", talkTitle: "Zero" },
  "speaker-5": { name: "Amina Diallo", talkTitle: "CI/CD" },
  "speaker-6": { name: "David Moreau", talkTitle: "CI/CD" },
};

describe("SPKR-02: FR speaker profile pages generated for all 6 speakers", () => {
  for (const slug of SPEAKER_SLUGS) {
    it(`generates FR profile page for ${slug} (${SPEAKER_DATA[slug].name})`, () => {
      const html = readPage(`speakers/${slug}/index.html`);
      expect(html).toContain(SPEAKER_DATA[slug].name);
    });

    it(`FR profile for ${slug} contains their talk content`, () => {
      const html = readPage(`speakers/${slug}/index.html`);
      expect(html).toContain(SPEAKER_DATA[slug].talkTitle);
    });

    it(`FR profile for ${slug} contains back navigation to speaker grid`, () => {
      const html = readPage(`speakers/${slug}/index.html`);
      // Back link text from i18n FR key "speakers.back"
      expect(html).toContain("Retour aux speakers");
    });
  }
});

describe("SPKR-02: EN speaker profile pages generated for all 6 speakers", () => {
  for (const slug of SPEAKER_SLUGS) {
    it(`generates EN profile page for ${slug} (${SPEAKER_DATA[slug].name})`, () => {
      const html = readPage(`en/speakers/${slug}/index.html`);
      expect(html).toContain(SPEAKER_DATA[slug].name);
    });

    it(`EN profile for ${slug} contains their talk content`, () => {
      const html = readPage(`en/speakers/${slug}/index.html`);
      expect(html).toContain(SPEAKER_DATA[slug].talkTitle);
    });

    it(`EN profile for ${slug} contains back navigation to speaker grid`, () => {
      const html = readPage(`en/speakers/${slug}/index.html`);
      // Back link text from i18n EN key "speakers.back"
      expect(html).toContain("Back to speakers");
    });
  }
});
