---
phase: 24
verified_at: "2026-04-18"
status: verified
success_criteria:
  - id: 1
    text: "Homepage displays a Sponsors Platinum section showing logos of all Platinum-tier sponsors"
    result: met
    evidence: "src/components/sponsors/SponsorsPlatinumStrip.astro renders <section> with <h2> + responsive grid (grid-cols-2 sm:grid-cols-3 lg:grid-cols-4) of sponsor cards, each rendering the sponsor logo via <img src={logoSrc} alt={s.data.name}> bounded to max-w-[180px] max-h-16. Data is supplied by caller via ReadonlyArray<CollectionEntry<'sponsors'>>. Two platinum sponsors exist in src/content/sponsors/sponsors.csv (acme-cloud, nebula-stack) so the component will render real logos when mounted. Phase-24 scope is COMPONENT-level only; mounting on the homepage is explicitly deferred to Phase 26 per UI-SPEC §Scope reminder + ROADMAP.md Phase 24 row."
  - id: 2
    text: 'Sponsors section includes a "Voir tous les sponsors" link navigating to the /sponsors page'
    result: met
    evidence: "SponsorsPlatinumStrip.astro line 41 declares `ctaHref = lang === 'en' ? '/en/sponsors' : '/sponsors'` (locale-aware) and line 111-118 renders <p class='mt-12 text-center'><a href={ctaHref}>{ctaLabel} <span aria-hidden='true'>→</span></a></p>. ctaLabel resolves via t('sponsors.homepage.cta') — FR: 'Voir tous les sponsors', EN: 'View all sponsors' (src/i18n/ui.ts lines 95 / 391). Same-tab navigation (no target='_blank') per UI-SPEC §Accessibility."
  - id: 3
    text: "The 2023 bloc shows only the KCD logo and a text link to /2023 (no photo grid)"
    result: met
    evidence: "src/components/past-editions/Edition2023Link.astro renders exactly two children inside <section>: (1) header row containing <Image src={logo} alt={logoAlt}> (KCD brand logo, caller passes EDITION_2023.brandLogo which resolves to src/assets/logos/kcd2023/logo-color.png) + <h2>{heading}</h2>; (2) CTA row with single <a href={viewPageHref}>{viewPageLabel}</a> to /2023 (or /en/2023). Template body has ZERO <figure>, ZERO bare <img>, ZERO grid-cols-3/grid-cols-6, ZERO playlist/youtube reference — template-scoped grep returns 0 for all forbidden tokens."
  - id: 4
    text: "Sponsors section gracefully hides when no Platinum sponsors exist in the data"
    result: met
    evidence: "SponsorsPlatinumStrip.astro line 52 wraps the ENTIRE <section> in `{sponsors.length > 0 && (...)}` — when the sponsors prop is an empty array the component emits zero DOM (no dangling <h2>, no empty grid, no stale heading). Belt-and-braces design per UI-SPEC §Empty-state behaviour + PITFALLS.md #3."
requirements:
  - id: SPON-01
    result: met
    evidence: "Component SponsorsPlatinumStrip.astro implements the Platinum logo strip with 'Voir tous les sponsors →' CTA to /sponsors. Supporting artifacts: src/lib/sponsor-utils.ts (safeUrl + safeLogoPath) and sponsors.homepage.{heading,cta} i18n keys in fr+en. Homepage mount is Phase 26's responsibility per REQUIREMENTS.md traceability table."
  - id: ED23-01
    result: met
    evidence: "Component Edition2023Link.astro satisfies 'KCD logo + text link to /2023, no photos'. Reuses EXISTING editions.2023.compact_title + editions.2023.view_page_cta keys; no new i18n keys. Homepage mount is Phase 26's responsibility."
code_quality:
  astro_check: "11 errors (all pre-existing baseline; 0 originate from Phase 24 files — grep for 'SponsorsPlatinumStrip|Edition2023Link|sponsor-utils' across astro-check output returns 0 matches). Errors are in content.config.ts (3 Zod loader), Edition2023PhotoGrid.astro (2 implicit-any), TestimonialsStrip.astro (4 template-literal key narrowing), src/pages/index.astro + src/pages/en/index.astro (orphan editions.2026.gallery_cta refs)."
  build: "exit 0 — 156 pages built in 5.72s, zero warnings referencing Phase 24 files."
  review_status: clean
human_visual_uat: pending (separate step via /gsd-verify-work 24)
---

# Phase 24: Sponsors Platinum & Edition 2023 — Verification Report

**Phase Goal:** Homepage shows Platinum sponsor logos and the 2023 edition bloc is reduced to a minimal logo-and-link format.
**Verified:** 2026-04-18
**Status:** verified
**Re-verification:** No — initial verification
**Human visual UAT:** Pending (separate conversational step via /gsd-verify-work 24)

## Goal-Backward Analysis

Phase 24 delivers two new homepage components at the COMPONENT level. Per UI-SPEC §Scope reminder and ROADMAP.md Phase 24 row, the actual homepage mount is explicitly deferred to Phase 26. At verification time, success means: both components exist, are substantive, are wired to the security/i18n foundation laid by plan 24-01, and are CAPABLE of satisfying the four ROADMAP success criteria when Phase 26 mounts them.

Goal-backward chain:
- For criterion #1 to hold when mounted → a component must exist that maps `ReadonlyArray<CollectionEntry<'sponsors'>>` into a visible logo grid, using safe URL/logo gates, in both locales. → SponsorsPlatinumStrip.astro is 120 lines, exports Props, uses safeUrl + safeLogoPath from the extracted shared module, resolves t('sponsors.homepage.heading') in both locales.
- For criterion #2 to hold when mounted → the same component must emit an anchor to `/sponsors` (or `/en/sponsors`). → Line 41 encodes the locale-aware href; line 112-117 emits the anchor with the Pattern-B decorative arrow span.
- For criterion #3 to hold when mounted → a NEW 2-block component exists that does NOT render photos / playlist / brand-history, and the existing PastEditionMinimal is LEFT ALONE (Phase 26 deletes it). → Edition2023Link.astro is 60 lines, template body contains only <Image> + <h2> + <a>; PastEditionMinimal.astro is untouched.
- For criterion #4 to hold when mounted → the strip component must guard against empty arrays at the section level. → Line 52 wraps the whole <section> in `{sponsors.length > 0 && ...}`.

All four backward-chains terminate on artifacts that exist, are wired, and work.

## Criterion-by-Criterion

### Criterion 1: Sponsors Platinum section

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Component exists | met | `src/components/sponsors/SponsorsPlatinumStrip.astro` (120 lines) |
| Substantive | met | Full 3-block anatomy (h2 → grid → CTA), DS tokens only, no stubs / no TODO / no placeholder prose |
| Wired to foundation | met | imports safeUrl + safeLogoPath from `@/lib/sponsor-utils` (line 25); imports useTranslations (line 24); calls `t('sponsors.homepage.heading')` (line 39) + `t('sponsors.homepage.cta')` (line 40) + `t('sponsors.card.aria')` (line 67) — all three keys exist in both fr + en |
| Data path capable | met | Props accepts `ReadonlyArray<CollectionEntry<'sponsors'>>`; CSV has 2 platinum sponsors (acme-cloud, nebula-stack at `src/content/sponsors/sponsors.csv:2,7`); Phase 26 caller snippet in UI-SPEC §Props Interface is idiomatic getCollection + tier filter |
| Contract alignment | met | UI-SPEC §Component A anatomy mirrored 1:1 — centred h2 with `font-bold tracking-wider uppercase`, responsive grid 2/3/4 cols, card chrome with `bg-card border border-border rounded-md p-6 md:p-7`, logo bbox `max-w-[180px] max-h-16`, Pattern B decorative arrow on the CTA |

### Criterion 2: "Voir tous les sponsors" link

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Locale-aware href | met | Line 41: `ctaHref = lang === "en" ? "/en/sponsors" : "/sponsors"` — exact grep match per acceptance criteria |
| Label wired | met | Line 40 resolves `t('sponsors.homepage.cta')` → "Voir tous les sponsors" (FR) / "View all sponsors" (EN); values stored at `src/i18n/ui.ts:95` and `:391`, both arrow-free (Pattern B) |
| Arrow rendering | met | Line 116 renders `{ctaLabel} <span aria-hidden="true">→</span>` — decorative, accessibility-correct, single occurrence |
| Same-tab | met | CTA anchor has no `target="_blank"` — internal navigation per UI-SPEC §Accessibility |

### Criterion 3: 2023 bloc minimalisation

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Component exists | met | `src/components/past-editions/Edition2023Link.astro` (60 lines) |
| KCD logo rendered | met | Line 44: `<Image src={logo} alt={logoAlt} class="w-full h-auto" />` via `astro:assets` (build-time optimised). Caller will pass `EDITION_2023.brandLogo` from `src/lib/editions-data.ts:111`, which resolves to `src/assets/logos/kcd2023/logo-color.png` (file exists). |
| Single text link to /2023 | met | Lines 52-58: single `<a href={viewPageHref}>{viewPageLabel}</a>`. viewPageLabel will resolve to `editions.2023.view_page_cta` — Pattern A (arrow already in i18n value); template does not duplicate. |
| No photos / no playlist | met | Template body (lines 37-60) contains zero `<figure>`, zero bare `<img>`, zero `grid-cols-3`/`grid-cols-6`, zero `playlist`/`youtube` references. The single JSDoc match on "photos/playlist" documents what the component INTENTIONALLY OMITS and is stripped at build. |
| Typography one notch lighter | met | Line 46: `font-semibold tracking-tight leading-tight` — NOT `font-bold uppercase tracking-wider` (that pattern is reserved for the Sponsors strip h2 per UI-SPEC §Typography). |

### Criterion 4: Empty-state graceful hide

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Component-level guard | met | SponsorsPlatinumStrip.astro line 52: `{sponsors.length > 0 && (<section>...</section>)}` wraps the ENTIRE section; zero DOM when array is empty. |
| Caller guard documented | met | UI-SPEC §Props Interface + component JSDoc both prescribe `{platinumSponsors.length > 0 && ...}` at the call site (Phase 26's responsibility). Belt-and-braces redundancy is intentional. |

## Scope Discipline

All four scope invariants hold:

| Invariant | Status | Evidence |
|-----------|--------|----------|
| Homepage files untouched | met | `git log --all -- src/pages/index.astro src/pages/en/index.astro` shows most recent homepage edits are from Phase 20-21; no Phase 24 commit appears in that history. |
| PastEditionMinimal.astro untouched | met | `git log --all -- src/components/past-editions/PastEditionMinimal.astro` shows last edit at Phase 17-04; Phase 24 did not touch it. Remains orphan-by-design until Phase 26. |
| Existing /sponsors page stable | met | SponsorCard.astro only modified by Phase 24-01 refactor (behaviour-neutral: inline helpers replaced with named import); SponsorTierSection.astro, SponsorCTA.astro, sponsors.astro, en/sponsors.astro were NOT touched. |
| Source diff narrow | met | `git diff --stat HEAD~12..HEAD -- src/` shows exactly 5 source files: 3 created (sponsor-utils.ts, SponsorsPlatinumStrip.astro, Edition2023Link.astro), 2 modified (SponsorCard.astro -40/+1, ui.ts +4). No other src/** touched. |

## CLAUDE.md Compliance

| Rule | Status | Evidence |
|------|--------|----------|
| Stitch-first | respected | UI-SPEC is the validated visual contract against "Homepage Mockup v2 — Restructured Sections" (project 14858529831105057917); both components mirror the anatomy diagrams verbatim; no speculative layout/colour/typography outside the spec. |
| CSV is single source of truth | respected | Neither component hardcodes a sponsor or edition row. SponsorsPlatinumStrip is data-agnostic (props only); Edition2023Link is fully prop-driven (no getCollection, no editions-data import). Phase 26 caller will run getCollection('sponsors') + tier filter. |
| No hardcoded sponsor/session/speaker/team data in .astro/.ts | respected | grep of both components shows zero hardcoded sponsor names, URLs, or logo paths. |

## FR/EN i18n Parity

| Check | Result |
|-------|--------|
| `fr count` | 250 keys |
| `en count` | 250 keys |
| `only in fr` | [] |
| `only in en` | [] |
| New Phase 24 keys in both locales | 2 keys × 2 locales = 4 entries confirmed at ui.ts:94-95 (fr) and :390-391 (en) |
| Pattern B invariant (sponsors.homepage.cta arrow-free in value) | holds — no trailing "→" in either locale value |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| SponsorsPlatinumStrip.astro | `sponsors` prop | Caller's `getCollection('sponsors').filter(s => s.data.tier === 'platinum')` (Phase 26 responsibility) | Yes — sponsors.csv has 2 platinum rows (acme-cloud, nebula-stack) with valid url + logo columns | FLOWING (capability verified; actual wire happens in Phase 26) |
| SponsorsPlatinumStrip.astro | `heading`, `ctaLabel` | `t('sponsors.homepage.heading')` + `t('sponsors.homepage.cta')` resolved in-component | Yes — keys exist in fr + en; astro check shows no TS2345 on these calls | FLOWING |
| Edition2023Link.astro | `logo`, `heading`, `viewPageLabel`, `viewPageHref` | Caller-supplied props (Phase 26 will pass EDITION_2023.brandLogo + t(...) + locale-aware href) | Yes — EDITION_2023.brandLogo resolves to existing PNG asset; i18n keys exist; no runtime fetch | FLOWING (capability verified) |

No hollow props, no disconnected data source, no static fallbacks masquerading as real data. The components are pure render functions of caller-supplied input; the input path is complete end-to-end.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| sponsor-utils exports callable helpers | `bun -e "import('./src/lib/sponsor-utils.ts').then(m => console.log(typeof m.safeUrl, typeof m.safeLogoPath))"` | `function function` | PASS |
| safeUrl allows https URL | `safeUrl('https://example.com')` | `'https://example.com/'` | PASS |
| safeUrl rejects javascript: URL | `safeUrl('javascript:alert(1)')` | `null` | PASS |
| safeLogoPath allows absolute path | `safeLogoPath('/sponsors/foo.svg')` | `'/sponsors/foo.svg'` | PASS |
| safeLogoPath rejects traversal | `safeLogoPath('../secrets')` | `null` | PASS |
| i18n parity | `bun -e "…parity script…"` | `fr count: 250, en count: 250, only in fr: [], only in en: []` | PASS |
| Build produces output | `bun run build` | `156 page(s) built in 5.72s, exit 0` | PASS |
| astro check baseline unchanged | `bun run astro check` | `11 errors` (all pre-existing, 0 from Phase 24 files) | PASS |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SPON-01 | 24-01 (foundation) + 24-02 (component) | Homepage shows Platinum sponsor logos with "Voir tous les sponsors →" link to /sponsors | SATISFIED (component layer) | SponsorsPlatinumStrip.astro + sponsor-utils.ts + sponsors.homepage.{heading,cta} i18n keys |
| ED23-01 | 24-03 | Homepage 2023 bloc shows only KCD logo + text link to /2023 | SATISFIED (component layer) | Edition2023Link.astro (60 lines, zero photo/playlist refs) |

Both requirements are in-progress at the REQUIREMENTS.md traceability level (lines 67-68 flag them as "awaiting Phase 26 homepage mount") — that is consistent with Phase 24's documented COMPONENT-ONLY scope.

## Anti-Patterns Found

None.

- `grep TODO|FIXME|XXX|HACK|PLACEHOLDER|placeholder|coming soon|not yet implemented` across `SponsorsPlatinumStrip.astro`, `Edition2023Link.astro`, `sponsor-utils.ts` → zero matches.
- No `return null | return {} | return []` stub patterns in any Phase 24 file (the `return null` inside safeUrl/safeLogoPath is the intended reject-path of a security allow-list, not a stub).
- No `client:*` directive on either component (verified by grep).
- No ad-hoc hex/rgb colours; no `bg-accent`/`text-accent`/`border-accent`; DS tokens only.

## Gaps Summary

No gaps blocking goal achievement at the Phase 24 (component-level) scope. The four ROADMAP success criteria are all met at the capability level — each component has the code paths necessary to satisfy the criterion when Phase 26 mounts it. Scope discipline, CLAUDE.md compliance, code quality, and i18n parity invariants all hold.

The following items are CORRECTLY deferred (not gaps):
- Actual homepage mounting of both components → deferred to Phase 26 per ROADMAP.md and UI-SPEC §Scope reminder
- Deletion of now-orphan `PastEditionMinimal.astro` → deferred to Phase 26 (Pitfall #11 orphan-import guard)
- Human visual UAT (browser rendering, WCAG contrast feel, mobile responsive stacking) → separate step via `/gsd-verify-work 24`
- 4 INFO-level review notes (min-h-[112px] CSS polish, prop-arrow discipline doc, `list-none p-0` redundancy, `||` vs `??` in safeLogoPath) → none block merge; logged in 24-REVIEW.md for v1.3 housekeeping sweep

## Outstanding Items

1. **Human visual UAT**: recommended — `/gsd-verify-work 24` to confirm Stitch-mockup visual alignment on both locales. Not blocking for Phase 24 sign-off at the code level.
2. **Orphan-component cleanup**: `PastEditionMinimal.astro` is intentionally left in place so the homepage keeps rendering until Phase 26 swaps in `Edition2023Link`. No action needed in Phase 24.

---

_Verified: 2026-04-18_
_Verifier: Claude (gsd-verifier)_
