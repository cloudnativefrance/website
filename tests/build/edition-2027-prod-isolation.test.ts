/**
 * The invariant, as a test.
 *
 *   No fact about a preview-access edition — a talk title, a room, a time, a
 *   speaker name, a speaker slug in a URL — may appear in a production build.
 *
 * Enforced structurally rather than by inspecting rendered output: a production
 * build never fetches the data, so a template bug, a stray getStaticPaths entry
 * or a sitemap filter mistake cannot leak what was never loaded.
 *
 * If you are here because this test failed, do not relax it. It is the only
 * thing standing between an unannounced programme and cloudnativedays.fr.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveEditionLoadable } from "@/lib/edition-visibility";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

/** Every route that can reach a preview edition's sessions or speakers. */
const GUARDED_ROUTES = [
  "src/pages/programme/[year].astro",
  "src/pages/en/programme/[year].astro",
  "src/pages/intervenants/[year]/index.astro",
  "src/pages/en/speakers/[year]/index.astro",
  "src/pages/intervenants/[year]/[slug].astro",
  "src/pages/en/speakers/[year]/[slug].astro",
  "src/pages/intervenants/[slug].astro",
  "src/pages/en/speakers/[slug].astro",
  "src/pages/programme.ics.ts",
  "src/pages/replays/index.astro",
  "src/pages/en/replays/index.astro",
];

describe("preview editions are unreachable in a production build", () => {
  it("is not loadable with the programme flag inactive, whatever the year", () => {
    for (const year of [2026, 2027, 2028] as const) {
      for (const current of [2026, 2027] as const) {
        expect(resolveEditionLoadable("preview", year, current, false)).toBe(false);
      }
    }
  });

  it("becomes loadable only when the flag is active", () => {
    expect(resolveEditionLoadable("preview", 2027, 2026, true)).toBe(true);
  });

  // `assertEditionPublishable` is the shared rule too: it is a thin throwing
  // wrapper over `isEditionLoadable`, for the routes with no coming-soon state.
  it.each(GUARDED_ROUTES)("%s consults the shared rule", (rel) => {
    expect(read(rel)).toMatch(/isEditionLoadable|assertEditionPublishable/);
  });

  it.each(GUARDED_ROUTES)("%s imports it from the one module", (rel) => {
    expect(read(rel)).toContain("@/lib/edition-visibility");
  });

  it("no route reimplements the rule with its own flag check", () => {
    for (const rel of GUARDED_ROUTES) {
      const source = read(rel);
      expect(source, `${rel} calls isFlagActive directly`).not.toContain(
        'isFlagActive("programme")',
      );
    }
  });
});

describe("the archives a production build falls back to stay empty", () => {
  it.each(["sessions", "speakers"])("%s-2027.json is an empty array", (kind) => {
    const raw = read(`src/content/schedule/${kind}-2027.json`);
    expect(JSON.parse(raw)).toEqual([]);
  });
});
