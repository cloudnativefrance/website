/**
 * What the site knows about each edition's Pretalx event.
 *
 * Data ABOUT editions, not about HTTP — which is why it lives here rather than
 * in `pretalx.ts`. `edition-visibility.ts` needs it to answer "may this edition
 * be shown?", and `astro.config.mjs` needs that answer to build its redirects.
 * While the registry lived next to the fetch helpers, importing it dragged
 * `remote-fetch.ts` and `node:fs` into config load, and the whole graph beneath
 * `astro.config.mjs` had to stay off the `@/` alias — a constraint nothing
 * tested and that any new import could break with a confusing error.
 *
 * So keep this module dependency-free apart from `editions.ts`, which is itself
 * dependency-free.
 */
import type { Edition } from "./editions";

export type EditionAccess = "public" | "preview" | "frozen";

export interface PretalxEventEntry {
  slug: string;
  /**
   * How the schedule is fetched — and ONLY that.
   *
   *   "public"  — a schedule has been RELEASED; the anonymous agenda export at
   *               /<slug>/schedule/export/schedule.json serves it.
   *   "preview" — no released schedule; readable only through the authenticated
   *               REST API, and only in a build where the `programme` flag is active.
   *   "frozen"  — the edition is over; the schedule is served from the committed
   *               frozen archive (`sessions-{year}.json` / `speakers-{year}.json`)
   *               and NO network request is ever issued for it. The entry stays
   *               so `cfpOpen` and the event identity survive the freeze.
   *
   * Flips when a schedule is released, NEVER merely when the event becomes
   * visible to submitters — the export does not exist until a release, so an
   * early flip would 404 and fall back to a snapshot that does not exist.
   */
  access: EditionAccess;
  /**
   * Whether submitters may reach this event. Drives the /cfp link and nothing
   * else, so it can be turned on months before any schedule exists.
   */
  cfpOpen?: boolean;
}

/**
 * Editions with a Pretalx event. 2023 predates the instance.
 *
 * 2026 is FROZEN — the edition ran 2026-02-03 and its programme is served from
 * the committed archives (`sessions-2026.json` / `speakers-2026.json`), so no
 * build ever fetches it again. The entry stays because `cfpOpen` and the event
 * identity must survive the freeze.
 *
 * 2027's event now exists (slug "2027", `is_public: false`), so it is mapped
 * with `access: "preview"` — no schedule has been released, so the wip
 * schedule is read through the authenticated REST API, gated behind the
 * `programme` flag same as any other preview edition.
 *
 * Deliberately no `cfpOpen` on 2027. The event is non-public: a submitter who
 * reached it would hit a login redirect, not a submission form. `/cfp` keeps
 * pointing at 2026 until the organiser flips the Pretalx event public — that
 * is a one-word edit here, independent of when the schedule itself releases.
 */
export const PRETALX_EVENT: Partial<Record<Edition, PretalxEventEntry>> = {
  2026: { slug: "2026", access: "frozen", cfpOpen: true },
  2027: { slug: "2027", access: "preview" },
};
