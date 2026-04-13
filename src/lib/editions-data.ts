/**
 * Past-editions homepage data module (Phase 17, D-01).
 *
 * Single source of truth for homepage past-edition sections (2026, 2023).
 * Consumed by:
 *   - src/pages/index.astro         (Phase 17, Plan 17-03)
 *   - src/pages/en/index.astro      (Phase 17, Plan 17-03)
 *   - src/pages/venue/index.astro   (Phase 17, Plan 17-02 — transition window; removed Phase 18)
 *
 * Placeholder content is flagged with `placeholder: true` and a tracker issue URL.
 * Real recap content replaces placeholders post-event (tracker issue #3).
 */
import type { ImageMetadata } from "astro";

import kcd2023_01 from "@/assets/photos/kcd2023/01.jpg";
import kcd2023_05 from "@/assets/photos/kcd2023/05.jpg";
import kcd2023_08 from "@/assets/photos/kcd2023/08.jpg";

type Stat = { value: string; labelKey: string };
type Thumbnail = { src: ImageMetadata; altKey: string };

export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl:
    "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+", labelKey: "editions.2026.stats.speakers" },
    { value: "40+", labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  thumbnails: [
    { src: kcd2023_01, altKey: "editions.2026.thumbnail_alt.1" },
    { src: kcd2023_05, altKey: "editions.2026.thumbnail_alt.2" },
    { src: kcd2023_08, altKey: "editions.2026.thumbnail_alt.3" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: true,
  trackerIssueUrl: "https://github.com/cloudnativefrance/website/issues/3",
} as const;

/**
 * D-03 stub — filled by Phase 19 (photos, brandCallout, featured video, stats).
 * Not rendered on homepage in Phase 17.
 */
export const EDITION_2023 = {
  placeholder: true,
  trackerIssueUrl: "https://github.com/cloudnativefrance/website/issues/4",
} as const;
