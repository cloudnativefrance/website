import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { toSessionRows, type PretalxScheduleExport } from "../pretalx";

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
});
