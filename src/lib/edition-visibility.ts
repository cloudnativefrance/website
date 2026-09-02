/**
 * May an edition's data be fetched, and may its pages be shown?
 *
 * One question, one answer, one function — consulted by every route that can
 * reach a preview edition, deciding both whether to fetch and whether to
 * render from the same call. The data layer (`loadSessions`, `loadSpeakers`)
 * does not call it yet; wiring the two together so a route can no longer
 * forget the gate is deliberately deferred to a later PR. Until then, a route
 * that omits the check is how "the page is hidden but the data is published"
 * would happen — which is exactly what the route-gate tests under
 * `tests/build/` exist to catch.
 *
 * This lives here rather than in `editions.ts` because it needs `PRETALX_EVENT`,
 * which transitively pulls in `node:fs` via `remote-fetch.ts`. `editions.ts` is
 * dependency-free and safe to import from a React island; keeping it that way is
 * the point. No island imports it today, which is exactly why the trap would be
 * set silently.
 */
import { CURRENT_EDITION, type Edition } from "./editions";
import { isFlagActive } from "./flags";
import { PRETALX_EVENT, type EditionAccess } from "./pretalx";

/**
 * The rule, as a pure function of its four inputs, so the whole truth table is
 * testable without mocking a module registry or a clock.
 *
 * Order matters. `access === "preview"` is checked FIRST, before the
 * `year > currentEdition` arithmetic. Otherwise moving `CURRENT_EDITION` to
 * 2027 — an edit that looks like routine housekeeping at launch time — would
 * make the arithmetic branch return true and un-hide the entire unannounced
 * programme in production.
 *
 * `year` and `currentEdition` are plain numbers, not `Edition`: this is a year
 * comparison, and the "unmapped future edition" branch exists exactly for years
 * that are not yet in the `Edition` union. `isEditionLoadable` below is the
 * typed entry point.
 */
export function resolveEditionLoadable(
  access: EditionAccess | undefined,
  year: number,
  currentEdition: number,
  flagActive: boolean,
): boolean {
  if (access === "preview") return flagActive;
  // Everything else — a public event, or no Pretalx event at all (2023, or an
  // edition listed in EDITIONS before its event exists). A PAST edition always
  // renders; a FUTURE one waits for the flag even when its Pretalx event is
  // already public, because `access` decides how the data is fetched and the
  // flag decides when it is published. Making the event public in Pretalx must
  // not, by itself, publish the programme on the site.
  return year <= currentEdition || flagActive;
}

/** Whether `year`'s sessions and speakers may be loaded and rendered. */
export function isEditionLoadable(year: Edition, now?: Date): boolean {
  return resolveEditionLoadable(
    PRETALX_EVENT[year]?.access,
    year,
    CURRENT_EDITION,
    isFlagActive("programme", now),
  );
}
