# Phase 8: Event Lifecycle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 08-event-lifecycle
**Areas discussed:** CFP data source, CFP widget placement, Post-event replays destination, Post-event mode trigger

---

## CFP data source

| Option | Description | Selected |
|--------|-------------|----------|
| Date-gated constants | Two ISO dates (`CFP_OPENS`, `CFP_CLOSES`) in a config module; build+client compute state identically | ✓ |
| Live Conference Hall API | Fetch current state at build time from conference-hall.io | |
| Manual config flag | Single string (`coming-soon` / `open` / `closed`), requires redeploy to change | |

**User's choice:** Date-gated constants (recommended).
**Follow-up:** Dates + Conference Hall URL left as placeholders — staff edits later.

---

## CFP widget placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated section below key numbers | Matches existing homepage vertical rhythm, easy to hide when closed | ✓ |
| Top banner above hero | Maximum visibility, but clutters first paint | |
| Side card inside hero | Compact, but hero already dense | |

**User's choice:** Dedicated section below key numbers.

---

## Post-event replays destination

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `/replays` page fed by sessions.csv | On-brand, reuses schedule pipeline | ✓ |
| External YouTube playlist URL only | Zero build work; leaves the site | |
| Both: `/replays` + playlist CTA | Page default, playlist as secondary | |

**User's choice:** Dedicated `/replays` page.
**Follow-ups:**
- Organization: grid grouped by track (reuse Phase 7 `trackColor()`)
- Gating: page hidden (nav link + hero CTA) until post-event mode active

---

## Post-event mode trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Client runtime date check | Reuse existing `CountdownTimer` `TARGET_DATE` vs `Date.now()` pattern | ✓ |
| Build-time bake | Decide at build, ship static HTML; requires rebuild to flip | |
| Manual config flag overrides date | `eventPhase` override for staff | |

**User's choice:** Client runtime date check.

---

## Claude's Discretion

- Exact CFP section copy and CTA wording (within bilingual voice)
- Whether CFP section hides or shows muted note when `closed`
- `/replays` card layout specifics within "grid grouped by track"
- Exact file location for CFP date constants (single file, staff-obvious)

## Deferred Ideas

- Live-event mode banner / during-conference UI
- Realtime "happening now" session status
- Attendee check-in / QR / badging
- Full YouTube playlist CTA on `/replays` (can add post-launch)
- Conference Hall live API for CFP state
- Auto-fetching recording URLs from YouTube/Conference Hall APIs
