---
phase: 18-venue-page-cleanup
milestone: v1.1
depends_on: [17]
requirements: [VENUE-01, VENUE-02, VENUE-03, VENUE-04]
created: 2026-04-14
---

# Phase 18 Context — Venue Page Cleanup

## Goal (from roadmap)

Strip the relocated "Previous edition 2026" block from `src/pages/venue/index.astro` (FR) and `src/pages/en/venue/index.astro` (EN) now that Phase 17 shipped the 2026 homepage integration in both locales. Remove orphaned imports, i18n keys, and audit (document absence of) inbound anchor references so nothing silently breaks.

## Prior-Phase Inheritance

- **Phase 17 (now complete):** `EDITION_2026` in `src/lib/editions-data.ts` is the single source of truth for 2026 content. Homepage `/` and `/en/` render the `PastEditionSection` with `id="edition-2026"`. The venue page still mirrors that data via `venue.prev.*` keys + direct `EDITION_2026` import — those are what Phase 18 removes.
- **Phase 17 did not delete** any venue code (Success Criterion 5). That deletion is this phase's entire job.

## Scouting Findings

1. **Venue pages affected:** `src/pages/venue/index.astro` (287 lines), `src/pages/en/venue/index.astro`.
2. **Orphaned symbols after block deletion** (venue only; kept elsewhere):
   - Import: `EDITION_2026` from `@/lib/editions-data` (removable from venue — still used on homepage)
   - Imports: `ambiance03`, `ambiance06`, `ambiance10` (removable from venue — the image master files stay; `HeroSection.astro` uses `ambiance-10` and `editions-data.ts` uses 03/06/08/10 for the homepage 2026 thumbnails)
   - Locals: `YOUTUBE_ID`, `GALLERY_URL`, `previousStats`, `thumbnails` (all removable — block-local)
3. **i18n keys to sweep:** 8 `venue.prev.*` keys × 2 locales = 16 entries in `src/i18n/ui.ts` (lines 136–143 FR, 404–411 EN).
4. **Anchor audit:** `grep -rn "#previous-edition\|previous-edition" src/` → **zero hits**. `grep -n 'id="' src/pages/venue/index.astro` → **zero hits**. The block never had an id anchor; no inbound reference redirect is required.

## Decisions (Locked)

### D-01: Two commits, not three
Roadmap goal line says "three surgical, separately-revertable commits". Scouting shows the third (anchor audit/redirect) is genuinely empty work — no anchor exists and no refs point at one. Ship **two commits** plus document the anchor finding in `18-VERIFICATION.md`:
- **Commit A — Block deletion + orphan cleanup:** Remove the `<!-- previous edition 2026 -->` block from both venue pages, plus the `EDITION_2026`, `ambiance03`, `ambiance06`, `ambiance10` imports and the `YOUTUBE_ID`, `GALLERY_URL`, `previousStats`, `thumbnails` locals.
- **Commit B — i18n sweep:** Delete the 16 `venue.prev.*` keys from `src/i18n/ui.ts`.

**Rationale:** Commit theater adds no value when the work is zero. Anchor audit result is a verification artifact, not a code change. Each remaining commit is still independently revertable.

### D-02: No filler content on venue page
The venue page is about the venue (transport, accessibility, map). The previous-edition block was always off-topic there. After deletion, the page ends cleanly on the final existing section (no "See homepage for past editions" link, no divider). Homepage now owns past editions; footer/nav already link to `/#edition-2026` implicitly via homepage nav.

**Rationale:** Avoid stitching in a link purely to fill vertical space. The venue page is stronger when focused.

### D-03: Add minimal regression tests
One new build-time Vitest suite (`tests/build/venue-cleanup.test.ts`) with assertions:
- `src/i18n/ui.ts` contains zero matches for `venue.prev`
- `src/pages/venue/index.astro` and `src/pages/en/venue/index.astro` contain zero matches for `EDITION_2026`, `ambiance03`, `ambiance06`, `ambiance10`, `YOUTUBE_ID`, `GALLERY_URL`, `previousStats`, `thumbnails`
- `dist/venue/index.html` and `dist/en/venue/index.html` contain zero matches for `1700+`, `youtube-nocookie`, `youtube.com/embed`, `CND France 2026` rail copy

**Rationale:** Mirrors the Phase 17 testing approach (source-level grep + dist-level DOM grep). Cheap, locale-parity enforced, regression-proof.

### D-04: Commit conventions
Match Phase 17 style:
- `refactor(18-01): delete previous-edition 2026 block from venue pages + orphan cleanup`
- `refactor(18-02): remove venue.prev.* i18n keys (FR + EN)`

### D-05: Tests go in the first commit that makes them green
Following the Phase 17 RED-GREEN pattern is unnecessary for pure deletion — the tests pass simultaneously with the deletion itself. Include test assertions for block removal in **Commit A**, and the i18n-sweep assertion in **Commit B**. Alternative (RED-first) would add a third commit for no real TDD benefit on deletion work.

## Gray Areas (Resolved — Do Not Re-Ask)

| Gray area | Resolution | Source |
|-----------|-----------|--------|
| Anchor redirect for `/#previous-edition` | Not needed — zero inbound refs found during scouting. Documented in verification. | Scouting + D-01 |
| Delete image master files (ambiance-03/06/10.jpg) | No — still used elsewhere (HeroSection, editions-data) | Scouting |
| Filler content on venue page after deletion | No filler | D-02 |
| Number of commits | 2 (not 3) | D-01 |
| New test file | Yes, one new Vitest build suite | D-03 |

## Deferred / Out of Scope

- Venue page visual redesign (separate future concern)
- Restructuring `src/pages/en/venue/index.astro` to import from a shared venue component (Phase 16 shell was for editions, not venue — venue DRY is a deferred refactor, not v1.1)
- Removing now-orphaned CSS utility classes unique to the deleted block (if any surface, handle inline in Commit A)

## Success Criteria Restated (verbatim from ROADMAP.md Phase 18)

1. "Previous edition 2026" block removed from `src/pages/venue/index.astro` in a separate commit from any homepage change
2. `grep -n "ambiance03\|ambiance06\|ambiance10\|YOUTUBE_ID\|GALLERY_URL\|previousStats\|thumbnails" src/pages/venue/index.astro` returns zero hits; `pnpm exec tsc --noEmit` passes
3. `grep -rn "venue\.prev" src/` returns zero hits after the i18n sweep commit
4. References to `#previous-edition` anchor are either redirected or audited absent across `src/`, footer, header, mobile nav
5. `pnpm build` succeeds with no orphaned `dist/` assets and no broken `t()` calls

## Plans Anticipated

- **18-01-PLAN.md** — Block deletion + orphan symbol cleanup (both locales) + new regression test suite
- **18-02-PLAN.md** — `venue.prev.*` i18n-key sweep (FR + EN) + test assertion extension

## Next Step

`/gsd-plan-phase 18` (continues from here; research is not needed — this is a mechanical deletion phase with full scouting already done).
