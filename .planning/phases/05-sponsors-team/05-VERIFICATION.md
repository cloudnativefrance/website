---
phase: 05-sponsors-team
verified: 2026-04-12T00:00:00Z
status: human_needed
score: 5/5 success criteria structurally satisfied (1 requires human acceptance of placeholder quantity)
overrides_applied: 0
human_verification:
  - test: "Visit /sponsors and /en/sponsors in dev/preview; confirm Platinum/Gold/Silver/Community sections render with distinct visual density, and that logos render as broken images (expected, placeholder SVGs unshipped) but card layout is intact"
    expected: "Four tier sections visible in order; single accent-pink CTA at bottom; card hover/focus states feel correct; no broken layout"
    why_human: "Visual hierarchy (presented Platinum vs wall-of-logos Community) is a design judgment; Stitch-first rule applies"
  - test: "Visit /team and /en/team; confirm initials fallback renders as a circle with 'CL' / 'EG' for members without photos"
    expected: "SpeakerAvatar initials fallback shows colored circle for chloe-leroy + erin-garcia"
    why_human: "Visual fallback quality; cannot verify pixel output programmatically"
  - test: "Accept placeholder team roster of 5 members vs SC #3 target of 10-20"
    expected: "Phase ships with 5 placeholder team rows (one per group + edge cases); real roster lands via Google Sheets content-ops per CONTEXT.md D-02 deferred items"
    why_human: "SC #3 literal count (10-20) is not met by placeholder data; CONTEXT.md D-02 explicitly deferred real roster population to organizer workflow. Needs user acceptance that the content pipeline is the deliverable, not the final content."
  - test: "Click Partenaires/Partners and Equipe/Team in the header on a running preview; verify correct locale-aware routing from / and /en/ contexts"
    expected: "FR header → /sponsors, /team; EN header → /en/sponsors, /en/team; active-state border shows on current page"
    why_human: "Navigation active-state + locale routing under live click interaction"
---

# Phase 5: Sponsors & Team — Verification Report

**Phase Goal:** Sponsors see their brand represented by tier, and the organizing team is visible to attendees.

**Verified:** 2026-04-12
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Sponsors page displays logos in distinct Platinum/Gold/Silver/Community tier sections | ✓ VERIFIED | `src/pages/sponsors.astro:12` TIER_ORDER covers all 4 tiers; `SponsorTierSection.astro:16-21` has per-tier grid densities (platinum 1-col centered → community 6-col); sponsors.csv has rows for every tier |
| 2 | Each sponsor entry shows logo, short description, clickable link | ✓ VERIFIED | `SponsorCard.astro:81-114` renders `<a href={safeHref} target="_blank" rel="noopener noreferrer" title={description}>` wrapping `<img src={logoSrc}>` and name caption; safeUrl + safeLogoPath hardening |
| 3 | Team page displays 10-20 members with photo, name, role, social links | ⚠ PARTIAL | Structure complete (`TeamMemberCard.astro:33-42`: avatar+name+role+socials). team.csv only has 5 placeholder rows vs SC literal 10-20. CONTEXT.md D-02 explicitly defers real roster to organizer content-ops. Needs human acceptance. |
| 4 | Team grouped by function (core, program committee, volunteers) | ✓ VERIFIED | `src/pages/team.astro:12` GROUP_ORDER = ["core", "program-committee", "volunteers"]; `TeamGroupSection.astro` renders labeled sections; i18n keys `team.group.*` resolved per locale |
| 5 | Data managed via content collections validated by Zod (CSV per D-02) | ✓ VERIFIED | `src/content.config.ts:109-145` — sponsors + team collections use csvLoader with Zod schemas (enum tier, enum group, socialUrl helper); CSVs at `src/content/{sponsors,team}/*.csv`; YAML files deleted |

**Score:** 5/5 criteria structurally satisfied. SC #3 quantity deferred.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content.config.ts` | CSV-based sponsors + team collections with Zod | ✓ VERIFIED | lines 109-145, flattened schemas as planned |
| `src/content/sponsors/sponsors.csv` | Rows for all tiers | ✓ VERIFIED | 5 rows across 4 tiers |
| `src/content/team/team.csv` | Rows for all groups | ✓ VERIFIED | 5 rows across 3 groups incl. empty-photo + empty-social edge cases |
| `src/lib/remote-csv.ts` | SPONSORS_CSV_URL + TEAM_CSV_URL exports | ✓ VERIFIED | lines 89-93 |
| `src/components/sponsors/SponsorCard.astro` | logo + title + anchor + safeUrl/safeLogoPath | ✓ VERIFIED | 114 lines, defensive URL+path allowlists |
| `src/components/sponsors/SponsorTierSection.astro` | per-tier grid densities | ✓ VERIFIED | all 4 tier grid strings present |
| `src/components/sponsors/SponsorCTA.astro` | mailto CTA, accent-pink | ✓ VERIFIED | `bg-accent` + `mailto:contact@cloudnativedays.fr` |
| `src/components/team/TeamMemberCard.astro` | avatar+name+role+socials | ✓ VERIFIED | reuses SpeakerAvatar + SocialLinks |
| `src/components/team/TeamGroupSection.astro` | grouped grid | ✓ VERIFIED | 5-col xl grid |
| `src/pages/{sponsors,team}.astro` + `src/pages/en/{sponsors,team}.astro` | 4 routes | ✓ VERIFIED | all 4 exist, use `getLangFromUrl` (no hardcoded locale) |
| `src/components/Navigation.astro` | dead:false for nav.sponsors + nav.team | ✓ VERIFIED | line 15 `path: "/sponsors", dead: false`; line 17 `path: "/team", dead: false`; zero `dead: true`, zero `Phase 5 pending` |
| `src/i18n/ui.ts` | sponsors.* + team.* keys both locales | ✓ VERIFIED | FR lines 61-74 + 162-167; EN lines 222-235 + 323-328 |

### Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| sponsors.astro | sponsors collection | `getCollection("sponsors")` + TIER_ORDER filter | ✓ WIRED |
| SponsorCard | sponsor.data.url | `safeUrl()` → `<a href>` | ✓ WIRED |
| SponsorCard | sponsor.data.logo | `safeLogoPath()` → `<img src>` | ✓ WIRED |
| SponsorCard | sponsor.data.description_{lang} | selected by `lang` → `title` attr | ✓ WIRED |
| team.astro | team collection | `getCollection("team")` + GROUP_ORDER filter | ✓ WIRED |
| TeamMemberCard | flat `social_*` → nested social | reshape object → `SocialLinks` | ✓ WIRED |
| TeamMemberCard | member.data.photo / initials | `SpeakerAvatar` (w-28 h-28 override) | ✓ WIRED |
| Navigation | /sponsors, /team | `getLocalePath(lang, path)` → header links | ✓ WIRED (verified in dist/index.html + dist/en/index.html) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| sponsors.astro | `all` | `getCollection("sponsors")` → csvLoader → `sponsors.csv` | Yes (5 placeholder rows, all tiers) | ✓ FLOWING |
| team.astro | `all` | `getCollection("team")` → csvLoader → `team.csv` | Yes (5 placeholder rows, all groups) | ✓ FLOWING |

Note: Asset paths referenced by CSV rows (`/sponsors/*.svg`, `/team/*.jpg`) are not shipped; `<img>` tags render broken icons until organizer content lands. This is documented and intentional.

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| 4 new routes built | `ls dist/{sponsors,team,en/sponsors,en/team}/index.html` | all 4 present | ✓ PASS |
| Nav wiring in rendered HTML | `grep href=/sponsors dist/index.html` + EN | 1 match each | ✓ PASS |
| Team group headings in built HTML | `grep 'Équipe principale\|Core Team' dist/team/index.html` | present both locales | ✓ PASS |
| No `dead: true` left in Navigation.astro | inspection | 0 matches | ✓ PASS |
| Zero `href="javascript:"` in dist | per 05-04 SUMMARY | 0 matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SPNS-01 (tiered layout) | 05-02, 05-04 | ✓ SATISFIED | SponsorTierSection + 4 tier-grid classes |
| SPNS-02 (logo + description + link per sponsor) | 05-02 | ✓ SATISFIED | SponsorCard: img + title attr + anchor |
| SPNS-03 (content collection) | 05-01 | ✓ SATISFIED | Zod-validated CSV collection |
| TEAM-01 (member cards) | 05-03, 05-04 | ✓ SATISFIED | TeamMemberCard with avatar+name+role+socials |
| TEAM-02 (grouped by function) | 05-03 | ✓ SATISFIED | GROUP_ORDER 3 groups in fixed order |
| TEAM-03 (content collection) | 05-01 | ✓ SATISFIED | Zod-validated CSV collection |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `SponsorCTA.astro` | 12 | `TODO: verify with organizers — replace with sponsor-specific inbox` | ℹ Info | Documented; canonical PROJECT.md contact in place; no blocker |
| Placeholder CSV rows | — | Obvious-placeholder names (Acme Cloud, Alice Martin) + non-existent asset paths | ℹ Info | Intentional per CONTEXT.md D-02; guaranteed-not-prod data |

No blocker anti-patterns. No TODO/FIXME in the wired render path.

### Human Verification Required

1. **Visual verification of sponsor tier hierarchy** — confirm the 4 tiers feel visually distinct (Platinum "presented" vs Community "wall of logos") per Stitch design; Stitch-first rule applies (CLAUDE.md).

2. **Team initials-fallback rendering** — confirm SpeakerAvatar renders colored circles with "CL"/"EG" for photo-less members.

3. **SC #3 quantity acceptance** — SC #3 literally asks for 10-20 team members. Current team.csv has 5 placeholder rows (one per group + edge-case coverage). CONTEXT.md D-02 explicitly defers the real roster to organizer content-ops via `TEAM_CSV_URL` Google Sheet. The code pipeline is done; the content is the deferred part. User needs to accept this interpretation (content pipeline complete; real data lands via non-code workflow).

4. **Live nav click-through** — verify active-state highlighting + locale-aware routing of the now-live Partenaires/Equipe links.

### Gaps Summary

No blocking gaps. All structural, data-pipeline, and security-hardening deliverables are in place. The only open question is interpretive: does a complete content pipeline + 5 placeholder rows satisfy a literal "10-20 members" criterion when CONTEXT.md D-02 explicitly makes the real-roster population an organizer content-ops task outside this phase? Developer decision.

Pre-existing `pnpm astro check` errors (33, in Phase 4 speakers files + csvLoader type inference) are out-of-scope per SCOPE BOUNDARY and unchanged across all 4 plans. `pnpm build` passes cleanly (146 routes).

---

*Verified: 2026-04-12*
*Verifier: Claude (gsd-verifier)*
