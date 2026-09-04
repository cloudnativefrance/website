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

export type EditionAccess = "public" | "preview";

export interface PretalxEventEntry {
  slug: string;
  /**
   * How the schedule is fetched — and ONLY that.
   *
   *   "public"  — a schedule has been RELEASED; the anonymous agenda export at
   *               /<slug>/schedule/export/schedule.json serves it.
   *   "preview" — no released schedule; readable only through the authenticated
   *               REST API, and only in a build where the `programme` flag is active.
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
 * Editions with a Pretalx event. 2023 predates the instance. 2027 is added here
 * once its event exists; until then the fetch would 404 on every build, so it is
 * deliberately absent rather than mapped and failing.
 */
export const PRETALX_EVENT: Partial<Record<Edition, PretalxEventEntry>> = {
  2026: { slug: "2026", access: "public", cfpOpen: true },
};
