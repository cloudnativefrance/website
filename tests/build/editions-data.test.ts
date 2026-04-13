/**
 * EDIT-01 / EDIT-02 / EDIT-03 (Phase 17 revised — both editions mount on homepage).
 *
 * Asserts editions-data.ts shape for both EDITION_2026 (real recap ported from
 * venue/index.astro: ambiance photos + video + stats) and EDITION_2023 (real
 * KCD France 2023 content: 6-tile mosaic + playlist video + KCD brand callout).
 */
import { describe, it, expect } from "vitest";
import { EDITION_2026, EDITION_2023 } from "../../src/lib/editions-data";

function srcString(src: unknown): string {
  return typeof src === "string" ? src : (src as { src: string }).src;
}

describe("EDIT-01: EDITION_2026 data module (real 2026 recap)", () => {
  it("has the ported YouTube id from venue/index.astro", () => {
    expect(EDITION_2026.youtubeId).toBe("qyMGuU2-w8o");
  });

  it("has the ported gallery URL from venue/index.astro", () => {
    expect(EDITION_2026.galleryUrl).toBe(
      "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
    );
  });

  it("is NOT flagged as placeholder (real content)", () => {
    expect(EDITION_2026.placeholder).toBe(false);
  });

  it("has exactly 3 stats with the ported venue literals", () => {
    expect(EDITION_2026.stats).toHaveLength(3);
    expect(EDITION_2026.stats.map((s) => s.value)).toEqual(["1700+", "50+", "40+"]);
    expect(EDITION_2026.stats.map((s) => s.labelKey)).toEqual([
      "editions.2026.stats.participants",
      "editions.2026.stats.speakers",
      "editions.2026.stats.sessions",
    ]);
  });

  it("has 4 ambiance thumbnails for the 2026 section in a 2x2 grid", () => {
    expect(EDITION_2026.thumbnails).toHaveLength(4);
    EDITION_2026.thumbnails.forEach((thumb) => {
      expect(thumb.src).toBeDefined();
      const s = srcString(thumb.src);
      expect(s).toContain("ambiance");
      expect(thumb.size).toBe("hero");
    });
  });
});

describe("EDIT-02 / EDIT-03: EDITION_2023 data module (real KCD 2023 content)", () => {
  it("wires the 2023 YouTube playlist as the featured video", () => {
    expect(EDITION_2023.youtubeId).toBe(
      "videoseries?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h",
    );
    expect(EDITION_2023.playlistUrl).toBe(
      "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h",
    );
  });

  it("has exactly 3 stats for the 2023 edition", () => {
    expect(EDITION_2023.stats).toHaveLength(3);
    expect(EDITION_2023.stats.map((s) => s.labelKey)).toEqual([
      "editions.2023.stats.participants",
      "editions.2023.stats.speakers",
      "editions.2023.stats.sessions",
    ]);
  });

  it("has 6 thumbnails wired to kcd2023 masters (homepage mosaic subset)", () => {
    expect(EDITION_2023.thumbnails).toHaveLength(6);
    EDITION_2023.thumbnails.forEach((thumb) => {
      expect(thumb.src).toBeDefined();
      const s = srcString(thumb.src);
      expect(s).toContain("kcd2023");
    });
  });

  it("applies a balanced size rhythm (2 hero + 2 medium + 2 small)", () => {
    const sizes = EDITION_2023.thumbnails.map((t) => t.size);
    const counts = sizes.reduce<Record<string, number>>((acc, s) => {
      const key = s ?? "unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.hero).toBe(2);
    expect(counts.medium).toBe(2);
    expect(counts.small).toBe(2);
  });

  it("exposes the KCD 2023 brand logo for the callout band (EDIT-03)", () => {
    expect(EDITION_2023.brandLogo).toBeDefined();
    const s = srcString(EDITION_2023.brandLogo);
    expect(s).toContain("kcd2023");
  });

  it("is NOT flagged as placeholder (real content)", () => {
    expect(EDITION_2023.placeholder).toBe(false);
  });
});
