---
phase: 23-edition-2026-combined-section
fixed_at: 2026-04-18T00:00:00Z
review_path: .planning/phases/23-edition-2026-combined-section/23-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 23: Code Review Fix Report

**Fixed at:** 2026-04-18
**Source review:** `.planning/phases/23-edition-2026-combined-section/23-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (Critical + Warning only — Info findings deferred per scope)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Unnecessary `as any` casts on already-typed i18n keys

**Files modified:** `src/lib/editions-data.ts`, `src/components/past-editions/Edition2026Combined.astro`
**Commit:** `4c8c46a`
**Applied fix:**
- Tightened `Thumbnail.altKey` type from `string` to `keyof typeof ui.fr` in `editions-data.ts` (added `import { ui } from "@/i18n/ui"` and a JSDoc note explaining the Phase 23 WR-01 motivation).
- Dropped `as any` on `t(p.altKey)` in `Edition2026Combined.astro:61` — now fully typesafe via the narrowed `Thumbnail.altKey`.
- Replaced `as any` on `t(item.quoteKey)` and `t(item.attributionKey)` (lines 80-81) with the tighter cast `as keyof typeof import("@/i18n/ui").ui.fr`. This still narrows the template-literal type `` `testimonials.${number}.quote` `` (which is broader than the actual finite key union) but only disables that specific assignability check rather than ALL typechecking.

**Why a partial cast remains for testimonials:** The review's suggestion to "drop the cast" is rooted in matching project convention (TestimonialsStrip.astro uses uncast template-literal keys). However, those existing call sites already produce TS errors that count toward the project's pre-existing 11-error `astro check` baseline. The phase context explicitly requires "no new errors beyond the documented baseline." Using `as keyof typeof ui.fr` instead of `as any` is the cleanest middle ground: better type safety than `as any`, no new astro check errors.

**Verification:** Tier 2 — `bun run astro check` baseline of 11 errors preserved (0 new errors).

### WR-02: Orphan i18n key `editions.2026.thumbnail_alt.4` in both locales

**Files modified:** `src/i18n/ui.ts`
**Commit:** `983676d`
**Applied fix:** Deleted `editions.2026.thumbnail_alt.4` from both the `fr` block (line 218) and the `en` block (line 511). Verified no source code reference exists — only documentation/planning files mention the key, which is expected (audit trail).

**Verification:**
- Tier 1 — re-read both blocks; key absent, surrounding entries intact, fr/en parity preserved.
- Tier 2 — `bun run astro check` baseline of 11 errors preserved (0 new errors).
- Grep confirmed no source-code references remain.

## Skipped Issues

None.

## Out-of-Scope Info Findings (not addressed)

These IN-* findings were excluded per `fix_scope: critical_warning` and remain documented in `23-REVIEW.md`:

- **IN-01:** TODO comments without tracker references (`editions-data.ts:41,44`).
- **IN-02:** Redundant `&&` truthiness guards on always-defined `video`/`photos` defaults.
- **IN-03:** FR/EN copy asymmetry for `editions.2026.thumbnail_alt.3` ("vue générale de l'événement" vs "overall venue view").
- **IN-04:** `tracking-tight` + inline `letter-spacing:-0.02em` declared together on the h2 (intentional, mirrors `PastEditionSection.astro`).
- **IN-05:** Rotated rail `<p>` decorative element exposed to screen readers (project-wide pattern, deferred to a future a11y pass).

## astro check baseline note

Project baseline: 11 pre-existing errors (3 in `src/content.config.ts`, 2 in `Edition2023PhotoGrid.astro`, 4 in `TestimonialsStrip.astro`, 2 in `src/pages/{,en/}index.astro` for the removed `editions.2026.gallery_cta` key). Post-fix verification confirms identical 11 errors — Phase 23 introduced zero regressions.

---

_Fixed: 2026-04-18_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
