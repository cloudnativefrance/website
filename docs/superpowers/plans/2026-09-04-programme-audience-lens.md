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
- Conventional commits, English. Never co-author; no attribution lines.
- No `git commit --amend`, no `git reset --hard`.
- Baseline: `pnpm test` 57 files / 695 tests green; `pnpm exec astro check` 0 errors / 0 warnings; `pnpm build` 374 pages. Two build-artifact tests read `dist/`, so run `pnpm build` before judging them.

## Existing machinery to reuse (do not reinvent)

| Symbol | Location |
|---|---|
| `apply()`, `state`, `facetMatches`, `activeFilterCount`, `normalise` | `src/components/schedule/schedule-ui.ts` |
| `is-hidden` per card; container hidden when it has no visible card | `schedule-ui.ts:59,66` |
| `--room-count` set server-side from `rooms.length` | `ScheduleGridView.astro:53` |
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
- Modify: `src/components/schedule/ScheduleGrid.astro`
- Modify: `src/components/schedule/ScheduleToolbar.astro`
- Modify: `src/components/schedule/ScheduleGridView.astro`
- Modify: `src/i18n/ui.ts` (FR + EN)
- Test: `tests/build/audience-lens.test.ts` (create)

**Interfaces:**
- Consumes: `hasBothAudiences`, `audienceOf` from Task 1.
- Produces: `data-audience="tech|leadership"` on every `.session-card`; `data-room="<name>"` on every `.grid-view-room` header cell; a control with `data-audience-switch` and buttons carrying `data-audience`; `data-has-audiences` on `[data-schedule-root]`.

The header cells must become addressable: the client hides a column by hiding *both* its header cell and its cards, and today the header cells carry no room identity.

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

  it("the control is rendered only when an edition has both audiences", () => {
    const src = read("src/components/schedule/ScheduleToolbar.astro");
    expect(src).toContain("hasBothAudiences");
    expect(src).toContain("data-audience-switch");
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

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test audience-lens`
Expected: FAIL — no `data-audience` in `SessionCard.astro`.

- [ ] **Step 3: Stamp the audience on each card**

In `src/components/schedule/SessionCard.astro`, import `audienceOf` and add the attribute beside the existing `data-track`:

```astro
data-audience={audienceOf(session.track)}
```

- [ ] **Step 4: Make header cells addressable**

In `ScheduleGridView.astro`, the `.grid-view-room` header cells render one per room. Add the room name so the client can hide a column:

```astro
<div class="grid-view-room" data-room={room}>{room}</div>
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

Run: `pnpm test audience-lens && pnpm build`
Expected: PASS; 374 pages. The control renders nowhere yet — 2027 has no leadership sessions, so `hasBothAudiences` is false everywhere. That is correct and is what Task 6's guard pins.

- [ ] **Step 9: Commit**

```bash
git add src/components/schedule/ src/i18n/ui.ts tests/build/audience-lens.test.ts
git commit -m "feat(schedule): render the audience control and make columns addressable"
```

---

### Task 3: Apply the lens client-side

**Files:**
- Modify: `src/components/schedule/schedule-ui.ts`
- Test: `src/components/schedule/__tests__/audience-apply.test.ts` (create)

**Interfaces:**
- Consumes: `data-audience` on cards, `data-room` on header cells, `data-has-audiences` on the root.
- Produces: `state.audience: Audience`; `applyAudience(root, audience): number` returning the count of visible room columns.

- [ ] **Step 1: Write the failing test**

Create `src/components/schedule/__tests__/audience-apply.test.ts`. Build a minimal DOM, then assert the three properties that matter:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { applyAudience } from "../schedule-ui-audience";

function build(): HTMLElement {
  document.body.innerHTML = `
    <div data-schedule-root data-has-audiences="true">
      <div class="grid-view" style="--room-count:5">
        <div class="grid-view-head">
          <div class="grid-view-room" data-room="Monet">Monet</div>
          <div class="grid-view-room" data-room="Eiffel">Eiffel</div>
        </div>
        <div class="grid-view-body">
          <div class="grid-view-row">
            <article class="session-card" data-session-id="A" data-room="Monet" data-audience="tech"></article>
            <article class="session-card" data-session-id="B" data-room="Eiffel" data-audience="leadership"></article>
            <article class="session-card" data-session-id="K" data-room="" data-format="keynote" data-audience="tech"></article>
          </div>
          <div class="grid-view-break">Déjeuner</div>
        </div>
      </div>
    </div>`;
  return document.querySelector<HTMLElement>("[data-schedule-root]")!;
}

beforeEach(build);

describe("applyAudience", () => {
  it("hides cards outside the lens", () => {
    applyAudience(document.querySelector("[data-schedule-root]")!, "tech");
    const hidden = (id: string) =>
      document.querySelector(`[data-session-id="${id}"]`)!.classList.contains("is-audience-hidden");
    expect(hidden("A")).toBe(false);
    expect(hidden("B")).toBe(true);
  });

  it("keeps an all-room keynote visible in BOTH lenses", () => {
    for (const lens of ["tech", "leadership"] as const) {
      applyAudience(document.querySelector("[data-schedule-root]")!, lens);
      expect(
        document.querySelector('[data-session-id="K"]')!.classList.contains("is-audience-hidden"),
      ).toBe(false);
    }
  });

  it("NEVER hides a break band — that is the difference from a filter", () => {
    applyAudience(document.querySelector("[data-schedule-root]")!, "leadership");
    expect(
      document.querySelector(".grid-view-break")!.classList.contains("is-hidden"),
    ).toBe(false);
  });

  it("hides the column header of a room with nothing in the lens", () => {
    applyAudience(document.querySelector("[data-schedule-root]")!, "tech");
    const head = (r: string) =>
      document.querySelector<HTMLElement>(`.grid-view-room[data-room="${r}"]`)!;
    expect(head("Monet").classList.contains("is-audience-hidden")).toBe(false);
    expect(head("Eiffel").classList.contains("is-audience-hidden")).toBe(true);
  });

  it("recomputes --room-count so the remaining columns expand", () => {
    const root = document.querySelector<HTMLElement>("[data-schedule-root]")!;
    expect(applyAudience(root, "tech")).toBe(1);
    expect(
      root.querySelector<HTMLElement>(".grid-view")!.style.getPropertyValue("--room-count"),
    ).toBe("1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test audience-apply`
Expected: FAIL — cannot resolve `../schedule-ui-audience`.

- [ ] **Step 3: Implement**

Create `src/components/schedule/schedule-ui-audience.ts` as a separate module so it is unit-testable without the whole toolbar bootstrap (`schedule-ui.ts` runs its setup at import time against a live document):

```ts
import type { Audience } from "@/lib/audience";

/**
 * Scope the schedule to one audience.
 *
 * Deliberately a SECOND hidden-class, `is-audience-hidden`, rather than reusing
 * the filters' `is-hidden`. The two must compose: a card is shown only when the
 * lens allows it AND the filters do. Sharing one class would make whichever ran
 * last clobber the other, so switching lens would silently clear an active
 * filter.
 *
 * Break bands are untouched. They describe the unfiltered day and belong to
 * both lenses; the filter code hides them because narrowing a day makes them
 * meaningless, which a lens does not.
 *
 * Returns the number of room columns still visible, so the caller can size the
 * grid.
 */
export function applyAudience(root: HTMLElement, audience: Audience): number {
  const roomsInLens = new Set<string>();

  for (const card of root.querySelectorAll<HTMLElement>(".session-card")) {
    // A keynote spans every room and belongs to everyone — the same reasoning
    // the room filter already applies in schedule-ui.ts.
    const isKeynote = card.getAttribute("data-format") === "keynote";
    const show = isKeynote || card.getAttribute("data-audience") === audience;
    card.classList.toggle("is-audience-hidden", !show);
    const room = card.getAttribute("data-room") ?? "";
    if (show && room && !isKeynote) roomsInLens.add(room);
  }

  for (const head of root.querySelectorAll<HTMLElement>(".grid-view-room")) {
    const room = head.getAttribute("data-room") ?? "";
    head.classList.toggle("is-audience-hidden", !roomsInLens.has(room));
  }

  const grid = root.querySelector<HTMLElement>(".grid-view");
  if (grid) grid.style.setProperty("--room-count", String(Math.max(roomsInLens.size, 1)));
  return roomsInLens.size;
}
```

- [ ] **Step 4: Add the CSS**

In `ScheduleGridView.astro`'s `<style>`, beside the existing `.is-hidden` rules:

```css
  /* A second axis, composed with the filters' own `.is-hidden` — see
     schedule-ui-audience.ts for why they cannot share one class. */
  :global(.is-audience-hidden) { display: none !important; }
```

- [ ] **Step 5: Wire it into the toolbar**

In `schedule-ui.ts`: add `audience` to the state, default `"tech"`, call `applyAudience` before the existing `apply()`, and bind the control's buttons. **`activeFilterCount` must not change** — the lens is not a filter.

- [ ] **Step 5b: The leadership lens opens in the list view (spec D-7)**

With Eiffel alone the grid would be a single ~1100px column, which is not a grid. When `applyAudience` returns a visible-room count of **1**, switch to the list view — the same code path the existing grid/list toggle uses, so the toggle's state stays truthful and the visitor can switch back.

Derived from the count, not hardcoded to the leadership lens: a technical lens that ever narrows to one room gets the same treatment, and a leadership programme that grows to two rooms gets a grid without anyone remembering to change this.

Add a case to the Task 3 test file:

```ts
  it("reports a single visible room, which is what selects the list view", () => {
    const root = document.querySelector<HTMLElement>("[data-schedule-root]")!;
    expect(applyAudience(root, "leadership")).toBe(1);
  });
```

- [ ] **Step 6: Run tests**

Run: `pnpm test audience && pnpm exec astro check`
Expected: PASS, 0 type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/schedule/
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
- Modify: `src/components/schedule/schedule-ui.ts`
- Test: `src/components/schedule/__tests__/cross-lens-search.test.ts` (create)

**Interfaces:**
- Produces: `countMatchesOutsideLens(root, audience, query): number`.

Without this a CTO searching "gouvernance" from the technical lens is told *no results* — true and useless. The lens becomes a hiding device instead of a focusing one.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { countMatchesOutsideLens } from "../schedule-ui-audience";

beforeEach(() => {
  document.body.innerHTML = `
    <div data-schedule-root>
      <article class="session-card" data-audience="tech"        data-search="ebpf réseau"></article>
      <article class="session-card" data-audience="leadership"  data-search="gouvernance cloud"></article>
      <article class="session-card" data-audience="leadership"  data-search="gouvernance et budget"></article>
    </div>`;
});

const root = () => document.querySelector<HTMLElement>("[data-schedule-root]")!;

describe("countMatchesOutsideLens", () => {
  it("counts matches in the other lens", () => {
    expect(countMatchesOutsideLens(root(), "tech", "gouvernance")).toBe(2);
  });

  it("is zero when the other lens has nothing", () => {
    expect(countMatchesOutsideLens(root(), "tech", "ebpf")).toBe(0);
  });

  it("is zero for an empty query — an empty search is not a search", () => {
    expect(countMatchesOutsideLens(root(), "tech", "")).toBe(0);
  });

  it("ignores accents and case, like the main search", () => {
    expect(countMatchesOutsideLens(root(), "tech", "GOUVERNANCE")).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test cross-lens-search`
Expected: FAIL — `countMatchesOutsideLens` is not exported.

- [ ] **Step 3: Implement**

Add to `schedule-ui-audience.ts`. Reuse the same folding the main search uses, exported from `schedule-ui.ts` if it already is; otherwise duplicate the two-line `normalise` and note why:

```ts
export function countMatchesOutsideLens(
  root: HTMLElement,
  audience: Audience,
  query: string,
): number {
  const q = query.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  if (!q) return 0;
  let n = 0;
  for (const card of root.querySelectorAll<HTMLElement>(".session-card")) {
    if (card.getAttribute("data-audience") === audience) continue;
    const hay = (card.getAttribute("data-search") ?? "")
      .normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (hay.includes(q)) n += 1;
  }
  return n;
}
```

- [ ] **Step 4: Surface it in the result line**

In `schedule-ui.ts`'s `apply()`, after the existing count is written, append the remainder when non-zero, using `schedule.audience.more_results` with `{n}` and `{lens}` substituted. Render it as a **button** that switches lens and keeps the query — not plain text. A count the reader cannot act on is worse than no count.

- [ ] **Step 5: Run tests**

Run: `pnpm test schedule && pnpm exec astro check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/schedule/
git commit -m "feat(schedule): search across both lenses and offer the remainder"
```

---

### Task 5: Prune filters, and detect clashes in the agenda

**Files:**
- Modify: `src/components/schedule/schedule-ui.ts`
- Modify: `src/components/schedule/AgendaDrawer.astro`
- Test: `src/components/schedule/__tests__/agenda-clash.test.ts` (create)

**Interfaces:**
- Produces: `findClashes(items): Map<string, string[]>` — session id → ids it overlaps.

The agenda is the one surface where the two lenses reunite, so it is the only place a cross-audience clash can be shown.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { findClashes } from "../schedule-ui-audience";

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

Run: `pnpm test agenda-clash`
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
  const at = items.map((i) => {
    const start = new Date(i.start).getTime();
    return { id: i.id, start, end: start + i.duration * 60_000 };
  });
  for (let a = 0; a < at.length; a++) {
    for (let b = a + 1; b < at.length; b++) {
      if (at[a].start < at[b].end && at[b].start < at[a].end) {
        (out.get(at[a].id) ?? out.set(at[a].id, []).get(at[a].id)!).push(at[b].id);
        (out.get(at[b].id) ?? out.set(at[b].id, []).get(at[b].id)!).push(at[a].id);
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Show clashes in the drawer**

In `AgendaDrawer.astro`'s rendering code, mark a clashing entry with the other session's title and room. Add FR + EN keys, e.g. `"schedule.agenda.clash": "chevauche {title} ({room})"` / `"overlaps with {title} ({room})"`.

- [ ] **Step 4b: Remove the leadership tracks from the track filter (spec D-4)**

`ScheduleToolbar.astro` builds the track filter from `listTracks(sessions)`. Once a track defines the lens, offering it again in the dropdown is a trap: selecting it from the technical lens yields an empty grid with no explanation, and from the leadership lens it is a no-op. Filter the leadership track names out of that list.

Guard it in `tests/build/audience-lens.test.ts`:

```ts
  it("the leadership track is not offered as a track filter", () => {
    const src = read("src/components/schedule/ScheduleToolbar.astro");
    expect(src).toMatch(/listTracks\([^)]*\)[\s\S]{0,200}(LEADERSHIP_TRACKS|audienceOf)/);
  });
```

- [ ] **Step 5: Prune single-option filters**

In `apply()`, after the lens is applied: for each filter group, count distinct values among cards not hidden by the lens; hide the whole group when fewer than two remain. In the leadership lens the room filter offers only Eiffel — a control that cannot change anything. This also improves the 2023 archive, which has fewer rooms.

- [ ] **Step 6: Drop inapplicable filter values on switch**

When switching lens, remove from `state` any selected facet value that no longer exists in the new lens — a room filter for Piaf carried into a lens without Piaf produces zero results and no explanation. Level and format carry across.

- [ ] **Step 7: Run tests**

Run: `pnpm test && pnpm exec astro check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/schedule/ src/i18n/ui.ts
git commit -m "feat(schedule): clash detection in the agenda, and lens-aware filters"
```

---

### Task 6: URL, defaults, and the other editions

**Files:**
- Modify: `src/components/schedule/schedule-ui.ts`
- Test: `tests/build/audience-lens.test.ts` (extend)

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
    const src = read("src/components/schedule/schedule-ui.ts");
    const fn = src.slice(src.indexOf("function activeFilterCount"));
    expect(fn.slice(0, fn.indexOf("}"))).not.toContain("audience");
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

On boot, read `?audience=leadership` from `location.search`; anything else, including its absence and an unknown value, means `"tech"`. When `data-has-audiences` is `"false"`, ignore the parameter entirely — an edition without the track renders its normal programme rather than an empty grid or a 404.

Switching the lens updates the URL with `history.replaceState` so the view is shareable without adding history entries a Back button would have to walk.

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
