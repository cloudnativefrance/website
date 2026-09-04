import type { Audience } from "./audience";
import { normalise } from "./schedule-filter";

export interface LensCard { id: string; room: string; format: string; audience: Audience }
export interface LensResult {
  hiddenIds: Set<string>;
  hiddenRooms: Set<string>;
  /** Room name -> its 1-based position among the rooms still visible. */
  columnOf: Map<string, number>;
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

/**
 * How many sessions in the OTHER lens match the query.
 *
 * Without this a CTO searching "gouvernance" from the technical lens is told
 * "no results" — true, and useless. A lens is meant to focus; unannounced
 * misses turn it into a hiding device.
 *
 * Needs `id` and `format`, not just `audience`/`search`, for the same two
 * reasons `lensTotal` does: every session renders twice (grid + list), so
 * counting entries rather than distinct ids doubles the number; and a
 * keynote is already on screen in BOTH lenses (`resolveLens` exempts it),
 * so counting one here would offer to switch lens to reach a session the
 * visitor is already looking at.
 */
export function countMatchesOutsideLens(
  cards: readonly { id: string; audience: Audience; format: string; search: string }[],
  audience: Audience,
  query: string,
): number {
  const q = normalise(query).trim();
  if (!q) return 0;
  const ids = new Set<string>();
  for (const c of cards) {
    if (c.format === "keynote" || c.audience === audience) continue;
    if (normalise(c.search).includes(q)) ids.add(c.id);
  }
  return ids.size;
}

/**
 * How many distinct sessions belong to a lens: its own audience, plus every
 * keynote (which spans both).
 *
 * Every session renders twice — once in the grid, once in the list — so
 * `cards` here is a superset of session ids. Counting into a Set, not
 * counting entries, is what makes that safe: a card rendered once (a
 * keynote, say) would silently break a divide-by-two.
 */
export function lensTotal(
  cards: readonly { id: string; audience: Audience; format: string }[],
  audience: Audience,
): number {
  const ids = new Set<string>();
  for (const c of cards) {
    if (c.format === "keynote" || c.audience === audience) ids.add(c.id);
  }
  return ids.size;
}
