---
phase: 23-edition-2026-combined-section
verified: 2026-04-18T13:25:00Z
status: human_needed
score: 4/4 must-haves verified (component-level); 0/2 mounted-on-homepage truths (deferred to Phase 26)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "Visitor sees the combined section live on the homepage at / and /en"
    addressed_in: "Phase 26"
    evidence: "ROADMAP Phase 26 SC1: 'Both /fr and /en homepages render sections in order: Hero, Key Numbers, Edition 2026, Mini-bloc 2023, CFP, Sponsors Platinum' and SC2: 'Old separate PastEditionSection and TestimonialsStrip imports are removed from homepage files'. CONTEXT D-01 explicitly defers mounting to Phase 26."
  - truth: "Old PastEditionSection (2026) + TestimonialsStrip removed from homepage"
    addressed_in: "Phase 26"
    evidence: "ROADMAP Phase 26 SC2: 'Old separate PastEditionSection and TestimonialsStrip imports are removed from homepage files'. 23-CONTEXT §Deferred Ideas: 'Remove TestimonialsStrip import from both src/pages/index.astro and src/pages/en/index.astro. Remove the old 2026 PastEditionSection mount from both homepage pages.'"
human_verification:
  - test: "Mount the component locally and inspect the rendered section"
    expected: "Run `bun run dev`, then in a temporary scratch page (e.g. src/pages/_preview-23.astro) add `<Edition2026Combined />`. Visit http://localhost:4321/_preview-23 and confirm: (a) 3 photos render in an asymmetric mosaic (1 wide-left + 2 stacked-right on desktop), (b) the YouTube aftermovie embed loads and is playable, (c) 'Voir tous les replays' link opens the 2026 YouTube playlist in a new tab, (d) 'Télécharger le bilan 2026 (PDF)' opens the Drive PDF in a new tab, (e) 3 testimonial cards render below in a 3-up grid (md+) / 1-up (mobile). Discard the scratch page after."
    why_human: "Visual verification of layout, image rendering, iframe behaviour, and external-link navigation cannot be done programmatically. The component compiles and the data flow is verifiable in code, but the lived rendering (image cropping, mosaic balance, link reachability of the actual Drive PDF / YouTube playlist) requires a human eye and a working browser session."
  - test: "Verify the destination URLs are still live"
    expected: "Open `https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2` in a browser — should load the 2026 replays playlist. Open `https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view` — should load the bilan one-pager PDF. (T-23-03 in the threat model accepts breakage risk; this human check confirms current state.)"
    why_human: "External resource availability is outside the build pipeline. Both URLs are organizer-controlled and could rotate."
  - test: "Visual review of the Stitch reference vs. the rendered output"
    expected: "Per project Stitch-first rule (CLAUDE.md), open the Stitch project 14858529831105057917 'Homepage Mockup v2 — Restructured Sections' (Accent Pink CTA version) and visually compare against the rendered scratch-page screenshot from test 1. Confirm the stacking, mosaic shape (1 hero + 2 medium), CTA placement under the video, and testimonial card grid match the locked Stitch design within reasonable tolerance."
    why_human: "Visual diff between Stitch mockup and code requires a human aesthetic judgement; the project's Stitch-first rule explicitly mandates this validation step after UI work."
---

# Phase 23: Edition 2026 Combined Section — Verification Report

**Phase Goal:** Visitors see a single, rich 2026 recap section with photos, embedded film, replay link, PDF download, and testimonial cards.

**Verified:** 2026-04-18T13:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Verification Frame

Phase 23's scope per CONTEXT D-01 is to **build the component**, not to mount it on the homepage. Mounting is explicitly deferred to Phase 26 (Homepage Wiring). Therefore the 4 ROADMAP success criteria are evaluated at the **component-render-output** level: would the component, when mounted as `<Edition2026Combined />` with no props, satisfy each success criterion? Live homepage observation is intentionally deferred and listed under "Deferred Items" below.

This evaluation frame is consistent with how the orchestrator phrased the verification focus and is the only frame in which Phase 23 can pass at all (the homepage files are intentionally untouched).

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria — evaluated at component level)

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | Combined section renders 3 photos AND the embedded conference film | VERIFIED | `Edition2026Combined.astro:110-126` renders `photos.map(...)` over `EDITION_2026.thumbnails` (3 entries — `editions-data.ts:56-60`) inside the same `<section>` (line 90); `Edition2026Combined.astro:129-143` renders the YouTube iframe via `https://www.youtube-nocookie.com/embed/${EDITION_2026.youtubeId}` ("qyMGuU2-w8o") in the same section. Single `<section id="edition-2026">` wraps all blocks. |
| 2  | Section includes a "Voir tous les replays" link pointing to the replays playlist | VERIFIED | `Edition2026Combined.astro:147-154` renders an `<a>` with `href={replaysCta.href}` resolved from `EDITION_2026.replaysUrl = "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2"` (`editions-data.ts:42-43`) and label `t("editions.2026.replays_cta")` → FR "Voir tous les replays" / EN "Watch all replays" (`ui.ts:219, 512`). Anchor carries `target="_blank" rel="noopener noreferrer"` (D-11). |
| 3  | Section includes a "Télécharger le bilan 2026 (PDF)" link to the one-pager PDF | VERIFIED | `Edition2026Combined.astro:155-163` renders an `<a>` with `href={pdfCta.href}` resolved from `EDITION_2026.pdfUrl = "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view"` (`editions-data.ts:45-46`) and label `t("editions.2026.pdf_cta")` → FR "Télécharger le bilan 2026 (PDF)" / EN "Download 2026 report (PDF)" (`ui.ts:220, 513`). Anchor carries `target="_blank" rel="noopener noreferrer"` plus `aria-label={pdfCta.ariaLabel}` (`ui.ts:221, 514`). |
| 4  | Testimonial cards render within the same section (replacing the old separate TestimonialsStrip) | VERIFIED | `Edition2026Combined.astro:166-183` renders `<h3>{testimonialsHeading}</h3>` followed by `testimonials.map(...)` over `TESTIMONIALS.slice(0, 3)` (`testimonials-data.ts:20-36` — 3 entries) inside the same `<section>`. Cards use static styling (no marquee — D-03). Heading copy `editions.2026.testimonials_heading` → FR "Ils en parlent mieux que nous" / EN "They said it better than we could" (`ui.ts:222, 515`). The "replacing the old separate TestimonialsStrip" half of the criterion is the homepage swap — that is **deferred to Phase 26** (see Deferred Items). |

**Score:** 4/4 component-level truths VERIFIED.

### Deferred Items

Items not yet met but explicitly addressed in Phase 26 of the milestone.

| # | Item | Addressed In | Evidence |
| - | ---- | ------------ | -------- |
| 1 | Visitor sees the combined section live on the homepage at `/` and `/en` | Phase 26 | ROADMAP Phase 26 SC1: "Both /fr and /en homepages render sections in order: Hero, Key Numbers, Edition 2026, Mini-bloc 2023, CFP, Sponsors Platinum". CONTEXT D-01 explicitly defers mounting to Phase 26. |
| 2 | Old `PastEditionSection` (2026) + `TestimonialsStrip` removed from homepage | Phase 26 | ROADMAP Phase 26 SC2: "Old separate PastEditionSection and TestimonialsStrip imports are removed from homepage files". 23-CONTEXT §Deferred Ideas restates this. |

These items are non-actionable for Phase 23 — they are by-design out of scope.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/editions-data.ts` | EDITION_2026 with 3 thumbnails (ambiance-03, 06, 10), `replaysUrl`, `pdfUrl`; ambiance-08 import removed | VERIFIED | 184 → 127-line file. `replaysUrl` (line 42-43), `pdfUrl` (line 45-46) present. Thumbnails array (lines 56-60) has exactly 3 entries in order ambiance-03 (hero) / ambiance-06 (medium) / ambiance-10 (medium). `ambiance08` import absent (only ambiance03, ambiance06, ambiance10 imported on lines 25-27). |
| `src/i18n/ui.ts` | 4 new `editions.2026.*` keys present in both `fr` and `en` blocks | VERIFIED | `editions.2026.replays_cta` (lines 219, 512), `editions.2026.pdf_cta` (lines 220, 513), `editions.2026.pdf_cta_aria` (lines 221, 514), `editions.2026.testimonials_heading` (lines 222, 515). FR/EN parity confirmed for all 4 new keys. `thumbnail_alt.3` rewritten to "vue générale de l'événement" / "overall venue view" matching ambiance-10 (lines 217, 510). |
| `src/components/past-editions/Edition2026Combined.astro` | New pure-SSR Astro component, ≥ 80 lines, renders all 6 blocks | VERIFIED | File exists at expected path, 184 lines (well above the 80-line floor). Renders rail → h2 → 3-photo mosaic → youtube-nocookie embed → CTA row → testimonials block, in that order. Single `<h2>`, single `<h3>`. Pure SSR (zero `client:*` directives). DS tokens only (zero ad-hoc hex/rgb). |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `Edition2026Combined.astro` | `src/lib/editions-data.ts` | `import { EDITION_2026 }` | WIRED | Line 21: `import { EDITION_2026 } from "@/lib/editions-data";` Used on lines 59, 65, 70, 74. |
| `Edition2026Combined.astro` | `src/lib/testimonials-data.ts` | `import { TESTIMONIALS }` | WIRED | Line 22: `import { TESTIMONIALS } from "@/lib/testimonials-data";` Used on line 79. |
| `Edition2026Combined.astro` | `src/i18n/utils.ts` | `useTranslations(getLangFromUrl(Astro.url))` | WIRED | Line 23: `import { getLangFromUrl, useTranslations } from "@/i18n/utils";` Used on lines 46-47. `t()` called for heading, rail, video_caption, replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading, thumbnail_alt.{1,2,3}, testimonials.{0,1,2}.{quote,attribution}. |
| `EDITION_2026.replaysUrl` | `<a href>` for replays CTA | direct prop assignment | WIRED | `replaysCta.href ?? EDITION_2026.replaysUrl` on line 70 → consumed at line 148 (`href={replaysCta.href}`). |
| `EDITION_2026.pdfUrl` | `<a href>` for PDF CTA | direct prop assignment | WIRED | `pdfCta.href ?? EDITION_2026.pdfUrl` on line 74 → consumed at line 156 (`href={pdfCta.href}`). |
| `EDITION_2026.thumbnails` | `<Image>` mosaic | `photos.map(p => <Image src={p.src} alt={p.alt} />)` | WIRED | Lines 57-63 default-resolve `photos` from thumbnails; lines 112-124 render. Each photo carries unique `alt` from `t(p.altKey)` (lines 215-217 / 508-510 in ui.ts). |
| `TESTIMONIALS` | testimonial card grid | `testimonials.slice(0,3).map(...)` then `testimonials.map` in template | WIRED | Lines 77-82 default-resolve `testimonials`; lines 173-180 render `<blockquote>` + attribution per item. |

All key links WIRED — no orphans, no partial wiring.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `Edition2026Combined.astro` | `photos` | `EDITION_2026.thumbnails` (3 typed-const entries with image imports) | YES — 3 real ImageMetadata objects from `@/assets/photos/ambiance/ambiance-{03,06,10}.jpg` | FLOWING |
| `Edition2026Combined.astro` | `video.youtubeId` | `EDITION_2026.youtubeId` literal `"qyMGuU2-w8o"` | YES — concrete YouTube ID | FLOWING |
| `Edition2026Combined.astro` | `replaysCta.href` | `EDITION_2026.replaysUrl` literal | YES — concrete YouTube playlist URL | FLOWING |
| `Edition2026Combined.astro` | `pdfCta.href` | `EDITION_2026.pdfUrl` literal | YES — concrete Google Drive URL | FLOWING |
| `Edition2026Combined.astro` | `testimonials` | `TESTIMONIALS.slice(0,3)` over 3-entry typed const | YES — 3 real Testimonial objects (placeholder copy per project TODO, but real shape and 3 cards render) | FLOWING (with caveat: copy is fabricated placeholder per `testimonials-data.ts:8-11` TODO; tracker `testimonials-real-quotes`. Replacement is out of scope for Phase 23 — see CONTEXT §Deferred Ideas "v1.3 / content cycle".) |
| `Edition2026Combined.astro` | `heading`, `rail`, `testimonialsHeading`, `pdfCta.ariaLabel`, etc. | `t(...)` resolving against `ui.fr`/`ui.en` | YES — all literal-string keys exist in both locales | FLOWING |

All rendered data has a real source. The testimonial copy is intentionally placeholder until v1.3 (organizer-validated quotes) — this is documented project debt, not a Phase 23 gap.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Production build succeeds | `bun run build` | exit 0; "156 page(s) built in 6.25s"; no `ambiance-08` references in build log | PASS |
| Astro type-check (component-scoped) | `bun run astro check` | exit 1 with **11 pre-existing errors only** — all in `src/pages/{,en/}index.astro` (`editions.2026.gallery_cta` removed-key reference) and other unrelated files (per 23-01-SUMMARY documented baseline). **Zero new errors introduced by Phase 23.** Error count is identical to the `92734c7` (pre-phase) baseline documented by Plan 23-01. | PASS (no new errors) |
| Component file compiles in build pipeline | (covered by `bun run build` exit 0) | All 156 pages built successfully — the component is type-checked & bundled by Vite/Astro as part of the build, even though it is not yet imported by any page | PASS |
| Component is not orphaned | `grep Edition2026Combined src/` | Found in 1 file (the component itself); zero importers — **expected** because Phase 26 owns mounting | INTENTIONALLY UNMOUNTED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| ED26-01 | 23-01, 23-02 | Homepage shows combined 2026 section with 3 photos, embedded film, and testimonial cards (replacing separate PastEditionSection + TestimonialsStrip) | SATISFIED (component) / NEEDS HUMAN (live homepage swap) | Component-level: 3 photos (component lines 110-126) + film (lines 129-143) + 3 testimonial cards (lines 166-183) all in one `<section>`. Live homepage swap is **deferred to Phase 26** by design. |
| ED26-02 | 23-01, 23-02 | 2026 section includes "Voir tous les replays →" link | SATISFIED | CTA renders with arrow span (line 153) and FR copy "Voir tous les replays" (`ui.ts:219`); EN "Watch all replays" (`ui.ts:512`); href = `EDITION_2026.replaysUrl`. |
| ED26-03 | 23-01, 23-02 | 2026 section includes "Télécharger le bilan 2026 (PDF) →" link to one-pager | SATISFIED | CTA renders with arrow span (line 162) and FR copy "Télécharger le bilan 2026 (PDF)" (`ui.ts:220`); EN "Download 2026 report (PDF)" (`ui.ts:513`); href = `EDITION_2026.pdfUrl`; `aria-label` for screen-reader announces "(PDF, nouvelle fenêtre)" / "(PDF, new window)". |

No orphaned requirements — REQUIREMENTS.md maps ED26-01..03 to Phase 23, and all three are addressed by 23-01 + 23-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/components/past-editions/Edition2026Combined.astro` | 61, 80, 81 | `as any` casts on i18n keys (`p.altKey as any`, `item.quoteKey as any`, `item.attributionKey as any`) | Warning (matches REVIEW WR-01) | Disables type-checking on these specific `t()` calls. A typo in `Thumbnail.altKey` or `Testimonial.quoteKey` data would no longer be caught by `astro check`. Other call sites (`pages/index.astro`, `TestimonialsStrip.astro`) pass these fields without the cast — local type-safety regression. **Does not block phase verification.** Recommended fix: tighten `Thumbnail.altKey` to `keyof typeof ui.fr` in `editions-data.ts` and drop the casts. |
| `src/i18n/ui.ts` | 218 (fr), 511 (en) | Orphan key `editions.2026.thumbnail_alt.4` — referenced by zero call sites after Plan 23-01 trimmed thumbnails to 3 | Warning (matches REVIEW WR-02) | i18n drift: the key remains in both locales but no consumer; EN value "overall event view" duplicates slot 3's "overall venue view". Plan 23-01 + UI-SPEC §3 explicitly defer this cleanup. **Does not block phase verification.** |
| `src/i18n/ui.ts` | 217, 510 | FR/EN copy asymmetry on `thumbnail_alt.3` ("événement" vs "venue") | Info (matches REVIEW IN-03) | Both descriptions are valid for ambiance-10; minor translation inconsistency. Not blocking. |
| `src/components/past-editions/Edition2026Combined.astro` | 110, 129 | Defensive `&&` guards on always-truthy `photos`/`video` values | Info (matches REVIEW IN-02) | Dead branches under current default-fall-through. Acceptable defensive coding consistent with `PastEditionSection.astro`. |
| `src/components/past-editions/Edition2026Combined.astro` | 103-104 | Both `tracking-tight` Tailwind class AND inline `style="letter-spacing:-0.02em;"` | Info (matches REVIEW IN-04) | Inline style wins; UI-SPEC documented this verbatim from `PastEditionSection.astro:83`. Acceptable. |
| `src/components/past-editions/Edition2026Combined.astro` | 95-99 | Rotated rail `<p>` lacks `aria-hidden="true"` | Info (matches REVIEW IN-05) | Screen reader will announce both rail and h2; copies project-wide pattern from `PastEditionSection.astro`. Out-of-scope a11y polish. |
| `src/lib/editions-data.ts` | 41, 44 | `// NEW (D-05)`, `// NEW (D-06)` comments without tracker reference | Info (matches REVIEW IN-01) | Low-priority documentation polish. |

**Pre-existing baseline errors** (not introduced by Phase 23, not counted as anti-patterns):
- 11 `astro check` errors in `src/pages/{,en/}index.astro` (`editions.2026.gallery_cta` removed-key reference), `src/content.config.ts` (zod loader signature drift), `src/components/past-editions/Edition2023PhotoGrid.astro` (implicit any), `src/components/testimonials/TestimonialsStrip.astro` (template-literal key narrowing). Documented in 23-01-SUMMARY §Deferred Issues. Phase 26 will repair the homepage `gallery_cta` references when it removes the legacy mount.

### Human Verification Required

Visual + behavioural checks that cannot be done from grep alone. See the structured `human_verification` block in the frontmatter above for the full instructions. Summary:

1. **Mount + render check** — temporarily add `<Edition2026Combined />` to a scratch page and visually confirm photos, video playback, link navigation, and testimonial grid all behave as the UI-SPEC describes.
2. **Destination URL liveness** — confirm the 2026 YouTube playlist and the Drive PDF are still accessible.
3. **Stitch parity check** — diff the rendered output against the locked Stitch mockup "Homepage Mockup v2 — Restructured Sections" per CLAUDE.md Stitch-first rule.

### Gaps Summary

There are **no Phase-23-actionable gaps**. All component-level success criteria are met (4/4 truths verified, all required artifacts present and substantive, all key links wired, all data flowing). The two ROADMAP truths that depend on the live homepage (visitor-facing rendering and removal of the legacy strip) are **deferred-by-design to Phase 26** per CONTEXT D-01 and the ROADMAP Phase 26 success criteria.

The phase is structurally complete; final sign-off requires the three human verification steps above (visual mount review, link liveness, Stitch parity), per the project's Stitch-first rule and the inherent un-grep-ability of visual/behavioural concerns.

The two REVIEW warnings (`as any` casts; orphan `thumbnail_alt.4` key) are non-blocking technical debt acknowledged in REVIEW.md — they do not affect goal achievement and can be addressed in a future housekeeping plan or rolled into Phase 26.

---

_Verified: 2026-04-18T13:25:00Z_
_Verifier: Claude (gsd-verifier)_
