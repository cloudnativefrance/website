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
import kcd2023_02 from "@/assets/photos/kcd2023/02.jpg";
import kcd2023_03 from "@/assets/photos/kcd2023/03.jpg";
import kcd2023_04 from "@/assets/photos/kcd2023/04.jpg";
import kcd2023_05 from "@/assets/photos/kcd2023/05.jpg";
import kcd2023_06 from "@/assets/photos/kcd2023/06.jpg";
import kcd2023_07 from "@/assets/photos/kcd2023/07.jpg";
import kcd2023_08 from "@/assets/photos/kcd2023/08.jpg";
import kcd2023_09 from "@/assets/photos/kcd2023/09.jpg";
import kcd2023_10 from "@/assets/photos/kcd2023/10.jpg";
import ambiance03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import ambiance06 from "@/assets/photos/ambiance/ambiance-06.jpg";
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
  // NEW (D-05) — 2026 replays YouTube playlist
  replaysUrl:
    "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2",
  // NEW (D-06) — one-pager bilan 2026 PDF on Google Drive
  pdfUrl:
    "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+", labelKey: "editions.2026.stats.speakers" },
    { value: "40+", labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  // CHANGED (D-04 + UI-SPEC §3) — 3 entries, sized for asymmetric mosaic
  // Slot 1 (hero): ambiance-03 main hall ambiance.
  // Slot 2 (medium): ambiance-06 networking moment.
  // Slot 3 (medium): ambiance-10 overall venue view.
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero" },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.2", size: "medium" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.3", size: "medium" },
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
  /**
   * Phase 19: all 10 KCD 2023 masters for the dedicated `/2023` (FR) and
   * `/en/2023` (EN) page photo grid + lightbox. Distinct alt keys per photo
   * meet A11Y-04 (unique descriptive alt, no "photo 1/2" patterns).
   */
  photos10: [
    { src: kcd2023_01, altKey: "editions.2023.photo_alt.01" },
    { src: kcd2023_02, altKey: "editions.2023.photo_alt.02" },
    { src: kcd2023_03, altKey: "editions.2023.photo_alt.03" },
    { src: kcd2023_04, altKey: "editions.2023.photo_alt.04" },
    { src: kcd2023_05, altKey: "editions.2023.photo_alt.05" },
    { src: kcd2023_06, altKey: "editions.2023.photo_alt.06" },
    { src: kcd2023_07, altKey: "editions.2023.photo_alt.07" },
    { src: kcd2023_08, altKey: "editions.2023.photo_alt.08" },
    { src: kcd2023_09, altKey: "editions.2023.photo_alt.09" },
    { src: kcd2023_10, altKey: "editions.2023.photo_alt.10" },
  ] as const,
  brandLogo: kcdLogo,
  /**
   * Phase 19 D-11: brand-history callout references.
   * Body + heading + venue strings live in i18n (FR + EN) and are gated on
   * organizer sign-off (see content-gates.md — TODO(19) I18N-03 / EDIT-07).
   */
  brandHistory: {
    logo: kcdLogo,
    logoAltKey: "editions.2023.brand_history.logo_alt",
    headingKey: "editions.2023.brand_history.heading",
    bodyKey: "editions.2023.brand_history.body",
    venueKey: "editions.2023.brand_history.venue",
  } as const,
  /**
   * Phase 19 EDIT-07: gallery URL + real stats are placeholders awaiting
   * organizer confirmation. The playlist URL is a reasonable interim target
   * so visitors can still reach the 2023 content.
   */
  galleryUrl: "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h",
  galleryPlaceholder: true,
  trackerUrl: "https://github.com/cloudnativefrance/website/issues/19",
  placeholder: false,
} as const;
