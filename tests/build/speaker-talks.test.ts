/**
 * SPKR-03: Build-output tests for co-speaker cross-references.
 *
 * Verifies bidirectional co-speaker linking:
 * - speaker-5 (Amina Diallo) profile shows speaker-6 (David Moreau) as co-speaker
 * - speaker-6 (David Moreau) profile shows speaker-5 (Amina Diallo) as co-speaker
 * - speaker-4 (Lucas Martin) has two separate talks (talk-4 + talk-6) on their profile
 * - Schedule links render as muted placeholder text (not a live <a> link)
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

describe("SPKR-03: Co-speaker cross-references are bidirectional", () => {
  let speaker5Html: string;
  let speaker6Html: string;

  beforeAll(() => {
    speaker5Html = readPage("speakers/speaker-5/index.html");
    speaker6Html = readPage("speakers/speaker-6/index.html");
  });

  it("speaker-5 (Amina Diallo) profile references speaker-6 (David Moreau) as co-speaker", () => {
    expect(speaker5Html).toContain("David Moreau");
  });

  it("speaker-6 (David Moreau) profile references speaker-5 (Amina Diallo) as co-speaker", () => {
    expect(speaker6Html).toContain("Amina Diallo");
  });

  it("co-speaker link on speaker-5 profile points to speaker-6 profile URL", () => {
    // The co-speaker name must appear as a link href to speaker-6
    expect(speaker5Html).toContain("/speakers/speaker-6");
  });

  it("co-speaker link on speaker-6 profile points to speaker-5 profile URL", () => {
    expect(speaker6Html).toContain("/speakers/speaker-5");
  });

  it("shared talk (CI/CD) appears on both speaker-5 and speaker-6 profiles", () => {
    expect(speaker5Html).toContain("CI/CD");
    expect(speaker6Html).toContain("CI/CD");
  });
});

describe("SPKR-03: EN co-speaker cross-references are bidirectional", () => {
  let speaker5Html: string;
  let speaker6Html: string;

  beforeAll(() => {
    speaker5Html = readPage("en/speakers/speaker-5/index.html");
    speaker6Html = readPage("en/speakers/speaker-6/index.html");
  });

  it("EN speaker-5 profile references speaker-6 (David Moreau) as co-speaker", () => {
    expect(speaker5Html).toContain("David Moreau");
  });

  it("EN speaker-6 profile references speaker-5 (Amina Diallo) as co-speaker", () => {
    expect(speaker6Html).toContain("Amina Diallo");
  });

  it("EN co-speaker link on speaker-5 profile points to speaker-6 EN profile URL", () => {
    expect(speaker5Html).toContain("/en/speakers/speaker-6");
  });

  it("EN co-speaker link on speaker-6 profile points to speaker-5 EN profile URL", () => {
    expect(speaker6Html).toContain("/en/speakers/speaker-5");
  });
});

describe("SPKR-03: Multi-talk speaker shows all talks", () => {
  it("speaker-4 (Lucas Martin) FR profile shows two distinct talks (Zero Trust + eBPF)", () => {
    const html = readPage("speakers/speaker-4/index.html");
    // talk-4: Zero Trust Kubernetes, talk-6: eBPF security
    expect(html).toContain("Zero");
    expect(html).toContain("eBPF");
  });

  it("speaker-3 (Sarah Chen) FR profile shows two distinct talks (OpenTelemetry + multi-cloud)", () => {
    const html = readPage("speakers/speaker-3/index.html");
    // talk-3: OpenTelemetry, talk-8: Scaling Kubernetes multi-cloud
    expect(html).toContain("OpenTelemetry");
    expect(html).toContain("multi-cloud");
  });
});

describe("SPKR-03: Schedule placeholder renders as non-interactive text", () => {
  it("FR speaker-1 profile has schedule placeholder text, not a schedule link", () => {
    const html = readPage("speakers/speaker-1/index.html");
    expect(html).toContain("Programme a venir");
    // The placeholder must be in a <span>, not inside an <a href>
    // We verify that the phrase is not wrapped in an anchor with href
    const placeholderIdx = html.indexOf("Programme a venir");
    const surroundingContext = html.slice(
      Math.max(0, placeholderIdx - 100),
      placeholderIdx + 30,
    );
    expect(surroundingContext).not.toMatch(/<a\s[^>]*href/);
  });

  it("EN speaker-1 profile has 'Schedule coming soon' as placeholder text", () => {
    const html = readPage("en/speakers/speaker-1/index.html");
    expect(html).toContain("Schedule coming soon");
  });
});
