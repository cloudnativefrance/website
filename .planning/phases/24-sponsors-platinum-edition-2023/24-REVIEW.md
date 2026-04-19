---
phase: 24
status: clean
reviewed_files:
  - src/lib/sponsor-utils.ts
  - src/components/sponsors/SponsorCard.astro
  - src/i18n/ui.ts
  - src/components/sponsors/SponsorsPlatinumStrip.astro
  - src/components/past-editions/Edition2023Link.astro
findings_count:
  critical: 0
  warnings: 0
  info: 4
depth: standard
---

# Phase 24 — Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 5
**Status:** clean

## Summary

All five Phase 24 source files are well-constructed, safe, and align tightly with the approved UI-SPEC and project conventions (CSV-as-source-of-truth, allow-list sponsor URL/logo gates, DS tokens only, no hardcoded sponsor data). The extraction of `safeUrl` / `safeLogoPath` into `src/lib/sponsor-utils.ts` is a clean, behaviour-preserving refactor that removes duplication and keeps both consumers (`SponsorCard.astro` and the new `SponsorsPlatinumStrip.astro`) wired through the same security-critical allow-list. Components render only from props and CSV-derived collection entries; no hardcoded sponsor / speaker / session data leaks into `.astro` or `.ts` files. i18n parity holds: both `sponsors.homepage.heading` and `sponsors.homepage.cta` are added to `fr` and `en` in the same commit (Pitfall #2 satisfied). Anchor `rel="noopener noreferrer"` pairs correctly with every `target="_blank"`. Empty-state behaviour is defensive (belt-and-braces) and correct.

No critical issues and no warnings. Four informational observations below are nice-to-have polish items — none block merge.

## Critical

_None._

## Warnings

_None._

## Info

### IN-01: `SponsorsPlatinumStrip.astro` — no-URL fallback card could expose `min-h-[112px]` extra space visually when logo is also missing

**File:** `src/components/sponsors/SponsorsPlatinumStrip.astro:91-103`
**Category:** UX / code quality (cosmetic only)
**Issue:** When a sponsor has both `safeHref === null` AND `logoSrc === null`, the rendered card is a `<div>` containing only the `<span>` name fallback, centered inside a `min-h-[112px]` box. That is the intended behaviour per UI-SPEC, but the div is not interactive and carries the full `cardClasses` string including `transition-all`, `motion-safe:hover:-translate-y-0.5`, `hover:border-primary/50`, and all the `focus-visible:*` utilities — none of which apply to a non-focusable, non-hovered `<div>`. The classes are inert (no bug) but add bundle CSS output for every non-interactive card.
**Fix (optional):** Split `cardClasses` into `baseCardClasses` (structural: bg/border/padding/flex/min-h) and `interactiveExtras` (transitions + hover + focus ring), and concatenate `interactiveExtras` only on the `<a>` branch — mirrors how `SponsorCard.astro:37-39` already separates `baseCardClass` from `linkExtrasClass`. Pure polish; zero behaviour change.

### IN-02: `Edition2023Link.astro` — props-documented Pattern A arrow relies on caller discipline

**File:** `src/components/past-editions/Edition2023Link.astro:29-30, 57`
**Category:** API contract / code quality
**Issue:** The component comment on line 29 and the inline JSDoc explicitly state that `viewPageLabel` MUST already include the trailing ` →` (Pattern A). If a future caller passes a label without the arrow (e.g. a new i18n key that forgets it, or someone refactoring `editions.2023.view_page_cta` to drop the glyph in favour of Pattern B site-wide), the visual contract silently breaks — no compiler warning, no runtime error, just a missing arrow. Today the two existing keys (`editions.2023.view_page_cta` in FR + EN) both end in " →", so the current usage is correct; this is a forward-safety note.
**Fix (optional):** Either (a) add an `arrow?: "inline" | "append" | "none"` prop (default `"inline"`, keeps current behaviour) so the template can append `<span aria-hidden="true">→</span>` when requested, or (b) leave as-is and rely on the JSDoc — this is the established Phase 23 pattern and Phase 24 follows it consistently. Documented-only concern; no change recommended unless a future phase introduces inconsistency.

### IN-03: `SponsorsPlatinumStrip.astro` — inline `list-none p-0` on `<ul>` is a Tailwind-reset belt-and-braces

**File:** `src/components/sponsors/SponsorsPlatinumStrip.astro:63`
**Category:** code quality (style)
**Issue:** The `<ul>` carries `list-none p-0` defensive overrides in addition to the `grid` layout classes. Tailwind 4's preflight already resets `ul` margin/padding and bullet markers (`list-style: none` on `ul` without a `role`), so `list-none p-0` is redundant given the project's Tailwind 4 baseline. Not a bug — the classes are no-ops given the reset — but noise in the class string.
**Fix (optional):** Drop `list-none p-0` from the `<ul>` classes. If project-wide Tailwind config ever re-enables list markers, keeping them is also valid as a localised guard.

### IN-04: `sponsor-utils.ts` — `safeLogoPath` accepts `undefined` via nullish fallback but the param type is `string | undefined`

**File:** `src/lib/sponsor-utils.ts:37-38`
**Category:** type-safety polish
**Issue:** `safeLogoPath(raw: string | undefined)` starts with `const t = (raw || "").trim();`. The `||` fallback also consumes the empty-string case, which is the intended behaviour (empty → null). Using `??` instead would only catch `null`/`undefined` and leave `""` to be handled by the subsequent `if (!t) return null` check — functionally identical here but semantically cleaner. Not a bug, but the next reader has to mentally verify that `""` triggers the `!t` short-circuit.
**Fix (optional):** Either change to `const t = (raw ?? "").trim();` (relies on the `!t` check for the empty string) or document the current `||` choice with a single-line comment. Purely stylistic.

---

## Conventions & Design-System Compliance

- [x] CSV source-of-truth respected — both new components render only from `CollectionEntry<"sponsors">` collection entries or caller-supplied props. No sponsor rows hardcoded in `.astro`/`.ts`.
- [x] DS tokens only — no ad-hoc hex/rgb values, no `style="color: …"` overrides; all colours reference token utilities (`text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `ring-ring`).
- [x] Accent Pink reserved — `bg-accent` / `border-accent` / `text-accent` not used anywhere in the two new components (UI-SPEC §Color contract upheld).
- [x] i18n parity — both NEW keys (`sponsors.homepage.heading`, `sponsors.homepage.cta`) exist in FR + EN at `src/i18n/ui.ts:94-95` and `:390-391`. No template-literal or drifted keys.
- [x] Accessibility — single `<h2>` per section; `<img>` carries non-empty `alt`; sponsor anchors pair `target="_blank"` with `rel="noopener noreferrer"`; internal CTAs (`/sponsors`, `/2023`) are same-tab; focus rings tokenised via `ring-ring`.
- [x] Pure SSR — no `client:*` directive on either component (Astro-correct for prop-only render).
- [x] Security — `safeUrl` and `safeLogoPath` allow-list gates applied on both the href and the logo src inside `SponsorsPlatinumStrip.astro` (T-05-02 + T-05-03 mitigations); no `innerHTML`, no `eval`, no unsafe sinks; no hardcoded secrets.
- [x] Stitch-first respected — visual contract mirrors `24-UI-SPEC.md` (h2 style, grid columns, card chrome, CTA underline, Pattern B arrow for sponsors CTA, Pattern A arrow for 2023 CTA).

## Pre-existing Baseline (Not Phase 24 Findings)

Per the scope note, 11 pre-existing `astro check` errors outside the Phase 24 file set (content.config.ts zod loaders, `Edition2023PhotoGrid` implicit-any, `TestimonialsStrip` template-literal keys, orphan `editions.2026.gallery_cta` refs in homepage files) are explicitly out of scope — carried over from Phase 23 and the v1.1 ship-now decision. They are noted here only to confirm they were considered and correctly excluded.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
