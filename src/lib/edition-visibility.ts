/**
 * May an edition's data be fetched, and may its pages be shown?
 *
 * One question, one answer, one function — consulted by every route that can
 * reach a preview edition, deciding both whether to fetch and whether to
 * render from the same call. The data layer (`loadSessions`, `loadSpeakers`)
 * calls it too, so a route that forgets the check no longer publishes the
 * data either: a non-loadable edition never leaves its frozen archive, in
 * either place. The route-gate tests under `tests/build/` still exist to
 * catch a route rendering facts it should not — the two gates cover
 * different failure modes, not the same one twice.
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
 * Order matters, but only so far. `access === "preview"` is checked FIRST, so
 * an edition explicitly marked `preview` stays hidden no matter where
 * `CURRENT_EDITION` points — moving `CURRENT_EDITION` to a preview edition is
 * safe *for that edition*.
 *
 * That is the whole of the protection, and it is narrower than it looks. An
 * edition that is `public` in Pretalx, or has no `PRETALX_EVENT` entry at all
 * (2027 today), falls through to the arithmetic and becomes loadable the
 * instant `CURRENT_EDITION` reaches it. The arithmetic is not wrong — past and
 * current editions are public history and must render without a flag, which is
 * why the flag cannot be made authoritative for `year >= currentEdition`
 * without hiding `/programme/2026` after the 2027 bump. So the dangerous edit
 * is caught elsewhere instead: `edition-visibility.test.ts` asserts that every
 * edition `<= CURRENT_EDITION` actually has public data, which turns a
 * premature bump into a failing test rather than a published programme.
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
export function isEditionLoadable(year: Edition): boolean {
  return resolveEditionLoadable(
    PRETALX_EVENT[year]?.access,
    year,
    CURRENT_EDITION,
    isFlagActive("programme"),
  );
}

/**
 * Fail the build rather than serve an edition that may not be published.
 *
 * For the routes with no coming-soon state — a static build cannot serve a 404,
 * and an ICS feed or a replays page has nothing sensible to render instead. They
 * assert instead of branching, so a future edit ("point this at next year")
 * turns into a red build rather than a silent leak of an unannounced schedule.
 *
 * `label` names the feed or page that refused, so the build log says *which*
 * route needs re-pinning without a stack trace read.
 */
export function assertEditionPublishable(year: Edition, label: string): void {
  if (isEditionLoadable(year)) return;
  throw new Error(
    `[${label}] refusing to serve edition ${year}: it is not publicly ` +
      `loadable. ${label} has no coming-soon state — pin it to a public edition.`,
  );
}
