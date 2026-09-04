import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  diffSpeakerSlugs,
  insertSlugEntries,
  slugify,
  type NewSlugEntry,
} from "../speaker-slug-sync";
import { SPEAKER_SLUGS } from "../../../src/data/speaker-slugs";

// The eight entries `src/data/speaker-slugs.ts`'s own docstring names as
// hand-shortened in ways no rule derives — `slugify` must NOT reproduce
// these, and the regression test below excludes exactly these eight before
// asserting the rule against the other 69.
const HAND_SHORTENED_SLUGS = new Set([
  "behar",
  "chmielowski",
  "petazzoni",
  "piard",
  "rexed",
  "saboni",
  "vache",
  "vermande",
]);

describe("slugify", () => {
  it("lowercases and joins with hyphens", () => {
    expect(slugify("Amine AIT AAZIZI")).toBe("amine-ait-aazizi");
  });

  it("NFD-normalises and strips diacritics", () => {
    expect(slugify("Jérôme Petazzoni")).toBe("jerome-petazzoni");
    expect(slugify("Aurélie Vache")).toBe("aurelie-vache");
    expect(slugify("Hervé Leclerc")).toBe("herve-leclerc");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugify("Jean-Baptiste  Kempf")).toBe("jean-baptiste-kempf");
    expect(slugify("O'Brien   Test")).toBe("o-brien-test");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-Test Name-")).toBe("test-name");
    expect(slugify("  Padded Name  ")).toBe("padded-name");
  });

  it("matches every non-hand-shortened entry already in the committed map", () => {
    const regular = Object.entries(SPEAKER_SLUGS).filter(
      ([, slug]) => !HAND_SHORTENED_SLUGS.has(slug),
    );
    // Sanity check on the fixture itself: exactly 8 exceptions, same count the
    // file's own docstring claims, so this test would fail loudly if that set
    // ever drifts rather than silently checking fewer entries than intended.
    expect(Object.keys(SPEAKER_SLUGS).length - regular.length).toBe(8);

    for (const [name, slug] of regular) {
      expect(slugify(name), `slugify(${JSON.stringify(name)})`).toBe(slug);
    }
  });
});

describe("diffSpeakerSlugs", () => {
  const existing = {
    "Ada Lovelace": "ada-lovelace",
    "Jérôme Petazzoni": "petazzoni", // hand-shortened, not what slugify(name) gives
  };

  it("adds a genuinely new name under its derived slug", () => {
    const { toAdd, collisions } = diffSpeakerSlugs(["Grace Hopper"], existing);
    expect(collisions).toEqual([]);
    expect(toAdd).toEqual([{ name: "Grace Hopper", slug: "grace-hopper" }]);
  });

  it("is idempotent: a name already an exact key is never re-suggested", () => {
    const { toAdd, collisions } = diffSpeakerSlugs(
      ["Ada Lovelace", "Jérôme Petazzoni"],
      existing,
    );
    expect(toAdd).toEqual([]);
    expect(collisions).toEqual([]);
  });

  it("trims incoming names the same way buildSpeakerResolver's lookup does", () => {
    const { toAdd } = diffSpeakerSlugs(["  Ada Lovelace  "], existing);
    expect(toAdd).toEqual([]);
  });

  it("ignores an empty/whitespace-only name", () => {
    const { toAdd, collisions } = diffSpeakerSlugs(["   "], existing);
    expect(toAdd).toEqual([]);
    expect(collisions).toEqual([]);
  });

  it("flags two new names deriving the same slug as a collision, and adds neither", () => {
    const { toAdd, collisions } = diffSpeakerSlugs(
      ["Jean Dupont", "Jean DUPONT"],
      existing,
    );
    expect(toAdd).toEqual([]);
    expect(collisions).toEqual([
      { slug: "jean-dupont", names: ["Jean Dupont", "Jean DUPONT"] },
    ]);
  });

  it("flags a new name landing on a slug someone else already owns", () => {
    // "petazzoni" is hand-shortened, so a brand-new "Petazzoni" would collide
    // with the existing, differently-named owner without slugify ever
    // producing that value for the existing key itself.
    const { toAdd, collisions } = diffSpeakerSlugs(["Petazzoni"], existing);
    expect(toAdd).toEqual([]);
    expect(collisions).toEqual([
      {
        slug: "petazzoni",
        names: ["Petazzoni"],
        existingOwner: "Jérôme Petazzoni",
      },
    ]);
  });

  it("returns entries sorted by slug", () => {
    const { toAdd } = diffSpeakerSlugs(["Zoe Zebra", "Amy Apple"], existing);
    expect(toAdd.map((e) => e.slug)).toEqual(["amy-apple", "zoe-zebra"]);
  });
});

describe("insertSlugEntries", () => {
  const source = [
    "/** doc */",
    'export const SPEAKER_SLUGS: Readonly<Record<string, string>> = {',
    '  "Alexandre Buisine": "alexandre-buisine",',
    '  "Baptiste Assmann": "baptiste-assmann",',
    '  "Yousri KOUKI": "yousri-kouki",',
    "};",
    "",
    "export const SLUG_TO_NAME = {};",
    "",
  ].join("\n");

  function entries(...pairs: [string, string][]): NewSlugEntry[] {
    return pairs.map(([name, slug]) => ({ name, slug }));
  }

  it("returns the source unchanged when there is nothing to add", () => {
    expect(insertSlugEntries(source, [])).toBe(source);
  });

  it("inserts a single entry at its alphabetical-by-slug position", () => {
    const out = insertSlugEntries(source, entries(["Camille Test", "camille-test"]));
    const lines = out.split("\n");
    expect(lines).toContain('  "Camille Test": "camille-test",');
    // Between baptiste-assmann and yousri-kouki, and every original line is
    // still present verbatim.
    const idx = lines.indexOf('  "Camille Test": "camille-test",');
    expect(lines[idx - 1]).toBe('  "Baptiste Assmann": "baptiste-assmann",');
    expect(lines[idx + 1]).toBe('  "Yousri KOUKI": "yousri-kouki",');
    for (const original of source.split("\n")) {
      expect(out).toContain(original);
    }
  });

  it("inserts an entry that sorts before everything as the new first entry", () => {
    const out = insertSlugEntries(source, entries(["Aaron Test", "aaron-test"]));
    const lines = out.split("\n");
    const idx = lines.indexOf('  "Aaron Test": "aaron-test",');
    expect(lines[idx + 1]).toBe('  "Alexandre Buisine": "alexandre-buisine",');
  });

  it("inserts an entry that sorts after everything right before the closing brace", () => {
    const out = insertSlugEntries(source, entries(["Zzz Test", "zzz-test"]));
    const lines = out.split("\n");
    const idx = lines.indexOf('  "Zzz Test": "zzz-test",');
    expect(lines[idx - 1]).toBe('  "Yousri KOUKI": "yousri-kouki",');
    expect(lines[idx + 1]).toBe("};");
  });

  it("inserts multiple entries in mutually-consistent sorted order", () => {
    const out = insertSlugEntries(
      source,
      entries(["Zzz Test", "zzz-test"], ["Aaa Test", "aaa-test"], ["Mid Test", "mid-test"]),
    );
    const lines = out.split("\n");
    const positions = [
      '  "Aaa Test": "aaa-test",',
      '  "Alexandre Buisine": "alexandre-buisine",',
      '  "Baptiste Assmann": "baptiste-assmann",',
      '  "Mid Test": "mid-test",',
      '  "Yousri KOUKI": "yousri-kouki",',
      '  "Zzz Test": "zzz-test",',
      "};",
    ].map((l) => lines.indexOf(l));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("never rewrites a line untouched by an insertion", () => {
    const out = insertSlugEntries(source, entries(["Camille Test", "camille-test"]));
    for (const line of source.split("\n")) {
      expect(out.split("\n")).toContain(line);
    }
    // Exactly one line added.
    expect(out.split("\n").length).toBe(source.split("\n").length + 1);
  });

  it("refuses to write when it finds no line matching the entry shape", () => {
    expect(() =>
      insertSlugEntries("export const X = 1;\n", entries(["A", "a"])),
    ).toThrow(/refusing to write/);
  });

  it("round-trips against the real committed file without disturbing existing entries", () => {
    const real = readFileSync(
      resolve(__dirname, "../../../src/data/speaker-slugs.ts"),
      "utf8",
    );
    const out = insertSlugEntries(real, entries(["Zzz Real Test", "zzz-real-test"]));
    expect(out).toContain('  "Zzz Real Test": "zzz-real-test",');
    // Every original line is still present, in its original form.
    for (const line of real.split("\n")) {
      expect(out).toContain(line);
    }
    // It landed after the last real entry (alphabetically last by slug),
    // still inside the object, before the closing brace.
    const lines = out.split("\n");
    const idx = lines.indexOf('  "Zzz Real Test": "zzz-real-test",');
    expect(lines[idx + 1]).toBe("};");
  });
});
