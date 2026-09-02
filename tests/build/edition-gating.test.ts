/**
 * Guards the edition gate on every 2027-capable route.
 *
 * Source-shape guard: a full build per case is too slow, and the property being
 * guarded is structural — that each route asks isEditionLoadable, and that the
 * per-speaker routes ask it in getStaticPaths rather than only in the body.
 *
 * A gated page body is not enough for a [slug] route: it still emits one HTML
 * file per speaker, publishing the speaker's name in the URL, in dist/ and in
 * the sitemap. A "coming soon" body over a URL that names the person is a leak.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

const PROGRAMME_ROUTES = [
  "src/pages/programme/[year].astro",
  "src/pages/en/programme/[year].astro",
];

describe.each(PROGRAMME_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("imports isEditionLoadable", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toContain("@/lib/edition-visibility");
  });

  it("derives readiness from it", () => {
    expect(source).toMatch(
      /const\s+programmeReady\s*=\s*isEditionLoadable\(\s*year\s*\)/,
    );
  });

  it("no longer gates on the year > CURRENT_EDITION arithmetic", () => {
    expect(source).not.toContain("isUpcomingEdition");
    expect(source).not.toMatch(/year\s*>\s*CURRENT_EDITION/);
  });

  it("does not load sessions for an edition it will not render", () => {
    expect(source).toMatch(/programmeReady\s*\?\s*await loadSessions\(year\)/);
  });

  it("still falls back to ComingSoonLayout", () => {
    expect(source).toContain('<ComingSoonLayout flag="programme"');
  });
});

const SPEAKER_INDEX_ROUTES = [
  "src/pages/intervenants/[year]/index.astro",
  "src/pages/en/speakers/[year]/index.astro",
];

describe.each(SPEAKER_INDEX_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("imports isEditionLoadable and ComingSoonLayout", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toContain("ComingSoonLayout");
  });

  it("renders ComingSoonLayout for a non-loadable edition", () => {
    expect(source).toContain('<ComingSoonLayout flag="programme"');
  });

  it("does not load speakers for an edition it will not render", () => {
    expect(source).toMatch(
      /speakersReady\s*\?\s*await getSpeakersByLocale\(lang,\s*year\)/,
    );
  });
});

const SPEAKER_DETAIL_ROUTES = [
  "src/pages/intervenants/[year]/[slug].astro",
  "src/pages/en/speakers/[year]/[slug].astro",
  "src/pages/intervenants/[slug].astro",
  "src/pages/en/speakers/[slug].astro",
];

describe.each(SPEAKER_DETAIL_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("filters editions in getStaticPaths, not only in the body", () => {
    const paths = source.slice(
      source.indexOf("getStaticPaths"),
      source.indexOf("---", source.indexOf("getStaticPaths")),
    );
    expect(paths).toContain("isEditionLoadable");
  });

  it("skips a non-loadable edition before enumerating its speakers", () => {
    expect(source).toMatch(/if\s*\(!isEditionLoadable\(year\)\)\s*continue;/);
  });
});

describe("src/pages/programme.ics.ts", () => {
  const source = read("src/pages/programme.ics.ts");

  it("names the edition it serves instead of defaulting implicitly", () => {
    expect(source).toMatch(/loadSessions\(year\)/);
    expect(source).not.toMatch(/loadSessions\(\)/);
  });

  it("refuses to serve a non-loadable edition", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toMatch(/throw new Error/);
  });

  it("derives the filename from that edition rather than hardcoding a year", () => {
    expect(source).toMatch(/cnd-france-\$\{year\}\.ics/);
    expect(source).not.toContain("cnd-france-2027.ics");
  });
});
