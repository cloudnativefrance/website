# Event Photography

Photography from past Cloud Native Days France events, intended for use on the 2027 edition website (hero backgrounds, gallery, about-page atmosphere, speakers section).

## Source

Original files delivered as `drive-download-20260412T054206Z-3-001.zip` (not committed — 115 MB). Originals are 6000×4000 / 4134×2756 / 3983×5975 pixel JPEGs straight from camera. Licensed for use on the CND France website; attribution to the event photographer should be added on any public gallery page.

## Optimisation recipe

All masters in this directory were processed through ImageMagick with:

```bash
magick INPUT \
  -auto-orient \
  -resize '2400x2400>' \
  -strip \
  -sampling-factor 4:2:0 \
  -interlace JPEG \
  -colorspace sRGB \
  -quality 82 \
  OUTPUT
```

- `-auto-orient` applies EXIF rotation then strips the tag (needed for `AMBIANCE-003`)
- `-resize '2400x2400>'` caps the long edge at 2400 px (only shrinks, never enlarges)
- `-strip` removes EXIF/IPTC/colour profiles (privacy + size)
- `-sampling-factor 4:2:0 -interlace JPEG -colorspace sRGB -quality 82` is the standard web-JPG recipe

Resulting masters are **~300–850 KB** each (down from 3–15 MB). Total directory: ~6.7 MB for 12 photos.

## How to consume

Import from `src/assets/photos/...` and let Astro's `<Image>` component generate responsive AVIF/WebP variants at build time. **Do not import from `public/`** — that bypasses optimisation.

```astro
---
import { Image } from "astro:assets";
import ambiance01 from "@/assets/photos/ambiance/ambiance-01.jpg";
---
<Image
  src={ambiance01}
  alt="Audience at Cloud Native Days France"
  widths={[480, 800, 1200, 1600]}
  sizes="(min-width: 1024px) 50vw, 100vw"
  formats={["avif", "webp"]}
  loading="lazy"
/>
```

For hero backgrounds, add `loading="eager"` and a `fetchpriority="high"` hint.

## Inventory

### `ambiance/` — venue, audience, and panel atmosphere (10 photos)

| File               | Dimensions | Orientation | Notes                                                        |
| ------------------ | ---------- | ----------- | ------------------------------------------------------------ |
| `ambiance-01.jpg`  | 1596×2400  | portrait    | Panel on stage, large screen backdrop                        |
| `ambiance-02.jpg`  | 1600×2400  | portrait    | Audience / stage ambience                                    |
| `ambiance-03.jpg`  | 2400×1600  | landscape   | Wide venue / crowd shot                                      |
| `ambiance-04.jpg`  | 2400×1600  | landscape   | Wide venue / crowd shot                                      |
| `ambiance-05.jpg`  | 1600×2400  | portrait    | Venue portrait framing                                       |
| `ambiance-06.jpg`  | 2400×1600  | landscape   | Panel discussion, stage                                      |
| `ambiance-07.jpg`  | 1600×2400  | portrait    | Panel / audience layered composition                         |
| `ambiance-08.jpg`  | 2400×1600  | landscape   | Conference room / audience                                   |
| `ambiance-09.jpg`  | 1600×2400  | portrait    | Detail / portrait format                                     |
| `ambiance-10.jpg`  | 2400×1600  | landscape   | Conference room / audience                                   |

### `speakers/` — intervenants on stage (2 photos)

| File               | Dimensions | Orientation | Notes                                                        |
| ------------------ | ---------- | ----------- | ------------------------------------------------------------ |
| `speakers-01.jpg`  | 2400×1600  | landscape   | Stage with pirate-themed decor — opening/keynote moment      |
| `speakers-02.jpg`  | 2400×1600  | landscape   | Speaker on stage                                             |

## Re-running optimisation

If originals are re-delivered or you want to regenerate with a different quality setting, drop the zip into the repo root and run:

```bash
unzip -o drive-download-*.zip -d /tmp/cnd-photos
# Then re-run the magick recipe above — see git log for the mapping of
# original filenames → semantic names (ambiance-01..10, speakers-01..02).
```
