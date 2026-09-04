import { describe, it, expect } from "vitest";
import { audienceOf, hasBothAudiences, LEADERSHIP_TRACKS } from "@/lib/audience";

const tech = (track: string) => ({ track });

describe("audienceOf", () => {
  it("maps a leadership track to the leadership audience", () => {
    expect(audienceOf(LEADERSHIP_TRACKS[0])).toBe("leadership");
  });

  it("maps every other track, and the empty track, to tech", () => {
    expect(audienceOf("Infrastructure et opérations")).toBe("tech");
    expect(audienceOf("")).toBe("tech");
  });

  it("is case- and accent-insensitive, so a Pretalx rename does not silently reclassify", () => {
    expect(audienceOf(LEADERSHIP_TRACKS[0].toUpperCase())).toBe("leadership");
  });
});

describe("hasBothAudiences", () => {
  it("is false when every session is technical", () => {
    expect(hasBothAudiences([tech("IA et Data"), tech("Developer Experience")])).toBe(false);
  });

  it("is false when there are no sessions at all", () => {
    expect(hasBothAudiences([])).toBe(false);
  });

  it("is false when EVERY session is leadership — one lens, so no control", () => {
    expect(hasBothAudiences([tech(LEADERSHIP_TRACKS[0])])).toBe(false);
  });

  it("is true only when both audiences are present", () => {
    expect(hasBothAudiences([tech("IA et Data"), tech(LEADERSHIP_TRACKS[0])])).toBe(true);
  });
});
