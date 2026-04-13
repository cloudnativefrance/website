/**
 * EVNT-04: Unit tests for CFP state machine + replays path helper.
 *
 * Tests verify the observable behavior of the exports in src/lib/cfp.ts:
 * TARGET_DATE, CFP_OPENS, CFP_CLOSES, CONFERENCE_HALL_URL,
 * getCfpState, getReplaysPath, isPostEvent.
 */

import { describe, it, expect } from "vitest";
import {
  TARGET_DATE,
  CFP_OPENS,
  CFP_CLOSES,
  CONFERENCE_HALL_URL,
  getCfpState,
  getReplaysPath,
  isPostEvent,
} from "@/lib/cfp";

describe("TARGET_DATE", () => {
  it("matches the CountdownTimer constant exactly (2027-06-03T09:00:00+02:00)", () => {
    expect(TARGET_DATE).toBe(
      new Date("2027-06-03T09:00:00+02:00").getTime(),
    );
  });
});

describe("CFP placeholder constants", () => {
  it("exposes CFP_OPENS and CFP_CLOSES as Date instances with OPENS < CLOSES", () => {
    expect(CFP_OPENS).toBeInstanceOf(Date);
    expect(CFP_CLOSES).toBeInstanceOf(Date);
    expect(CFP_OPENS.getTime()).toBeLessThan(CFP_CLOSES.getTime());
  });

  it("exposes CONFERENCE_HALL_URL as a string starting with https://", () => {
    expect(typeof CONFERENCE_HALL_URL).toBe("string");
    expect(CONFERENCE_HALL_URL.startsWith("https://")).toBe(true);
  });
});

describe("getCfpState", () => {
  it("returns 'coming-soon' when now < CFP_OPENS", () => {
    const before = new Date(CFP_OPENS.getTime() - 1000);
    expect(getCfpState(before)).toBe("coming-soon");
  });

  it("returns 'open' when now === CFP_OPENS (inclusive lower bound)", () => {
    expect(getCfpState(new Date(CFP_OPENS.getTime()))).toBe("open");
  });

  it("returns 'open' when CFP_OPENS < now < CFP_CLOSES", () => {
    const mid = new Date(
      (CFP_OPENS.getTime() + CFP_CLOSES.getTime()) / 2,
    );
    expect(getCfpState(mid)).toBe("open");
  });

  it("returns 'open' when now === CFP_CLOSES (inclusive upper bound)", () => {
    expect(getCfpState(new Date(CFP_CLOSES.getTime()))).toBe("open");
  });

  it("returns 'closed' when now > CFP_CLOSES", () => {
    const after = new Date(CFP_CLOSES.getTime() + 1000);
    expect(getCfpState(after)).toBe("closed");
  });

  it("defaults to the current Date when called with no argument", () => {
    // Smoke test: invocation without args must not throw and must return one
    // of the three valid states.
    const state = getCfpState();
    expect(["coming-soon", "open", "closed"]).toContain(state);
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
    // Smoke test: invocation without args must not throw.
    expect(typeof isPostEvent()).toBe("boolean");
  });
});
