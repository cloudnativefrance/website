import { describe, it, expect } from "vitest";
import { getFlagState, type FlagState } from "@/lib/flags";
import type { FlagDefinition } from "@/config/flags";

const pageFlag = (opens?: string, closes?: string): FlagDefinition => ({
  kind: "page",
  opens,
  closes,
});

describe("getFlagState", () => {
  const OPENS = "2026-09-01T00:00:00+02:00";
  const CLOSES = "2027-02-28T23:59:59+01:00";
  const opensDate = new Date(OPENS);
  const closesDate = new Date(CLOSES);

  it("returns 'pending' strictly before opens", () => {
    const before = new Date(opensDate.getTime() - 1000);
    expect(getFlagState(pageFlag(OPENS, CLOSES), before)).toBe("pending");
  });

  it("returns 'active' at opens (inclusive lower bound)", () => {
    expect(getFlagState(pageFlag(OPENS, CLOSES), opensDate)).toBe("active");
  });

  it("returns 'active' mid-window", () => {
    const mid = new Date((opensDate.getTime() + closesDate.getTime()) / 2);
    expect(getFlagState(pageFlag(OPENS, CLOSES), mid)).toBe("active");
  });

  it("returns 'active' at closes (inclusive upper bound)", () => {
    expect(getFlagState(pageFlag(OPENS, CLOSES), closesDate)).toBe("active");
  });

  it("returns 'ended' strictly after closes", () => {
    const after = new Date(closesDate.getTime() + 1000);
    expect(getFlagState(pageFlag(OPENS, CLOSES), after)).toBe("ended");
  });

  it("returns 'active' forever when closes is missing and now >= opens", () => {
    const farFuture = new Date("2099-01-01T00:00:00Z");
    expect(getFlagState(pageFlag(OPENS), farFuture)).toBe("active");
  });

  it("returns 'active' always when opens and closes are both missing", () => {
    const anyDate = new Date("1999-01-01T00:00:00Z");
    expect(getFlagState(pageFlag(), anyDate)).toBe("active");
  });

  it("returns correct state when only closes is set (no opens)", () => {
    const flagWithOnlyCloses = pageFlag(undefined, CLOSES);
    const before = new Date("2026-01-01T00:00:00Z");
    expect(getFlagState(flagWithOnlyCloses, before)).toBe("active");
    const after = new Date(closesDate.getTime() + 1000);
    expect(getFlagState(flagWithOnlyCloses, after)).toBe("ended");
  });

  describe("override resolution", () => {
    it("returns 'active' when override is 'on' regardless of pending dates", () => {
      const farFuture = pageFlag("2099-01-01T00:00:00Z");
      const now = new Date("2026-01-01T00:00:00Z");
      expect(getFlagState(farFuture, now, "on")).toBe("active");
    });

    it("returns 'ended' when override is 'off' regardless of active dates", () => {
      const active = pageFlag(OPENS, CLOSES);
      expect(getFlagState(active, opensDate, "off")).toBe("ended");
    });
  });
});
