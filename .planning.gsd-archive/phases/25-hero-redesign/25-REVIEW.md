---
phase: 25
status: warnings
reviewed_files:
  - src/components/hero/HeroSection.astro
  - src/i18n/ui.ts
findings_count:
  critical: 0
  warnings: 1
  info: 4
depth: standard
---

# Phase 25 — Hero Redesign — Code Review

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 2
**Status:** warnings (1 warning, 4 info — all advisory; no blockers)

## Summary

The Phase 25 implementation faithfully applies the four surgical edits prescribed by the UI-SPEC and the 01-PLAN. Both i18n keys are correctly added in fr/en parity, the background image swap with `opacity-75` is clean, the 3-CTA row is well structured, the inline mail SVG carries the correct `aria-hidden="true" focusable="false"` attributes, and the placeholder anchor + `sr-only aria-hidden` sentinel pattern is implemented as specified. The Pink Ghost CTA's accent overlay (`text-accent`, `hover:bg-accent/10 hover:text-accent`, `focus-visible:ring-accent/50`, `gap-2`) layers correctly on top of `buttonVariants({ variant: "ghost", size: "lg" })`.

One Warning is raised about the perceived behavior of the placeholder anchor (the spec claims "no visual jump" but a same-page anchor still nudges scroll position when the stub falls outside the current viewport — a UX concern, not a correctness bug). Four Info-level notes capture minor polish opportunities: the background `<img>` lacks `width`/`height` attributes (no CLS impact in this absolute-positioned case, but Astro/HTML linters may complain), the new FR strings use accented `é` while neighboring `hero.cta.register` historically uses unaccented "Reservez" (intentional per UI-SPEC, but creates copy inconsistency), the Ghost CTA's `focus-visible:ring-accent/50` contrast is borderline (~3.2:1) over the brightest image midtones, and the i18n `ui` const lacks a structural type-equality guard that would catch fr/en drift at build time.

The Phase 24 Accent Pink anchoring rule is honored as a non-regression: a fresh grep confirms exactly **9** `bg-accent|text-accent|border-accent` usages outside `src/components/hero/` and `src/components/ui/button.tsx` (matches the planning-time baseline; zero new leakage). The `lucide-react` package is not imported. No source files outside `src/i18n/ui.ts` and `src/components/hero/HeroSection.astro` were modified.

---

## Warnings

### WR-01: Placeholder anchor `#newsletter-stub` will cause perceptible scroll on tablet/desktop viewports

**File:** `src/components/hero/HeroSection.astro:93-94, 125`
**Category:** UX / Accessibility
**Severity:** Warning

**Issue:** The Ghost CTA `<a href="#newsletter-stub">` (line 94) targets a sentinel `<div id="newsletter-stub" class="sr-only" aria-hidden="true"></div>` (line 125) placed at the **bottom** of the inner `relative z-10 mx-auto flex max-w-4xl flex-col` container. On viewports tall enough that the stub is **already visible** (typical desktop, where `min-h-screen` matches the viewport), clicking the CTA produces no scroll — fine. But on viewports where the stub falls **below the fold** (common on landscape tablets at 768–1024px when the hero is `min-h-[80vh]` and the stub is the last child of a vertically dense flex column), the browser will:

1. Update `window.location.hash` to `#newsletter-stub`.
2. Scroll the page so the `sr-only` element (which has `width: 1px; height: 1px` per Tailwind's `sr-only` utility) is at the top of the viewport.
3. From the user's perspective: the entire hero scrolls upward by ~50–80px, "jumping" away from the CTA they just clicked. The destination is empty (sr-only), so they see whatever sits below the hero (KeyNumbers, CFP, etc.) — or, if the stub IS within the hero, just a re-aligned hero. Either way it reads as broken behavior on a CTA labeled "Restez informé" / "Stay in the loop".

The UI-SPEC §"Discretion Resolutions" Q1 claims "silent scroll; target lives inside hero, no visual jump", but this only holds when the stub is in-viewport at click time. The spec also documents a fallback: the executor could `preventDefault` via a small JS island, but explicitly rejected that to keep the hero zero-JS outside Countdown.

Additional concerns:
- Updating `location.hash` to `#newsletter-stub` pollutes browser history (back-button now returns to a "no-hash" state, requiring a second back press to leave the page).
- Screen-reader users following the link land on an `aria-hidden="true"` empty `<div>` — virtual cursor positioning is undefined behavior across SR/browser combinations; some readers announce nothing, others jump to the next focusable element below the hero.

**Fix (recommended; pick one):**

Option A — Move the stub to the **same flex row** as the CTAs (so it always shares the viewport with the CTA when clicked):
```astro
<!-- Inside the CTA row container, AFTER the ghost CTA <a> -->
<a href="#newsletter-stub" ...>...</a>
<span id="newsletter-stub" class="sr-only" aria-hidden="true"></span>
</div>
```
This keeps the stub in the same line-box as the button, so the scroll-to-top-of-target movement is sub-pixel.

Option B — Use `href="#"` with `tabindex="-1" aria-disabled="true"` instead, accepting the documented downside (loses keyboard "press Enter to activate"):
```astro
<a href="#" aria-disabled="true" tabindex="0"
   onclick="event.preventDefault()" ...>
```
(Requires `is:inline` script directive or a tiny client island — the UI-SPEC explicitly rejected this path.)

Option C — Document the trade-off and ship as-is, with a manual UAT check on tablet viewports (768–1024px) to confirm the scroll movement is acceptable. Mark for review when CLO-6 backend lands and the placeholder is replaced.

Suggested next action: validate in a real browser at viewport heights of 700px and 900px (clicking the Ghost CTA) before declaring Phase 25 fully done. If the scroll movement is visible, apply Option A.

---

## Info

### IN-01: Background `<img>` is missing `width` and `height` attributes

**File:** `src/components/hero/HeroSection.astro:22-29`
**Category:** Code Quality / HTML Validity

**Issue:** The hero background `<img>` element declares only `src`, `alt`, `aria-hidden`, `loading`, `decoding`, and `class`:
```astro
<img
  src={ambiance00.src}
  alt=""
  aria-hidden="true"
  loading="eager"
  decoding="async"
  class="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
/>
```

The `ambiance00` import (`import ambiance00 from "@/assets/photos/ambiance/ambiance-00.jpg"`) returns an Astro `ImageMetadata` object that exposes `.src`, `.width`, and `.height`. The current code uses only `.src`, discarding the dimension metadata that browsers + accessibility audits can use to compute aspect-ratio reservations. In this specific case the impact is **zero** because the image is `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover` — layout space is reserved by the parent section, not the image. But:

- HTML lint tools (axe-core, Lighthouse, `astro check` with strict image checks) commonly flag missing `width`/`height` on `<img>` regardless of layout context.
- The `<img>` for the logo at lines 43-51 DOES pass `width={400} height={(400 * logo.height) / logo.width}` — the codebase has the convention; it's just inconsistent on the background image.

**Fix:**
```astro
<img
  src={ambiance00.src}
  width={ambiance00.width}
  height={ambiance00.height}
  alt=""
  aria-hidden="true"
  loading="eager"
  decoding="async"
  class="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
/>
```
No visual impact; silences lint warnings and matches the pattern used for the logo `<img>` in the same component.

---

### IN-02: New FR i18n string uses accented `é` while neighboring `hero.cta.register` uses unaccented "Reservez"

**File:** `src/i18n/ui.ts:31, 36-37`
**Category:** Copywriting Consistency

**Issue:** The existing FR string at line 31 is:
```ts
"hero.cta.register": "Reservez votre place",
```
(no accents — likely a pre-existing copy-style decision or an artefact of the original PR that authored the hero block).

The new strings at lines 36-37 use accented characters:
```ts
"hero.cta.newsletter": "Restez informé",
"hero.cta.newsletter_aria": "Restez informé des annonces Cloud Native Days France",
```
(accented `é`).

Both styles render correctly in the browser, but they expose an inconsistent French-text policy on adjacent CTA labels in the same row. This was an explicit choice in the UI-SPEC (verbatim "Restez informé" with the accent), so it is **not a regression** — it is the new pattern, and the older unaccented hero strings are the outliers. Phase 24 introduced accented venue/footer strings already, so the codebase is mid-migration.

**Fix (optional, out of Phase 25 scope):** A separate housekeeping pass should normalize all FR `hero.*` strings to use accented characters consistently (`Réservez votre place`, `programme`, `j'ai`, etc.). Track as a v1.3 polish item; do not block Phase 25 on this.

---

### IN-03: Ghost CTA focus-ring contrast (`ring-accent/50`) is borderline over the brightest image midtones

**File:** `src/components/hero/HeroSection.astro:101`
**Category:** Accessibility / WCAG

**Issue:** The Ghost CTA overrides the default blue focus ring with `focus-visible:ring-accent/50` to identity-match the Pink button. The UI-SPEC §"Color check summary" calculates this at ~3.2:1 over the image-midtone background — which **passes** WCAG 2.1 AA for non-text UI components (3:1 minimum), but only barely.

Two real-world variables can push it below threshold:
1. The background image `ambiance-00.jpg` may have brighter regions than the planning-time worst-case midtone of ~52% L. Without an automated contrast measurement tool run against the actual rendered hero (image + gradient + radial + GeoBackground, composited at production resolution), the 3.2:1 figure is theoretical.
2. The `ring-3` (3px ring width) is generous, but the `/50` opacity halves the effective contrast of the ring's visible "color signal" — the ring will read as a softer pink halo rather than a crisp outline.

**Fix (optional remediation if UAT shows the focus ring is hard to see):**
- Increase opacity: `focus-visible:ring-accent/70` (still `/50` is fine if UAT passes).
- Add a co-located `focus-visible:ring-offset-2 focus-visible:ring-offset-background` to inset the ring with a dark gap that boosts contrast against any image region.
- Or accept the calculated ~3.2:1 and confirm with a manual keyboard-tab UAT pass (Tab through the 3 CTAs, verify the Pink ring is visible against the live rendered photo).

Suggested next action: include this in the Phase 25 visual UAT checklist (tab through the hero, photograph the focus state, confirm the Pink ring is distinguishable against the photo's brightest area).

---

### IN-04: No build-time guard that the `ui` object's fr and en blocks have identical key sets

**File:** `src/i18n/ui.ts:7-602`
**Category:** Code Quality / i18n Drift Prevention

**Issue:** `ui` is typed as `as const` and is a plain object literal. The fr block (lines 8-305) and en block (lines 306-601) are independently maintained — TypeScript will not raise a compile error if a key exists in one block and not the other. The `useTranslations` helper (`src/i18n/utils.ts:18-22`) silently falls back to `defaultLang` (fr) when a key is missing in the requested locale, so a missing en key surfaces as French text on an English page rather than a crash.

PITFALLS #2 (referenced in the 01-PLAN) calls this out explicitly. Phase 25 correctly adds both keys to both blocks, but the codebase still relies on **planner discipline + grep gates in plan acceptance criteria** rather than a structural compile-time guard.

**Fix (optional, out of Phase 25 scope — file as a v1.3 platform task):**

Add a compile-time check at the bottom of `src/i18n/ui.ts`:
```ts
// Compile-time fr/en parity guard — fails type-check if any key
// exists in one locale but not the other.
type Keys<L extends Locale> = keyof typeof ui[L];
type EnsureSameKeys = Keys<"fr"> extends Keys<"en">
  ? Keys<"en"> extends Keys<"fr">
    ? true
    : never
  : never;
const _i18nParityCheck: EnsureSameKeys = true;
```
This converts the i18n drift risk from "grep gate enforced by planner" to "compile error caught by `bun run astro check`". Costs zero runtime, zero bundle bytes (the const is dead-code-eliminated). Track as a separate housekeeping plan; not a Phase 25 blocker.

---

## Verification Notes (advisory)

- **Accent Pink lockout non-regression:** Confirmed via `grep -rE 'bg-accent|text-accent|border-accent' src/components/ --glob '*.{astro,tsx}'` — exactly **9** matches outside `src/components/hero/` and `src/components/ui/button.tsx` (PastEditionSection × 2, CfpSection × 2, SponsorCTA × 1, ScheduleGrid × 2, SpeakerCard × 1, TalkCard × 1). Matches planning-time baseline. **No new leakage.**
- **In-hero accent usages:** 4 lines in `HeroSection.astro` (subtitle Badge line 57 — pre-existing; Ghost CTA `text-accent` line 99, `hover:bg-accent/10 hover:text-accent` line 100 — new) plus `KeyNumbers.tsx` line 93 (`text-accent` — pre-existing in-hero React island). The `focus-visible:ring-accent/50` on line 101 uses `ring-accent` (not matched by the bg/text/border grep) and is correctly scoped to the Ghost CTA.
- **No `lucide-react` import** added to `HeroSection.astro` — confirmed via `Grep` for `lucide-react` in the file (zero matches). Mail icon is hand-inlined SVG per UI-SPEC §"Discretion Resolutions".
- **Asset preservation:** `ambiance-10.jpg` is still imported by `src/lib/editions-data.ts:29` (consumed by PastEditionSection / Edition2026Combined). Phase 25 correctly did not delete the file.
- **Mail SVG accessibility:** `aria-hidden="true"` (line 106) + `focusable="false"` (line 107) — both present; accessible name comes from the anchor's `aria-label={t("hero.cta.newsletter_aria")}` (line 95). Correct decorative-icon pattern.
- **Tap target compliance:** Ghost CTA inherits `h-[52px]` (52px tall × intrinsic-width with `px-8` = ≥ 80px wide for "Stay in the loop"). Both dimensions exceed the WCAG 2.5.5 / Apple HIG 44×44 px minimum.
- **Keyboard tab order:** Register → Schedule → Newsletter (matches DOM order, matches LTR visual order at sm+, matches top-to-bottom mobile stack order). No `tabindex` overrides used.
- **DS token compliance:** No ad-hoc hex/rgb introduced. The pre-existing `oklch(62.5%_0.162_259.9_/_0.3)` glow on the Register CTA shadow is unchanged. The Ghost CTA's accent overlays all use token-named utilities (`text-accent`, `bg-accent/10`, `ring-accent/50`).
- **i18n parity (manual count):** fr block has the new keys at lines 36-37, en block has them at lines 334-335. Both with the verbatim copy specified in the UI-SPEC §"Copywriting Contract".

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Advisory only — no source files modified._
