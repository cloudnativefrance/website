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
 * Deduped by `id` on entry, like `lensTotal` and `countMatchesOutsideLens` —
 * every session renders twice (grid + list), so a caller that ever passes
 * `querySelectorAll(".session-card")` results directly, instead of one
 * resolved card per bookmark, must not make every session clash with its own
 * on-screen twin.
 *
 * Touching is not overlapping: a 10:00-10:30 and a 10:30-11:00 are a plan, not
 * a clash.
 *
 * An item with a missing or unparseable `start` degrades safely rather than
 * throwing: `new Date("").getTime()` is `NaN`, and every comparison against
 * `NaN` is `false`, so that item simply participates in no clashes.
 */
export function findClashes(items: readonly AgendaItem[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (id: string, other: string) => {
    const list = out.get(id);
    if (list) list.push(other);
    else out.set(id, [other]);
  };
  const deduped = [...new Map(items.map((i) => [i.id, i])).values()];
  const at = deduped.map((i) => {
    const start = new Date(i.start).getTime();
    return { id: i.id, start, end: start + i.duration * 60_000 };
  });
  for (let a = 0; a < at.length; a++) {
    for (let b = a + 1; b < at.length; b++) {
      // Strict `<` on both sides: touching is not overlapping. NaN on either
      // side (an unparseable start) makes both sides false, so the item never
      // clashes rather than throwing.
      if (at[a].start < at[b].end && at[b].start < at[a].end) {
        add(at[a].id, at[b].id);
        add(at[b].id, at[a].id);
      }
    }
  }
  return out;
}

/**
 * Fill a clash-label template's `{title}` and `{room}` tokens in one pass.
 *
 * Two sequential `.replace()` calls cannot do this safely: a Pretalx title
 * can itself contain the literal text `{room}`, and the second `.replace()`
 * would then match that occurrence INSIDE the just-substituted title rather
 * than the template's own `{room}` token — e.g. a title "Scheduling {room} at
 * scale" turns `"chevauche {title} ({room})"` into
 * `"chevauche Scheduling Piaf at scale ({room})"`: the room name lands inside
 * the title, and the real `{room}` token is left showing on screen. Matching
 * both tokens in a single regex pass cannot re-enter text it already
 * substituted.
 *
 * Function-replacement form, not string-replacement: `String.prototype.replace`
 * treats `$&`, `$$`, `` $` ``, `$'` and `$<name>` as special patterns in a
 * STRING replacement argument, so a title containing `$&` would render
 * wrong. A function replacement disables that handling.
 */
export function substituteClashLabel(template: string, title: string, room: string): string {
  return template.replace(/\{(title|room)\}/g, (_match, key: string) => (key === "title" ? title : room));
}

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
