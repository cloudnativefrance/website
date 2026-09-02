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
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "../../");

const read = (rel: string) => readFileSync(resolve(REPO_ROOT, rel), "utf-8");

/** Recursively list every file under an absolute directory path. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

/**
 * Extracts the getStaticPaths function body by matching braces, rather than
 * stopping at the next "---" — for the flat redirect shims, that fence is
 * the very end of the file, so a naive slice would "pass" even if the guard
 * lived outside the function entirely.
 */
function extractGetStaticPaths(source: string): string {
  const start = source.indexOf("getStaticPaths");
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(start, i + 1);
}

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

  it("does not load speaker entries for an edition it will not render", () => {
    expect(source).toMatch(
      /programmeReady\s*\?\s*await getSpeakersByLocale\(lang,\s*year\)/,
    );
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

describe("src/pages/en/speakers/[year]/index.astro", () => {
  const source = read("src/pages/en/speakers/[year]/index.astro");

  it("does not load sessions for an edition it will not render", () => {
    expect(source).toMatch(
      /speakersReady\s*\?\s*await loadSessions\(year\)/,
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
    const paths = extractGetStaticPaths(source);
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

const REPLAYS_ROUTES = [
  "src/pages/replays/index.astro",
  "src/pages/en/replays/index.astro",
];

describe.each(REPLAYS_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("imports isEditionLoadable", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toContain("@/lib/edition-visibility");
  });

  it("names the edition it serves instead of defaulting implicitly", () => {
    expect(source).toMatch(/loadSessions\(year\)/);
    expect(source).not.toMatch(/loadSessions\(\)/);
  });

  it("refuses to serve a non-loadable edition", () => {
    expect(source).toMatch(/throw new Error/);
  });
});

describe("no route under src/pages calls loadSessions() with no argument", () => {
  const pagesDir = resolve(REPO_ROOT, "src/pages");
  const files = listFiles(pagesDir).filter((f) => /\.(astro|ts)$/.test(f));

  // Routes that legitimately need the implicit CURRENT_EDITION default go
  // here, each with a comment explaining why it is safe. This is the sweep
  // that would have caught the replays routes before Task 4-6's review did —
  // keep it empty if at all possible.
  const ALLOWLIST: string[] = [];

  it("finds none outside the allowlist", () => {
    const offenders = files
      .map((f) => relative(REPO_ROOT, f))
      .filter((rel) => !ALLOWLIST.includes(rel))
      .filter((rel) => /loadSessions\(\s*\)/.test(read(rel)));

    const message =
      `${offenders.join(", ")} call loadSessions() with no year argument. ` +
      `That silently defaults to CURRENT_EDITION today, but becomes a leak ` +
      `the moment CURRENT_EDITION moves to a preview-access edition — the ` +
      `exact "routine housekeeping at launch" edit src/lib/edition-visibility.ts ` +
      `warns about. Pass the edition explicitly (usually ` +
      `\`const year = CURRENT_EDITION\`, gated by \`isEditionLoadable(year)\` — ` +
      `see src/pages/programme.ics.ts or src/pages/replays/index.astro for the ` +
      `pattern), or add a named ALLOWLIST entry above with a comment saying why.`;

    expect(offenders, message).toEqual([]);
  });
});
