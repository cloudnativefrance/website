import { describe, it, expect } from "vitest";
import { REPLAYS_2026, REPLAYS_PLAYLIST_ID } from "@/data/replays";

describe("REPLAYS_2026", () => {
  it("contains exactly 6 entries", () => {
    expect(REPLAYS_2026).toHaveLength(6);
  });

  it("each entry has a non-empty id and title", () => {
    for (const replay of REPLAYS_2026) {
      expect(typeof replay.id).toBe("string");
      expect(replay.id.length).toBeGreaterThan(0);
      expect(typeof replay.title).toBe("string");
      expect(replay.title.length).toBeGreaterThan(0);
    }
  });
});

describe("REPLAYS_PLAYLIST_ID", () => {
  it("is the 2026 playlist ID", () => {
    expect(REPLAYS_PLAYLIST_ID).toBe("PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2");
  });
});
