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
import ambiance03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import ambiance06 from "@/assets/photos/ambiance/ambiance-06.jpg";
import ambiance08 from "@/assets/photos/ambiance/ambiance-08.jpg";
import ambiance10 from "@/assets/photos/ambiance/ambiance-10.jpg";
import kcdLogo from "@/assets/logos/kcd2023/logo-color.png";

type Stat = { value: string; labelKey: string };
type Thumbnail = {
  src: ImageMetadata;
  altKey: string;
  size?: "hero" | "medium" | "small";
};

export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl:
    "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+", labelKey: "editions.2026.stats.speakers" },
    { value: "40+", labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  // 4 real 2026 ambiance photos (ported from venue/index.astro).
  // Rendered as a clean 2×2 grid via size: "hero" (col-span-12 md:col-span-6).
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero" },
    { src: ambiance08, altKey: "editions.2026.thumbnail_alt.2", size: "hero" },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.3", size: "hero" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.4", size: "hero" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: false,
} as const;

/**
 * 2023 edition — KCD France 2023 at Centre Georges Pompidou.
 * Real content (not placeholder): 10 optimized photos + YouTube playlist + KCD brand callout.
 */
export const EDITION_2023 = {
  // Playlist embed — Stitch D-13 + the shell's `/embed/${id}` pattern accepts
  // the `videoseries?list=…` YouTube playlist shorthand.
  youtubeId: "videoseries?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h",
  playlistUrl:
    "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h",
  stats: [
    { value: "1700+", labelKey: "editions.2023.stats.participants" },
    { value: "42", labelKey: "editions.2023.stats.speakers" },
    { value: "24", labelKey: "editions.2023.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  // Homepage minimal block (17-04) — 3 curated photos (01, 05, 08) consumed by
  // PastEditionMinimal.astro. Full 10-photo mosaic + lightbox ships on a
  // dedicated 2023 page in a later phase.
  thumbnails: [
    { src: kcd2023_01, altKey: "editions.2023.thumbnail_alt.1", size: "medium" },
    { src: kcd2023_05, altKey: "editions.2023.thumbnail_alt.5", size: "medium" },
    { src: kcd2023_08, altKey: "editions.2023.thumbnail_alt.8", size: "medium" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  brandLogo: kcdLogo,
  placeholder: false,
} as const;
