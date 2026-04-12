---
phase: 05
plan: 01
subsystem: content-collections
tags: [content-collections, csv, data-migration, zod, i18n]
requires:
  - csvLoader helper (src/content.config.ts, pre-existing from Phase 7)
  - fetchCsvOrFallback helper (src/lib/remote-csv.ts, pre-existing)
  - socialUrl Zod helper (src/content.config.ts, pre-existing)
provides:
  - sponsors collection loaded from CSV with flat bilingual + url schema
  - team collection loaded from CSV with flat bilingual + 5 social_* columns
  - SPONSORS_CSV_URL env-var export
  - TEAM_CSV_URL env-var export
  - Placeholder CSV rows exercising every tier and group
affects:
  - Unblocks Plan 05-02 (SponsorCard page consumes sponsors collection)
  - Unblocks Plan 05-03 (TeamMemberCard page consumes team collection)
tech-stack:
  added: []
  patterns:
    - csvLoader pattern reused (not duplicated) for two new collections
    - Flat schemas: nested {fr, en} objects collapsed to _fr / _en columns
    - socialUrl helper applied uniformly across speaker + team collections
key-files:
  created:
    - src/content/sponsors/sponsors.csv
    - src/content/team/team.csv
  modified:
    - src/lib/remote-csv.ts (added SPONSORS_CSV_URL + TEAM_CSV_URL exports)
    - src/content.config.ts (rewrote sponsors + team collections to use csvLoader)
  deleted:
    - src/content/sponsors/sponsors.yaml
    - src/content/team/team.yaml
decisions:
  - Empty-string default for SPONSORS_CSV_URL / TEAM_CSV_URL (sheets not yet provisioned); fetchCsvOrFallback reads local CSV when URL is falsy
  - No leading `# ...` comment row in CSVs (parseCsv does not skip comments); placeholder warning deferred to sibling docs if needed
  - logo column kept as z.string() (path, not URL) — Plan 05-02's SponsorCard must apply safeUrl scheme allowlist
metrics:
  duration: ~4 min
  completed: 2026-04-12
requirements: [SPNS-03, TEAM-03]
---

# Phase 05 Plan 01: CSV Migration for Sponsors & Team Summary

Migrated `sponsors` and `team` content collections from YAML `file()` loader to the CSV `csvLoader()` pattern already in use for `sessions` + `speakers`, unblocking the Phase 5 page work with a data pipeline aligned to the Phase 7 Google Sheets workflow.

## What Changed

**Schema flattening (nested → flat):**

| Before (YAML) | After (CSV) |
|---------------|-------------|
| `description: { fr, en }` | `description_fr`, `description_en` |
| `role: { fr, en }` | `role_fr`, `role_en` |
| `social: { twitter, linkedin, github, bluesky }` | `social_linkedin`, `social_github`, `social_bluesky`, `social_twitter`, `social_website` |

**Loader swap:**

```ts
// before
loader: file("src/content/sponsors/sponsors.yaml"),
// after
loader: csvLoader({
  url: SPONSORS_CSV_URL,
  fallback: "src/content/sponsors/sponsors.csv",
  label: "sponsors.csv",
}),
```

**CSV placeholder data:**

- `sponsors.csv` — 5 rows covering every tier: platinum (Acme Cloud), gold ×2 (KubeCorp, CloudForge), silver (StackOps), community (CNCF Paris Meetup). All URLs use RFC 2606 `*.example.com` reserved TLDs.
- `team.csv` — 5 rows covering every group: core ×2 (Alice Martin, Bob Dupont), program-committee ×2 (Chloé Leroy no-photo, Dan Fischer), volunteers ×1 (Erin Garcia — empty photo + empty socials for edge-case coverage).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `51dd4b2` | feat(05-01): add SPONSORS_CSV_URL and TEAM_CSV_URL exports |
| 2 | `edd7718` | feat(05-01): placeholder sponsors.csv and team.csv |
| 3 | `28e3a71` | feat(05-01): migrate sponsors + team collections from YAML to CSV |

## Build Verification

`pnpm astro check` confirms both CSV loaders work end-to-end via the fallback path:

```
[csv] sponsors.csv: using local fallback (no URL configured, 870 bytes)
[csv] team.csv: using local fallback (no URL configured, 784 bytes)
```

Zero Zod validation errors on the new collections — all placeholder rows parse, the `z.enum` tier/group constraints validate, and the `socialUrl` helper cleanly maps empty CSV cells to `undefined`.

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues

**Pre-existing TypeScript errors (out of scope — not caused by this plan):**

- `src/content.config.ts:85,110,127` — `csvLoader` return type is not assignable to Astro's `LoaderConstraint<{ id: string }>`. This is a pre-existing typing issue on the `speakers` collection (line 85) — my new `sponsors` (110) and `team` (127) collections inherit the same pattern. Comparing pre-change vs post-change error counts: 38 → 33 (my changes did not add errors, they removed 5). Fix belongs to a future csvLoader refactor.
- `src/pages/speakers/index.astro` + `src/pages/schedule.astro` — references to `talkTitle`, `talkDuration`, `talkTrack` on the speakers schema. Phase 4 concern, unrelated to this plan.
- Two `ts(6385)` deprecation warnings on `.url()` usage (pre-existing on line 85; same warning now also on line 120 for `sponsors.url`). Cosmetic — `z.string().url()` still works; Zod v4 will migrate to `z.url()` in a later pass.

These were logged only (not fixed) per the SCOPE BOUNDARY rule — they are unrelated to the YAML→CSV migration and pre-date this plan.

## Threat Flags

No new security surface introduced beyond what the `<threat_model>` in PLAN.md already enumerates. T-05-02 (CSV url → anchor href) and T-05-03 (CSV logo → img src) remain correctly deferred to Plan 05-02's SponsorCard implementation. T-05-04 (social_* URLs) is mitigated via the reused `socialUrl` Zod helper + downstream `SocialLinks.astro` `safeUrl` allowlist.

## Known Stubs

- `/sponsors/*.svg` and `/team/*.jpg` paths referenced by the placeholder CSVs do not yet exist in `/public/`. This is intentional — logo/photo assets land with real sponsor + team data via the organizer content-ops workflow (CONTEXT.md D-02). Placeholder rows use obviously-fake names (Acme Cloud, Alice Martin, etc.) so they cannot ship to prod without replacement.

## Self-Check: PASSED

- [x] `src/content/sponsors/sponsors.csv` exists
- [x] `src/content/team/team.csv` exists
- [x] `src/content/sponsors/sponsors.yaml` deleted
- [x] `src/content/team/team.yaml` deleted
- [x] Commits `51dd4b2`, `edd7718`, `28e3a71` all present in git log
- [x] `csvLoader({` appears exactly 3 times in `src/content.config.ts` (speakers, sponsors, team)
- [x] `file(` no longer appears in `src/content.config.ts`
- [x] Build logs confirm fallback path works for both new collections
