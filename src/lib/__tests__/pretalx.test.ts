import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  toSessionRows,
  durationToMinutes,
  buildSpeakerResolver,
  type PretalxScheduleExport,
  type PretalxTalk,
} from "../pretalx";

const doc = JSON.parse(
  readFileSync("src/content/schedule/pretalx-2026.json", "utf8"),
) as PretalxScheduleExport;

// The real index is built from the speakers Sheet (Task 5). Here we only need a
// resolver that is deterministic, so lowercase-hyphenate and assert on that.
const resolve = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

describe("toSessionRows", () => {
  const rows = toSessionRows(doc, resolve);

  it("returns every released talk", () => {
    expect(rows).toHaveLength(51);
  });

  it("uses the Pretalx code as the session id, matching existing bookmarks", () => {
    expect(rows.map((r) => r.id)).toContain("9H9WKR");
    expect(rows.every((r) => /^[A-Z0-9]{6}$/.test(r.id))).toBe(true);
  });

  it("derives formats the way the Sheet was hand-classified", () => {
    const count = (f: string) => rows.filter((r) => r.format === f).length;
    expect(count("keynote")).toBe(1);
    expect(count("talk")).toBe(29);
    expect(count("lightning")).toBe(21);
  });

  it("classifies short sessions as lightning even when their type is not Éclair", () => {
    const shorts = rows.filter((r) => r.durationMin <= 15);
    expect(shorts).toHaveLength(21);
    expect(shorts.every((r) => r.format === "lightning")).toBe(true);
  });

  it("converts HH:MM durations to minutes", () => {
    const keynote = rows.find((r) => r.format === "keynote");
    expect(keynote?.durationMin).toBe(75);
    expect(rows.find((r) => r.id === "9H9WKR")?.durationMin).toBe(45);
  });

  it("preserves the ISO offset instead of shifting to the build machine's zone", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.startTime).toBe("2026-02-03T10:30:00+01:00");
  });

  it("carries the feedback URL the Sheet never had", () => {
    expect(rows.every((r) => r.feedbackUrl.startsWith("https://"))).toBe(true);
  });

  it("carries the curated track colour", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.track).toBe("Infrastructure et opérations");
    expect(s?.trackColor).toBe("#edbb45");
  });

  it("resolves speakers through the resolver, never raw names", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.speakers).toEqual(["nicolas-vermande"]);
  });

  it("absolutises relative attachment URLs", () => {
    const withSlides = rows.filter((r) => r.slidesUrl);
    expect(withSlides.length).toBeGreaterThanOrEqual(1);
    expect(withSlides.every((r) => r.slidesUrl.startsWith("https://"))).toBe(true);
  });

  it("sorts by start time then room for a deterministic order", () => {
    const starts = rows.map((r) => r.startTime);
    expect([...starts].sort()).toEqual(starts);
  });

  it("marks every exported talk confirmed", () => {
    expect(rows.every((r) => r.status === "confirmed")).toBe(true);
  });

  // The stand-in resolver above ignores its second argument, so nothing else
  // in this file proves talk.code (not some other field) reaches the
  // resolver. A swapped argument order would type-check and pass silently.
  it("passes the talk's own code as the resolver's second argument", () => {
    const withCode = toSessionRows(doc, (name, code) => `${name}@${code}`);
    const s = withCode.find((r) => r.id === "9H9WKR");
    expect(s?.speakers).toEqual(["Nicolas Vermande@9H9WKR"]);
  });
});

describe("buildSpeakerResolver", () => {
  // The Sheet uses hand-shortened slugs. Slugifying the Pretalx name would give
  // "jerome-petazzoni" and 404; exact name match is what actually works (67/67).
  const csv = [
    "slug,name,company",
    "petazzoni,Jérôme Petazzoni,Enix",
    "nicolas-vermande,Nicolas Vermande,Staticvoid",
  ].join("\n");

  it("maps an exact Pretalx name to the Sheet slug", () => {
    const resolve = buildSpeakerResolver(csv);
    expect(resolve("Jérôme Petazzoni", "GJ89TV")).toBe("petazzoni");
    expect(resolve("Nicolas Vermande", "9H9WKR")).toBe("nicolas-vermande");
  });

  it("throws with the name and talk code when a speaker is unknown", () => {
    const resolve = buildSpeakerResolver(csv);
    // Emitting the raw name would render /intervenants/Someone%20New — a 404
    // that looks like a working link. Fail the build instead.
    expect(() => resolve("Someone New", "ABC123")).toThrow(/Someone New/);
    expect(() => resolve("Someone New", "ABC123")).toThrow(/ABC123/);
  });

  it("tolerates surrounding whitespace on both sides", () => {
    const resolve = buildSpeakerResolver("slug,name\n a-b , Ada Lovelace \n");
    expect(resolve("Ada Lovelace", "X")).toBe("a-b");
  });
});

describe("durationToMinutes edge cases", () => {
  it("throws on a malformed duration", () => {
    expect(() => durationToMinutes("not-a-duration")).toThrow(/unparseable duration/);
  });
});

describe("toSessionRows edge branches (hand-built talks, not the fixture)", () => {
  const baseTalk: PretalxTalk = {
    code: "ZZZZZZ",
    title: "Edge case talk",
    date: "2026-02-03T09:00:00+01:00",
    duration: "00:20",
    room: "Room A",
    track: null,
    type: "Conférence",
    language: "fr",
    abstract: null,
    description: null,
    logo: null,
    url: "https://cfp.example/talk/ZZZZZZ",
    persons: [{ code: "P1", name: "Edge Speaker" }],
  };

  function docWith(talk: PretalxTalk): PretalxScheduleExport {
    return {
      schedule: {
        version: "1.0",
        conference: {
          title: "Test",
          tracks: [],
          days: [{ date: "2026-02-03", rooms: { "Room A": [talk] } }],
        },
      },
    };
  }

  const resolve = (name: string) => name;

  it("yields an empty track and undefined trackColor when track is null", () => {
    const rows = toSessionRows(docWith(baseTalk), resolve);
    expect(rows[0].track).toBe("");
    expect(rows[0].trackColor).toBeUndefined();
  });

  it("yields empty slidesUrl and recordingUrl when links/attachments are absent", () => {
    const rows = toSessionRows(docWith(baseTalk), resolve);
    expect(rows[0].slidesUrl).toBe("");
    expect(rows[0].recordingUrl).toBe("");
  });

  it("picks a YouTube link as the recordingUrl", () => {
    const talk: PretalxTalk = {
      ...baseTalk,
      links: [{ title: "Watch it", url: "https://youtube.com/watch?v=abc123" }],
    };
    const rows = toSessionRows(docWith(talk), resolve);
    expect(rows[0].recordingUrl).toBe("https://youtube.com/watch?v=abc123");
  });
});
