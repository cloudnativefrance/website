/**
 * Team photos must be committed, not merely present on a developer's disk.
 *
 * The 2026-10 sheet mirror added Amine Saboni's row referencing
 * public/team/amine-saboni.jpg while the JPEG sat untracked in the working
 * tree: the local build showed the photo, CI's clean checkout shipped the
 * row without it, and the deployed team page 404'd the image. Existence on
 * disk cannot catch that; only git can.
 *
 * `git ls-files` reads the INDEX, which is exactly what a CI checkout
 * materialises — so an added-but-uncommitted file passes only once it is
 * actually committed, and a deleted-but-still-on-disk file fails the way CI
 * would ship it.
 *
 * The CSV is parsed with the repo's own RFC-4180 parser (src/lib/csv.ts),
 * not split(","): the quoted `groups` column (`"equipe-principale,comite-
 * selection"`) shifts naive column indices straight past `photo`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { parseCsv } from "@/lib/csv";

const TEAM_CSV = resolve(import.meta.dirname, "../../src/content/team/team.csv");
const rows = parseCsv(readFileSync(TEAM_CSV, "utf8"));
const [header, ...body] = rows;
const photoIdx = header.indexOf("photo");

const tracked = new Set(
  execFileSync("git", ["ls-files", "public/team/"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

describe("team photos are tracked in git", () => {
  it("the team CSV has a photo column", () => {
    expect(photoIdx, "no `photo` header in team.csv").toBeGreaterThan(-1);
  });

  for (const row of body) {
    const [id] = row;
    it(`${id}'s photo is committed under public/team/`, () => {
      const photo = row[photoIdx];
      expect(photo, `${id}: empty photo path`).toBeTruthy();
      // CSV paths are site-absolute (/team/x.jpg); on disk they live in public/.
      expect(
        tracked.has(`public${photo}`),
        `${id}: public${photo} is referenced by team.csv but not tracked in git — CI would ship a 404`,
      ).toBe(true);
    });
  }
});
