# Design spec — Programme: an audience lens for 2027

**Date:** 2026-09-04
**Status:** Approved, ready for implementation
**Delivery:** one PR

---

## Context

The 2027 edition adds a fifth room, **Eiffel**, and a dedicated track for a leadership
audience — CTOs, DSI, engineering leaders. The schedule grid lays rooms out as equal
columns:

```css
grid-template-columns: 56px repeat(var(--room-count), minmax(0, 1fr));
```

`minmax(0, 1fr)` has no floor and there is no horizontal-scroll container, so columns
shrink without limit as rooms are added. Measured against the `max-w-7xl` container:

| Viewport | 4 rooms | 5 rooms |
|---|---|---|
| 1440+ | 296px | 235px |
| 1280 | 280px | 222px |
| **1024–1366** | 216px | **170px** |

At 170px a title like *"FinOps sans tableur : instrumenter la dépense comme une métrique"*
wraps to six lines, on top of track, level and duration. **The damage lands on 1024–1366px
laptops — what attendees actually carry — while looking merely tight on the wider screen
the page would be designed on.**

The fix is not a narrower card. Splitting by audience is an editorial decision the
organisers have already made; the layout problem dissolves as a consequence of expressing
it.

## What this is not

Rejected during design, recorded so they are not revisited by accident:

- **A minimum column width plus horizontal scroll.** Keeps one grid honest at any room
  count, but sideways scrolling on a laptop is a poor way to read a day, and it treats a
  content decision as a CSS problem.
- **Two genuinely separate programmes (hard tabs).** Cleanest marketing story, but a
  cross-audience clash becomes invisible: someone bookmarking in both tabs cannot see the
  conflict. Rejected on the strength of the unified-agenda requirement.
- **Separate routes** (`/programme/2027/leadership`). Cleanest URLs, but splits the
  agenda's DOM across two documents, which fights the same requirement.

## The shape

**One programme, two lenses.** A view control — peer to the existing grid/list toggle —
scopes which sessions the page shows. It is one page, one agenda, one calendar.

### D-1 — The lens is derived from the track, never the room

A session belongs to the leadership lens because it carries a leadership track, whatever
room it is in. Room-derived membership would break silently the day a leadership keynote
is moved to Monet for capacity, or a technical talk is scheduled into Eiffel: the session
would appear in the wrong lens with no error anywhere.

Nothing is added to `SessionRow`. The lens reads `track`, which is already populated on
both ingestion paths.

**Membership is a configured SET of track names, not a single one** — currently one entry.
A set costs nothing today and avoids a rework if the leadership programme later spans two
tracks, which is likely enough (a "Strategy" and a "Leadership" split, say) that hardcoding
one would be a false economy. The set lives beside the edition data, not in the component.

Consequence, accepted: the technical lens renders whichever rooms its own sessions
occupy — normally four, but five if something technical lands in Eiffel. That is the
honest rendering of an unusual schedule, and it is rare.

### D-2 — The lens is a view, not a filter

It sits beside grid/list, not among the filters, and specifically:

- it does **not** increment the active-filter count;
- **`Clear filters` does not reset it**;
- it does **not** trigger the break-band hiding.

That last point is load-bearing. `schedule-ui.ts:78` hides the break bands whenever any
filter is active. Implemented as "just another filter", switching lens would make lunch
and the coffee breaks disappear — a bug that would read as a styling glitch rather than a
logic error.

Breaks, and any all-room keynote span, appear in **both** lenses. A lens must be a
complete day, not a fragment.

### D-3 — Search must not lie

Search runs across **both** lenses. When matches exist outside the current one, the result
line says so:

> 2 results · **3 more in Strategy & Leadership**

with that phrase acting as a control: it switches lens and keeps the query.

This single affordance repays most of what a lens costs. A lens is a focusing device;
without this it becomes a hiding device, and a CTO searching "gouvernance" from the
technical lens would be told *no results* — true and useless.

### D-4 — Filters adapt to the lens

- **The leadership track leaves the track filter.** Once a track defines the lens,
  offering it again in the dropdown is a trap: selecting it from the technical lens
  yields an empty grid with no explanation.
- **A filter with fewer than two options hides itself.** In the leadership lens the room
  filter would offer only Eiffel — a control that cannot change anything. This also
  quietly improves the 2023 archive, which has fewer rooms.
- **Filter state survives a lens switch where it still applies.** Level and format carry
  across. A room filter for Piaf is dropped on switching to a lens without Piaf, rather
  than silently producing zero results.
- **The result count is lens-scoped**, matching what is on screen. The cross-lens
  remainder is shown separately per D-3 and never folded into the total.

### D-5 — The agenda is where the lenses reunite

One card per session in the DOM (see D-7), so bookmarks are lens-agnostic by
construction — there is no second copy whose state could drift.

**Clash detection lives here, and only here.** A lens hides cross-audience parallelism in
the grid; the agenda is the one surface that can show it. When two bookmarked sessions
overlap, the drawer marks them:

> 10:00 · overlaps with *FinOps sans tableur* (Piaf)

This is what makes the lens safe. Someone planning a mixed day is told about the conflict
at the moment they would act on it, rather than in the corridor.

### D-6 — The calendar is the programme, not the view

`/programme.ics` and the toolbar's export-all keep serving the whole programme. A calendar
file scoped to whichever tab happened to be open is a baffling artifact to find in a
calendar six weeks later. Someone wanting only the leadership sessions bookmarks them and
exports the agenda — which is what the agenda is for.

### D-7 — Implementation: one grid, filtered

Every session is rendered once. Switching lens:

1. toggles `is-hidden` on cards outside the lens — the mechanism the filters already use
   (`schedule-ui.ts:59`);
2. hides room columns left with no visible card and recomputes `--room-count`, so the
   remaining columns expand to fill the width;
3. leaves breaks and all-room spans visible.

The alternative — two server-rendered grids, one hidden — was rejected because keynotes
and breaks appear in both lenses, so those cards would exist twice, giving one session two
bookmark buttons whose state must be kept in sync. That is the same shape as the
speaker-allowlist asymmetry found earlier in this codebase: two copies of one rule, and
they disagreed.

**The leadership lens defaults to the list view.** With Eiffel alone it would otherwise be
a single ~1100px column, which is not a grid. `ScheduleListView` already exists and is
room-count agnostic.

### D-8 — Entry and URL

`/programme/2027` opens on the technical lens. `?audience=leadership` opens on the other,
so marketing can link CTOs directly. The control is visible in both, so nobody is trapped.

Canonical stays the bare path; the lens is a view of one page, not a second document.

### D-9 — Other editions, and why no feature flag

**The control is absent, not disabled, for editions with no leadership sessions.** This is
derived, not configured: an edition with sessions in the leadership track has two lenses
and a control; every other edition has one lens and no control. It appears automatically
for 2027, would appear for any future edition adopting the track, and never for 2023 or
2026. `?audience=leadership` on an edition without it is ignored — no 404, no empty grid.

**No feature flag is added.** The lens renders only for an edition with leadership
sessions — 2027 — and a production build cannot load 2027 at all until the `programme`
flag opens (see `2026-09-02-edition-2027-preview-design.md`). It is therefore
staging-only by construction. A second switch would be one more thing to keep in step with
the one that already works.

### D-10 — Room order

`ROOM_ORDER` in `src/lib/schedule.ts:116` is `["Monet", "Piaf", "Debussy", "Dumas"]` — the
physical floor layout, not alphabetical. Rooms absent from it sort alphabetically *after*
the known set, so Eiffel must be added or it lands last by accident rather than by choice.

**Decision: append Eiffel after Dumas**, pending confirmation of the venue layout. It
normally appears alone in its own lens, so its position only matters when a technical
session is scheduled there. One line to change if the floor says otherwise.

## Data prerequisite

The leadership track does not yet exist in Pretalx: the 2027 event has five tracks
(Infrastructure et opérations, Developer Experience, IA et Data, Réseau et sécurité,
Autres sujets et crazy stuff). An organiser must create the leadership track and assign
the relevant proposals to it. Room Eiffel must also exist and be scheduled into.

Until both exist, the code is inert: no edition has leadership sessions, so no control
renders. The implementation can therefore land before the content does.

## Testing

- **Unit** — lens membership from track; column recount; filter-option pruning;
  cross-lens search counting; clash detection over overlapping bookmarks.
- **Build guards** (`tests/build/`) — the control is absent on 2023 and 2026 and present
  on 2027; breaks and all-room spans appear in both lenses; `Clear filters` does not
  change the lens; `?audience=leadership` on an edition without the track renders the
  normal programme.
- **Regression** — a bookmark made in one lens is present in the agenda after switching,
  which is the property approach A exists to guarantee.

## Out of scope

- Any change to how 2026 or 2023 render.
- Horizontal scrolling or a minimum column width — superseded by the lens.
- Per-audience ICS feeds (D-6).
- Marketing copy for the leadership programme.
