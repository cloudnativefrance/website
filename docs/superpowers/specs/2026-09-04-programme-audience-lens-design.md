# Design spec — Programme: an audience lens for 2027

**Date:** 2026-09-04
**Status:** Implemented — PR #53. Revised 2026-09-04 to match what shipped; the
revisions are marked in the decisions they touch and listed under *Changes after
implementation* at the end.
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

That last point is load-bearing. `apply()` in `schedule-ui.ts` hides the break bands whenever any
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

**The remainder counts what the click will deliver, not what the query matches.** These
are different numbers as soon as a filter is active, and the difference makes the control
lie: filter `level=advanced`, search "gouvernance", and a query-only count offers two more
in the other lens; the switch keeps the level filter — the target lens can honour it, so
it is not dropped — and renders *no sessions*. The one affordance that exists to rescue a
fruitless search would deliver an empty page.

So the count applies the query **and** the selections the target lens can honour, dropping
the ones it cannot exactly as the switch itself will (D-4). Promise and delivery are
computed by the same rule.

Two things it never counts:

- **Sessions already on screen**, which is every keynote — a keynote belongs to both
  lenses, so offering to switch lens to reach one would send the visitor away from a
  session they are looking at.
- **Anything, when the search box is empty.** An empty search is not a search. Without
  that guard the line would permanently announce that the other lens also has sessions,
  which is noise rather than information.

### D-4 — Filters adapt to the lens

- **The leadership track leaves the track filter.** Once a track defines the lens,
  offering it again in the dropdown is a trap: selecting it from the technical lens
  yields an empty grid with no explanation.
- **A filter with fewer than two options hides itself.** In the leadership lens the room
  filter would offer only Eiffel — a control that cannot change anything.

  **Only on an edition that has a lens.** The parenthetical this decision originally
  carried — that it would "quietly improve the 2023 archive" — is not implemented, and
  deliberately so: it contradicts this spec's own *Out of scope* line, "any change to how
  2026 or 2023 render". A single-audience edition prunes nothing and keeps every facet it
  has today.
- **A lens switch never loses a selection.** Level and format carry across unchanged. A
  room filter for Piaf is *not applied* in a lens without Piaf — it would otherwise
  produce zero results with no visible cause, since the chip that explains it has just
  been hidden — but it is not forgotten either: switch back and it is in force again.

  This distinction is the whole of it. What the visitor **asked for** and what is
  **currently applied** are two different things; the lens narrows the second and never
  touches the first. Deleting the selection outright, which is what "dropped" was first
  taken to mean, made a round trip through the other lens silently clear the filters
  someone had set — a *view* control quietly destroying state, which is exactly what D-2
  says a lens must not be.

  The active-filter badge counts what is applied, not what was asked for, so it keeps
  telling the truth about the page in front of you.
- **The result count is lens-scoped on both sides of the fraction**, matching what is on
  screen. The numerator is the sessions this lens is showing; the denominator is the
  sessions this lens *has*, not the edition's total. Scoping only the numerator reads as
  "6 of 51 sessions" with no filter active — an assertion that 45 sessions are filtered
  out when none are. The cross-lens remainder is shown separately per D-3 and never
  folded into either number.

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

1. toggles **`is-audience-hidden`** on cards outside the lens — a *second* class, not the
   filters' own `is-hidden`. The two axes must compose; sharing one class would let
   whichever ran last clobber the other, so switching lens would silently clear an active
   filter;
2. hides the room columns left with no visible card, **renumbers the survivors**, and
   recomputes `--room-count`, so the remaining columns expand to fill the width;
3. leaves breaks and all-room spans visible.

**Renumbering is not optional, and this is the part that is easy to get wrong.** The
grid's two halves are placed differently: the head auto-places one cell per room and
reflows by itself, but the body pins every cell to an explicit `grid-column` computed
server-side. So hiding a room's cards is not enough — the emptied cell keeps its track —
and shrinking `--room-count` alone strands the survivors on column numbers that no longer
exist. A room that survives while an earlier one drops out has to *move left*.

The alternative — two server-rendered grids, one hidden — was rejected because keynotes
and breaks appear in both lenses, so those cards would exist twice, giving one session two
bookmark buttons whose state must be kept in sync. That is the same shape as the
speaker-allowlist asymmetry found earlier in this codebase: two copies of one rule, and
they disagreed.

**A lens showing one room renders as a list.** With Eiffel alone the grid would otherwise
be a single ~1100px column, which is not a grid. `ScheduleListView` already exists and is
room-count agnostic.

Derived from the room count, not hardcoded to the leadership lens: a technical lens that
ever narrows to one room gets the same treatment, and a leadership programme that grows to
two rooms gets a grid without anyone remembering to change this.

**It constrains what is rendered, never what the visitor chose.** The page already draws
that distinction for the `max-width: 767px` breakpoint, where the grid does not exist: a
stored *grid* preference survives being shown a list on a phone. A one-room lens is a
second reason a grid cannot be drawn, so it joins the first rather than pretending to be a
click — writing the view preference would mean opening the leadership lens once
permanently overwrote a choice the visitor made.

**And the grid/list toggle hides while the lens forces the list**, exactly as it already
does below 767px. A control that reports success and changes nothing is worse than an
absent one: without this, clicking *Grille* in the leadership lens turned the button
primary, set `aria-pressed="true"`, wrote the preference — and left the page in list view.

### D-8 — Entry and URL

`/programme/2027` opens on the technical lens. `?audience=leadership` opens on the other,
so marketing can link CTOs directly. The control is visible in both, so nobody is trapped.

An unrecognised value — `?audience=banana`, or the parameter on an edition with one
audience — resolves to the technical lens and the parameter is removed from the URL.

Canonical stays the bare path; the lens is a view of one page, not a second document. The
technical lens therefore **deletes** the parameter rather than writing `?audience=tech`,
and switching uses `replaceState`, not `pushState` — toggling a view four times must not
cost four presses of Back to leave the page.

### D-9 — Other editions, and why no feature flag

**The control is absent, not disabled, for editions with no leadership sessions.** This is
derived, not configured: an edition with sessions in the leadership track has two lenses
and a control; every other edition has one lens and no control. It appears automatically
for 2027, would appear for any future edition adopting the track, and never for 2023 or
2026. `?audience=leadership` on an edition without it is ignored — no 404, no empty grid.

**An edition with one audience applies no lens at all.** Not "applies the technical lens":
none. The difference is invisible today and total the year someone runs a leadership-only
track day — with no control rendered, booting into the technical lens would hide every
session on the page and leave nothing to escape with.

**No feature flag is added.** The lens renders only for an edition with leadership
sessions — 2027 — and a production build cannot load 2027 at all until the `programme`
flag opens (see `2026-09-02-edition-2027-preview-design.md`). It is therefore
staging-only by construction. A second switch would be one more thing to keep in step with
the one that already works.

### D-10 — Room order

`ROOM_ORDER` in `src/lib/schedule.ts` was `["Monet", "Piaf", "Debussy", "Dumas"]` — the
physical floor layout, not alphabetical. Rooms absent from it sort alphabetically *after*
the known set, so Eiffel must be added or it lands last by accident rather than by choice.

**Decision: append Eiffel after Dumas**, pending confirmation of the venue layout. It
normally appears alone in its own lens, so its position only matters when a technical
session is scheduled there. One line to change if the floor says otherwise.

Eiffel already exists as a room in the 2027 Pretalx event — verified against the live API —
so nothing is outstanding here beyond that confirmation.

## Data prerequisite

The leadership track does not yet exist in Pretalx: the 2027 event has five tracks
(Infrastructure et opérations, Developer Experience, IA et Data, Réseau et sécurité,
Autres sujets et crazy stuff). An organiser must create the leadership track and assign
the relevant proposals to it. **Room Eiffel already exists** in the 2027 event — verified
against the live API — so only the track is outstanding.

### The track's name must match exactly, and in French

`LEADERSHIP_TRACKS` in `src/lib/audience.ts` holds the literal string

> `Strategy & Leadership`

and the track's **French** name must equal it. 2027 is a preview-access edition, so its
sessions come through `src/lib/pretalx-preview.ts`, which resolves
`track: localised(submission.track?.name)`, and `localised` (`pretalx-preview-api.ts`)
returns the `fr` field first. So it is the French name that reaches `SessionRow.track`.

`audienceOf` folds case and accents, so `STRATEGY & LEADERSHIP` or a stray accent still
matches. A *different name* does not: "Stratégie & Leadership", "Leadership", or
"Strategy and Leadership" would all leave `hasBothAudiences` false.

**This is the feature's most likely operational failure, and it is silent.** A mismatched
name renders no control, ignores `?audience=leadership`, and reports no error anywhere —
the page simply looks like an edition with one audience, which is a legitimate state. If
the lens does not appear once the track exists, check this string first.

Until both exist, the code is inert: no edition has leadership sessions, so no control
renders. The implementation can therefore land before the content does.

## Testing

**There is no DOM test environment, and none is added.** Both vitest projects run
`environment: "node"`; jsdom and happy-dom are not installed. That constraint shapes the
whole implementation rather than being worked around: everything worth testing is a pure
function over plain data in `src/lib/lens.ts`, and the DOM half is a thin loop that reads
attributes and toggles classes. It is the split this codebase already uses for
`resolveEditionLoadable`/`isEditionLoadable`.

- **Unit** (`src/lib/__tests__/`) — lens membership from track; column renumbering;
  filter-option pruning; the cross-lens count including its facet-awareness, its keynote
  exclusion and its empty-query guard; clash detection over overlapping bookmarks;
  placeholder substitution.
- **Component** (`src/components/schedule/__tests__/`, Astro's container API) — the
  control is absent for a one-audience edition and present for a two-audience one, tested
  by *rendering*, since "absent, not disabled" is a property of output that no source grep
  can distinguish from a call that is present but gates nothing.
- **Build guards** (`tests/build/`) — the control is absent from the built 2023 and 2026
  pages; `Clear filters` does not reset the lens; the lens never enters `FilterState`; the
  prune runs before the filters re-apply; both halves of the hiding CSS exist.
- **Manual, in a browser** — the DOM behaviour the guards above can only approximate:
  that the toggle disappears and returns, that a stored view choice survives a round trip,
  that focus lands somewhere sensible, that the columns actually renumber.

**A guard is not trusted until it has been seen to fail.** Every source-shape assertion
here was proven by breaking the thing it guards, watching it go red, restoring it, and
watching it go green. This was learned the hard way: seven guards written for this feature
looked correct and could not fail — one asserted an attribute that a different element
also carried, one asserted a string absent from markup that HTML-escapes it, one compared
`indexOf` positions that landed on an import and a function declaration. A guard that
cannot fail is worse than no guard, because it reports coverage that does not exist.

## Out of scope

- Any change to how 2026 or 2023 render. This is why the single-option facet hiding in
  D-4 applies only to editions that have a lens.
- Horizontal scrolling or a minimum column width — superseded by the lens.
- Per-audience ICS feeds (D-6).
- Marketing copy for the leadership programme.
- Translating the lens's own name. `schedule.audience.leadership` is the same literal in
  both locales because it is the Pretalx track's name, pinned identically in
  `LEADERSHIP_TRACKS`; translating the label would leave the control naming something the
  programme does not contain. Renaming the track means changing both together.

---

## Changes after implementation

Recorded so the spec and the code do not diverge silently. Each was found by review or by
running the thing; none changes the shape of the design.

| Decision | What changed, and why |
|---|---|
| **D-3** | The remainder counts *what the click delivers*, not what the query matches. With a filter active the two differ, and the control was promising results the switch then filtered away. It also never counts a keynote (on screen in both lenses) and returns zero for an empty query. |
| **D-4** | "A filter with fewer than two options hides itself" applies **only** to editions that have a lens; the original parenthetical about improving the 2023 archive contradicted this spec's own *Out of scope*. "Filter state survives where it still applies" was implemented as *deleting* the selection, which made a round trip through the other lens clear the visitor's filters — now the intent is kept and only what is *applied* narrows. The result count is lens-scoped on **both** sides of the fraction; scoping only the numerator read as "6 of 51 sessions" with nothing filtered. |
| **D-7** | The column **renumbering** requirement was implicit and is now stated: the grid body is placed explicitly, so hiding a room strands the survivors unless they move left. The list fallback is derived from the room count rather than hardcoded to the leadership lens, must not write the visitor's view preference, and hides the grid/list toggle while it is in force. |
| **D-8** | Unknown parameter values resolve to the technical lens and are stripped; the technical lens deletes the parameter rather than writing `?audience=tech`; switching uses `replaceState`. |
| **D-9** | A one-audience edition applies **no** lens, rather than defaulting to the technical one — which would blank an all-leadership edition with no control to escape with. |
| **D-10** | Eiffel confirmed to exist in the 2027 Pretalx event. |
| **Testing** | Rewritten around the constraint that there is no DOM test environment, and around the rule that a guard is not trusted until it has been seen to fail. |
| **Out of scope** | The lens's own name is deliberately untranslated in both locales — it mirrors the Pretalx track name. |
