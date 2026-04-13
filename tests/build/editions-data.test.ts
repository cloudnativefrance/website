/**
 * EDIT-01 (Phase 17, D-01/D-02/D-04/D-05).
 *
 * Asserts editions-data.ts shape, placeholder flag, tracker URL, stat literals,
 * and that the 3 kcd2023 thumbnails resolve to ImageMetadata at import time.
 */
import { describe, it, expect } from "vitest";
import { EDITION_2026, EDITION_2023 } from "../../src/lib/editions-data";

describe("EDIT-01: EDITION_2026 data module", () => {
  it("has the ported YouTube id from venue/index.astro", () => {
    expect(EDITION_2026.youtubeId).toBe("qyMGuU2-w8o");
  });

  it("has the ported gallery URL from venue/index.astro", () => {
    expect(EDITION_2026.galleryUrl).toBe(
      "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
    );
  });

  it("has placeholder flag set to true (D-02)", () => {
    expect(EDITION_2026.placeholder).toBe(true);
  });

  it("points to tracker issue #3 (D-04)", () => {
    expect(EDITION_2026.trackerIssueUrl).toBe(
      "https://github.com/cloudnativefrance/website/issues/3",
    );
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

  it("has exactly 3 thumbnails wired to kcd2023 masters (D-05)", () => {
    expect(EDITION_2026.thumbnails).toHaveLength(3);
    // In vitest (non-Astro) runtime, image imports resolve to a URL string or
    // an ImageMetadata-like object (shape depends on the Astro build phase).
    // Either way, each thumbnail must resolve and reference the kcd2023 masters.
    const expectedFiles = ["01.jpg", "05.jpg", "08.jpg"];
    EDITION_2026.thumbnails.forEach((thumb, i) => {
      expect(thumb.src).toBeDefined();
      const srcStr =
        typeof thumb.src === "string"
          ? thumb.src
          : (thumb.src as { src: string }).src;
      expect(srcStr).toContain("kcd2023");
      expect(srcStr).toContain(expectedFiles[i]);
    });
    expect(EDITION_2026.thumbnails.map((t) => t.altKey)).toEqual([
      "editions.2026.thumbnail_alt.1",
      "editions.2026.thumbnail_alt.2",
      "editions.2026.thumbnail_alt.3",
    ]);
  });
});

describe("D-03: EDITION_2023 stub", () => {
  it("exists as a placeholder for Phase 19", () => {
    expect(EDITION_2023).toBeDefined();
    expect(EDITION_2023.placeholder).toBe(true);
    expect(typeof EDITION_2023.trackerIssueUrl).toBe("string");
  });
});
