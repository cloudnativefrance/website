---
phase: 03-hero-landing
verified: 2026-04-11T20:00:00Z
status: human_needed
score: 3/4 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Confirm Stitch design was validated before implementation"
    expected: "Hero design was reviewed and approved in Google Stitch prior to code execution, per CLAUDE.md Stitch-first rule"
    why_human: "No Stitch prototype reference found in UI-SPEC, CONTEXT.md, or DISCUSSION-LOG. Design was approved via chat discussion only. Cannot programmatically determine if Stitch validation occurred."
  - test: "Confirm #register placeholder is acceptable for phase completion"
    expected: "HERO-03 requires 'Prominent CTA button linking to external registration/ticketing'. The button exists and is prominent but href='#register' is an anchor placeholder. Either the real external URL is not yet available (acceptable) or this is an omission."
    expected_resolution: "If a real ticketing URL is not yet known, add an override for SC3. If it should be a real URL, update HeroSection.astro."
    why_human: "The plan's threat model explicitly marks T-03-03 as 'accept' (placeholder link; real URL will be validated when provided). But the requirements definition says 'linking to external registration/ticketing' which implies a real URL. A human must decide if #register satisfies HERO-03 for this phase."
  - test: "Visually confirm homepage passes the 5-second test"
    expected: "A visitor landing on / or /en/ immediately understands: (1) event name 'Cloud Native Days France', (2) date 'June 3, 2027', (3) venue 'CENTQUATRE-PARIS', (4) how to register (CTA button), all above the fold on a typical viewport"
    why_human: "Cannot verify visual layout, viewport clipping, or perceived readability programmatically. Requires browser rendering."
  - test: "Verify countdown timer animates correctly in browser (pre-event mode)"
    expected: "Timer shows 4 cards (days, hours, minutes, seconds) updating every second with correct values counting down to 2027-06-03T09:00:00+02:00"
    why_human: "JavaScript runtime behavior cannot be verified without executing the React island in a browser. Logic is correct in source but actual rendering and interval behavior requires visual confirmation."
  - test: "Verify KeyNumbers count-up animation triggers on scroll"
    expected: "Stats (1700+, 50+, 40+) animate from 0 to their target values when the section scrolls into view. Animation fires only once."
    why_human: "IntersectionObserver behavior requires a real browser viewport with scrolling. Cannot verify programmatically."
  - test: "Fix WR-01: aria-label ends with hardcoded English 'remaining'"
    expected: "After adding countdown.remaining translation key in ui.ts and updating CountdownTimer.tsx line 46, French screen readers hear 'restants' not 'remaining'"
    why_human: "Code review WR-01 identified this accessibility regression. The fix was NOT applied (grep confirms hardcoded 'remaining' still on line 46 and countdown.remaining key absent from ui.ts). A human must decide: fix now, or defer to a later polish phase."
---

# Phase 03: Hero & Landing — Verification Report

**Phase Goal:** A visitor landing on the homepage immediately understands what, when, where, and how to register
**Verified:** 2026-04-11T20:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Homepage displays event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), and geometric background matching the design system | VERIFIED | HeroSection.astro: t("hero.title"), t("hero.subtitle"), t("hero.venue") all present. GeoBackground imported and rendered at line 16. Badge with accent styling at line 34. |
| 2 | Countdown timer shows days/hours/minutes/seconds remaining until the event and updates live | VERIFIED | CountdownTimer.tsx: UNITS array covers all 4 units, setInterval(1000) on line 56, clearInterval cleanup on line 62, TARGET_DATE set to 2027-06-03T09:00:00+02:00, padStart zero-padding, role="timer" accessibility attribute present. |
| 3 | A prominent CTA button links to the external registration/ticketing page | PARTIAL | CTA button exists with buttonVariants styling at HeroSection.astro line 45-53. However href="#register" is an internal anchor placeholder, not an external ticketing URL. Plan T-03-03 accepts this explicitly: "Placeholder link; real URL will be validated when provided." Requires human decision on acceptability for HERO-03 closure. |
| 4 | Key numbers section displays 1700+ attendees, 50+ talks, 40+ partners in a visually distinct block | VERIFIED | KeyNumbers.tsx: stats array at lines 37-40 has correct values (1700, 50, 40) with "+" suffix. IntersectionObserver at threshold 0.3 with disconnect-after-trigger. requestAnimationFrame + ease-out cubic animation. Cards styled with bg-card border border-border. Both homepages wire it with client:idle. |

**Score:** 3/4 truths fully verified (SC3 is partial — link is placeholder, not real external URL)

### Deferred Items

None identified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/hero/HeroSection.astro` | Full-viewport hero with GeoBackground, title, date badge, CTAs, countdown (min 40 lines) | VERIFIED | 65 lines. All required elements present. |
| `src/components/hero/CountdownTimer.tsx` | React island countdown with card-based digits and post-event mode (min 50 lines) | VERIFIED | 105 lines. Export default present. Post-event mode with t("hero.post_event") and t("hero.cta.replays") at lines 69/75. |
| `src/i18n/ui.ts` | All hero and countdown translation keys in FR and EN, contains "hero.title" | VERIFIED | All 14 keys present in both FR and EN objects. `as const` preserved. |
| `src/components/hero/KeyNumbers.tsx` | Animated count-up React island with IntersectionObserver (min 50 lines) | VERIFIED | 104 lines. Export default present. |
| `src/pages/index.astro` | FR homepage with HeroSection and KeyNumbers | VERIFIED | Both components imported and rendered. client:idle on KeyNumbers. t("site.title") for Layout title. |
| `src/pages/en/index.astro` | EN homepage with HeroSection and KeyNumbers | VERIFIED | Identical structure with correct Layout import path (../../layouts/Layout.astro). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| HeroSection.astro | GeoBackground.astro | Astro import | WIRED | `import GeoBackground from "@/components/patterns/GeoBackground.astro"` at line 2, rendered at line 16 |
| HeroSection.astro | CountdownTimer.tsx | React island client:load | WIRED | `import CountdownTimer from "./CountdownTimer"` at line 3, `<CountdownTimer client:load lang={lang} />` at line 42 |
| HeroSection.astro | src/i18n/utils.ts | useTranslations helper | WIRED | `import { getLangFromUrl, useTranslations, getLocalePath } from "@/i18n/utils"` at line 5 |
| CountdownTimer.tsx | src/i18n/ui.ts | direct import of ui dictionary | WIRED | `import { ui, type Locale } from "@/i18n/ui"` at line 2 |
| KeyNumbers.tsx | src/i18n/ui.ts | direct import of ui dictionary | WIRED | `import { ui, type Locale } from "@/i18n/ui"` at line 2 |
| src/pages/index.astro | HeroSection.astro | Astro import | WIRED | `import HeroSection from "@/components/hero/HeroSection.astro"` at line 3, rendered at line 13 |
| src/pages/index.astro | KeyNumbers.tsx | React island client:idle | WIRED | `import KeyNumbers from "@/components/hero/KeyNumbers"` at line 4, `<KeyNumbers client:idle lang={lang} />` at line 14 |
| src/pages/en/index.astro | HeroSection.astro | Astro import | WIRED | Same pattern as FR homepage, verified at line 3/13 |
| src/pages/en/index.astro | KeyNumbers.tsx | React island client:idle | WIRED | Same pattern as FR homepage, verified at line 4/14 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| CountdownTimer.tsx | timeLeft (days/hours/minutes/seconds) | `calcTimeLeft()` computing from `Date.now()` vs `TARGET_DATE` (hardcoded 2027-06-03) | Yes — real-time calculation each second | FLOWING |
| KeyNumbers.tsx | animated (attendees, talks, partners) | useCountUp hook with requestAnimationFrame and hardcoded stat values (1700, 50, 40) | Yes — animated from 0 to target when visible | FLOWING |
| HeroSection.astro | hero text (title, subtitle, venue, CTA labels) | useTranslations(lang) reading from ui.ts dictionary | Yes — all text via translation keys, no hardcoded visible strings | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — Components require a browser runtime (React islands with useState/useEffect, Astro SSR). No standalone runnable entry points to test without starting the dev server. Build success was verified by the executor via `pnpm build` (commit 7c381b5).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HERO-01 | 03-01-PLAN.md | Hero section with event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), geometric background | SATISFIED | HeroSection.astro renders all four elements via translation keys and GeoBackground component |
| HERO-02 | 03-01-PLAN.md | Countdown timer to event date (pre-event mode) | SATISFIED | CountdownTimer.tsx with correct target date, setInterval, 4 units displayed |
| HERO-03 | 03-01-PLAN.md | Prominent CTA button linking to external registration/ticketing | PARTIAL | CTA button is prominent and styled, but href="#register" is a placeholder anchor. No external URL is wired. Plan explicitly defers real URL to "when provided" (T-03-03 accepted). Requires human decision. |
| HERO-04 | 03-02-PLAN.md | Key numbers section: 1700+ attendees, 50+ talks, 40+ partners | SATISFIED | KeyNumbers.tsx renders all three stats with animated count-up; wired in both homepages |

**Note:** REQUIREMENTS.md traceability table still shows HERO-01 through HERO-04 as `Pending` (unchecked). This is a housekeeping omission — the checkboxes were not updated after phase completion. Not a blocker but should be corrected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/hero/CountdownTimer.tsx | 46 | Hardcoded English string `"remaining"` in aria-label — French screen readers hear mixed-language announcement | Warning | Accessibility regression for French users with screen readers. Code review WR-01 documented this fix but it was not applied. The t("countdown.remaining") key does not exist in ui.ts. |

No TODO/FIXME/placeholder comments found. No empty return values. No hardcoded user-visible strings outside translation system. No hollow props.

### Human Verification Required

#### 1. Stitch-First Rule Compliance

**Test:** Confirm the hero page design was reviewed and approved in Google Stitch before code execution.

**Expected:** A Stitch prototype or frame showing the hero layout (GeoBackground, title, badge, countdown cards, CTAs, key numbers) was validated by the user before HeroSection.astro was built.

**Why human:** CLAUDE.md states: "Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code. Never skip straight to code for visual work." The DISCUSSION-LOG shows design decisions were made via chat (layout options, countdown style, etc.) but no Stitch frame ID or validation step is recorded anywhere in the phase artifacts. Cannot determine programmatically whether Stitch was used.

#### 2. HERO-03 Placeholder Registration Link

**Test:** Decide whether `href="#register"` satisfies HERO-03 for this phase.

**Expected:** Either (a) confirm placeholder is acceptable because the ticketing URL is not yet known — add an override in this VERIFICATION.md frontmatter — or (b) provide the real ticketing URL to replace the placeholder.

**Why human:** REQUIREMENTS.md defines HERO-03 as "linking to external registration/ticketing" implying a functional outbound link. The plan's threat model (T-03-03) explicitly accepts a placeholder. A human must resolve this ambiguity. If accepted as-is, add:

```yaml
overrides:
  - must_have: "A prominent CTA button links to the external registration/ticketing page"
    reason: "Real ticketing URL not yet available. Placeholder #register accepted per T-03-03 threat model decision. Will be updated when URL is known."
    accepted_by: "smana"
    accepted_at: "2026-04-11T00:00:00Z"
```

#### 3. Visual 5-Second Test

**Test:** Open `http://localhost:4321/` and `http://localhost:4321/en/` in a browser. Without scrolling, check that the following are immediately visible: event name "Cloud Native Days France", date badge "3 juin 2027" (FR) / "June 3, 2027" (EN), venue "CENTQUATRE-PARIS", countdown timer with 4 digit cards, and a register CTA button.

**Expected:** All above-the-fold content is visible without scrolling on a 1440px desktop viewport and on a 390px mobile viewport.

**Why human:** Cannot verify visual layout, font rendering, or viewport clipping programmatically.

#### 4. Countdown Timer Runtime Behavior

**Test:** Verify the countdown cards update every second and display correct values. If testing after June 3, 2027, verify post-event mode shows "L'evenement est termine !" and a replay CTA.

**Expected:** Digits update in real-time. Values are accurate relative to 2027-06-03T09:00:00+02:00.

**Why human:** JavaScript runtime and React island hydration require a real browser.

#### 5. KeyNumbers Scroll Animation

**Test:** Scroll to the key numbers section on the homepage. Verify stats animate from 0 to 1700+, 50+, 40+ over ~2 seconds. Scroll away and back — confirm animation does NOT re-trigger (one-shot behavior).

**Expected:** Ease-out cubic animation on first scroll into view. No re-animation on subsequent scrolls.

**Why human:** IntersectionObserver requires a live browser with viewport scrolling.

#### 6. WR-01 Fix Decision

**Test:** Decide whether to fix the hardcoded `"remaining"` in the countdown aria-label now or defer.

**Expected:** If fixing now: add `"countdown.remaining"` key to ui.ts (fr: "restants", en: "remaining") and update CountdownTimer.tsx line 46 to use `t("countdown.remaining")`. If deferring: accept the warning.

**Why human:** This is a non-blocking accessibility improvement. The fix is straightforward (2-file change) but requires a human decision on priority.

### Gaps Summary

No hard blockers were found. All critical artifacts exist, are substantive, and are wired correctly. The data flows are real (computed timer, animated counters, i18n translations).

The phase is held at `human_needed` for two reasons:

1. **Stitch-first rule compliance** (CLAUDE.md project rule): The design was approved via chat discussion rather than a documented Stitch prototype review. This may have been intentional (if Stitch was used outside the documented artifacts) or a process deviation.

2. **HERO-03 ambiguity**: The register CTA uses `#register` placeholder. This is explicitly accepted in the plan's threat model but conflicts with the requirements definition. A human must confirm the placeholder is acceptable for phase sign-off.

Additionally, **WR-01** (hardcoded English "remaining" in French aria-label) was identified in code review but not fixed. This is a warning-level accessibility regression that should be addressed before or during next phase.

---

_Verified: 2026-04-11T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
