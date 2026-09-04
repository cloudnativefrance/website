/**
 * Thin DOM wrapper around `resolveLens`. Reads attributes, calls the pure
 * policy function, applies the result — no policy of its own.
 *
 * There is NO DOM test environment in this repo (both vitest projects are
 * `environment: "node"`), so this file is deliberately kept to a loop over
 * attributes and class/style toggles: the decision lives in `resolveLens`,
 * which is fully unit-tested; this is guarded by source shape only.
 */
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
