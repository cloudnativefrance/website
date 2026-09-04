# Programme audience lens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the 2027 programme be viewed through two audience lenses — technical and leadership — as one page, one agenda, one calendar.

**Architecture:** A session's lens is derived from its track. Every session is rendered once; a view control toggles `is-hidden` on cards outside the lens, hides room columns left empty, and recomputes `--room-count` so the remaining columns expand. The lens is a *view*, peer to grid/list — not a filter — so it never touches the active-filter count, `Clear filters`, or the break bands.

**Tech Stack:** Astro 5 components, vanilla TS (`schedule-ui.ts`), CSS grid, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-programme-audience-lens-design.md` — read it, especially D-2 (why the lens is not a filter) and D-7 (why one grid, not two).

## Global Constraints

- **The lens is a view, not a filter.** It must not increment `activeFilterCount`, must not be reset by `Clear filters`, and must not trigger break-band hiding (`schedule-ui.ts:78` hides bands when any filter is active — that is the trap).
- **Breaks and all-room keynote spans appear in BOTH lenses.** A lens is a complete day, not a fragment.
- **Membership derives from `track`, never from `room`**, and is a configured **set** of track names.
- **One card per session in the DOM.** Two copies would give one session two bookmark buttons whose state must be synchronised.
- Editions with no leadership sessions render exactly as today, with **no control at all** — absent, not disabled.
- Bilingual: every string comes from `src/i18n/ui.ts` with FR **and** EN entries; `i18n-parity.test.ts` enforces it.
- **There is NO DOM test environment.** Both vitest projects are `environment: "node"`; jsdom and happy-dom are not installed and must not be added. Anything worth testing therefore lives as a pure function over plain data in `src/lib/`, with a thin DOM wrapper that only reads attributes and toggles classes — the idiom already used by `resolveEditionLoadable`/`isEditionLoadable` and `getFlagState`/`isFlagActive`. Guard the wrapper by source shape in `tests/build/` if it needs guarding at all.
- Conventional commits, English. Never co-author; no attribution lines.
- No `git commit --amend`, no `git reset --hard`.
- Baseline: `pnpm test` 57 files / 695 tests green; `pnpm exec astro check` 0 errors / 0 warnings; `pnpm build` 374 pages. Two build-artifact tests read `dist/`, so run `pnpm build` before judging them.

## Existing machinery to reuse (do not reinvent)

| Symbol | Location |
|---|---|
| `apply()`, `state` (the DOM plumbing) | `src/components/schedule/schedule-ui.ts` |
| `FilterState`, `facetMatches`, `activeFilterCount`, `normalise` (the pure semantics, shared with the server render) | `src/lib/schedule-filter.ts` |
| `is-hidden` per card; container hidden when it has no visible card | `schedule-ui.ts:59,66` |
| `--room-count` set server-side from `rooms.length` | `ScheduleGridView.astro:53` |
| Grid **body** cells placed explicitly: `grid-column:${i + 2}` | `ScheduleGridView.astro:95` |
| Grid **head** cells auto-placed, one per room | `ScheduleGridView.astro:56` |
| `listRooms`, `listTracks`, `ROOM_ORDER` | `src/lib/schedule.ts` |
| Card attributes: `data-session-id`, `data-room`, `data-format`, `data-track`, `data-level`, `data-start`, `data-duration`, `data-search` | `SessionCard.astro` |

---

### Task 1: The audience model, and Eiffel in the room order

**Files:**
- Create: `src/lib/audience.ts`
- Modify: `src/lib/schedule.ts:116` (`ROOM_ORDER`)
- Test: `src/lib/__tests__/audience.test.ts` (create)

**Interfaces:**
- Produces:
  ```ts
  export type Audience = "tech" | "leadership";
  export const LEADERSHIP_TRACKS: readonly string[];
  export function audienceOf(track: string): Audience;
  export function hasBothAudiences(sessions: readonly { track: string }[]): boolean;
  ```

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/audience.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { audienceOf, hasBothAudiences, LEADERSHIP_TRACKS } from "@/lib/audience";

const tech = (track: string) => ({ track });

describe("audienceOf", () => {
  it("maps a leadership track to the leadership audience", () => {
    expect(audienceOf(LEADERSHIP_TRACKS[0])).toBe("leadership");
  });

  it("maps every other track, and the empty track, to tech", () => {
    expect(audienceOf("Infrastructure et opérations")).toBe("tech");
    expect(audienceOf("")).toBe("tech");
  });

  it("is case- and accent-insensitive, so a Pretalx rename does not silently reclassify", () => {
    expect(audienceOf(LEADERSHIP_TRACKS[0].toUpperCase())).toBe("leadership");
  });
});

describe("hasBothAudiences", () => {
  it("is false when every session is technical", () => {
    expect(hasBothAudiences([tech("IA et Data"), tech("Developer Experience")])).toBe(false);
  });

  it("is false when there are no sessions at all", () => {
    expect(hasBothAudiences([])).toBe(false);
  });

  it("is false when EVERY session is leadership — one lens, so no control", () => {
    expect(hasBothAudiences([tech(LEADERSHIP_TRACKS[0])])).toBe(false);
  });

  it("is true only when both audiences are present", () => {
    expect(hasBothAudiences([tech("IA et Data"), tech(LEADERSHIP_TRACKS[0])])).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test audience`
Expected: FAIL — cannot resolve `@/lib/audience`.

- [ ] **Step 3: Implement**

Create `src/lib/audience.ts`:

```ts
/**
 * Which audience a session belongs to.
 *
 * Derived from the TRACK, never the room. Room-derived membership breaks
 * silently the day a leadership keynote is moved to a bigger room for capacity,
 * or a technical talk is scheduled into Eiffel: the session lands in the wrong
 * lens with no error anywhere. The track follows the session wherever it goes.
 *
 * A SET of track names rather than one, currently holding a single entry. A set
 * costs nothing today and avoids a rework if the leadership programme later
 * splits (a "Strategy" and a "Leadership" track, say).
 */
export type Audience = "tech" | "leadership";

/**
 * Track names that place a session in the leadership lens.
 *
 * Must match the track name as Pretalx serves it. Compared accent- and
 * case-insensitively so a cosmetic rename in Pretalx does not silently move
 * every leadership session into the technical lens — which would look like a
 * scheduling error rather than a configuration one.
 */
export const LEADERSHIP_TRACKS: readonly string[] = ["Strategy & Leadership"];

function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

const LEADERSHIP_FOLDED = new Set(LEADERSHIP_TRACKS.map(fold));

export function audienceOf(track: string): Audience {
  return LEADERSHIP_FOLDED.has(fold(track)) ? "leadership" : "tech";
}

/**
 * Whether an edition has both audiences, and therefore needs the control.
 *
 * False for an edition that is entirely one or the other — including a
 * hypothetical all-leadership edition. One lens means no choice to offer, and
 * an absent control is better than a control with one option.
 */
export function hasBothAudiences(sessions: readonly { track: string }[]): boolean {
  let tech = false;
  let leadership = false;
  for (const s of sessions) {
    if (audienceOf(s.track) === "leadership") leadership = true;
    else tech = true;
    if (tech && leadership) return true;
  }
  return false;
}
```

- [ ] **Step 4: Add Eiffel to the room order**

`src/lib/schedule.ts:116` — `ROOM_ORDER` is the physical floor layout, not alphabetical. Rooms absent from it sort alphabetically *after* the known set, so Eiffel would land last by accident rather than by choice:

```ts
const ROOM_ORDER = ["Monet", "Piaf", "Debussy", "Dumas", "Eiffel"];
```

- [ ] **Step 5: Run tests**

Run: `pnpm test audience && pnpm exec astro check`
Expected: PASS, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/audience.ts src/lib/__tests__/audience.test.ts src/lib/schedule.ts
git commit -F - <<'MSG'
feat(schedule): derive a session's audience from its track

The 2027 edition adds a leadership track and the Eiffel room. Membership comes
from the track, not the room: a leadership keynote moved to Monet for capacity
must stay in the leadership lens, and a technical talk scheduled into Eiffel
must not join it.

The track set holds one entry today. A set rather than a constant because a
later split into "Strategy" and "Leadership" is plausible enough that hardcoding
one would be a false economy.

Eiffel joins ROOM_ORDER, which is the floor layout — without it the room sorts
alphabetically after the known four, last by accident rather than by choice.
MSG
```

---

### Task 2: Render the control, and make columns addressable

**Files:**
- Modify: `src/components/schedule/SessionCard.astro`
- Modify: `src/components/schedule/ScheduleGrid.astro`
- Modify: `src/components/schedule/ScheduleToolbar.astro`
- Modify: `src/components/schedule/ScheduleGridView.astro`
- Modify: `src/i18n/ui.ts` (FR + EN)
- Modify: `src/components/schedule/__tests__/ScheduleGridView.test.ts` (its cell regex — see Step 4)
- Test: `src/components/schedule/__tests__/ScheduleToolbar.test.ts` (extend)
- Test: `tests/build/audience-lens.test.ts` (create)

**Interfaces:**
- Consumes: `hasBothAudiences`, `audienceOf` from Task 1.
- Produces: `data-audience="tech|leadership"` on every `.session-card`; `data-room="<name>"` on every `.grid-view-room` header cell **and every `.grid-view-cell`**; a control with `data-audience-switch` and buttons carrying `data-audience`; `data-has-audiences` on `[data-schedule-root]`.

**Why both, and why the cells matter.** The two halves of the grid are placed
differently, and this is the trap the lens has to clear:

| | Placement | Effect of hiding a room |
|---|---|---|
| `.grid-view-head` | auto — one `<div>` per room, in order | survivors reflow into columns 2…n by themselves |
| `.grid-view-body` | **explicit** — `grid-column:${i + 2}` computed server-side (`ScheduleGridView.astro:95`) | survivors keep column numbers that may no longer exist |

So hiding cards alone is not enough twice over: the `.grid-view-cell` wrapper
keeps occupying its track even when every card inside it is hidden, and once
`--room-count` shrinks, a cell pinned to `grid-column:6` in a four-column grid
lands in an implicit track. The client must therefore hide the *cells* and
**renumber** the survivors — which it can only do if each cell says which room
it is. Task 3 owns the renumbering; this task makes it addressable.

- [ ] **Step 1: Write the failing test**

Create `tests/build/audience-lens.test.ts`:

```ts
/**
 * Source-shape guards for the audience lens.
 *
 * The lens is a VIEW, not a filter. The distinction is not cosmetic:
 * schedule-ui.ts hides the break bands whenever a filter is active, so a lens
 * implemented as a filter makes lunch and the coffee breaks vanish on switch —
 * which reads as a styling glitch, not a logic error.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

describe("audience lens markup", () => {
  it("cards carry their audience", () => {
    expect(read("src/components/schedule/SessionCard.astro")).toMatch(/data-audience=/);
  });

  it("grid header cells carry their room, so a column can be hidden", () => {
    const src = read("src/components/schedule/ScheduleGridView.astro");
    const head = src.slice(src.indexOf("grid-view-head"), src.indexOf("grid-view-body"));
    expect(head).toMatch(/data-room=/);
  });

  it("the control sits with the view toggle, not among the filters", () => {
    const src = read("src/components/schedule/ScheduleToolbar.astro");
    const switchAt = src.indexOf("data-audience-switch");
    const filtersAt = src.indexOf("schedule-filter-clear");
    expect(switchAt).toBeGreaterThan(-1);
    expect(switchAt).toBeLessThan(filtersAt);
  });
});
```

**And the control's presence is pinned by RENDERING, not by grepping.** Spec D-9
says the control is *absent, not disabled* for an edition with one audience —
a property of the output, which a regex for `hasBothAudiences` in the source
cannot tell apart from the call being there but not gating anything. This repo
already renders `.astro` components in tests through Astro's container API
(the `astro-components` vitest project, `src/components/**/__tests__/*.test.ts`).
Extend `src/components/schedule/__tests__/ScheduleToolbar.test.ts`, reusing its
existing `row()` helper and `AstroContainer` setup:

```ts
describe("ScheduleToolbar — the audience control", () => {
  const renderWith = async (list: SessionRow[]) => {
    const container = await AstroContainer.create();
    return container.renderToString(ScheduleToolbar, {
      props: { sessions: list, lang: "fr", defaultView: "grid" },
    });
  };

  it("is absent — not disabled — when every session is one audience", async () => {
    const html = await renderWith([row({ track: "Cloud Native" })]);
    expect(html).not.toContain("data-audience-switch");
  });

  it("appears when an edition has sessions in both audiences", async () => {
    const html = await renderWith([
      row({ id: "A", track: "Cloud Native" }),
      row({ id: "B", track: "Strategy & Leadership", room: "Eiffel" }),
    ]);
    expect(html).toContain("data-audience-switch");
    expect(html).toContain('data-audience="leadership"');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test audience-lens`
Expected: FAIL — no `data-audience` in `SessionCard.astro`.

- [ ] **Step 3: Stamp the audience on each card**

In `src/components/schedule/SessionCard.astro`, import `audienceOf` and add the attribute beside the existing `data-track`:

```astro
data-audience={audienceOf(session.track)}
```

- [ ] **Step 4: Make columns addressable, head and body**

In `ScheduleGridView.astro`, add the room name in both places. The header cell:

```astro
<div class="grid-view-room" data-room={room}>{room}</div>
```

and the body cell, whose explicit `grid-column` the client will have to rewrite:

```astro
<div
  class="grid-view-cell"
  data-room={room}
  style={`grid-column:${i + 2}; grid-row:${start} / ${end};`}
>
```

Leave the server-rendered `grid-column` exactly as it is — it is the correct
value for the unfiltered page, which is what a visitor with JavaScript disabled
gets.

**This markup change breaks an existing test — fix it in the same commit.**
`src/components/schedule/__tests__/ScheduleGridView.test.ts` slices the rendered
row with a regex that requires `class` and `style` to be *adjacent*:

```ts
/<div class="grid-view-cell" style="grid-column:(\d+); grid-row:(\d+) \/ (\d+);"[^>]*>/g
```

Astro emits attributes in source order, so inserting `data-room` between them
makes that regex match nothing and `cellsByColumn` returns an empty map — the
suite fails with a confusing "expected Map(0)". Relax the regex to tolerate any
attribute order rather than quietly placing `data-room` last and depending on
source order:

```ts
/<div class="grid-view-cell"[^>]*style="grid-column:(\d+); grid-row:(\d+) \/ (\d+);"[^>]*>/g
```

That test pins the *server-rendered* columns, which this task does not change —
it must still pass, unchanged in intent. If any of its assertions fail on
values rather than on parsing, stop and report: it means the markup edit changed
placement, which it must not.

Then extend it with the new attribute, using its own `renderGrid` helper:

```ts
  it("labels each room cell with its room, so the lens can renumber columns", async () => {
    const html = await renderGrid([
      row({ id: "A", room: "Monet" }),
      row({ id: "B", room: "Piaf" }),
    ]);
    expect(html).toContain('data-room="Monet"');
    expect(html).toContain('data-room="Piaf"');
  });
```

- [ ] **Step 5: Render the control**

In `ScheduleToolbar.astro`, import `hasBothAudiences` from `@/lib/audience` and render the segmented control **beside the existing grid/list view toggle**, before the filter block. Render nothing when `!hasBothAudiences(sessions)` — absent, not disabled:

```astro
{hasBothAudiences(sessions) && (
  <div class="audience-switch" data-audience-switch role="group" aria-label={t("schedule.audience.label")}>
    <button type="button" data-audience="tech" aria-pressed="true">{t("schedule.audience.tech")}</button>
    <button type="button" data-audience="leadership" aria-pressed="false">{t("schedule.audience.leadership")}</button>
  </div>
)}
```

Style it to match the existing view toggle exactly — same height, radius, active treatment. Read the grid/list toggle's markup and classes and mirror them rather than inventing a second visual language for a control that sits beside it.

- [ ] **Step 6: Expose the flag to the client**

In `ScheduleGrid.astro`, add to the `[data-schedule-root]` element so `schedule-ui.ts` can tell whether a lens exists at all:

```astro
data-has-audiences={hasBothAudiences(sessions) ? "true" : "false"}
```

- [ ] **Step 7: Add the i18n keys, both locales**

`src/i18n/ui.ts`:

```ts
// fr
"schedule.audience.label": "Public",
"schedule.audience.tech": "Technique",
"schedule.audience.leadership": "Strategy & Leadership",
"schedule.audience.more_results": "{n} de plus dans {lens}",
// en
"schedule.audience.label": "Audience",
"schedule.audience.tech": "Technical",
"schedule.audience.leadership": "Strategy & Leadership",
"schedule.audience.more_results": "{n} more in {lens}",
```

The lens name stays untranslated in both — it is the track's name in Pretalx and the label the organisers market it under.

- [ ] **Step 8: Run tests and build**

Run: `pnpm test && pnpm build`  — the whole suite, because this task edits an
existing container test; a filtered run would hide a regression in it.
Expected: PASS; 374 pages. The control renders nowhere yet — 2027 has no leadership sessions, so `hasBothAudiences` is false everywhere. That is correct and is what Task 6's guard pins.

- [ ] **Step 9: Commit**

```bash
git add src/components/schedule/ src/i18n/ui.ts tests/build/audience-lens.test.ts
git commit -F - <<'MSG'
feat(schedule): render the audience control and make columns addressable

Cards get `data-audience`, header cells and body cells get `data-room`, and the
root says whether a lens exists at all. Nothing switches yet — this is the
surface the client script will act on.

The body cells matter more than they look: the grid head auto-places and
reflows on its own, but the body pins every cell to an explicit `grid-column`
computed server-side. Hiding a room therefore has to renumber the survivors,
and it can only do that if each cell says which room it is.

ScheduleGridView.test.ts parsed cells by requiring `class` and `style` to be
adjacent attributes; its regex is relaxed to tolerate the new one. The columns
it pins are unchanged.
MSG
```

---

### Task 3: Apply the lens client-side

**Files:**
- Create: `src/lib/lens.ts`
- Create: `src/components/schedule/schedule-ui-audience.ts`
- Modify: `src/components/schedule/schedule-ui.ts`
- Modify: `src/components/schedule/ScheduleGridView.astro` (the `.is-audience-hidden` rule)
- Test: `src/lib/__tests__/lens.test.ts` (create)

**Interfaces:**
- Consumes: `data-audience` on cards, `data-room` on header cells, `data-has-audiences` on the root.
- Produces, in `src/lib/lens.ts` (pure, node-testable):
  ```ts
  export interface LensCard { id: string; room: string; format: string; audience: Audience }
  export interface LensResult {
    hiddenIds: Set<string>;
    hiddenRooms: Set<string>;
    /** Room name -> its 1-based position among the rooms still visible. */
    columnOf: Map<string, number>;
    roomCount: number;
  }
  export function resolveLens(cards: readonly LensCard[], rooms: readonly string[], audience: Audience): LensResult;
  ```
  plus a thin DOM wrapper `applyAudience(root, audience): number` in
  `src/components/schedule/schedule-ui-audience.ts`.
- Produces, module-local in `schedule-ui.ts` and called by name in Tasks 4, 5 and 6
  (defined in Step 5c): `audience`, `lensForcesList`, `otherAudience(a)`,
  `lensLabel(a)`, `lensCards()`, `setAudience(next)`.

**Why the split.** There is NO DOM test environment in this repo — both vitest
projects are `environment: "node"`, jsdom and happy-dom are not installed, and no
existing test touches `document`. Rather than add one, the policy lives in a pure
function over plain data and the wrapper is a loop that reads attributes and
toggles classes. That is this codebase's established idiom (`resolveEditionLoadable`
and `isEditionLoadable`; `getFlagState` and `isFlagActive`) — the decision is
tested, the DOM plumbing is guarded by source shape.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/lens.test.ts` — plain data, no DOM:

```ts
import { describe, it, expect } from "vitest";
import { resolveLens, type LensCard } from "@/lib/lens";

const ROOMS = ["Monet", "Piaf", "Eiffel"];
const cards: LensCard[] = [
  { id: "A", room: "Monet",  format: "talk",    audience: "tech" },
  { id: "B", room: "Eiffel", format: "talk",    audience: "leadership" },
  { id: "K", room: "",       format: "keynote", audience: "tech" },
];

describe("resolveLens", () => {
  it("hides cards outside the lens", () => {
    const r = resolveLens(cards, ROOMS, "tech");
    expect(r.hiddenIds.has("B")).toBe(true);
    expect(r.hiddenIds.has("A")).toBe(false);
  });

  it("keeps an all-room keynote visible in BOTH lenses", () => {
    for (const lens of ["tech", "leadership"] as const) {
      expect(resolveLens(cards, ROOMS, lens).hiddenIds.has("K")).toBe(false);
    }
  });

  it("hides a room with nothing in the lens", () => {
    const r = resolveLens(cards, ROOMS, "tech");
    expect(r.hiddenRooms.has("Eiffel")).toBe(true);
    expect(r.hiddenRooms.has("Piaf")).toBe(true);   // empty in every lens
    expect(r.hiddenRooms.has("Monet")).toBe(false);
  });

  it("counts the rooms that remain, which is what widens the columns", () => {
    expect(resolveLens(cards, ROOMS, "tech").roomCount).toBe(1);
    expect(resolveLens(cards, ROOMS, "leadership").roomCount).toBe(1);
  });

  it("renumbers the surviving rooms from 1, keeping their original order", () => {
    const wide: LensCard[] = [
      { id: "a", room: "Monet",  format: "talk", audience: "tech" },
      { id: "b", room: "Eiffel", format: "talk", audience: "tech" },
    ];
    // Piaf sits BETWEEN them in ROOMS and drops out, so Eiffel must move from
    // column 3 to column 2. Without this the grid pins it to a track that no
    // longer exists.
    const r = resolveLens(wide, ROOMS, "tech");
    expect(r.columnOf.get("Monet")).toBe(1);
    expect(r.columnOf.get("Eiffel")).toBe(2);
    expect(r.columnOf.has("Piaf")).toBe(false);
  });

  it("never reports zero rooms — a grid with no columns has no layout", () => {
    expect(resolveLens([], ROOMS, "tech").roomCount).toBe(1);
  });

  it("says nothing about break bands — they belong to both lenses", () => {
    const r = resolveLens(cards, ROOMS, "leadership");
    expect(r.hiddenIds.has("K")).toBe(false);
    expect(Object.keys(r)).toEqual(["hiddenIds", "hiddenRooms", "roomCount"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test lens`
Expected: FAIL — cannot resolve `@/lib/lens`.

- [ ] **Step 3: Implement the pure part**

Create `src/lib/lens.ts`:

```ts
import type { Audience } from "./audience";

export interface LensCard { id: string; room: string; format: string; audience: Audience }
export interface LensResult {
  hiddenIds: Set<string>;
  hiddenRooms: Set<string>;
  /** Never below 1: a grid with no columns has no layout. */
  roomCount: number;
}

/**
 * Which cards and room columns a lens hides.
 *
 * Pure, over plain data, because this repo has no DOM test environment — both
 * vitest projects are `environment: "node"`. The decision is tested here; the
 * DOM plumbing that applies it is a loop guarded by source shape. Same split as
 * `resolveEditionLoadable` / `isEditionLoadable` and `getFlagState` /
 * `isFlagActive`.
 *
 * Says nothing about break bands, deliberately. They describe the unfiltered
 * day and belong to both lenses — the filter code hides them because narrowing
 * a day makes them meaningless, which scoping it does not.
 */
export function resolveLens(
  cards: readonly LensCard[],
  rooms: readonly string[],
  audience: Audience,
): LensResult {
  const hiddenIds = new Set<string>();
  const roomsInLens = new Set<string>();

  for (const card of cards) {
    // A keynote spans every room and belongs to everyone — the same reasoning
    // the room filter already applies in schedule-ui.ts.
    const isKeynote = card.format === "keynote";
    const show = isKeynote || card.audience === audience;
    if (!show) hiddenIds.add(card.id);
    else if (card.room && !isKeynote) roomsInLens.add(card.room);
  }

  const hiddenRooms = new Set(rooms.filter((r) => !roomsInLens.has(r)));
  // Positions are recomputed, not merely reduced: the grid body places cells
  // with an explicit `grid-column`, so a room that survives while an earlier
  // one drops out must MOVE LEFT. Shrinking `--room-count` alone would pin it
  // to a track the grid no longer has.
  const columnOf = new Map<string, number>();
  for (const room of rooms) {
    if (roomsInLens.has(room)) columnOf.set(room, columnOf.size + 1);
  }
  return { hiddenIds, hiddenRooms, columnOf, roomCount: Math.max(columnOf.size, 1) };
}
```

- [ ] **Step 3b: Implement the thin DOM wrapper**

Create `src/components/schedule/schedule-ui-audience.ts`. It reads attributes,
calls `resolveLens`, and applies the result — no policy of its own:

```ts
import type { Audience } from "@/lib/audience";
import { resolveLens, type LensCard } from "@/lib/lens";

export function applyAudience(root: HTMLElement, audience: Audience): number {
  const els = [...root.querySelectorAll<HTMLElement>(".session-card")];
  const cards: LensCard[] = els.map((el) => ({
    id: el.getAttribute("data-session-id") ?? "",
    room: el.getAttribute("data-room") ?? "",
    format: el.getAttribute("data-format") ?? "",
    audience: (el.getAttribute("data-audience") as Audience) ?? "tech",
  }));
  const heads = [...root.querySelectorAll<HTMLElement>(".grid-view-room")];
  const rooms = heads.map((h) => h.getAttribute("data-room") ?? "");

  const { hiddenIds, hiddenRooms, columnOf, roomCount } = resolveLens(cards, rooms, audience);

  // A SECOND hidden-class, not the filters' `is-hidden`: the two axes must
  // compose. Sharing one class would let whichever ran last clobber the other,
  // so switching lens would silently clear an active filter.
  els.forEach((el, i) => el.classList.toggle("is-audience-hidden", hiddenIds.has(cards[i].id)));
  heads.forEach((h, i) => h.classList.toggle("is-audience-hidden", hiddenRooms.has(rooms[i])));

  // The head auto-places and reflows on its own; the body does not. Hide the
  // out-of-lens cells (an empty cell still occupies its track) and move the
  // survivors to their new column.
  for (const cell of root.querySelectorAll<HTMLElement>(".grid-view-cell")) {
    const room = cell.getAttribute("data-room") ?? "";
    const column = columnOf.get(room);
    cell.classList.toggle("is-audience-hidden", column === undefined);
    // +1 for the 56px time gutter, which is column 1.
    if (column !== undefined) cell.style.gridColumn = String(column + 1);
  }

  root.querySelector<HTMLElement>(".grid-view")
    ?.style.setProperty("--room-count", String(roomCount));
  return roomCount;
}
```

- [ ] **Step 4: Add the CSS**

In `ScheduleGridView.astro`'s `<style>`, beside the existing `.is-hidden` rules:

```css
  /* A second axis, composed with the filters' own `.is-hidden` — see
     schedule-ui-audience.ts for why they cannot share one class. */
  :global(.is-audience-hidden) { display: none !important; }
```

- [ ] **Step 5: Wire it into the toolbar, and scope `apply()` to the lens**

In `schedule-ui.ts`: hold the current lens in a module-level `let audience: Audience = "tech"` — **NOT** in `FilterState`, which `activeFilterCount` and `Clear filters` both read wholesale. Call `applyAudience(root, audience)` before `apply()`, and bind the control's buttons to set the lens, re-run both, and update `aria-pressed`.

Three edits inside `apply()` are load-bearing, because the lens uses a second
class the existing code knows nothing about (`ScheduleGridView.astro:53-56,89-101`
is the markup this reasons over):

1. **The result count is lens-scoped** (spec D-4). A card only joins `visible`
   when it passes the filters *and* is in the lens:

   ```ts
   const inLens = !card.classList.contains("is-audience-hidden");
   const show = facetOk && searchOk;
   card.classList.toggle("is-hidden", !show);   // the filter axis, unchanged
   if (show && inLens) visible.add(card.getAttribute("data-session-id") ?? "");
   ```

   `is-hidden` still tracks the filters alone, so the two axes stay independent
   and a lens switch cannot clear a filter.

2. **The emptiness check must see both axes.** The existing selector is
   `.session-card:not(.is-hidden)`; a row whose only survivor is lens-hidden
   would stay open as a labelled empty band. It becomes:

   ```ts
   const any = container.querySelector(".session-card:not(.is-hidden):not(.is-audience-hidden)");
   ```

3. **`activeFilterCount` must not change** — the lens is not a filter, so it is
   not in `FilterState` and cannot reach that function. This is what keeps the
   break bands alive on a lens switch (`schedule-ui.ts:78`).

- [ ] **Step 5c: Define the lens helpers Tasks 4, 5 and 6 consume**

These are module-local to `schedule-ui.ts` — not exports, not part of any public
interface — but later tasks call them by name, so they are settled here rather
than invented three times:

```ts
let audience: Audience = "tech";

const otherAudience = (a: Audience): Audience => (a === "tech" ? "leadership" : "tech");

const lensLabel = (a: Audience) =>
  a === "leadership"
    ? root.getAttribute("data-schedule-audience-leadership") || "Strategy & Leadership"
    : root.getAttribute("data-schedule-audience-tech") || "Technical";

/** Every card's lens-relevant attributes, read once per call. Cards are static
 *  after render, so there is nothing to cache and nothing to invalidate. */
function lensCards() {
  return [...document.querySelectorAll<HTMLElement>(".session-card")].map((el) => ({
    id: el.getAttribute("data-session-id") ?? "",
    room: el.getAttribute("data-room") ?? "",
    format: el.getAttribute("data-format") ?? "",
    track: el.getAttribute("data-track") ?? "",
    level: el.getAttribute("data-level") ?? "",
    search: el.getAttribute("data-search") ?? "",
    audience: (el.getAttribute("data-audience") as Audience) ?? "tech",
  }));
}

/** The single entry point for changing lens. Everything that reacts to a switch
 *  hangs off this, so a new caller cannot forget half the sequence. */
function setAudience(next: Audience): void {
  audience = next;
  lensForcesList = applyAudience(root, audience) <= 1;
  // Task 5 adds the facet prune here — BEFORE apply().
  renderView();
  apply();
  for (const btn of document.querySelectorAll<HTMLElement>("[data-audience-switch] [data-audience]")) {
    btn.setAttribute("aria-pressed", btn.getAttribute("data-audience") === audience ? "true" : "false");
  }
  // Task 6 adds the URL write here.
}
```

`lensCards()` returns a superset of every shape the pure functions want:
`LensCard` (Task 3), `{audience, search}` (Task 4) and `FacetCard` (Task 5) are
all structurally satisfied by it, so TypeScript accepts it at each call site
without a second traversal or a cast. Later tasks call it as `lensCards()` —
the names `searchCards()` and `facetCards()` appearing in their code blocks mean
this same function; use `lensCards()`.

- [ ] **Step 5b: The leadership lens opens in the list view (spec D-7)**

With Eiffel alone the grid would be a single ~1100px column, which is not a grid. When `applyAudience` returns a visible-room count of **1**, render the list view instead.

Derived from the count, not hardcoded to the leadership lens: a technical lens that ever narrows to one room gets the same treatment, and a leadership programme that grows to two rooms gets a grid without anyone remembering to change this.

**Do NOT call `setView("list")`.** That function is the visitor's *choice*: it writes `preferredView`, `localStorage` and `?view=` in the URL. An automatic fallback is not a choice, and calling it would overwrite the grid preference a visitor set, permanently — switching back to the technical lens would then leave them in the list view they never asked for. `setView("list", false)` is no better: it still mutates `preferredView`, so the preference is gone either way.

`schedule-ui.ts` already draws exactly this distinction and names it (see the comment at `schedule-ui.ts:110-121`): `preferredView` is what the visitor chose and what persists; `renderedView` is what the viewport can actually display. A one-room lens is a second reason the viewport cannot display a grid — the same shape as the `max-width: 767px` case — so add it the same way:

```ts
/** A lens showing one room has no grid to draw. Like `narrow`, this constrains
 *  what is RENDERED without touching what the visitor chose. */
let lensForcesList = false;

function renderView() {
  const renderedView = narrow.matches || lensForcesList ? "list" : preferredView;
  // …unchanged…
}
```

and on every lens switch:

```ts
lensForcesList = applyAudience(root, audience) <= 1;
renderView();
apply();
```

The grid/list buttons keep reflecting `preferredView`, which is what they already do on a phone.

`resolveLens` already reports this; the Task 3 test
`"counts the rooms that remain, which is what widens the columns"` pins it.
Add a source-shape guard in `tests/build/audience-lens.test.ts` that the
wrapper acts on it:

```ts
  it("a lens with one room opens in the list view", () => {
    expect(read("src/components/schedule/schedule-ui.ts")).toMatch(/roomCount|applyAudience\([^)]*\)\s*===?\s*1|<=\s*1/);
  });
```

- [ ] **Step 6: Run tests**

Run: `pnpm test lens audience && pnpm exec astro check`
Expected: PASS, 0 type errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lens.ts src/lib/__tests__/lens.test.ts src/components/schedule/ tests/build/
git commit -F - <<'MSG'
feat(schedule): apply the audience lens and resize the grid

Cards outside the lens get `is-audience-hidden` — a second class, not the
filters' `is-hidden`, because the two axes must compose. Sharing one class would
let whichever ran last clobber the other, so switching lens would silently clear
an active filter.

Break bands are untouched. The filter code hides them because narrowing a day
makes them meaningless; a lens does not narrow the day, it scopes it, and lunch
belongs to both audiences.
MSG
```

---

### Task 4: Search across both lenses

**Files:**
- Modify: `src/lib/lens.ts`
- Modify: `src/components/schedule/schedule-ui.ts`
- Modify: `src/components/schedule/ScheduleGrid.astro` (the three client-side labels)
- Modify: `src/i18n/ui.ts` (FR + EN)
- Test: `src/lib/__tests__/lens.test.ts` (extend)

**Interfaces:**
- Consumes: `normalise` from `@/lib/schedule-filter`.
- Produces:
  ```ts
  export function countMatchesOutsideLens(
    cards: readonly { audience: Audience; search: string }[],
    audience: Audience,
    query: string,
  ): number;
  ```

Without this a CTO searching "gouvernance" from the technical lens is told *no results* — true and useless. The lens becomes a hiding device instead of a focusing one.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/lens.test.ts` — plain data, no DOM:

```ts
import { countMatchesOutsideLens } from "@/lib/lens";

const haystack = [
  { audience: "tech" as const,       search: "ebpf réseau" },
  { audience: "leadership" as const, search: "gouvernance cloud" },
  { audience: "leadership" as const, search: "gouvernance et budget" },
];

describe("countMatchesOutsideLens", () => {
  it("counts matches in the other lens", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "gouvernance")).toBe(2);
  });

  it("is zero when the other lens has nothing", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "ebpf")).toBe(0);
  });

  it("is zero for an empty query — an empty search is not a search", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "   ")).toBe(0);
  });

  it("ignores accents and case, like the main search", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "GOUVERNANCE")).toBe(2);
    expect(countMatchesOutsideLens(haystack, "leadership", "RESEAU")).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test lens`
Expected: FAIL — `countMatchesOutsideLens` is not exported from `@/lib/lens`.

- [ ] **Step 3: Implement**

Add to `src/lib/lens.ts`, beside `resolveLens`. The DOM wrapper collects
`{audience, search}` from the cards and calls this:

```ts
/**
 * How many sessions in the OTHER lens match the query.
 *
 * Without this a CTO searching "gouvernance" from the technical lens is told
 * "no results" — true, and useless. A lens is meant to focus; unannounced
 * misses turn it into a hiding device.
 */
export function countMatchesOutsideLens(
  cards: readonly { audience: Audience; search: string }[],
  audience: Audience,
  query: string,
): number {
  const q = normalise(query).trim();
  if (!q) return 0;
  let n = 0;
  for (const c of cards) {
    if (c.audience === audience) continue;
    if (normalise(c.search).includes(q)) n += 1;
  }
  return n;
}
```

`normalise` is the existing accent- and case-folding helper — import it from
`./schedule-filter` (`src/lib/schedule-filter.ts:34`), do NOT write a second
copy. The main search already folds with it; a remainder count that folded
differently would report matches the visitor cannot reproduce by switching lens.

- [ ] **Step 4: Surface it in the result line**

`#schedule-result-count` is written with `textContent` today, so the count is
plain text. The remainder must be a **control**, not a sentence: a count the
reader cannot act on is worse than no count. Keep the number as text and append
a real `<button>`:

```ts
countEl.textContent = visible.size === 0 ? noneLabel : countTemplate…;   // unchanged

const outside = countMatchesOutsideLens(lensCards(), audience, state.query);
if (outside > 0) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toolbar-cross-lens";
  btn.textContent = moreResultsLabel   // root.getAttribute("data-schedule-more-results")
    .replace("{n}", String(outside))
    .replace("{lens}", lensLabel(otherAudience(audience)));
  // Switches lens and keeps the query — the whole point of telling them.
  btn.addEventListener("click", () => setAudience(otherAudience(audience)));
  countEl.append(" · ", btn);
}
```

Two things follow from the existing code, not from taste:

- **`textContent =` wipes the element**, so the button must be appended *after*
  the count is written, and re-created on every `apply()`. Build it with
  `createElement`/`textContent`, never by assembling an HTML string — the
  substituted values are fine here, but the file's own convention is to escape
  anything interpolated (`escHtml`), and `createElement` makes the question moot.
- **The labels reach the island through the root element**, like every other
  client-side string in this file (`schedule-ui.ts:495-500`). Add them in
  `ScheduleGrid.astro` beside `data-schedule-agenda-remove`:

  ```astro
  data-schedule-more-results={t("schedule.audience.more_results")}
  data-schedule-audience-tech={t("schedule.audience.tech")}
  data-schedule-audience-leadership={t("schedule.audience.leadership")}
  ```

  and read them with the same `getAttribute(...) || fallback` shape. Do **not**
  import `useTranslations` into the island: it is a client bundle, and the whole
  i18n table would ship to the browser.

- [ ] **Step 5: Run tests**

Run: `pnpm test && pnpm exec astro check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ src/components/schedule/ src/i18n/ui.ts
git commit -m "feat(schedule): search across both lenses and offer the remainder"
```

---

### Task 5: Prune filters, and detect clashes in the agenda

**Files:**
- Modify: `src/lib/lens.ts`
- Modify: `src/components/schedule/schedule-ui.ts`
- Modify: `src/components/schedule/ScheduleToolbar.astro`
- Modify: `src/components/schedule/ScheduleGrid.astro` (the clash label on `[data-schedule-root]`)
- Modify: `src/i18n/ui.ts` (FR + EN)
- Test: `src/lib/__tests__/lens.test.ts` (extend)

**Interfaces:**
- Produces, in `src/lib/lens.ts`:
  ```ts
  export function findClashes(items: readonly AgendaItem[]): Map<string, string[]>;
  export function facetValuesInLens(cards: readonly FacetCard[], audience: Audience): FacetValues;
  ```

The agenda is the one surface where the two lenses reunite, so it is the only place a cross-audience clash can be shown.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/lens.test.ts`:

```ts
import { findClashes } from "@/lib/lens";

const s = (id: string, start: string, duration: number) => ({ id, start, duration });

describe("findClashes", () => {
  it("finds an overlap across lenses", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 45),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.get("A")).toEqual(["B"]);
    expect(c.get("B")).toEqual(["A"]);
  });

  it("does not flag back-to-back sessions — touching is not overlapping", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 30),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.size).toBe(0);
  });

  it("handles three-way overlaps", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 60),
      s("B", "2027-06-03T10:15:00+02:00", 15),
      s("C", "2027-06-03T10:30:00+02:00", 15),
    ]);
    expect(c.get("A")!.sort()).toEqual(["B", "C"]);
  });

  it("is empty for a single session", () => {
    expect(findClashes([s("A", "2027-06-03T10:00:00+02:00", 30)]).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test lens`
Expected: FAIL — `findClashes` is not exported.

- [ ] **Step 3: Implement**

```ts
export interface AgendaItem { id: string; start: string; duration: number }

/**
 * Bookmarked sessions that overlap in time.
 *
 * The grid can only show parallelism within one lens; a clash between a
 * leadership session and a technical one is invisible there by construction.
 * The agenda holds both, so it is the only place the conflict can surface — and
 * it surfaces at the moment someone is planning their day rather than in the
 * corridor.
 *
 * Touching is not overlapping: a 10:00-10:30 and a 10:30-11:00 are a plan, not
 * a clash.
 */
export function findClashes(items: readonly AgendaItem[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (id: string, other: string) => {
    const list = out.get(id);
    if (list) list.push(other);
    else out.set(id, [other]);
  };
  const at = items.map((i) => {
    const start = new Date(i.start).getTime();
    return { id: i.id, start, end: start + i.duration * 60_000 };
  });
  for (let a = 0; a < at.length; a++) {
    for (let b = a + 1; b < at.length; b++) {
      // Strict `<` on both sides: touching is not overlapping.
      if (at[a].start < at[b].end && at[b].start < at[a].end) {
        add(at[a].id, at[b].id);
        add(at[b].id, at[a].id);
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Show clashes in the drawer**

**The drawer's entries are built in JavaScript, not in the component.**
`AgendaDrawer.astro` renders only the shell — heading, empty-state paragraph,
export button. The list is populated by `refreshAgenda()` in `schedule-ui.ts`
(~line 765), which reads each bookmarked card out of the DOM and writes an item
with `innerHTML`. That is where the clash marker goes; `AgendaDrawer.astro`
needs no change at all.

`refreshAgenda` already collects the cards it renders and reads
`data-session-id`, `data-start`, `data-room` and `data-title` off each one.
`data-duration` is on the card too, so build the `AgendaItem[]` from the same
`picked` array, call `findClashes` once before the render loop, and append a
line to the entry when its id has clashes:

```ts
const clashes = findClashes(
  picked.map((c) => ({
    id: c.getAttribute("data-session-id") ?? "",
    start: c.getAttribute("data-start") ?? "",
    duration: Number(c.getAttribute("data-duration") ?? "0"),
  })),
);
```

Render the marker inside the existing `<div class="min-w-0">`, naming the other
session — `clashLabel.replace("{title}", …).replace("{room}", …)` with the
titles read from the clashing cards. **Escape it with the existing `escHtml`**,
as every other interpolation in that template does: a talk title comes from
Pretalx and can contain `&` or `<`.

The label comes from `root.getAttribute(...)` like the drawer's other client-side
strings (`agendaRemoveLabel`, `emptyLabel` — see `schedule-ui.ts:500`), which
means adding it to the `[data-schedule-root]` element in `ScheduleGrid.astro`
as well as to `src/i18n/ui.ts`:

```ts
// fr
"schedule.agenda.clash": "chevauche {title} ({room})",
// en
"schedule.agenda.clash": "overlaps with {title} ({room})",
```

- [ ] **Step 4b: Remove the leadership tracks from the track filter (spec D-4)**

`ScheduleToolbar.astro` builds the track filter from `listTracks(sessions)`. Once a track defines the lens, offering it again in the dropdown is a trap: selecting it from the technical lens yields an empty grid with no explanation, and from the leadership lens it is a no-op. Filter the leadership track names out of that list.

Guard it in `tests/build/audience-lens.test.ts`:

```ts
  it("the leadership track is not offered as a track filter", () => {
    const src = read("src/components/schedule/ScheduleToolbar.astro");
    expect(src).toMatch(/listTracks\([^)]*\)[\s\S]{0,200}(LEADERSHIP_TRACKS|audienceOf)/);
  });
```

- [ ] **Step 5: Prune the filter options the lens has emptied**

The pure half goes in `src/lib/lens.ts`. Write the test first, appending to `src/lib/__tests__/lens.test.ts`:

```ts
import { facetValuesInLens, type FacetCard } from "@/lib/lens";

const mixed: FacetCard[] = [
  { audience: "tech",       room: "Monet",  format: "talk",    track: "IA et Data",           level: "intermediate" },
  { audience: "tech",       room: "Piaf",   format: "workshop", track: "Developer Experience", level: "" },
  { audience: "leadership", room: "Eiffel", format: "talk",    track: "Strategy & Leadership", level: "" },
  { audience: "tech",       room: "Monet",  format: "keynote", track: "",                     level: "" },
];

describe("facetValuesInLens", () => {
  it("keeps only the values the lens can still reach", () => {
    const v = facetValuesInLens(mixed, "leadership");
    expect([...v.room]).toEqual(["Eiffel"]);
    expect([...v.track]).toEqual(["Strategy & Leadership"]);
  });

  it("counts a keynote in every lens, since it is shown in both", () => {
    // The keynote is `audience: "tech"` by its (empty) track, but it spans the
    // whole audience — so "keynote" must stay offered in the leadership lens.
    expect(facetValuesInLens(mixed, "leadership").format.has("keynote")).toBe(true);
  });

  it("does not let a keynote's room into the room facet", () => {
    // The room filter already exempts keynotes (`schedule-filter.ts:52`), so
    // offering Monet in a lens whose only Monet session is the keynote would be
    // a control that changes nothing.
    expect(facetValuesInLens(mixed, "leadership").room.has("Monet")).toBe(false);
  });

  it("drops empty values — an unset level is not a level", () => {
    expect(facetValuesInLens(mixed, "tech").level.has("")).toBe(false);
    expect([...facetValuesInLens(mixed, "tech").level]).toEqual(["intermediate"]);
  });
});
```

Then implement:

```ts
export interface FacetCard {
  audience: Audience;
  room: string;
  format: string;
  track: string;
  level: string;
}

export type FacetValues = Record<"room" | "format" | "track" | "level", Set<string>>;

/**
 * The facet values still reachable inside one lens.
 *
 * A filter offering a value that yields nothing is worse than no filter: it
 * reads as a broken page rather than an empty result. In the leadership lens
 * the room facet would otherwise still list all five rooms.
 *
 * Keynotes belong to both lenses and are exempt from the room filter, exactly
 * as `matchesSession` has them — so a keynote contributes its format, track and
 * level, but never its room.
 */
export function facetValuesInLens(cards: readonly FacetCard[], audience: Audience): FacetValues {
  const out: FacetValues = { room: new Set(), format: new Set(), track: new Set(), level: new Set() };
  for (const card of cards) {
    const isKeynote = card.format === "keynote";
    if (!isKeynote && card.audience !== audience) continue;
    if (!isKeynote && card.room) out.room.add(card.room);
    if (card.format) out.format.add(card.format);
    if (card.track) out.track.add(card.track);
    if (card.level) out.level.add(card.level);
  }
  return out;
}
```

Then wire it in `schedule-ui.ts`, inside the lens switch (not inside `apply()` — the reachable values change with the lens, not with the filters):

```ts
const reachable = facetValuesInLens(lensCards(), audience);
for (const group of document.querySelectorAll<HTMLElement>(".toolbar-facet")) {
  let live = 0;
  for (const btn of group.querySelectorAll<HTMLElement>(".schedule-filter")) {
    const facet = btn.getAttribute("data-filter") as keyof FacetValues | null;
    const value = btn.getAttribute("data-value") ?? "";
    const on = !!facet && reachable[facet]?.has(value);
    btn.toggleAttribute("hidden", !on);
    if (on) live += 1;
  }
  // Fewer than two options is a control that cannot change anything (spec D-4).
  group.toggleAttribute("hidden", live < 2);
}
```

- [ ] **Step 6: Drop the selections the new lens cannot honour**

Still inside the lens switch, and **before** calling `apply()`: any selected facet value that is no longer reachable must leave `state`, or a room filter for Piaf carried into a lens without Piaf produces zero results with no visible cause — the chip that explains it has just been hidden by Step 5.

```ts
for (const facet of ["room", "format", "track", "level"] as const) {
  for (const value of [...state[facet]]) {
    if (!reachable[facet].has(value)) state[facet].delete(value);
  }
}
```

Level and format normally survive, which is the point: someone filtering for `beginner` keeps that filter across a lens switch.

Guard the ordering in `tests/build/audience-lens.test.ts`, because getting it backwards is silent — `apply()` would run once against stale state and the count would flicker:

```ts
  it("prunes the lens's dead filter values before re-applying the filters", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    const prune = src.indexOf("facetValuesInLens");
    expect(prune).toBeGreaterThan(-1);
    // The first apply() after the prune is what renders the corrected state.
    expect(src.indexOf("apply()", prune)).toBeGreaterThan(prune);
  });
```

- [ ] **Step 7: Run tests**

Run: `pnpm test && pnpm exec astro check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/ src/components/schedule/ src/i18n/ui.ts tests/build/
git commit -m "feat(schedule): clash detection in the agenda, and lens-aware filters"
```

---

### Task 6: URL, defaults, and the other editions

**Files:**
- Modify: `src/components/schedule/schedule-ui.ts`
- Test: `tests/build/audience-lens.test.ts` (extend)

**Interfaces:**
- Consumes from Task 3, Step 5c: `audience`, `setAudience(next)`, and the `params`
  object `schedule-ui.ts:233` already builds for `?view=`.

- [ ] **Step 1: Write the failing test**

Append to `tests/build/audience-lens.test.ts`:

```ts
describe("audience lens: other editions and the URL", () => {
  it("2023 and 2026 render no control — absent, not disabled", () => {
    for (const page of ["dist/programme/2023/index.html", "dist/programme/2026/index.html"]) {
      const html = readFileSync(resolve(import.meta.dirname, "../../", page), "utf-8");
      expect(html, page).not.toContain("data-audience-switch");
      expect(html, page).toContain('data-has-audiences="false"');
    }
  });

  it("the lens is read from the URL and defaults to tech", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    expect(src).toContain("audience");
    expect(src).toMatch(/searchParams/);
  });

  it("the lens is NOT counted as an active filter", () => {
    // `activeFilterCount` reads FilterState wholesale, so the guard is that the
    // lens never enters FilterState — assert on the file that DEFINES both.
    // (Slicing schedule-ui.ts for "function activeFilterCount" finds nothing
    //  there: it is imported, so indexOf returns -1, slice(-1) yields one
    //  character, and the assertion passes without testing anything.)
    const filter = read("src/lib/schedule-filter.ts");
    expect(filter).toContain("function activeFilterCount");
    expect(filter).not.toContain("audience");

    const ui = read("src/components/schedule/schedule-ui.ts");
    expect(ui).not.toMatch(/state\.audience|audience:\s*(new Set|")/);
  });

  it("Clear filters does not reset the lens", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    const clear = src.slice(src.indexOf("schedule-filter-clear"));
    expect(clear.slice(0, 400)).not.toContain("audience");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm build >/dev/null 2>&1 && pnpm test audience-lens`
Expected: FAIL on the URL and `activeFilterCount` assertions.

- [ ] **Step 3: Implement**

`schedule-ui.ts` already resolves `?view=` on boot in exactly this shape — a
`params` object, a narrowing helper that returns `null` for anything it does not
recognise, and a single settling call (`schedule-ui.ts:232-244`). Follow it,
reusing the `params` already built there:

```ts
/** A candidate is only a lens if it names one — anything else falls through. */
const asAudience = (v: string | null): Audience | null =>
  v === "tech" || v === "leadership" ? v : null;

// An edition with one audience has no lens to select. Ignoring the parameter
// rather than 404-ing or rendering an empty grid is what makes a stale link to
// ?audience=leadership harmless on 2026.
const hasLens = root.getAttribute("data-has-audiences") === "true";
setAudience(hasLens ? (asAudience(params.get("audience")) ?? "tech") : "tech");
```

Place that beside the existing `setView(...)` call, **before** the `apply()`
that follows it — `setAudience` calls `apply()` itself, and letting the boot
sequence run it twice would render the page once against the wrong lens.

Then extend `setAudience` at the marked point (Task 3, Step 5c) to write the URL:

```ts
  const url = new URL(window.location.href);
  if (hasLens && audience === "leadership") url.searchParams.set("audience", "leadership");
  else url.searchParams.delete("audience");
  history.replaceState(null, "", url);
```

`replaceState`, not `pushState`: the lens is a view of one page, so a visitor
toggling it four times should not have to press Back four times to leave. The
technical lens **deletes** the parameter rather than writing `?audience=tech`,
so the default state has the canonical URL — which is also what spec D-8 asks
for by keeping the canonical the bare path.

- [ ] **Step 4: Verify against a real build**

Run: `pnpm build >/dev/null 2>&1 && grep -c "data-audience-switch" dist/programme/2026/index.html`
Expected: `0`.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test && pnpm exec astro check && pnpm build`
Expected: green; 374 pages.

- [ ] **Step 6: Commit**

```bash
git add src/components/schedule/ tests/build/audience-lens.test.ts
git commit -F - <<'MSG'
feat(schedule): select the lens from the URL, and leave other editions alone

?audience=leadership opens the leadership lens so it can be linked directly;
absent or unknown means technical. An edition without the track ignores the
parameter and renders its normal programme rather than an empty grid.

Guards pin the two properties the design rests on: the lens is not counted as an
active filter, and Clear filters does not reset it.
MSG
```

---

### Task 7: See it work

**Files:** none — verification only.

The code is inert until Pretalx has the track, so this task proves it against real data using a throwaway edit, exactly as the 2027 preview was proven.

- [ ] **Step 1: Confirm it is inert today**

Run: `PUBLIC_SITE_URL=https://staging.cloudnativedays.fr FLAG_OVERRIDES=programme=on pnpm build 2>&1 | tail -3`
Then: `grep -c "data-audience-switch" dist/programme/2027/index.html`
Expected: `0` — 2027 has no leadership sessions yet, so no control. Record it.

- [ ] **Step 2: Prove it with a throwaway**

Temporarily add an existing 2027 track name to `LEADERSHIP_TRACKS` — e.g. `"Réseau et sécurité"`, which the eBPF demo talk carries — and rebuild with the same command. Confirm:

- the control renders;
- the technical lens shows the remaining rooms with `--room-count` reduced;
- the leadership lens shows only the eBPF session;
- the break bands are present in both;
- `/programme/2026` still has no control.

Record what you saw, then **revert the throwaway** and confirm `git diff` is empty.

- [ ] **Step 3: Report**

State plainly whether the lens rendered correctly, and flag anything that looked wrong even if the tests passed — a screenshot-level judgement the assertions cannot make.

---

## Definition of done

- [ ] `pnpm test` green; `pnpm exec astro check` 0 errors / 0 warnings; `pnpm build` 374 pages.
- [ ] `/programme/2023` and `/programme/2026` contain no `data-audience-switch`.
- [ ] The throwaway proof in Task 7 showed the control, the reduced column count, and breaks in both lenses.
- [ ] The throwaway is reverted and `git diff` is empty.
- [ ] The PR description notes the Pretalx prerequisite: an organiser must create the **Strategy & Leadership** track and assign proposals to it before anything appears, and `LEADERSHIP_TRACKS` must match that name exactly.
