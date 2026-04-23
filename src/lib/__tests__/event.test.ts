/**
 * Unit tests for src/lib/event.ts (formerly cfp.ts).
 *
 * Covers: TARGET_DATE, CONFERENCE_HALL_URL, NEWSLETTER_URL, getReplaysPath, isPostEvent.
 * CFP state logic is tested in src/lib/__tests__/flags.test.ts against getFlagState(FLAGS.cfp).
 */

import { describe, it, expect } from "vitest";
import {
  TARGET_DATE,
  CONFERENCE_HALL_URL,
  NEWSLETTER_URL,
  getReplaysPath,
  isPostEvent,
} from "@/lib/event";

describe("TARGET_DATE", () => {
  it("matches the CountdownTimer constant exactly (2027-06-03T09:00:00+02:00)", () => {
    expect(TARGET_DATE).toBe(
      new Date("2027-06-03T09:00:00+02:00").getTime(),
    );
  });
});

describe("outbound URLs", () => {
  it("CONFERENCE_HALL_URL is a string starting with https://", () => {
    expect(typeof CONFERENCE_HALL_URL).toBe("string");
    expect(CONFERENCE_HALL_URL.startsWith("https://")).toBe(true);
  });

  it("NEWSLETTER_URL is a string starting with https://", () => {
    expect(typeof NEWSLETTER_URL).toBe("string");
    expect(NEWSLETTER_URL.startsWith("https://")).toBe(true);
  });
});

describe("getReplaysPath", () => {
  it("returns /replays for the default (fr) locale", () => {
    expect(getReplaysPath("fr")).toBe("/replays");
  });

  it("returns /en/replays for the en locale", () => {
    expect(getReplaysPath("en")).toBe("/en/replays");
  });
});

describe("isPostEvent", () => {
  it("returns false for dates before TARGET_DATE", () => {
    expect(isPostEvent(new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });

  it("returns true for dates after TARGET_DATE", () => {
    expect(isPostEvent(new Date("2027-06-04T00:00:00Z"))).toBe(true);
  });

  it("defaults to the current Date when called with no argument", () => {
    expect(typeof isPostEvent()).toBe("boolean");
  });
});
