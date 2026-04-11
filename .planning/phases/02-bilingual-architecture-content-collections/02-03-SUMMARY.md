---
phase: 02-bilingual-architecture-content-collections
plan: 03
subsystem: content-collections
tags: [astro, content-layer, zod, bilingual, speakers, talks, sponsors, team]
dependency_graph:
  requires: [02-01]
  provides: [content-collections, content-schemas, sample-content]
  affects: [speakers-page, schedule-page, sponsors-page, team-page]
tech_stack:
  added: []
  patterns: [glob-loader, file-loader, zod-schema-validation, locale-subdirectories]
key_files:
  created:
    - src/content.config.ts
    - src/content/speakers/fr/speaker-1.md
    - src/content/speakers/en/speaker-1.md
    - src/content/talks/fr/talk-1.md
    - src/content/talks/en/talk-1.md
    - src/content/sponsors/sponsors.yaml
    - src/content/team/team.yaml
  modified: []
decisions:
  - Speakers and talks use glob loader with per-locale Markdown subdirectories (fr/, en/)
  - Sponsors and team use file loader with single YAML and inline bilingual fields
  - Shared social schema extracted to avoid duplication between speakers and team
metrics:
  duration: 2min
  completed: 2026-04-11T17:54:47Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 0
---

# Phase 02 Plan 03: Content Collections with Zod Schemas Summary

Zod-validated content collections for speakers, talks, sponsors, and team using Astro 6 Content Layer API with glob/file loaders and per-locale subdirectories for bilingual content.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create content.config.ts with Zod schemas | 05f5479 | src/content.config.ts |
| 2 | Create sample bilingual content entries | 374330a | 6 content files (speakers, talks, sponsors, team) |

## Implementation Details

### Content Collection Architecture

**Speakers** (glob loader, `**/*.md`): name, company, role, photo, bio, social links. Per-locale Markdown in fr/ and en/ subdirectories.

**Talks** (glob loader, `**/*.md`): title, speaker ref, cospeakers, track enum (4 values), format enum (4 values), duration, room, startTime, tags, youtubeUrl, feedbackUrl.

**Sponsors** (file loader, YAML): id, name, tier enum (platinum/gold/silver/community), logo, url, bilingual description object.

**Team** (file loader, YAML): id, name, bilingual role object, group enum (core/program-committee/volunteers), photo, social links.

### Bilingual Strategy

- Speakers and talks: separate Markdown files per locale in subdirectories (`fr/speaker-1.md`, `en/speaker-1.md`). Queried by filtering on `id.startsWith(lang + "/")`.
- Sponsors and team: single YAML file with inline bilingual fields (`description.fr`, `role.en`). Locale selected at render time.

### Schema Enforcement Verified

- Build passes with valid sample content in both FR and EN
- Build fails when frontmatter is missing required fields (name, bio) -- Zod rejects invalid data at build time

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all sample content contains real-looking data appropriate for development/testing.

## Self-Check: PASSED

- All 7 created files verified present on disk
- Commit 05f5479 verified in git log
- Commit 374330a verified in git log
