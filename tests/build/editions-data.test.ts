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

  it("has 3 ambiance thumbnails for the 2026 asymmetric mosaic (1 hero + 2 medium)", () => {
    expect(EDITION_2026.thumbnails).toHaveLength(3);
    EDITION_2026.thumbnails.forEach((thumb) => {
      expect(thumb.src).toBeDefined();
      const s = srcString(thumb.src);
      expect(s).toContain("ambiance");
    });
    expect(EDITION_2026.thumbnails[0].size).toBe("hero");
    expect(EDITION_2026.thumbnails[1].size).toBe("medium");
    expect(EDITION_2026.thumbnails[2].size).toBe("medium");
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

  it("has 3 thumbnails wired to kcd2023 masters (17-04 minimal homepage block)", () => {
    expect(EDITION_2023.thumbnails).toHaveLength(3);
    EDITION_2023.thumbnails.forEach((thumb) => {
      expect(thumb.src).toBeDefined();
      const s = srcString(thumb.src);
      expect(s).toContain("kcd2023");
    });
  });

  it("uses uniform medium size (carried over from 17-03 shape)", () => {
    const sizes = EDITION_2023.thumbnails.map((t) => t.size);
    expect(sizes.every((s) => s === "medium")).toBe(true);
  });

  it("exposes the KCD 2023 brand logo for the callout band (EDIT-03)", () => {
    expect(EDITION_2023.brandLogo).toBeDefined();
    const s = srcString(EDITION_2023.brandLogo);
    expect(s).toContain("kcd2023");
  });

  it("is NOT flagged as placeholder (real content)", () => {
    expect(EDITION_2023.placeholder).toBe(false);
  });

  /** Phase 19 EDIT-02 / A11Y-04: dedicated `/2023` page shape. */
  it("exposes exactly 10 kcd2023 photos via photos10 (dedicated page)", () => {
    expect(EDITION_2023.photos10).toHaveLength(10);
    EDITION_2023.photos10.forEach((p) => {
      const s = srcString(p.src);
      expect(s).toContain("kcd2023");
    });
  });

  it("has 10 distinct altKeys on photos10 (no alt-key reuse)", () => {
    const keys = EDITION_2023.photos10.map((p) => p.altKey);
    expect(new Set(keys).size).toBe(10);
    keys.forEach((k) => {
      expect(k).toMatch(/^editions\.2023\.photo_alt\.(01|02|03|04|05|06|07|08|09|10)$/);
    });
  });

  it("exposes brandHistory sub-object with i18n key references (EDIT-03)", () => {
    expect(EDITION_2023.brandHistory).toBeDefined();
    expect(EDITION_2023.brandHistory.headingKey).toBe("editions.2023.brand_history.heading");
    expect(EDITION_2023.brandHistory.bodyKey).toBe("editions.2023.brand_history.body");
    expect(EDITION_2023.brandHistory.venueKey).toBe("editions.2023.brand_history.venue");
    expect(EDITION_2023.brandHistory.logoAltKey).toBe("editions.2023.brand_history.logo_alt");
  });

  it("flags gallery URL + stats as placeholder with tracker (EDIT-07)", () => {
    expect(EDITION_2023.galleryPlaceholder).toBe(true);
    expect(EDITION_2023.trackerUrl).toMatch(/^https:\/\/github\.com/);
    expect(EDITION_2023.galleryUrl).toMatch(/^https:\/\//);
  });
});
