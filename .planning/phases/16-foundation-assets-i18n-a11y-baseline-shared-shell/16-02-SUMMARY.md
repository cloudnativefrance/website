---
phase: 16-foundation-assets-i18n-a11y-baseline-shared-shell
plan: 02
completed: 2026-04-13
status: complete
---

# 16-02 Summary — Photo Optimization Pipeline + 10 KCD 2023 Masters

## Commits

| Commit | Task | What |
|--------|------|------|
| `3513cc8` | T2 | Added `sharp@^0.34.5` + `tsx@^4.21.0` devDeps, `scripts/optimize-photos.ts`, `optimize:photos` npm script, `.gitignore` entry for `_photo-drop/`, and committed 10 JPG masters at `src/assets/photos/kcd2023/01.jpg..10.jpg` |
| (next) | T3 | `tests/build/kcd2023-assets.test.ts` — 5-assertion Vitest budget gate |

## Per-File Sizes

| File | Size |
|------|------|
| 01.jpg | 586 KB |
| 02.jpg | 497 KB |
| 03.jpg | 481 KB |
| 04.jpg | 263 KB |
| 05.jpg | 415 KB |
| 06.jpg | 514 KB |
| 07.jpg | 352 KB |
| 08.jpg | 196 KB |
| 09.jpg | 146 KB |
| 10.jpg | 332 KB |
| **Total** | **3.69 MB** (budget 7 MB) |

All 10 produced at `quality=80` on the first attempt — the quality-decrement retry loop was **not triggered** (no file exceeded 1 MB at q80).

## Idempotence

Re-running `pnpm optimize:photos` prints `[skip]` for all 10 entries and exits 0. Confirmed.

## Verification

- `ls src/assets/photos/kcd2023/*.jpg | wc -l` → 10 ✓
- `find src/assets/photos/kcd2023 -name '*.jpg' -size +1024k` → empty ✓
- `du -cb src/assets/photos/kcd2023/*.jpg | tail -1 | awk '{print $1}'` → 3,872,000 ≤ 7,340,032 ✓
- `pnpm exec vitest run tests/build/kcd2023-assets.test.ts` → 5/5 pass in 160 ms
- `grep -q '"optimize:photos"' package.json` ✓
- `grep -q "_photo-drop" .gitignore` ✓

## Decisions Honored

D-01 (sharp pipeline, quality decrement, mozjpeg + 4:2:0 chroma + progressive), D-02 (10 photos named 01..10 deterministic), D-11 (zero-warnings policy — pipeline exits clean).

## Originals Source

User provided 10 KCD 2023 photos via `drive-download-20260413T170613Z-3-001.zip`. Extracted to `./_photo-drop/kcd2023/` (gitignored). Originals were `Kubernetes-community-days-2023-WEB-{1,30,54,55,76,92,94,97,100,114}.jpg` — alphabetical sort yielded 01=WEB-1, 02=WEB-100, 03=WEB-114, 04=WEB-30, 05=WEB-54, 06=WEB-55, 07=WEB-76, 08=WEB-92, 09=WEB-94, 10=WEB-97.

## Downstream Consumers

- Phase 19 — `PastEditionSection` `photos` prop reads these masters via `astro:assets` for the 2023 variant mosaic (D-04 from Phase 15).
- Phase 19 lightbox wires each tile click to the full-size master.
