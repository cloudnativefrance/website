---
phase: 26-homepage-wiring
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/pages/index.astro
  - src/pages/en/index.astro
  - public/favicon.svg
  - src/components/past-editions/PastEditionSection.astro (deleted)
  - src/components/past-editions/PastEditionMinimal.astro (deleted)
  - src/components/testimonials/TestimonialsStrip.astro (deleted)
findings_count:
  critical: 0
  warnings: 3
  info: 4
  total: 7
status: warnings
---

# Phase 26: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard (advisory, non-blocking)
**Files Reviewed:** 6 (3 modified + 3 deleted)
**Status:** warnings

## Summary

The Phase 26 homepage rewire is correct and well-scoped: section composition, locale-aware hrefs (`/2023` vs `/en/2023`, `/sponsors` vs `/en/sponsors` via `lang` propagation), the lowercase `tier === "platinum"` filter at the page boundary, the redundant caller-side empty-state guard, and the favicon SVG (3 rects, square viewBox, official France colours, no script/external refs) all match the contracts in 26-01-PLAN / 26-02-PLAN and Phase 24's component interfaces. The `src/` deletion gate is clean — no remaining importers other than the two homepage files (already rewritten).

The notable warnings live entirely outside the source tree but inside the repo: the orphan-component cleanup in Plan 26-03 left two tightly-coupled tests (`tests/build/testimonials-strip-source.test.ts`, `tests/build/past-edition-shell.test.ts`) `readFileSync`-ing paths that no longer exist, and two HTML-shape tests (`homepage-testimonials-mount.test.ts`, the SC1 ordering assertion in `homepage-2026-section.test.ts`) make claims about the old DOM that the new composition no longer satisfies. `bun run build` is unaffected and ships 156 pages, but `bun run test` (vitest run) is now red until those test files are deleted or rewritten. None of this blocks the v1.2 milestone — flagged as warnings so the orchestrator can decide whether to clean up before the milestone audit.

## Warnings

### WR-01: Two test files `readFileSync` deleted source paths and will throw

**Files:**
- `tests/build/testimonials-strip-source.test.ts:11-17`
- `tests/build/past-edition-shell.test.ts:16-19`

**Category:** Bug / dead test (cross-file regression from Plan 26-03 deletes)

**Issue:** Both files do a top-of-module `readFileSync(...)` of paths that Plan 26-03 deleted:
- `src/components/testimonials/TestimonialsStrip.astro` (Phase 20 marquee shell)
- `src/components/past-editions/PastEditionSection.astro` (Phase 16 D-08 shell)

`readFileSync` runs at module-load time (not inside an `it()` block), so vitest will fail to even collect these suites — the whole `bun run test` run goes red with `ENOENT`. The Plan 26-03 safety gate was scoped to `src/` only (`grep -rl ... src/`), which is why these `tests/build/` consumers slipped past.

**Fix:** Either delete the now-obsolete test files (preferred — both target component contracts that no longer exist):
```bash
git rm tests/build/testimonials-strip-source.test.ts
git rm tests/build/past-edition-shell.test.ts
```
…or wrap the `readFileSync` call in a `describe.skipIf(!existsSync(...))` guard so the suite no-ops cleanly when the source is gone. The first option matches the dead-code-elimination posture of Plan 26-03.

### WR-02: `homepage-testimonials-mount.test.ts` asserts the old marquee DOM that no longer ships

**File:** `tests/build/homepage-testimonials-mount.test.ts:24-75`

**Category:** Bug / stale DOM contract

**Issue:** The test asserts `<ul data-track="canonical">`, `<ul data-track="duplicate">`, `aria-hidden="true" inert` markers, and exactly **6** `<blockquote>` elements (3 canonical + 3 duplicate marquee track). The new `Edition2026Combined.astro` ships a static 3-up grid (no marquee, no duplicate track) — see `Edition2026Combined.astro:179-189`: a single `<ul>` with **3** `<blockquote>` items and no `data-track` attribute. Every `it()` in this file now fails against the post-Phase-26 `dist/index.html`.

**Fix:** Replace the marquee-era assertions with the new contract — 3 blockquotes, FR heading "Ils en parlent mieux que nous" (verify against `editions.2026.testimonials_heading` i18n key for both locales), no `data-track` requirement. Or delete the file if the new structural contract is already covered by `homepage-2026-section.test.ts` (it isn't, today — that test focuses on the iframe + section ordering, not testimonials shape). A short rewrite is the better trade.

### WR-03: `homepage-2026-section.test.ts` SC1 ordering assertion contradicts the v1.2 section order

**File:** `tests/build/homepage-2026-section.test.ts:43-52`

**Category:** Bug / stale ordering contract

**Issue:** The test asserts `cfpIdx < section2026 < section2023` (CFP then 2026 then 2023). The Plan 26-01 rewrite reorders to `Edition2026Combined → Edition2023Link → CfpSection → SponsorsPlatinumStrip`, so the new DOM order is `2026 < 2023 < cfp` — the inverse. This test will fail against the new build. The remaining assertions in the same file (iframe id, anchor presence, "no rail / no stats / no iframe" on the 2023 minimal block, KCD logo alt, locale-correct `/2023` vs `/en/2023` href) all still hold and should be preserved.

**Fix:** Update the SC1 assertion to reflect the v1.2 order (2026 BEFORE 2023, both BEFORE CFP). Suggested replacement:
```ts
const cfpIdx = html.indexOf('id="cfp"');
const section2026 = html.indexOf('id="edition-2026"');
const section2023 = html.indexOf('id="edition-2023"');
expect(section2026, "#edition-2026 not found").toBeGreaterThan(-1);
expect(section2023).toBeGreaterThan(section2026);
expect(cfpIdx).toBeGreaterThan(section2023);
```

## Info

### IN-01: Stale comment references to deleted components in `editions-data.ts` and `Edition2023Link.astro`

**Files:**
- `src/lib/editions-data.ts:86-87` — `"// Homepage minimal block (17-04) — 3 curated photos (01, 05, 08) consumed by\n   // PastEditionMinimal.astro."`
- `src/components/past-editions/Edition2023Link.astro:9` — `"Replaces PastEditionMinimal.astro on the homepage starting in Phase 26."`
- `src/components/past-editions/Edition2023Link.astro:11` — `"removes the PastEditionMinimal import, and deletes the now-orphan file."`
- `src/components/past-editions/Edition2026Combined.astro:81` — `"Matches the existing TestimonialsStrip.astro pattern…"`

**Category:** Code quality / housekeeping

**Issue:** All four mentions point at files that no longer exist. Future readers grepping for `PastEditionMinimal` or `TestimonialsStrip` will hit these comments and be misled into a phantom-component hunt.

**Fix:** Either trim the comment to drop the dead reference (e.g. in `editions-data.ts`: `// Homepage 2023 thumbnails — 3 curated photos (01, 05, 08).` — also note `EDITION_2023.thumbnails` is now unused by any component since Plan 26-03; consider deleting the field altogether in a follow-up baseline-cleanup pass) or repoint to the live consumer (`Edition2023Link` for the 2023 logo flow, `Edition2026Combined` for the testimonials cast pattern). Low priority — purely descriptive drift.

### IN-02: `EDITION_2023.thumbnails` is now an orphan data field

**File:** `src/lib/editions-data.ts:89-93`

**Category:** Dead code

**Issue:** The `thumbnails` array on `EDITION_2023` was the data feed for the deleted `PastEditionMinimal.astro`. After Plan 26-03 it has zero consumers — the new `Edition2023Link.astro` only reads `EDITION_2023.brandLogo` (line 30 import + line 40 usage in homepages). The field is preserved by `editions-data.test.ts:70-82`, which itself is a candidate for cleanup — that test still asserts "3 thumbnails wired to kcd2023 masters (17-04 minimal homepage block)" for a block that no longer exists.

**Fix:** In a follow-up baseline-cleanup pass, drop `EDITION_2023.thumbnails` and the corresponding lines 70-82 in `editions-data.test.ts`. Out of scope for Phase 26's "delete the .astro files only" remit, but worth noting so the next maintainer doesn't add a new consumer to the orphan field.

### IN-03: `siteUrl` fallback string duplicated across both homepage files (and `getCollection("sponsors")` call duplicated too)

**Files:**
- `src/pages/index.astro:17, 23-24`
- `src/pages/en/index.astro:17, 23-24`

**Category:** Minor duplication / DRY

**Issue:** `Astro.site ? Astro.site.toString() : "https://cloudnativedays.fr/"` and the `getCollection("sponsors") + .filter(s => s.data.tier === "platinum")` snippet are byte-identical between the FR and EN files. Phase 26's deliberate FR/EN parity discipline (each file is the locale's canonical literal) makes this an intentional trade — duplication for parity transparency — so this is a non-issue under the Phase 26 plan, just flagged for future awareness if the pattern grows. If a third locale or a /preview homepage joins later, factor the sponsor-loader into `src/lib/sponsors-data.ts` (mirrors `editions-data.ts`).

**Fix:** None required. Re-evaluate if a third homepage variant appears or if the filter logic gains complexity (e.g. tier-ordering, drift-detection).

### IN-04: Favicon `<title>` is FR-only across both locales

**File:** `public/favicon.svg:2`

**Category:** Minor i18n nit (advisory)

**Issue:** The `<title>` element is `"Drapeau de la France — Cloud Native Days France"` — pure French. The favicon is shared between `/` and `/en/` (it's a single file in `public/`, served from `/favicon.svg` regardless of locale), so EN-only users get a French title string when their assistive tech inspects the favicon link. Practically zero AT users dig into favicon titles, and the brand string ("Cloud Native Days France") is locale-stable, so impact is negligible.

**Fix:** Optional — replace with a locale-neutral string like `<title>Cloud Native Days France</title>` (drops the "Drapeau de la France —" prefix). The flag visual itself is the brand signal; the title string is redundant cherry-on-top. Not worth a separate commit.

---

## What's NOT a Finding (intentionally surfaced for clarity)

These were checked and are correct — listed so the orchestrator doesn't re-flag them on a second pass:

- **Sponsor tier filter is lowercase** (`s.data.tier === "platinum"`) and matches the Zod enum at `src/content.config.ts:118` exactly. A `"Platinum"` typo would silently empty the array; the lowercase invariant is enforced by the planned grep matrix.
- **Locale-aware hrefs** — `/2023` in `src/pages/index.astro:43`, `/en/2023` in `src/pages/en/index.astro:43`. `SponsorsPlatinumStrip` resolves `/sponsors` vs `/en/sponsors` internally from the `lang` prop (component line 41). No locale leak between files.
- **Empty-state guards intact** — caller `{platinumSponsors.length > 0 && ...}` (line 46 in both files) AND component-side `{sponsors.length > 0 && ...}` (`SponsorsPlatinumStrip.astro:52`). Belt-and-braces redundancy preserved per Phase 24 decision.
- **Removed-component reachability** — `grep -rln 'PastEditionSection|PastEditionMinimal|TestimonialsStrip' src/` returns only three files: `Edition2023Link.astro` (comment), `Edition2026Combined.astro` (comment), `editions-data.ts` (comment). All three are stale comments (IN-01), not live importers. Other `src/pages/*` files (sponsors, /2023, /schedule, etc.) do NOT import any of the three deleted components — verified by grep.
- **Favicon SVG security** — only `<svg>`, `<title>`, three `<rect>` elements. No `<script>`, no `<image href>`, no external URLs. Self-contained. T-26-08 (info disclosure) and T-26-09 (XSS) properly mitigated by content shape, not just by browser policy.
- **Favicon palette + geometry** — `#002654` / `#FFFFFF` / `#ED2939` (official France-government tricolor), 1:1 viewBox `0 0 3 3`, three equal-width bands. Renders cleanly in browser favicon slots.
- **CSV-as-source-of-truth (CLAUDE.md)** — both homepages route sponsor data through `getCollection("sponsors")` rather than hardcoded lists. Component remains data-agnostic per Phase 24-02 decision.
- **Pre-existing astro-check baseline (5 errors)** — `content.config.ts` Zod regression × 3 + `Edition2023PhotoGrid.astro` implicit-any × 2. NOT in Phase 26's scope; documented in STATE.md "Pending Todos". Excluded from this review per the explicit reviewer brief.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Note: Advisory, non-blocking. Phase 26 ships green at the build layer (156 pages); the warnings cluster on the `tests/build/` cleanup follow-up._
