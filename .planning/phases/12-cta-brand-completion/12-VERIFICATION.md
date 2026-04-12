---
phase: 12
slug: cta-brand-completion
status: passed
verified: 2026-04-12
verified_by: retroactive audit (code shipped in commit ed331f0)
---

# Phase 12 — CTA & Brand Completion — Verification

**Goal:** Hero CTA buttons are functional and brand identity documentation is complete.

**Verdict:** PASS — all 4 success criteria satisfied. Retroactive verification; code landed in commit `ed331f0` before planning artifacts existed.

---

## Per-SC Evidence

### SC #1 — "Register" CTA links to external ticketing

**Status:** PASS

- `src/components/hero/HeroSection.astro:14` — `const TICKETING_URL = "https://tickets.cloudnativedays.fr/";`
- `src/components/hero/HeroSection.astro:72-73` — Anchor opens in new tab with `rel="noopener noreferrer"` (prevents tabnabbing).
- `src/components/Navigation.astro:37` — Header nav "Réservez votre place" button uses the same `TICKETING_URL`.
- `src/components/Navigation.astro:76-77` — Same `target="_blank" rel="noopener noreferrer"` treatment.

Both register CTAs (hero + header) route to the external ticketing page. Security posture is correct (no window.opener exposure).

### SC #2 — "View Schedule" CTA links to working route or is conditionally hidden

**Status:** PASS

- `src/components/hero/HeroSection.astro:15` — `const SCHEDULE_URL: string | null = getLocalePath(lang, "/programme");`
- `src/components/hero/HeroSection.astro:81-83` — Button render gated by `{SCHEDULE_URL && ...}` — conditional hide pattern is in place and continues to work even if `SCHEDULE_URL` is nulled later.
- `/programme` and `/en/programme` routes confirmed live via `pnpm build` (142 pages, including both schedule pages).

Phase 7 shipped `/programme`, so the CTA is currently visible and functional. If the schedule were withdrawn, setting `SCHEDULE_URL = null` hides the button without breaking the hero layout.

### SC #3 — DESIGN.md includes KCD logo usage guidelines

**Status:** PASS

- `DESIGN.md:359` — "## Logo Usage" section header.
- `DESIGN.md:379` — "### KCD (Kubernetes Community Days) co-branding" subsection.
- `DESIGN.md:383-394` covers:
  - **Placement** — horizontal lockup, CND France left, KCD right, vertical hairline divider (40% white/dark opacity).
  - **Relative sizing** — KCD cap height matches "C" of "Cloud" in CND wordmark (KCD never larger on this site; inverse on KCD-produced material).
  - **Clear space** — equal to KCD cap height between logos.
  - **Lockup variants** — horizontal header/footer, vertical badge, CND-alone always acceptable.
  - **Prohibited co-branding patterns.**

Complete coverage of placement, dimensions, and co-branding rules as the success criterion requires.

### SC #4 — Satisfied requirements in REQUIREMENTS.md have updated checkboxes

**Status:** PASS

- `.planning/REQUIREMENTS.md:15` — `[x] **DSGN-04**: Brand continuity preserved: DM Sans font, geometric shapes, CND France + KCD logos`
- `.planning/REQUIREMENTS.md:33` — `[x] **HERO-03**: Prominent CTA button linking to external registration/ticketing`
- `.planning/REQUIREMENTS.md:129` — mapping table row `DSGN-04 | Phase 12: CTA & Brand Completion | Complete`
- `.planning/REQUIREMENTS.md:141` — mapping table row `HERO-03 | Phase 12: CTA & Brand Completion | Complete`

Both phase-scoped requirements (HERO-03, DSGN-04) are checked and mapped to Phase 12 in the requirement-to-phase table.

---

## Retrospective Notes

- **No planning artifacts were produced before implementation.** Work landed directly in commit `ed331f0`. The phase dir was created empty during `/gsd-plan-phase 12` init and then this VERIFICATION.md was written to close the loop.
- **No regressions.** `pnpm build` passes (142 pages). Grep-level audit confirms no hardcoded placeholder `href="#register"` or `href="#"` remain on the register CTA.
- **Low risk.** Phase 12 scope was 2 small code edits (Hero + Nav anchor attrs) + 1 docs section. Retroactive verification is sufficient; a full retroactive plan would add process overhead without surfacing new evidence.

## Human Verification (optional)

- Click "Réservez votre place" in hero and header nav — both open `tickets.cloudnativedays.fr` in a new tab.
- Click "Voir le programme" in hero — scrolls/routes to `/programme` on FR, `/en/programme` on EN.
- Visually inspect DESIGN.md Logo Usage section renders intelligibly when read as markdown.
