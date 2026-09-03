/**
 * Authenticated reads of an UNRELEASED schedule.
 *
 * `pretalx.ts` is the public path: the released agenda export, fetched
 * anonymously. `pretalx-private.ts` reads non-public question answers for an
 * event whose schedule IS released. This module is the third case — an event
 * with no released schedule at all, whose grid exists only as a wip version.
 *
 * Two rules inherited from `pretalx-private.ts`, both enforced here:
 *
 * 1. **The wip schedule's slots are the allowlist.** With a token,
 *    `/submissions/` returns rejected and pending proposals too. Only
 *    submissions that appear in a slot of the wip schedule may reach the site.
 * 2. **Nothing is cached to disk.** Fetched at build time and discarded.
 */
import { PRETALX_BASE } from "./pretalx";
import { reanchor } from "./pretalx-private";

/** Localised Pretalx fields come back as `{ "fr": "...", "en": "..." }`, sometimes as a plain string. */
export type Localised = Record<string, string> | string;

/** One row of `GET /slots/` — a talk's placement on the grid. `room` is an id, not an object. */
export interface PreviewSlot {
  id: number;
  submission: string;
  room: number;
  start: string;
  end: string;
  duration: number;
  is_visible: boolean;
  schedule: number;
}

/** One row of `GET /submissions/`, expanded so track/type/speakers arrive nested rather than as ids. */
export interface PreviewSubmission {
  code: string;
  title: string;
  description: string | null;
  abstract?: string | null;
  duration: number;
  content_locale: string;
  tags: string[];
  state: string;
  track: { name: Localised; color: string } | null;
  submission_type: { name: Localised } | null;
  speakers: Array<{ code: string; name: string; biography: string | null }>;
  answers: Array<{ question: { id: number }; answer: string }>;
}

/** One row of `GET /schedules/` — a version of the schedule, released or not. */
interface PreviewScheduleVersion {
  id: number;
  version: string;
  published: string | null;
}

/** One row of `GET /rooms/`. */
interface PreviewRoom {
  id: number;
  name: Localised;
}

/** Pick the French value, then the first present value, then "". */
export function localised(v: Localised | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v.fr === "string") return v.fr;
  for (const value of Object.values(v)) {
    if (typeof value === "string") return value;
  }
  return "";
}

/**
 * Pretalx caps page size well below what `limit` requests — asking for 100
 * returns 50 — so a single request silently truncates. Always follow `next`.
 * Mirrors `PAGE_SIZE` in `pretalx-private.ts`.
 */
const PAGE_SIZE = 50;
/** Backstop for a non-advancing cursor; see `fetchAllPages` in `pretalx-private.ts`. */
const MAX_PAGES = 200;
/** Backoff between attempts. Length is the retry count; short, since this blocks a build. */
const RETRY_DELAYS_MS = [500, 2000, 5000];

/** What to print for a thrown value. `fetch` rejects with a TypeError; `catch` types it `unknown`. */
function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** 401/403 — the token is wrong or under-permissioned. Never worth a retry. */
class PretalxAuthError extends Error {
  constructor(status: number, what: string) {
    super(
      `HTTP ${status} fetching ${what} — token rejected or lacking access.`,
    );
    this.name = "PretalxAuthError";
  }
}

/** Any other non-OK response. 5xx and 429 are worth another attempt; 4xx is not. */
class PretalxHttpError extends Error {
  readonly retryable: boolean;
  constructor(status: number, what: string, url: string) {
    super(`HTTP ${status} fetching ${what} from ${url}`);
    this.name = "PretalxHttpError";
    this.retryable = status >= 500 || status === 429;
  }
}

/** One page of a paginated Pretalx list endpoint. */
interface PretalxPage<T> {
  results: T[];
  next: string | null;
}

/**
 * Fetch one page, retrying only what a retry can actually fix.
 *
 * A dropped connection, a timeout, a 5xx or a 429 is Pretalx being briefly
 * unavailable. A 401/403 is our token being wrong and any other 4xx is our
 * request being wrong — retrying those just makes the build slower before it
 * fails the same way.
 */
async function fetchPage<T>(
  url: string,
  token: string,
  what: string,
  timeoutMs: number,
): Promise<PretalxPage<T>> {
  let lastErr: unknown;
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Authorization: `Token ${token}`,
          Accept: "application/json",
          "User-Agent": "cndfrance-website-build/1.0",
        },
      });
      if (res.status === 401 || res.status === 403)
        throw new PretalxAuthError(res.status, what);
      if (!res.ok) throw new PretalxHttpError(res.status, what, url);
      return (await res.json()) as PretalxPage<T>;
    } catch (err) {
      // Never retry a failure that is about us rather than about Pretalx.
      if (err instanceof PretalxAuthError) throw err;
      if (err instanceof PretalxHttpError && !err.retryable) throw err;
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }

    const delay = RETRY_DELAYS_MS[attempt];
    if (delay === undefined) throw lastErr;
    console.warn(
      `[preview] ${what}: ${messageOf(lastErr)} — retrying in ${delay}ms ` +
        `(${attempt + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }
}

/**
 * Fetch every page of a paginated endpoint.
 *
 * Mirrors `fetchAllPages` in `pretalx-private.ts`: the `MAX_PAGES` backstop
 * against a non-advancing cursor, and re-anchoring `next` onto the configured
 * origin, because Pretalx emits it as `http://` even over HTTPS — following it
 * verbatim is a cross-origin hop and `fetch` silently drops the Authorization
 * header across it.
 */
async function fetchAllPages<T>(
  url: string,
  token: string,
  what: string,
  timeoutMs = 30000,
): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  let pages = 0;
  while (next) {
    if (++pages > MAX_PAGES) {
      throw new Error(
        `[preview] ${what} exceeded ${MAX_PAGES} pages — cursor is not advancing`,
      );
    }
    const body: PretalxPage<T> = await fetchPage<T>(
      next,
      token,
      what,
      timeoutMs,
    );
    out.push(...body.results);
    next = body.next ? reanchor(body.next) : null;
  }
  return out;
}

/**
 * Resolve the wip schedule's id.
 *
 * `GET /slots/` defaults to the RELEASED schedule. Omitting `?schedule=<id>`
 * renders last week's grid while looking entirely correct — no error, no
 * empty page, just quietly stale. So this throws rather than falling back to
 * a released version when no unpublished one exists.
 */
export async function fetchWipScheduleId(
  slug: string,
  token: string,
): Promise<number> {
  const versions = await fetchAllPages<PreviewScheduleVersion>(
    `${PRETALX_BASE}/api/events/${slug}/schedules/?limit=${PAGE_SIZE}`,
    token,
    `schedules for ${slug}`,
  );
  const wip = versions.find((v) => v.published === null);
  if (!wip) {
    throw new Error(
      `[preview] event "${slug}" has no unpublished schedule version. A preview ` +
        `edition renders the wip schedule; refusing to fall back to a released one, ` +
        `which would silently show an older grid than the organisers are editing.`,
    );
  }
  return wip.id;
}

/** Every slot of the given schedule version. Always pinned with `?schedule=`, never left to default. */
export async function fetchPreviewSlots(
  slug: string,
  scheduleId: number,
  token: string,
): Promise<PreviewSlot[]> {
  return fetchAllPages<PreviewSlot>(
    `${PRETALX_BASE}/api/events/${slug}/slots/?schedule=${scheduleId}&limit=${PAGE_SIZE}`,
    token,
    `slots for ${slug} (schedule ${scheduleId})`,
  );
}

/**
 * Every submission for the event — including rejected and pending ones.
 *
 * `/slots/` is the allowlist, not this: the caller must join against the wip
 * schedule's slots and discard anything without one, per the module docstring.
 */
export async function fetchPreviewSubmissions(
  slug: string,
  token: string,
): Promise<PreviewSubmission[]> {
  return fetchAllPages<PreviewSubmission>(
    `${PRETALX_BASE}/api/events/${slug}/submissions/` +
      `?expand=track,submission_type,speakers,answers.question&limit=${PAGE_SIZE}`,
    token,
    `submissions for ${slug}`,
  );
}

/** Room id → localised name, for resolving `PreviewSlot.room`. */
export async function fetchRoomNames(
  slug: string,
  token: string,
): Promise<Map<number, string>> {
  const rooms = await fetchAllPages<PreviewRoom>(
    `${PRETALX_BASE}/api/events/${slug}/rooms/?limit=${PAGE_SIZE}`,
    token,
    `rooms for ${slug}`,
  );
  return new Map(rooms.map((r) => [r.id, localised(r.name)]));
}
