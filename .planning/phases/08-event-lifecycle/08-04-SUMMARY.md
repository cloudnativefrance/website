---
phase: 08-event-lifecycle
plan: 04
status: complete
---

# 08-04 — /replays pages + CountdownTimer rewire + conditional nav (EVNT-01)

## Files

| Change | Path |
|--------|------|
| new | `src/components/replays/RecordingCard.astro` |
| new | `src/pages/replays/index.astro` |
| new | `src/pages/en/replays/index.astro` |
| edit | `src/components/hero/CountdownTimer.tsx` |
| edit | `src/components/Navigation.astro` |
| edit | `astro.config.mjs` |

## How the conditional nav reveal works

Pattern: **single source of truth via data-attribute passthrough**, locked in by Phase 8 planning (08-UI-SPEC D-01/D-02).

1. `Navigation.astro` frontmatter imports `TARGET_DATE` from `src/lib/cfp.ts`.
2. The root `<header id="site-header" data-target-date={TARGET_DATE}>` carries the epoch-ms into DOM.
3. Each `postEventOnly` nav item renders its `<li>` with `class="hidden"` and `data-post-event="true"` in both the desktop `<ul>` and the mobile panel.
4. The existing `<script>` block (already hosting the mobile-menu toggle and scroll divider) gets an appended snippet that reads `site-header.dataset.targetDate`, parses it, and if `Date.now() > targetDate`, removes the `hidden` class from every `[data-post-event="true"]` element.

Why not inline the date in the script? Astro `<script>` blocks are bundled separately from frontmatter, so a frontmatter `TARGET_DATE` is NOT visible inside the script. Hardcoding a second literal in the script would create a drift-prone duplicate of `src/lib/cfp.ts`. The data-attribute passthrough is the canonical Astro idiom and keeps `cfp.ts` as the single source of truth.

Verification: `grep` checks in the plan's acceptance criteria — all pass (import present, data-target-date used, no hardcoded literal, no `href="#replays"` remaining in CountdownTimer).

## Sitemap filter rationale (D-07)

`astro.config.mjs` now passes a `filter: (page) => !/\/replays\/?$/.test(page) && !/\/en\/replays\/?$/.test(page)` to the sitemap integration. Both `/replays` and `/en/replays` are permanently excluded from the sitemap. Post-event traffic arrives via the conditional nav entry and the CountdownTimer CTA — search-engine discovery of replays is not a goal given we control the inbound links and the static build doesn't redeploy automatically when the event passes.

Verified post-build: `grep -l "/replays" dist/sitemap*.xml` returns nothing.

## EVNT-02 regression note

Phase 7's schedule recording-link markup (`data-recording-url` on every session `<article>` in `dist/programme/index.html`) is intact — verified by grepping the built HTML after this plan's edits. No changes to `ScheduleGrid.astro`, `schedule.ts`, or session-detail modal markup. The `loadSessions()` reuse in `src/pages/replays/*.astro` is read-only and shares zero state with the schedule renderer.

## Manual steps when real recordings arrive

When staff populate `recording_url` fields in `data/sessions.csv` and redeploy:

1. `/replays` and `/en/replays` flip automatically from the empty-state block to the grouped-by-track grid.
2. Cards link out to whatever URL staff put in `recording_url` (YouTube, Vimeo, Rumble, etc.). The card is agnostic to provider — `target="_blank" rel="noopener noreferrer"` is the only safety contract.
3. Track hues on the sub-heading borders and card pills are computed deterministically via `trackColor(name)` hashing the track string. Track names matching what's in `data/sessions.csv` will produce the same hue as the schedule page. If staff introduce a new track, it gets a new hue automatically — no code change needed.
4. No redeploy is required for the nav link or CountdownTimer flip — both are client-side and cut over at TARGET_DATE (2027-06-03T09:00:00+02:00).

## What renders today (pre-event)

- `/replays` and `/en/replays`: empty-state block — heading, body ("Recordings coming soon"), link back home.
- CountdownTimer: still in active countdown (target is 2027-06-03), so the post-event branch isn't rendered. When it eventually is, `href` will now point to the locale-aware /replays path.
- Navigation: `/replays` li is present in DOM but `class="hidden"`, no sitemap entry, not discoverable.

## Commits

1. `feat(08-04): RecordingCard + /replays pages (FR+EN) with empty state`
2. `feat(08-04): rewire CountdownTimer + conditional nav + sitemap filter`
3. (next) `docs(08-04): SUMMARY + deferred notes`
