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
import { CURRENT_EDITION, EDITIONS_DESC, type Edition } from "./editions";
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
export function isEditionLoadable(year: Edition, now?: Date): boolean {
  return resolveEditionLoadable(
    PRETALX_EVENT[year]?.access,
    year,
    CURRENT_EDITION,
    isFlagActive("programme", now),
  );
}

/**
 * Every edition the site is allowed to show, newest first.
 *
 * The single derivation `featuredEdition` and `archivedEditions` are both views
 * of: the first entry leads, the rest are the archive. They used to each redo
 * this sort-and-filter, and `archivedEditions` also called `featuredEdition`,
 * so a nav render paid for it three times over.
 */
function shownEditions(now?: Date): readonly Edition[] {
  return EDITIONS_DESC.filter((y) => isEditionLoadable(y, now));
}

/**
 * The answer for THIS build, computed once.
 *
 * Every input is build-invariant — `EDITIONS` is a literal, the flag state
 * comes from `process.env` and a clock that only crosses a boundary between
 * builds — while `Navigation.astro` asks the question on every one of the
 * several hundred pages a build emits. Same pattern as `pretalx-preview.ts`'s
 * `CACHE`.
 *
 * Only the no-argument case is memoised. An injected `now` is a test asking
 * about a different moment, and caching across those would make one case's
 * clock leak into the next.
 */
let shownCache: readonly Edition[] | undefined;

function shownEditionsCached(now?: Date): readonly Edition[] {
  if (now !== undefined) return shownEditions(now);
  return (shownCache ??= shownEditions());
}

/**
 * The edition whose programme the site currently leads with.
 *
 * Deliberately NOT `CURRENT_EDITION`, which must stay pinned to the last
 * edition with public data — moving it forward re-opens the production gate
 * (see the guard test in edition-visibility.test.ts). This asks the live
 * question instead: which is the newest edition we are allowed to show? On
 * production that is 2026; on staging, where the programme flag is forced on,
 * it is 2027. The staging-only behaviour therefore falls out of the existing
 * flag rather than needing a second switch to keep in step.
 *
 * `EDITIONS` always contains at least one past edition (2023), and a past
 * edition is loadable unconditionally, so `shownEditions` is never empty. There
 * is deliberately no `?? CURRENT_EDITION` fallback: it was unreachable by that
 * same argument, and an unreachable fallback only invites the reader to believe
 * the two answers could differ.
 */
export function featuredEdition(now?: Date): Edition {
  return shownEditionsCached(now)[0];
}

/**
 * Finished editions that were themselves the headline programme, newest first.
 *
 * Everything shown that is not the current headline — `slice(1)`, since the
 * headline is by definition the newest shown one — EXCEPT anything older than
 * `CURRENT_EDITION`: 2023 predates the site's programme pages and has its own
 * dedicated /2023 retrospective, which the About menu already links, so listing
 * it again under Programme would be a second, worse route to the same content.
 * `>= CURRENT_EDITION` expresses that without hardcoding a year — it yields []
 * in production and [2026] on staging, which is exactly the requirement.
 *
 * That filter used to live at the one call site in Navigation.astro, which made
 * this function's own return value something no caller wanted.
 */
export function archivedEditions(now?: Date): Edition[] {
  return shownEditionsCached(now)
    .slice(1)
    .filter((y) => y >= CURRENT_EDITION);
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
