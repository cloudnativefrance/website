import { describe, it, expect } from "vitest";
import { buildIcs, sessionToIcs } from "../schedule";
import type { SessionRow } from "../schedule";

function row(over: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "AAA111",
    title: "Scaler vos charges de travail GPU",
    speakers: ["amine-saboni"],
    track: "IA et Data",
    level: "intermediate",
    room: "Debussy",
    format: "talk",
    startTime: "2026-02-03T11:15:00+01:00",
    durationMin: 45,
    tags: [],
    feedbackUrl: "",
    slidesUrl: "",
    recordingUrl: "",
    coverImageUrl: "",
    language: "fr",
    status: "confirmed",
    description: "Karpenter et Argo Workflows",
    ...over,
  };
}

describe("buildIcs — PRODID", () => {
  it("derives the PRODID year from the edition served, not a hardcoded year", () => {
    const ics = buildIcs([row()], 2026);
    expect(ics).toContain("PRODID:-//Cloud Native Days France 2026//Schedule//FR");
    expect(ics).not.toContain("2027");
  });

  it("stamps the given edition even for an empty schedule", () => {
    const ics = buildIcs([], 2027);
    expect(ics).toContain("PRODID:-//Cloud Native Days France 2027//Schedule//FR");
  });

  it("still wraps one VEVENT per session, unaffected by the PRODID year", () => {
    const ics = buildIcs([row()], 2026);
    expect(ics).toContain(sessionToIcs(row()));
  });
});
