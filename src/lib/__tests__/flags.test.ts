import { describe, it, expect, afterEach } from "vitest";
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

import { parseFlagOverrides, readEnvOverride } from "@/lib/flags";

describe("parseFlagOverrides", () => {
  it("returns an empty map for an empty or whitespace string", () => {
    expect(parseFlagOverrides("").size).toBe(0);
    expect(parseFlagOverrides("   ").size).toBe(0);
  });

  it("parses a single override", () => {
    expect(parseFlagOverrides("programme=on")).toEqual(
      new Map([["programme", "on"]]),
    );
  });

  it("parses several and tolerates whitespace around tokens", () => {
    expect(parseFlagOverrides(" programme=on , tickets=off ")).toEqual(
      new Map([
        ["programme", "on"],
        ["tickets", "off"],
      ]),
    );
  });

  it("throws on an unknown flag name, naming the value", () => {
    expect(() => parseFlagOverrides("programe=on")).toThrow(/programe/);
  });

  it("throws on a value that is not on or off", () => {
    expect(() => parseFlagOverrides("programme=true")).toThrow(/true/);
  });

  it("throws on a malformed entry with no '='", () => {
    expect(() => parseFlagOverrides("programme")).toThrow(/programme/);
  });

  it("throws on a duplicated flag name rather than picking one", () => {
    expect(() => parseFlagOverrides("programme=on,programme=off")).toThrow(
      /programme/,
    );
  });
});

describe("readEnvOverride", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns undefined when neither source is set", () => {
    delete process.env.FLAG_PROGRAMME;
    delete process.env.FLAG_OVERRIDES;
    expect(readEnvOverride("programme")).toBeUndefined();
  });

  it("reads the individual FLAG_<NAME> variable", () => {
    process.env.FLAG_PROGRAMME = "on";
    expect(readEnvOverride("programme")).toBe("on");
  });

  it("reads FLAG_OVERRIDES when no individual variable is set", () => {
    delete process.env.FLAG_PROGRAMME;
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("programme")).toBe("on");
  });

  it("lets the individual variable win over FLAG_OVERRIDES", () => {
    process.env.FLAG_PROGRAMME = "off";
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("programme")).toBe("off");
  });

  it("returns undefined for a flag absent from a populated FLAG_OVERRIDES", () => {
    delete process.env.FLAG_TICKETS;
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("tickets")).toBeUndefined();
  });
});
