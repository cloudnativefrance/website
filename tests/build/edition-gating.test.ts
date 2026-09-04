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
import {
  DATA_LAYER,
  LOADER_CALL_RE,
  NON_ROUTE_CONSUMERS,
  ROUTE_CONSUMERS,
} from "./edition-consumers";

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
    expect(source).toMatch(/assertEditionPublishable\(\s*year\s*,/);
    expect(source).toContain("@/lib/edition-visibility");
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

  it("imports the shared gate", () => {
    expect(source).toContain("assertEditionPublishable");
    expect(source).toContain("@/lib/edition-visibility");
  });

  it("names the edition it serves instead of defaulting implicitly", () => {
    expect(source).toMatch(/loadSessions\(year\)/);
    expect(source).not.toMatch(/loadSessions\(\)/);
  });

  it("refuses to serve a non-loadable edition, naming itself", () => {
    // The label is what tells the build log which page refused — three call
    // sites share one assertion, so a bare "[replays]" would be ambiguous.
    expect(source).toMatch(/assertEditionPublishable\(\s*year\s*,\s*"[^"]+"\s*\)/);
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

/**
 * The sweep that enumerates instead of trusting a list.
 *
 * The hand-written GUARDED_ROUTES list in edition-2027-prod-isolation.test.ts
 * missed `src/content.config.ts` — the single largest speaker-data consumer in
 * the codebase — precisely because it was hand-written and only looked at
 * routes. So this walks `src/` for real and classifies what it finds: a
 * consumer is either a route that consults the gate, or a declared non-route
 * consumer in ./edition-consumers.ts (which carries the PR 2 warning), or the
 * test fails.
 */
describe("every consumer of an edition's data is accounted for", () => {
  /**
   * Loader names appear in prose too (docstrings in edition-visibility.ts and
   * pretalx-private.ts both name `loadSessions`). Strip comments so the sweep
   * flags call sites, not documentation.
   */
  const stripComments = (source: string): string =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");

  const sourceFiles = listFiles(resolve(REPO_ROOT, "src"))
    .map((f) => relative(REPO_ROOT, f))
    .filter((rel) => /\.(astro|ts|tsx)$/.test(rel))
    .filter((rel) => !rel.includes("__tests__") && !rel.endsWith(".test.ts"))
    .filter((rel) => !(DATA_LAYER as readonly string[]).includes(rel));

  const consumers = sourceFiles.filter((rel) =>
    LOADER_CALL_RE.test(stripComments(read(rel))),
  );

  const declaredRoutes = ROUTE_CONSUMERS as readonly string[];
  const declaredNonRoutes: readonly string[] = NON_ROUTE_CONSUMERS.map(
    (c) => c.file,
  );

  it("finds at least the routes it already knows about", () => {
    // Sanity check on the sweep itself: a regex that matched nothing would make
    // every assertion below vacuously pass.
    expect(consumers.length).toBeGreaterThanOrEqual(declaredRoutes.length);
  });

  it("finds no undeclared consumer", () => {
    const undeclared = consumers.filter(
      (rel) => !declaredRoutes.includes(rel) && !declaredNonRoutes.includes(rel),
    );

    expect(
      undeclared,
      `${undeclared.join(", ")} read an edition's sessions or speakers but are ` +
        `declared in neither ROUTE_CONSUMERS nor NON_ROUTE_CONSUMERS ` +
        `(tests/build/edition-consumers.ts).\n\n` +
        `If it is a route under src/pages: gate it with isEditionLoadable — in ` +
        `getStaticPaths for a [slug] route, since a gated body still emits one ` +
        `HTML file per speaker — and add it to ROUTE_CONSUMERS.\n\n` +
        `If it is NOT a route (a content collection loader, an integration, a ` +
        `script): it runs on every build regardless of which pages render, so a ` +
        `route-level gate cannot protect it. Add it to NON_ROUTE_CONSUMERS with ` +
        `what keeps it harmless, and read the PR 2 warning above that list.`,
    ).toEqual([]);
  });

  it("every declared non-route consumer is one the sweep actually finds", () => {
    // A declared entry the sweep cannot see is either a typo'd path or a stale
    // record of a consumer that no longer exists — both make the list lie.
    for (const rel of declaredNonRoutes) {
      expect(consumers, `${rel} is declared but reads no edition data`).toContain(rel);
    }
  });

  it("src/content.config.ts is the known non-route consumer", () => {
    // Named explicitly so a future reader hits it without decoding the sweep:
    // speakersCollection(2027)'s loader calls loadSpeakers(2027) on EVERY build,
    // including a production build with every route correctly gated.
    expect(declaredNonRoutes).toContain("src/content.config.ts");
  });
});

