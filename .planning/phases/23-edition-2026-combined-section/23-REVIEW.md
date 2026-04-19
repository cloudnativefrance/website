---
phase: 23-edition-2026-combined-section
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/lib/editions-data.ts
  - src/i18n/ui.ts
  - src/components/past-editions/Edition2026Combined.astro
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 23 ships a clean, pure-SSR Astro component plus tightly scoped data/i18n changes. The threat model from `23-PLAN` (T-23-01 reverse-tabnabbing, T-23-02 cookie tracking) is correctly mitigated in the component (`rel="noopener noreferrer" target="_blank"` on both external CTAs, `youtube-nocookie.com` for the embed). DS token discipline is preserved — no ad-hoc colours. There are zero hydration directives and no client-side JS, matching D-02. No critical issues, no security gaps, no XSS surface.

Two warnings worth fixing before Phase 26 wires this into the homepage:
1. The component uses `as any` casts (3 occurrences) to coerce typed i18n key fields into the `t()` parameter type, even though the typed keys are valid subtypes of the union. Other call sites in the codebase (`src/pages/index.astro`, `src/pages/2023.astro`, `TestimonialsStrip.astro`) pass the same fields without the cast — this is local type-safety regression.
2. An orphan i18n key `editions.2026.thumbnail_alt.4` remains in both `fr` and `en` blocks of `ui.ts` after Plan 23-01 trimmed `EDITION_2026.thumbnails` from 4 to 3. UI-SPEC §3 line 223 explicitly leaves it "for now since key removal is a separate clean-up risk", so this is documented technical debt — flagged here so it is not forgotten. The EN copy for slot 4 also reads identically to slot 3 ("overall event view" / "overall venue view"), confirming it is dead.

The five Info items are minor polish (TODO without tracker, redundant truthiness guard, FR/EN copy mismatch, `let-spacing` declared twice, missing alt aria handling on rail).

The 11 pre-existing `astro check` errors in `src/pages/{,en/}index.astro` referencing the removed `editions.2026.gallery_cta` key are out of scope per the phase context and not counted in this review's findings.

---

## Warnings

### WR-01: Unnecessary `as any` casts on already-typed i18n keys

**File:** `src/components/past-editions/Edition2026Combined.astro:61, 80, 81`

**Issue:** The component uses `as any` to coerce `p.altKey`, `item.quoteKey`, and `item.attributionKey` into the `t()` parameter type:

```ts
alt: t(p.altKey as any),
quote: t(item.quoteKey as any),
attribution: t(item.attributionKey as any),
```

But these fields are already strongly typed:
- `Thumbnail.altKey` is declared as `string` in `editions-data.ts:32`, and the actual values stored are valid keys of `ui.fr` (e.g. `"editions.2026.thumbnail_alt.1"`).
- `Testimonial.quoteKey` and `attributionKey` in `testimonials-data.ts:16-17` are template-literal types `` `testimonials.${number}.quote` `` / `.attribution`, which are subtypes of the `t()` key union.

Other call sites pass these same fields directly without a cast — see `src/pages/index.astro:30,47`, `src/pages/2023.astro:26`, `src/pages/en/index.astro:29,46`, `src/pages/en/2023.astro:18`, `src/components/testimonials/TestimonialsStrip.astro:29-30,37-38`. Casting to `any` here disables type-checking on the call (a typo in the data source's `altKey` would no longer be caught) and is a local regression of project convention.

**Fix:** Drop the casts. If the `Thumbnail.altKey: string` declaration is too loose to satisfy `t()`, narrow it in `editions-data.ts` to `keyof typeof ui.fr` (the same approach `testimonials-data.ts` uses with template-literal types). Change to:

```ts
alt: t(p.altKey),
quote: t(item.quoteKey),
attribution: t(item.attributionKey),
```

If TypeScript complains because `Thumbnail.altKey` is declared `string`, tighten the type in `editions-data.ts:33` from `altKey: string` to `altKey: keyof typeof import("@/i18n/ui").ui.fr` (or a project-shared `I18nKey` alias).

### WR-02: Orphan i18n key `editions.2026.thumbnail_alt.4` in both locales

**File:** `src/i18n/ui.ts:218` (fr), `src/i18n/ui.ts:511` (en)

**Issue:** Plan 23-01 trimmed `EDITION_2026.thumbnails` from 4 entries to 3, but the corresponding `editions.2026.thumbnail_alt.4` translation strings were left in both `fr` and `en` blocks. No code path references key `.4` anymore (verified by grep — only matches are the two `ui.ts` definitions themselves).

The EN value is also a duplicate of slot 3:
- `editions.2026.thumbnail_alt.3` → `"CND France 2026 photo — overall venue view"`
- `editions.2026.thumbnail_alt.4` → `"CND France 2026 photo — overall event view"`

UI-SPEC §3 line 223 acknowledges this and defers cleanup ("leave it in `ui.ts` for now since key removal is a separate clean-up risk"). Flagging so it is not forgotten — leaving orphan keys grows i18n drift across locales over time and confuses future contributors.

**Fix:** Delete both entries:

```diff
-    "editions.2026.thumbnail_alt.4": "Photo CND France 2026 — vue générale de l'événement",
```
(line 218, fr block)

```diff
-    "editions.2026.thumbnail_alt.4": "CND France 2026 photo — overall event view",
```
(line 511, en block)

If deferring per UI-SPEC, add an inline TODO comment with a tracker ref so the cleanup is discoverable.

---

## Info

### IN-01: TODO comments without tracker references

**File:** `src/lib/editions-data.ts:41, 44`

**Issue:** New comments `// NEW (D-05)` and `// NEW (D-06)` reference Phase 23 design decision IDs but not a tracker issue. Once the phase is closed, future readers will have no easy path to the decision rationale beyond `git blame`. Other parts of the file follow the same pattern (`// CHANGED (D-04 + UI-SPEC §3)`), so this is consistent — but a one-line `Phase 23` reference would help.

**Fix:** Either link to the phase folder (`@see .planning/phases/23-edition-2026-combined-section/23-DISCUSSION-LOG.md#D-05`) or accept as project convention. Low priority.

### IN-02: Redundant `&&` guard on always-truthy `video`

**File:** `src/components/past-editions/Edition2026Combined.astro:129`

**Issue:** `{video && (...)}` and similarly `{photos && photos.length > 0 && (...)}` (line 110) defensively guard values that are guaranteed non-null after the `??` defaults assigned at lines 64 and 57 respectively. With the current default-fall-through, `video` is always defined and `photos` is always a non-empty array (3 entries from `EDITION_2026.thumbnails`). The guards are only meaningful if a caller explicitly passes `photos: []` or `video: undefined`.

This isn't a bug — it's defensive coding consistent with `PastEditionSection.astro:98` — but worth knowing the dead-code branches will never trip in current call patterns.

**Fix:** No action required. Either keep for defensive symmetry with the parent component pattern, or document intent with a brief comment ("guards permit caller to opt out of these blocks").

### IN-03: FR/EN copy asymmetry for `editions.2026.thumbnail_alt.3`

**File:** `src/i18n/ui.ts:217, 510`

**Issue:** Slot-3 alt text drifts subtly between locales:
- FR: `"Photo CND France 2026 — vue générale de l'événement"` ("overall view of the event")
- EN: `"CND France 2026 photo — overall venue view"` ("overall view of the venue")

Both are valid descriptions of `ambiance-10`, but "event" vs "venue" implies different things. Not blocking accessibility (both meet A11Y-04 unique descriptive alt), but a minor translation inconsistency.

**Fix:** Align — recommend EN `"overall event view"` to mirror the FR semantic, or update FR to `"vue générale du lieu"` to mirror EN. Pick one.

### IN-04: Heading uses both Tailwind class and inline style for letter-spacing

**File:** `src/components/past-editions/Edition2026Combined.astro:103-104`

**Issue:** The h2 declares letter-spacing twice:
```html
class="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
style="letter-spacing:-0.02em;"
```

`tracking-tight` is `letter-spacing: -0.025em` per Tailwind 4 defaults; the inline `style` then overrides it to `-0.02em`. Both apply but the inline wins (specificity). UI-SPEC §Typography line 62 documents `(tracking-tight, letter-spacing:-0.02em)` so this is intentional — it mirrors `PastEditionSection.astro:83` verbatim.

**Fix:** No action — keeping as-is matches the existing project pattern. If consolidating later, drop `tracking-tight` since the inline style supersedes it, or replace both with a Tailwind 4 arbitrary value `tracking-[-0.02em]`.

### IN-05: Rotated rail `<p>` is decorative but exposed to screen readers

**File:** `src/components/past-editions/Edition2026Combined.astro:95-99`

**Issue:** The rotated rail label `{rail}` ("EDITION 2026") is rendered as a `<p>` with no `aria-hidden`. Screen readers will announce it as part of the section, before the h2. Since the h2 already says "Edition 2026 — replay et bilan", the rail is duplicate audio content. The pattern is copied verbatim from `PastEditionSection.astro:76-80`, so this is a project-wide convention rather than a Phase 23 regression — but worth flagging.

**Fix:** Add `aria-hidden="true"` to the rail `<p>` if you want to hide the visual decoration from AT users. Out of Phase 23 scope (would require updating `PastEditionSection.astro` for consistency), defer to a future a11y pass.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
