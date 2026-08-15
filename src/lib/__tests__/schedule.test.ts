import { describe, it, expect } from "vitest";
import { defaultScheduleView } from "../schedule";
import type { SessionRow } from "../schedule";

function row(over: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "AAA111",
    title: "Test session",
    speakers: [],
    track: "",
    level: "",
    room: "Monet",
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
    description: "",
    ...over,
  };
}

describe("defaultScheduleView", () => {
  it("opens a past edition in list — the last session has already ended", () => {
    const sessions = [row({ startTime: "2026-02-03T09:00:00+01:00", durationMin: 45 })];
    const now = new Date("2026-02-03T12:00:00+01:00");
    expect(defaultScheduleView(sessions, now)).toBe("list");
  });

  it("opens a future edition in grid — the last session has not started yet", () => {
    const sessions = [row({ startTime: "2027-06-03T09:00:00+02:00", durationMin: 45 })];
    const now = new Date("2026-08-15T12:00:00+02:00");
    expect(defaultScheduleView(sessions, now)).toBe("grid");
  });

  it("opens an edition with no sessions in grid", () => {
    expect(defaultScheduleView([], new Date("2030-01-01T00:00:00Z"))).toBe("grid");
  });

  it("stays in grid while the event is live — earlier sessions ended but the last one has not", () => {
    // 'now' sits between the two sessions: the first is over, the second is
    // running. The day isn't done, so the visitor is still planning a day
    // across rooms, not hunting a replay.
    const sessions = [
      row({ id: "A", startTime: "2026-02-03T09:00:00+01:00", durationMin: 45 }),
      row({ id: "B", startTime: "2026-02-03T11:00:00+01:00", durationMin: 45 }),
    ];
    const now = new Date("2026-02-03T11:30:00+01:00");
    expect(defaultScheduleView(sessions, now)).toBe("grid");
  });

  it("uses the latest-ending session, not the last one in array order", () => {
    const sessions = [
      row({ id: "SHORT", startTime: "2026-02-03T09:00:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T09:00:00+01:00", durationMin: 90, room: "Piaf" }),
    ];
    // 10:00 is after SHORT ends (09:10) but before LONG ends (10:30).
    const now = new Date("2026-02-03T10:00:00+01:00");
    expect(defaultScheduleView(sessions, now)).toBe("grid");
  });

  // Pin the real editions against the real system clock, so this only breaks
  // when it should: once an edition's own event date actually passes.
  it("treats the real 2023 edition as past", () => {
    const sessions = [row({ startTime: "2023-06-07T09:00:00+02:00", durationMin: 45 })];
    expect(defaultScheduleView(sessions)).toBe("list");
  });

  it("treats the real 2026 edition as past", () => {
    const sessions = [row({ startTime: "2026-02-03T09:00:00+01:00", durationMin: 45 })];
    expect(defaultScheduleView(sessions)).toBe("list");
  });

  it("treats the real 2027 edition as not past", () => {
    // The 2027 event's real target date — see src/lib/event.ts TARGET_DATE.
    const sessions = [row({ startTime: "2027-06-03T09:00:00+02:00", durationMin: 45 * 12 })];
    expect(defaultScheduleView(sessions)).toBe("grid");
  });
});
