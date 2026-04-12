---
phase: 05
slug: sponsors-team
status: ready-for-planning
captured: 2026-04-12
source: /gsd-discuss-phase 5 (interactive)
---

# Phase 5: Sponsors & Team — Context

**Goal (from ROADMAP):** Sponsors see their brand represented by tier, and the organizing team is visible to attendees.

**Requirements:** SPNS-01, SPNS-02, SPNS-03, TEAM-01, TEAM-02, TEAM-03.

**Stitch-first rule applies** (per `CLAUDE.md`): Both pages (`/sponsors` and `/team` + EN mirrors) must be designed in Stitch and user-validated before code. After this CONTEXT.md lands, the next step is `/gsd-ui-phase 5` → user review → `/gsd-plan-phase 5`.

---

<domain>
## Phase Boundary

**In scope:**
- Two new public pages: sponsors (tiered) and team (grouped).
- Two new card components: `SponsorCard.astro`, `TeamMemberCard.astro`.
- Section/grid layout components per page.
- Wiring `nav.sponsors` and `nav.team` from dead-link placeholders to the new routes.
- Expanding placeholder YAML data only if needed to exercise layouts (≤ 10 team members, ≤ 8 sponsors across tiers).
- i18n keys for section headers, empty-state copy, and any new microcopy.

**Out of scope (deferred):**
- Real sponsor roster — lands via a follow-up content-ops commit once organizers confirm deals.
- Real team roster — same; schema is ready, data swap is trivial.
- "Become a sponsor" prospectus page/flow (a single contact CTA at the end of `/sponsors` is the only sponsor-acquisition touchpoint in this phase).
- Individual sponsor or team profile pages (no `/[slug]` routes — sponsors link to external URLs, team members to their social profiles).
- Dark/light logo variants, SVG sprite system (Phase 5 ships with whatever assets are in `/public/sponsors/`; asset optimization is a separate concern).
- Interactive features (sponsor filter, search) — not in roadmap scope.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Routes (symmetric English slugs)
- FR: `/sponsors`, `/team`.
- EN: `/en/sponsors`, `/en/team`.
- Rationale: matches the `/speakers` + `/en/speakers` precedent from Phase 4 and works with the existing prefix-only `getLocalePath(lang, path)` (`src/i18n/utils.ts:30-46`) — no route-translation map needed. Confirmed by user after initial draft of D-01 specified asymmetric paths (originally FR `/partenaires` + `/equipe`, EN `/en/sponsors` + `/en/team`) which would have required extending `getLocalePath` with a per-locale slug map, a subsystem not used elsewhere in the codebase.
- **Nav-label translation is a separate concern from URL slugs**: the rendered link text is still "Partenaires" (FR) / "Partners" (EN) / "Équipe" (FR) / "Team" (EN) from the existing `nav.sponsors` / `nav.team` i18n keys. Only the href slug stays English across both locales.
- Update `src/components/Navigation.astro:15,17` — change `path: "/"` + `dead: true` to `path: "/sponsors"` and `path: "/team"` and remove the `dead` flag.
- File locations: `src/pages/sponsors.astro` (FR) + `src/pages/en/sponsors.astro` (EN); `src/pages/team.astro` (FR) + `src/pages/en/team.astro` (EN).

### D-02 — Data source: CSV with Google Sheets admin pipeline (matches schedule/speakers pattern)
- **Migrate sponsors + team from YAML to CSV** to match the Phase 7 schedule + speakers workflow. Organizers edit a Google Sheet; a CSV export lands in-repo; the site builds from CSV.
- New files (replace existing YAML):
  - `src/content/sponsors/sponsors.csv` (replaces `sponsors.yaml`)
  - `src/content/team/team.csv` (replaces `team.yaml`)
- Environment variables for remote Sheets URLs, mirroring `SCHEDULE_SESSIONS_CSV_URL` pattern from `src/lib/remote-csv.ts`:
  - `SPONSORS_CSV_URL` — optional remote Google Sheets CSV export URL; falls back to `src/content/sponsors/sponsors.csv` if unset or fetch fails.
  - `TEAM_CSV_URL` — same treatment.
  - Add both to `src/lib/remote-csv.ts` alongside existing `SESSIONS_CSV_URL` / `SPEAKERS_CSV_URL` exports.
- **Schema changes required** (Zod schemas in `src/content.config.ts`): CSV is flat, no nested objects. Flatten bilingual + nested social fields:
  - Sponsors: `id, name, tier, logo, url, description_fr, description_en` (was `description: {fr, en}` nested object → two flat columns).
  - Team: `id, name, role_fr, role_en, group, photo, social_linkedin, social_github, social_bluesky, social_twitter, social_website` (flatten `role: {fr, en}` and `social: {...}` into columns; all social_* optional empty-string → undefined).
  - Page components read flattened fields and reconstruct bilingual display via `sponsor.description_fr` / `sponsor.description_en` selected by `lang`.
- Use the existing `csvLoader` + `fetchCsvOrFallback` helpers from `src/content.config.ts:23-81` and `src/lib/remote-csv.ts` — do NOT reinvent CSV parsing.
- **Expand placeholders** during planning only as needed to exercise every visual state: at minimum one CSV row per sponsor tier (Platinum/Gold/Silver/Community) and one row per team group (core/program-committee/volunteers). Rows must be obviously-placeholder ("Acme Cloud", "Jane Doe") so they can't accidentally ship to prod.
- Real data replacement flow: organizer edits Google Sheet → CI or pre-commit dumps latest CSV into repo → merged via normal PR. No code change required for content updates.
- Flag both CSV files with a header comment row `# Placeholder data — replace before v1.0 launch` (or equivalent within the CSV format — a first row with `# ...` that the parser skips, same convention as schedule CSVs if one exists; otherwise a sibling README.md in the content directory).
- **Delete** the existing `src/content/sponsors/sponsors.yaml` and `src/content/team/team.yaml` files as part of this migration.

### D-03 — Sponsor tier visual hierarchy: size-only
- All 4 tiers use the **same sponsor-card treatment**; only logo size and grid density differ.
- Target grids (responsive; these are desktop baselines for the Stitch mockup):
  - **Platinum**: 1 sponsor per row, logo ~200–240 px wide, centered, generous whitespace. Feels "presented."
  - **Gold**: 2 per row, logo ~160 px.
  - **Silver**: 3–4 per row, logo ~120 px.
  - **Community**: 5–6 per row, logo ~80–96 px, tight grid (wall of logos).
- Mobile collapses all tiers to 1–2 columns with size ordering preserved (Platinum stays largest).
- Rationale: reads like every reputable conference site (KubeCon, FOSDEM) without overengineering tier-specific card components.

### D-04 — Sponsor card content: logo + name + URL always; description on hover tooltip
- Every card renders: sponsor logo (image), sponsor name (caption beneath or aria-label), wrapping anchor to `sponsor.url` with `target="_blank" rel="noopener noreferrer"` (security posture matches Phase 12 ticketing link).
- Description surfaces via native `title={description[lang]}` attribute — works on desktop hover, mobile long-press, and is announced by screen readers.
- No dedicated description region in the visible card — keeps all tiers visually consistent.

### D-05 — Sponsor empty-tier handling: hide empty sections + single global CTA
- If a tier has zero entries, do NOT render its section header or grid.
- If a tier has 1–2 entries, render as-is (honest to sponsor state; no padding with fake content).
- **Global sponsor CTA** at end of `/sponsors` (and `/en/sponsors`): a single block with a headline ("Devenez partenaire" / "Become a sponsor"), a 1–2 sentence pitch, and a contact affordance (mailto or link to `PROJECT.md`-defined sponsor contact).
  - The actual email/URL for the CTA is Claude's discretion during planning — use whatever contact info exists in `PROJECT.md` or ROADMAP.md; if none, plan a placeholder with a `TODO` flagged in the plan's deferred-items for the user to fill in.

### D-06 — Team card: new `TeamMemberCard.astro`, compact + photo-forward
- **New component** — do NOT reuse `SpeakerCard.astro` (has Keynote badge, talk link, and other speaker-specific affordances that waste space and mislead on the team page).
- Card contents (top → bottom):
  1. Square or circle avatar ~96–120 px (choose in Stitch).
  2. Name (H3-equivalent, same type scale as speakers for visual harmony).
  3. Role in muted text (`text-muted-foreground`), one line, truncated with ellipsis if overflow.
  4. Social icons row (reuse `SocialLinks.astro` at a smaller icon scale if possible).
- Denser grid than `/speakers`: **4–5 columns on desktop**, 2–3 on tablet, 1–2 on mobile.
- Reuse **`SpeakerAvatar.astro`** pattern for the avatar (initials fallback) — keeps the component library tight.

### D-07 — Photo policy: optional with initials fallback
- `photo` stays optional in the Zod schema (already is: `z.string().optional()`).
- When missing, render initials-fallback via `SpeakerAvatar` (colored circle with first letters of name tokens).
- Rationale: respects team members who don't want their face on the site (common for volunteers) without creating a visual gap.

### D-08 — Team group order: Core → Program Committee → Volunteers
- Section order top-to-bottom:
  1. Core team
  2. Program committee
  3. Volunteers
- Matches typical conference org weight; also matches how sponsors are presented (highest-visibility first).

### D-09 — Group section heading copy
- FR:
  - `core` → **"Équipe principale"**
  - `program-committee` → **"Comité de programme"**
  - `volunteers` → **"Bénévoles"**
- EN:
  - `core` → **"Core Team"**
  - `program-committee` → **"Program Committee"**
  - `volunteers` → **"Volunteers"**
- Add i18n keys `team.group.core`, `team.group.program_committee`, `team.group.volunteers` to `src/i18n/ui.ts` for both locales.

### D-10 — Nav wiring (closes existing dead links)
- `src/components/Navigation.astro:15` — `{ key: "nav.sponsors", path: "/sponsors" /* localized via getLocalePath */, dead: false }`
- `src/components/Navigation.astro:17` — `{ key: "nav.team", path: "/team", dead: false }`
- Remove the `// Phase 5 pending (D-05)` trailing comments.
- Use `getLocalePath(lang, ...)` to resolve EN mirrors (matches existing nav items).

### D-11 — Sorting within groups/tiers
- **Sponsors within a tier:** preserve CSV row order (organizers manually arrange featured sponsors first by ordering rows in the Google Sheet; this is a deliberate editorial tool — do NOT auto-sort alphabetically).
- **Team within a group:** preserve CSV row order for the same reason (e.g., Conference Director as the first row within the `core` group).
- If row ordering causes confusion later, a separate phase can introduce a `display_order` column.

### Claude's Discretion (implementation details)
- Exact Tailwind spacing/token choices for grid gaps, card padding, logo-max-width constraints — derive from design tokens during Stitch review.
- Whether the logo `<img>` uses Astro's `<Image>` component or plain `<img src>` — use `<Image>` if logos are in `src/assets/sponsors/`, plain `<img>` if in `public/sponsors/` (sample data currently uses `/sponsors/...` paths = public).
- Exact copy for the global sponsor CTA block — propose in Stitch, user-edits before shipping.
- Whether a thin `<hr>` / divider separates tier sections or whitespace alone is enough — design decision in Stitch.
- Card hover/focus states (subtle lift? border highlight? nothing?) — keep in line with existing card treatments (SpeakerCard).
- Whether to render `aria-label` on the whole-card anchor describing the sponsor, or rely on the visible name + description-tooltip combo.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before acting.**

### Content schemas (Phase 2 schemas exist but MUST be migrated to CSV in this phase — see D-02)
- `src/content.config.ts` — contains existing `sponsors` + `team` collection defs using `file()` YAML loader. **Replace with `csvLoader({url, fallback, label})` pattern** matching the `sessions` / `speakers` collections already defined at lines 52-95. Zod schemas must be flattened (no nested objects) to match CSV row shape.
- `src/content/sponsors/sponsors.yaml` — **DELETE** in this phase; replaced by `src/content/sponsors/sponsors.csv`.
- `src/content/team/team.yaml` — **DELETE** in this phase; replaced by `src/content/team/team.csv`.

### CSV pipeline (authoritative reference pattern from Phase 7)
- `src/lib/remote-csv.ts` — `fetchCsvOrFallback()` helper + existing env-var exports (`SESSIONS_CSV_URL`, `SPEAKERS_CSV_URL`). Extend with `SPONSORS_CSV_URL` and `TEAM_CSV_URL`.
- `src/content.config.ts:23-81` — the `csvLoader({url, fallback, label})` function + `parseCsv()` RFC-4180 parser. Reuse as-is; do NOT duplicate.
- `src/content/schedule/sessions.csv` and `src/content/schedule/speakers.csv` — reference CSV files showing header-row + data-row format to mirror for sponsors.csv and team.csv.
- `src/lib/schedule.ts` — pattern for consuming a CSV-backed collection and reconstructing locale-dependent display.

### Reusable components (don't rebuild)
- `src/components/speakers/SpeakerAvatar.astro` — initials fallback pattern; reuse inside `TeamMemberCard`.
- `src/components/speakers/SocialLinks.astro` — renders LinkedIn/GitHub/Bluesky/Twitter/website with URL allowlist (`safeUrl`); reuse inside `TeamMemberCard`.
- `src/components/speakers/SpeakerCard.astro` — **reference only**; don't reuse for team but study its layout for visual harmony.
- `src/components/Navigation.astro` — wire `nav.sponsors` and `nav.team` away from dead links here.

### i18n
- `src/i18n/ui.ts` — extend with `team.group.{core,program_committee,volunteers}`, optionally `sponsors.cta.*`, `sponsors.tier.{platinum,gold,silver,community}`, `team.page.*`, `sponsors.page.*` headers as needed during planning.
- `src/i18n/utils.ts` — `useTranslations`, `getLangFromUrl`, `getLocalePath` (all three used by every new page component).

### Prior CONTEXT.md (for consistency)
- `.planning/phases/04-speakers/04-CONTEXT.md` — patterns for index+profile pages, card/avatar treatment, bilingual content flow.
- `.planning/phases/10-site-navigation-component-wiring/10-CONTEXT.md` — nav item contract (`key`, `path`, `dead`) and `getLocalePath` conventions.

### Project-level
- `.planning/PROJECT.md` — contact info, brand principles.
- `.planning/REQUIREMENTS.md` — SPNS-01..03, TEAM-01..03 acceptance criteria.
- `./CLAUDE.md` — Stitch-first rule (hard requirement for this phase).

### Design system
- `DESIGN.md` — Logo Usage section (§359+) — clarifies that KCD co-branding ≠ "sponsor" (different lockup, different section of the site). Don't conflate.
- `src/styles/global.css` — design tokens (OKLCH colors, DM Sans font); stick to tokens, no new palette.

### External conventions (reference only — not required reading)
- KubeCon sponsor page layout (size-only tier hierarchy) — mental model for D-03.
- FOSDEM team page (grouped by role) — mental model for D-08/D-09.

</canonical_refs>

<specifics>
## Specific Ideas

- **Platinum cards feel "presented":** user wants premium sponsors to look genuinely premium — large logos, centered, breathing room around them. Not a grid cell — more like a featured block.
- **Wall-of-logos for Community:** community tier should read dense and grid-like, signaling volume (many smaller supporters).
- **Honest sparse display:** if Gold has only 1 sponsor, show 1 sponsor in the Gold slot. Don't pad with fake content, don't stretch that one logo across the tier. A lone Gold sponsor sitting in its normal-size slot with whitespace around it is fine.
- **Volunteers-first aesthetic for team page:** photos humanize the event. Initials fallback acceptable, but photos are the default presumption — most of the real roster will have photos.
- **Nav integration is a one-liner, but don't forget it:** two `dead: true` flags in Navigation.astro are literally the last thing blocking these items from appearing in the header menu.

</specifics>

<deferred>
## Deferred Ideas (not this phase — capture for later)

- **Real sponsor + team data population** — handled by organizers editing the Google Sheets backing the `SPONSORS_CSV_URL` / `TEAM_CSV_URL` env vars. No code change required; CI re-exports CSV into `src/content/{sponsors,team}/*.csv` on each deploy.
- **Sponsor prospectus page** (`/sponsors/offre`, PDF download, tier pricing) — if organizers want lead-gen, a future phase.
- **Individual team member profile pages** — the social links row is enough for v1.0; individual pages would be a later phase.
- **Sponsor filter/search** — if the roster grows past ~30, revisit. Not needed for 2027.
- **Logo dark-mode variants** — add `logoLight` + `logoDark` to the schema if/when the site gains a light theme (currently dark-only).
- **Sponsor-provided sessions cross-linking** — if sponsors run sessions on the schedule, link from their card to their talk. Out of scope for this phase (and schema doesn't support it yet).
- **Animated tier reveal on scroll** — nice-to-have, not essential; do in polish phase if motion design becomes a priority.
- **Team member bios** — schema currently has no bio field; adding one would change the card contract (expand to bio drawer, etc.). Future phase.

</deferred>

---

## Next Steps

1. ✅ ~~`/gsd-ui-phase 5`~~ — UI-SPEC.md + Stitch mockups generated (screen IDs `56d58c5c7cdd425c8463688934a6898d` sponsors / `686bb49cfdac48118de1b30b245d6e30` team). Awaiting user validation in Stitch.
2. **User validates Stitch mockups** for both pages.
3. **`/gsd-plan-phase 5`** — Planner reads this CONTEXT + UI-SPEC → produces PLAN.md files. Expected structure: one plan for the CSV/schema migration (data layer), one plan per page (sponsors + team components + routes), one plan for nav wiring.
4. **`/gsd-execute-phase 5`** — Ship it.
5. (Later) Organizers populate the Google Sheets backing `SPONSORS_CSV_URL` / `TEAM_CSV_URL`; no code change required.

---

*Phase: 05-sponsors-team*
*Context gathered: 2026-04-12 via /gsd-discuss-phase*
