---
phase: 25
verified_at: "2026-04-19"
status: verified
score: 4/4 success criteria verified at integration level
verifier: gsd-verifier (Claude)
re_verification: false
success_criteria:
  - id: 1
    text: "Hero background displays the user-provided image at approximately 75% opacity"
    result: met
    evidence: "src/components/hero/HeroSection.astro:9 imports ambiance00 from @/assets/photos/ambiance/ambiance-00.jpg; line 23 sets src={ambiance00.src}; line 28 sets opacity-75. Built HTML dist/index.html and dist/en/index.html both contain ambiance-00.DgXFcpgf.jpg + class=opacity-75. Asset confirmed on disk at 4,583,225 bytes."
  - id: 2
    text: "Hero shows 3 CTAs in a row: Réservez votre place (Primary Blue filled), Voir le programme (Blue outline), Restez informé (Accent Pink ghost with mail icon)"
    result: met
    evidence: "HeroSection.astro lines 71-123 declare 3 sibling <a> tags in DOM order Register (variant default + glow shadow) → Schedule (variant outline) → Newsletter (variant ghost + text-accent + leading inline mail SVG). dist/index.html contains all three FR labels (Reservez votre place, Voir le programme, Restez informé) and dist/en/index.html contains all three EN labels (Get Your Ticket, View Schedule, Stay in the loop). Mail <svg aria-hidden=true focusable=false viewBox=0 0 24 24> with rect+path lucide-mail geometry renders 1× per locale."
  - id: 3
    text: "The Restez informé CTA functions as a placeholder anchor (no backend integration required)"
    result: met
    evidence: "HeroSection.astro line 94 sets href=\"#newsletter-stub\"; line 125 declares <div id=\"newsletter-stub\" class=\"sr-only\" aria-hidden=\"true\"></div> sibling inside the hero section. Both #newsletter-stub references render in dist/index.html and dist/en/index.html (1 href + 1 id per page). No fetch / no form / no JS island added — pure static anchor; CLO-6 swap-ready."
  - id: 4
    text: "CTA row is responsive and stacks gracefully on mobile viewports"
    result: met
    evidence: "HeroSection.astro line 70 declares CTA row container as 'flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6' — vertical stack with 12px gap on <640px, horizontal row with 16px gap at sm+, widening to 24px at md+. Class string echoes verbatim 2× in built HTML (one per locale)."
requirements:
  - id: HERO-01
    result: met
    evidence: "Background image swap (ambiance-10 → ambiance-00) + opacity raise (0.55 → 0.75) shipped live on both /fr and /en homepages."
  - id: HERO-02
    result: met
    evidence: "3-CTA row in DOM order Register filled / Schedule outline / Newsletter ghost-with-mail-SVG; mobile-first stacking; placeholder #newsletter-stub anchor; both new i18n keys (hero.cta.newsletter + hero.cta.newsletter_aria) present in fr + en blocks of src/i18n/ui.ts."
code_quality:
  astro_check: "11 errors / 0 warnings / 9 hints — matches pre-Phase-25 baseline (errors live in content.config.ts Zod loaders + Edition2023PhotoGrid + TestimonialsStrip + orphan editions.2026.gallery_cta references in src/pages/{index,en/index}.astro). 0 NEW errors introduced; nothing in src/components/hero/HeroSection.astro or src/i18n/ui.ts surfaces."
  build: "exit 0, 156 page(s) built in 7.39s — confirmed against dist/index.html + dist/en/index.html"
  review_status: "warnings (1 warning + 4 info) — WR-01 placeholder-anchor scroll behaviour ACCEPTED as the documented placeholder UX (per project memory: 'Newsletter CTA is placeholder anchor only; CLO-6 backend deferred'); 4 info notes (missing img width/height, FR accent inconsistency, ring-accent contrast, no compile-time i18n parity guard) deferred to v1.3 housekeeping. None block phase verification."
scope_discipline:
  files_modified_in_scope:
    - src/components/hero/HeroSection.astro (+36/-4)
    - src/i18n/ui.ts (+4)
    - src/assets/photos/ambiance/ambiance-00.jpg (created, 4.4 MB)
  files_NOT_modified_verified:
    - src/pages/index.astro (Phase 26 owns reordering)
    - src/pages/en/index.astro (Phase 26 owns reordering)
    - src/components/ui/button.tsx (no new variant)
    - src/styles/global.css (no DS token changes)
    - package.json (no lucide-react import; no new deps)
    - src/components/past-editions/* (out of scope; ambiance-10.jpg preserved)
accent_pink_lockout:
  baseline_pre_phase_25: 9
  actual_post_phase_25: 9
  delta: 0
  result: non_regression_holds
  note: "9 pre-existing non-hero accent usages in PastEditionSection ×2, CfpSection ×2, SponsorCTA ×1, ScheduleGrid ×2, SpeakerCard ×1, TalkCard ×1 are out of Phase 25 scope (separate v1.3 housekeeping); Phase 25 introduced ZERO new non-hero accent usages."
integration_status:
  hero_mounted_fr: true
  hero_mounted_en: true
  rendered_in_dist: true
  evidence: "src/pages/index.astro:67 and src/pages/en/index.astro:66 both render <HeroSection />; built HTML in dist/index.html (47,401 bytes) and dist/en/index.html (48,094 bytes) contain all expected markup."
human_visual_uat: pending (separate /gsd-verify-work 25 — visual inspection of Pink ring focus state, mobile real-device stacking, contrast over real photo regions, WR-01 scroll behaviour at 700–900px viewport heights)
---

# Phase 25: Hero Redesign — Verification Report

**Phase Goal:** Hero section uses the new background image at higher opacity and presents three distinct CTAs.
**Verified:** 2026-04-19
**Status:** verified
**Re-verification:** No — initial verification
**Verification Mode:** INTEGRATION (the hero is LIVE on both homepages right now, unlike Phase 23/24 components which await Phase 26 mount)

---

## Goal-Backward Analysis

**Goal restated as observable outcome:** A visitor landing on either `/` (FR) or `/en/` (EN) sees a hero band with (a) the new `ambiance-00.jpg` background at noticeably higher opacity than the old `ambiance-10` rendering, (b) three CTA buttons in a horizontal row on desktop / vertical stack on mobile — Register filled / Schedule outline / Newsletter ghost-pink-with-mail-icon, (c) clicking the Newsletter CTA produces a same-page anchor scroll (no backend, no error, no broken link), and (d) the CTA row reflows gracefully when narrowing the viewport.

**What must be TRUE:** see the 4 success-criteria entries in the frontmatter — each maps to a concrete observable behaviour on the rendered page.

**What must EXIST:** ambiance-00.jpg on disk + an `<img>` tag wired to it; 3 `<a>` tags inside a flex container with the locked variant assignments; an inline mail `<svg>` with `aria-hidden=true focusable=false`; a sibling `<div id="newsletter-stub">` sentinel; 2 new i18n keys in BOTH fr and en blocks.

**What must be WIRED:** HeroSection.astro mounted on both homepages (it was, pre-Phase-25); ambiance00 import resolves at build time (Vite hashes the URL); ghost-CTA `aria-label` binds to `t("hero.cta.newsletter_aria")`; newsletter-stub `href` resolves to a same-section sibling id; non-hero accent count holds at the planning-time baseline of 9 (Phase 24 lockout non-regression).

All four levels verified — see the evidence in the criterion table below and the Spot-Check section.

---

## Criterion-by-Criterion Verification

### Criterion 1 — Background image @ ~75% opacity (HERO-01)

| Check | Method | Result |
|-------|--------|--------|
| Asset on disk | `ls -la src/assets/photos/ambiance/ambiance-00.jpg` | PASS — 4,583,225 bytes |
| Import wired | grep for `import ambiance00 from "@/assets/photos/ambiance/ambiance-00.jpg"` in HeroSection.astro | PASS — 1 match (line 9) |
| Old import gone | grep `ambiance-10` in HeroSection.astro | PASS — 0 matches |
| `<img>` src wired | grep `ambiance00.src` in HeroSection.astro | PASS — 1 match (line 23) |
| Opacity class | grep `opacity-75` in HeroSection.astro | PASS — 1 match (line 28) |
| Old opacity gone | grep `opacity-\[0\.55\]` in HeroSection.astro | PASS — 0 matches |
| Rendered in dist | grep `opacity-75` + `ambiance-00.*\.jpg` in dist/index.html and dist/en/index.html | PASS — both present in both locales (Vite hashed URL: `ambiance-00.DgXFcpgf.jpg`) |
| Decorative attrs | `alt=""` + `aria-hidden="true"` + `loading="eager"` + `decoding="async"` preserved | PASS (lines 24-27) |

**Verdict: MET** — single-`<img>` opacity-75 implementation per UI-SPEC §"Background opacity implementation (locked)". No overlay div added (correctly held back as UAT remediation only).

### Criterion 2 — 3 CTAs (HERO-02)

| Check | Method | Result |
|-------|--------|--------|
| 3 sibling `<a>` tags in CTA row | Read HeroSection.astro lines 70-124 | PASS — Register (71-81), Schedule (82-92), Newsletter (93-123) |
| Register variant | grep `variant: "default"` + glow shadow | PASS (lines 76-77) |
| Schedule variant | grep `variant: "outline"` | PASS (line 86) |
| Newsletter variant | grep `variant: "ghost"` | PASS (line 97) |
| Newsletter accent overlays | Inspect for `text-accent`, `hover:bg-accent/10 hover:text-accent`, `focus-visible:ring-accent/50`, `gap-2` | PASS (lines 99-102) |
| Mail SVG inline (no lucide-react) | grep `from "lucide-react"` in HeroSection.astro AND across src/ | PASS — 0 matches anywhere in src/ |
| Mail SVG accessibility | `aria-hidden="true"` + `focusable="false"` | PASS (lines 106-107) |
| Mail SVG geometry | `viewBox="0 0 24 24"` + `<rect width="20" height="16" x="2" y="4" rx="2">` + envelope `<path d="m22 7-8.97 5.7…">` | PASS (lines 111, 119, 120) |
| FR labels render | grep "Reservez votre place"\|"Voir le programme"\|"Restez informé" in dist/index.html | PASS — all 3 present |
| EN labels render | grep "Get Your Ticket"\|"View Schedule"\|"Stay in the loop" in dist/en/index.html | PASS — all 3 present |
| FR aria-label render | grep `aria-label="Restez informé des annonces Cloud Native Days France"` in dist/index.html | PASS — 1 match |
| EN aria-label render | grep `aria-label="Stay informed about Cloud Native Days France announcements"` in dist/en/index.html | PASS — 1 match |
| Mail SVG renders per locale | grep `<svg aria-hidden="true" focusable="false"` in dist HTML files | PASS — 1 each in dist/index.html + dist/en/index.html |
| Glow on Register only | Inspect Schedule + Newsletter for `shadow-[0_0_20px_…]` | PASS — only Register CTA carries the glow shadow |

**Verdict: MET** — 3-CTA row in correct DOM order (Register → Schedule → Newsletter), correct variant assignments, mail SVG hand-inlined per UI-SPEC convention, both locales render correctly in production HTML.

### Criterion 3 — Placeholder anchor (HERO-02)

| Check | Method | Result |
|-------|--------|--------|
| Newsletter href | grep `href="#newsletter-stub"` in HeroSection.astro | PASS (line 94) |
| Sentinel target exists | grep `id="newsletter-stub"` in HeroSection.astro | PASS — 1 match (line 125) |
| Sentinel attrs | grep `class="sr-only"` paired with `aria-hidden="true"` on the stub div | PASS (line 125) |
| Sentinel placement | Read context — stub is sibling of the CTA row, INSIDE the inner content container `<div class="relative z-10 …">`, BEFORE its closing `</div>` | PASS — placed inside the hero `<section>` so same-page scroll stays within the hero fold (per UI-SPEC §"Discretion Resolutions" Q1) |
| Both refs render in built HTML | grep `#newsletter-stub` in dist/index.html and dist/en/index.html | PASS — 1 href + 1 id per page = 2 matches per page |
| No backend / no JS island | Inspect HeroSection.astro for fetch / form / handler beyond the existing CountdownTimer client:load island | PASS — only static `<a href="#newsletter-stub">`; zero new JS; CLO-6 swap-ready |

**Verdict: MET** — placeholder anchor pattern is structurally correct. See WR-01 acceptance below for the related UX caveat.

### Criterion 4 — Responsive stacking (HERO-02 #4)

| Check | Method | Result |
|-------|--------|--------|
| Container class | grep `flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6` in HeroSection.astro | PASS — 1 match (line 70) |
| Same string in built HTML | grep same pattern in dist/{index,en/index}.html | PASS — 2 matches total (1 per locale) |
| Mobile-first behaviour | Class chain: `flex-col gap-3` → `sm:flex-row sm:gap-4` → `md:gap-6` (12px stacked → 16px row → 24px row) | PASS — Tailwind utility chain produces vertical stack <640px, horizontal row at 640+, wider gap at 768+ |

**Verdict: MET** — class chain provides mobile-first vertical stack flipping to horizontal at sm+ with the gap widening at md+. Visual UAT on real mobile device deferred to /gsd-verify-work.

---

## Contract Alignment (UI-SPEC)

The UI-SPEC §"Component Anatomy & Layout" tree (lines 196-306) prescribes 7 blocks — 4 decorative layers (background image, vertical wash, GeoBackground SVG, radial gradient) + 3 content blocks (logo+subtitle stack, CountdownTimer, CTA row) + the new sentinel div. **All 8 elements verified present and correctly ordered in HeroSection.astro lines 18-127**. The pre-existing in-hero subtitle Badge (`bg-accent/15 text-accent`, line 57) is preserved per §"Accent Pink anchoring" item 1. The four "DO NOT" rules in §"Discretion Resolutions" are honored:
- No overlay div added (single-`<img>` opacity).
- No `lucide-react` import.
- No `w-full` on mobile buttons (intrinsic width preserved).
- No homepage section reordering (Phase 26 owns that).

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HERO-01 | 25-01-PLAN | Hero background swap + ~75% opacity | met | Edits 1+2 in HeroSection.astro applied; ambiance-00 + opacity-75 render in both locale dist HTML files |
| HERO-02 | 25-01-PLAN | 3 CTAs (filled/outline/ghost-with-mail) + placeholder anchor + responsive | met | Edits 3+4 in HeroSection.astro applied; 2 new i18n keys land in both fr+en blocks; all 3 labels and aria-labels render in dist HTML for both locales |

No orphaned requirements: REQUIREMENTS.md maps only HERO-01 + HERO-02 to Phase 25 — both claimed by 25-01-PLAN's `requirements:` field and both verified.

---

## Code Quality Gates

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| `bun run astro check` | 11 baseline errors preserved, 0 NEW | 11 errors / 0 warnings / 9 hints | PASS |
| `bun run build` | exit 0, 156 pages | exit 0, 156 page(s) built in 7.39s | PASS |
| `git status --porcelain` of out-of-scope files | empty | empty for src/pages/, src/components/ui/button.tsx, src/styles/global.css, package.json | PASS |

The 11 baseline `astro check` errors live in `content.config.ts` (Zod loader constraints), `Edition2023PhotoGrid.astro` (implicit-any), `TestimonialsStrip.astro` (template-literal keys), and the orphan `editions.2026.gallery_cta` references in `src/pages/index.astro` + `src/pages/en/index.astro` (deferred housekeeping per plan 23-01). None are in `src/components/hero/HeroSection.astro` or `src/i18n/ui.ts`.

---

## Scope Discipline

| Concern | Verification | Result |
|---------|--------------|--------|
| Homepage section ORDER unchanged | `git diff --stat HEAD~5 src/pages/` returns empty | PASS — Phase 26 still owns reordering |
| `button.tsx` not modified | git status clean | PASS |
| `global.css` not modified | git status clean | PASS |
| `package.json` not modified | git status clean + grep `lucide-react` in src/ returns 0 | PASS |
| `ambiance-10.jpg` not deleted | `ls` shows file at 654,885 bytes | PASS — still consumed by `src/lib/editions-data.ts` (PastEditionSection / Edition2026Combined) |
| Only 2 source files + 1 asset modified across Phase 25 | `git diff --stat HEAD~5 src/` confirms only HeroSection.astro + i18n/ui.ts changed (asset ambiance-00.jpg added) | PASS |

---

## Accent Pink Lockout — Non-Regression

**Pre-Phase-25 baseline:** 9 non-hero `bg-accent|text-accent|border-accent` lines outside `src/components/hero/` and `src/components/ui/button.tsx` (PastEditionSection ×2, CfpSection ×2, SponsorCTA ×1, ScheduleGrid ×2, SpeakerCard ×1, TalkCard ×1).

**Post-Phase-25 actual:** 9 — exact match. **Delta: 0.** Non-regression gate holds.

**In-hero accent usages:** 4 lines in HeroSection.astro (subtitle Badge `bg-accent/15 text-accent` line 57 — pre-existing; Ghost CTA `text-accent` line 99 + `hover:bg-accent/10 hover:text-accent` line 100 — new). The `focus-visible:ring-accent/50` on line 101 is a new accent usage but uses the `ring-accent` token (not matched by the bg/text/border grep) and is correctly scoped to the Ghost CTA. Plus `KeyNumbers.tsx` line 93 (`text-accent` — pre-existing in-hero React island).

The 9 pre-existing non-hero usages predate the Phase 24 lockout decision and are tracked as a separate v1.3 housekeeping sweep — explicitly out of Phase 25's scope per UI-SPEC §"Accent Pink anchoring" interpretation.

---

## CLAUDE.md Compliance

- **Stitch-first rule:** Honored. UI-SPEC committed as the textual mirror of the locked Stitch screen "Homepage Mockup v2 — Restructured Sections" (Accent Pink CTA version) BEFORE the executor began. UI-SPEC notes Stitch MCP was offline for this phase but used the existing locked Phase-23-captured screen + ROADMAP success criteria + user memory `project_v1_2_hero_bg` as the design source. UI-SPEC checker verdict APPROVED (5 PASS, 1 FLAG on 3-weight typography mirroring Phase 23/24 precedent — non-blocking).
- **CSV rule:** N/A. The hero is static copy; no CSV-backed data consumed.
- **Co-author / attribution rule (global):** Verified — recent Phase 25 commits (`2ac1d8f`, `b112d5d`, `b508e94`, `6f86510`) carry no Claude co-author lines and no "Generated with Claude Code" attribution.

---

## Behavioral Spot-Checks (Step 7b)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Hero renders on FR homepage | `grep -c '<HeroSection' dist/index.html`-equivalent: presence of hero markup | 1 hero section + 3 CTAs found | PASS |
| Hero renders on EN homepage | Same on dist/en/index.html | 1 hero section + 3 CTAs found | PASS |
| Production build exits clean | `bun run build` | exit 0, 156 pages | PASS |
| i18n key parity | `awk '/^  fr:/,/^  \},$/' \| grep -c '"' && awk '/^  en:/,/^  \},$/' \| grep -c '"'` | 252 keys in fr, 252 in en | PASS |
| Ghost CTA aria-label binds correctly per locale | grep aria-label values in dist HTML | FR copy in /index.html, EN copy in /en/index.html | PASS |
| No `lucide-react` runtime import | `grep -r "lucide-react" src/` | 0 matches | PASS |

---

## Review Warning Disposition

**WR-01 (placeholder anchor scroll behaviour) — ACCEPTED.** The reviewer correctly notes that on mid-height viewports (700-900px) the same-page anchor `#newsletter-stub` will produce a perceptible scroll when the sentinel falls below the fold. This is the documented placeholder UX:

- UI-SPEC §"Discretion Resolutions" Q1 explicitly acknowledged the "silent scroll; target lives inside hero, no visual jump" claim holds only when the stub is in-viewport.
- The user-memory record states the Newsletter CTA is a placeholder anchor only; CLO-6 backend integration is deferred to v2 (NEWS-01 in REQUIREMENTS.md `## v2 Requirements`).
- Resolution path is documented for CLO-6: swap `href="#newsletter-stub"` to `href="/newsletter"` (or modal trigger) and delete the sentinel `<div>` in a single commit; the Pink Ghost CTA chrome stays identical.
- Reviewer's three remediation options (Option A move stub into row, Option B `aria-disabled`, Option C ship-as-is) are tracked for human visual UAT — the recommendation is Option C with UAT validation at 700px and 900px viewport heights.

The 4 IN-* notes (missing `<img>` width/height, FR accent inconsistency vs `Reservez`, ring-accent contrast borderline, no compile-time i18n parity guard) are advisory polish items deferred to v1.3 housekeeping. None block Phase 25 verification.

---

## Outstanding Items

### Pending Human Visual UAT (separate `/gsd-verify-work 25` step)

1. **Pink ring focus state visibility** — Tab through the 3 CTAs at production resolution; photograph the focus state on the Ghost CTA; confirm the `ring-accent/50` is distinguishable against the brightest `ambiance-00.jpg` regions (UI-SPEC calculates ~3.2:1, just above the WCAG 3:1 threshold for non-text UI).
2. **Mobile real-device stacking** — Verify the 3-button vertical stack on iPhone SE (375px) and Android small (360px) viewports does not push the CountdownTimer out of the 80vh fold.
3. **Contrast over real photo regions** — Spot-check the venue line + description text contrast over the brightest midtone regions of the ambiance-00 photo at production resolution.
4. **WR-01 scroll behaviour** — Click the Ghost CTA at viewport heights of 700px and 900px; confirm scroll movement is acceptable. If the movement is visible and disruptive, apply WR-01 Option A (move stub into the CTA row's flex container).
5. **Tap target compliance** — Visually confirm all 3 CTAs are ≥ 44×44px on mobile (Ghost CTA inherits `h-[52px]` + `px-8` so this is theoretically satisfied — but a tap-test on real device is still recommended).

### Deferred to Future Milestones (v1.3 / v2)

- **WR-01 redesign** — If WR-01 UAT shows the scroll movement is disruptive, applying Option A is a 2-line change (move sentinel into the CTA row, change tag from `<div>` to `<span>` to fit inline-flex).
- **IN-01** — Add `width={ambiance00.width} height={ambiance00.height}` to the background `<img>` for HTML-validity / lint-tool happiness (zero visual impact).
- **IN-02** — Normalize FR `hero.*` strings to use accented characters consistently (`Réservez votre place`, etc.) — separate v1.3 copy housekeeping pass.
- **IN-03** — Optional `focus-visible:ring-accent/70` if WR-01 UAT shows the focus ring is hard to see.
- **IN-04** — Add compile-time fr/en parity guard at the bottom of `src/i18n/ui.ts` (zero-runtime TypeScript const) — converts i18n drift from a grep-gate to a compile error. v1.3 platform task.
- **CLO-6 (NEWS-01)** — Newsletter backend integration; replaces the placeholder anchor.
- **9 pre-existing non-hero accent usages** — Sweep PastEditionSection / CfpSection / SponsorCTA / ScheduleGrid / SpeakerCard / TalkCard to honor the Phase-24 lockout retroactively. v1.3 housekeeping.

---

## Verdict

**Status: VERIFIED.** All 4 ROADMAP success criteria for Phase 25 are met at the integration level. Both HERO-01 and HERO-02 requirements are satisfied. Code-quality gates pass (build green, 156 pages, no NEW astro-check errors over baseline). Phase-24 Accent Pink lockout holds at exactly 9 non-hero usages (delta = 0). Scope discipline is clean (only HeroSection.astro + i18n/ui.ts modified; no homepage / button.tsx / global.css / package.json changes). The single review warning (WR-01 placeholder-anchor scroll) is accepted as the documented placeholder UX; CLO-6 will replace the anchor when newsletter backend lands. Phase 26 is unblocked and can proceed with broader homepage section reordering against the new live hero.

The 4 advisory polish notes from the review and the 5-item human visual UAT checklist are tracked as outstanding items but do not block phase verification — they are appropriate for `/gsd-verify-work 25` follow-up and v1.3 housekeeping.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
