/**
 * Guards the speaker pipeline, whose failure modes are all silent ones.
 *
 * A wrong slug does not crash — it ships a 404 that looks like a working link.
 * Missing enrichment does not crash — it ships a speakers page with no companies.
 * A keynote cast that references people Pretalx does not know does not crash —
 * the opening-keynote block simply disappears.
 *
 * The live parts need a token, so they skip (never silently pass) without one.
 */
import { describe, it, expect } from "vitest";
import { loadSpeakers } from "@/lib/speaker-source";
import { SPEAKER_SLUGS, SLUG_TO_NAME } from "@/data/speaker-slugs";
import { KEYNOTE_CAST, keynoteRoleFor } from "@/data/keynote-cast";

const hasToken = Boolean(
  process.env.PRETALX_API_TOKEN?.trim() || process.env.PRETALX_API_TOKEN_FILE?.trim(),
);

describe("speaker slug map", () => {
  it("keeps the hand-shortened slugs that no rule would derive", () => {
    // Slugifying the name would give "jerome-petazzoni" and 404.
    expect(SPEAKER_SLUGS["Jérôme Petazzoni"]).toBe("petazzoni");
    expect(SPEAKER_SLUGS["Nicolas Vermande"]).toBe("vermande");
  });

  it("has no duplicate slugs — two people sharing one would overwrite a page", () => {
    const slugs = Object.values(SPEAKER_SLUGS);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("round-trips through the reverse map", () => {
    for (const [name, slug] of Object.entries(SPEAKER_SLUGS)) {
      expect(SLUG_TO_NAME[slug]).toBe(name);
    }
  });
});

describe("keynote cast", () => {
  it("assigns each member exactly one role", () => {
    const cast = KEYNOTE_CAST[2026]!;
    const all = [...cast.lead, ...cast.guest, ...cast.panel];
    expect(new Set(all).size).toBe(all.length);
  });

  it("references only slugs the slug map knows", () => {
    const cast = KEYNOTE_CAST[2026]!;
    const known = new Set(Object.values(SPEAKER_SLUGS));
    for (const slug of [...cast.lead, ...cast.guest, ...cast.panel]) {
      expect(known.has(slug), `${slug} is not in SPEAKER_SLUGS`).toBe(true);
    }
  });

  it("resolves roles, and returns undefined for everyone else", () => {
    expect(keynoteRoleFor(2026, "petazzoni")).toBe("lead");
    expect(keynoteRoleFor(2026, "sherine-khoury")).toBe("panel");
    expect(keynoteRoleFor(2026, "vermande")).toBeUndefined();
    // An edition with no cast must not throw.
    expect(keynoteRoleFor(2023, "petazzoni")).toBeUndefined();
  });
});

describe("archived speakers", () => {
  it("2023 reads its frozen archive rather than the emptied Sheet tab", async () => {
    const rows = await loadSpeakers(2023);
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.slug && r.name)).toBe(true);
  });
});

describe.skipIf(!hasToken)("speakers from Pretalx", () => {
  it("returns every person in the released schedule, with a stable slug", async () => {
    const rows = await loadSpeakers(2026);
    expect(rows.length).toBeGreaterThanOrEqual(67);
    expect(rows.map((r) => r.slug)).toContain("petazzoni");
    expect(new Set(rows.map((r) => r.slug)).size).toBe(rows.length);
  });

  it("carries the enrichment that only the authenticated API has", async () => {
    const rows = await loadSpeakers(2026);
    const withCompany = rows.filter((r) => r.company);
    const withRole = rows.filter((r) => r.role);
    // These are the fields the speaker cards render; an empty result here is the
    // silent regression this whole test file exists to catch.
    expect(withCompany.length).toBe(rows.length);
    expect(withRole.length).toBe(rows.length);
  });

  it("keeps bio and photo from the public export", async () => {
    const rows = await loadSpeakers(2026);
    expect(rows.filter((r) => r.bio).length).toBeGreaterThan(60);
    expect(rows.filter((r) => r.photo_url).length).toBeGreaterThan(60);
  });

  it("marks keynote speakers from the cast, not from a hand-maintained flag", async () => {
    const rows = await loadSpeakers(2026);
    const petazzoni = rows.find((r) => r.slug === "petazzoni");
    expect(petazzoni?.keynote).toBe(true);
    expect(petazzoni?.keynote_size).toBe("lead");
    const vermande = rows.find((r) => r.slug === "vermande");
    expect(vermande?.keynote).toBe(false);
    expect(vermande?.keynote_size).toBeUndefined();
  });

  it("reports how much of the keynote cast Pretalx actually knows", async () => {
    const rows = await loadSpeakers(2026);
    const present = new Set(rows.map((r) => r.slug));
    const cast = KEYNOTE_CAST[2026]!;
    const all = [...cast.lead, ...cast.guest, ...cast.panel];
    const missing = all.filter((s) => !present.has(s));
    // The 10 keynote participants are not yet Pretalx persons, so the opening
    // keynote block renders short. This asserts the gap is exactly the known one
    // — if an 11th goes missing, or the 10 get added, this test says so.
    expect(missing.length).toBe(10);
  });
});
