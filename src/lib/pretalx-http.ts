/**
 * The authenticated HTTP layer both Pretalx readers share.
 *
 * `pretalx-private.ts` (non-public question answers for a RELEASED event) and
 * `pretalx-preview-api.ts` (an event with no released schedule at all) speak to
 * the same API with the same token, the same pagination quirk and the same
 * retry policy. They used to each own a copy of that code, and on day one the
 * copies already disagreed: the preview copy dropped `TOKEN_HELP` from its auth
 * error and had no notion of `isConfigurationFailure`. One layer, one policy.
 *
 * Three behaviours live here because getting any of them wrong is silent:
 *
 * 1. **Follow `next`.** Pretalx caps page size well below what `limit` requests
 *    — asking for 400 returns 50 — so a single request truncates without
 *    saying so.
 * 2. **Re-anchor `next`.** Pretalx emits it as `http://` even over HTTPS.
 *    Following it verbatim is a cross-origin hop and `fetch` drops the
 *    `Authorization` header across it, so page 1 returns 200 and page 2 a 401.
 * 3. **Project every row at the fetch boundary.** `project` is not a type
 *    assertion. It builds a NEW object holding only the declared fields, so
 *    what the endpoint also returned — `/speakers/` sends `email` and
 *    `internal_notes` — stops existing in memory past this module. A
 *    `res.json() as T` leaves all of it in the heap, one `console.log` away
 *    from a build log.
 */
import { PRETALX_BASE } from "./pretalx";

/** Pretalx's real page cap, whatever `limit` asks for. */
export const PAGE_SIZE = 50;

/** Backstop for a non-advancing cursor; see `fetchAllPages`. */
export const MAX_PAGES = 200;

/** Backoff between attempts. Length is the retry count; short, since this blocks a build. */
export const RETRY_DELAYS_MS = [500, 2000, 5000];

/** How to obtain a token, appended to whichever error surfaces first. */
export const TOKEN_HELP =
  "Set PRETALX_API_TOKEN, or PRETALX_API_TOKEN_FILE to a file containing it. " +
  `Create one at ${PRETALX_BASE}/orga/me with read access to questions and answers.`;

/** What to print for a thrown value. `fetch` rejects with a TypeError; `catch` types it `unknown`. */
export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * 401/403 — the token is wrong or under-permissioned.
 *
 * Grouped with `MissingTokenError` as a CONFIGURATION failure: it is our
 * mistake, retrying cannot fix it, and it must never be degraded past.
 */
export class PretalxAuthError extends Error {
  constructor(status: number, what: string) {
    super(`HTTP ${status} fetching ${what} — token rejected or lacking access. ${TOKEN_HELP}`);
    this.name = "PretalxAuthError";
  }
}

/** Any other non-OK response. 5xx and 429 are worth another attempt; 4xx is not. */
export class PretalxHttpError extends Error {
  readonly retryable: boolean;
  constructor(status: number, what: string, url: string) {
    super(`HTTP ${status} fetching ${what} from ${url}`);
    this.name = "PretalxHttpError";
    this.retryable = status >= 500 || status === 429;
  }
}

/**
 * A 200 whose body is not the JSON page shape we asked for.
 *
 * Deliberately BODY-FREE — it names the endpoint, the URL and the status, and
 * nothing else. `res.json()` rejects with a V8 `SyntaxError` whose message
 * QUOTES the surrounding body text, and `/speakers/` bodies carry `email` and
 * `internal_notes`. The retry path below prints `messageOf(lastErr)` into the
 * build log, so letting that message through would echo a real person's email
 * address into a staging build log — a leak with no route, no page and no
 * template involved.
 *
 * Retryable: the realistic cause is a body truncated by a dropped connection,
 * which is Pretalx being briefly unavailable rather than us asking wrongly.
 */
export class PretalxParseError extends Error {
  constructor(what: string, url: string, status: number) {
    super(
      `Unreadable response fetching ${what} from ${url} (HTTP ${status}) — ` +
        `body withheld: it may contain personal data.`,
    );
    this.name = "PretalxParseError";
  }
}

/** One page of a paginated Pretalx list endpoint. */
export interface PretalxPage<T> {
  results: T[];
  next: string | null;
}

/**
 * Narrows one raw row to its declared shape, dropping every other field.
 *
 * Must not throw on an unexpected value and must never put body text into an
 * error message: coerce, default, and let the caller's own validation decide.
 */
export type RowProjection<T> = (row: unknown) => T;

export interface PagedFetch<T> {
  url: string;
  token: string;
  /** Human-readable name of what is being fetched, for error and log lines. */
  what: string;
  project: RowProjection<T>;
  timeoutMs?: number;
  /** Log tag, so each reader's warnings stay attributable to it. */
  logPrefix?: string;
}

const DEFAULT_PREFIX = "[pretalx]";

/**
 * Re-anchor a paginated `next` link onto the configured origin.
 *
 * Pretalx builds absolute `next` URLs from its own notion of the request scheme
 * and emits `http://cfp.cloudnativedays.fr/...` even when serving over HTTPS.
 * Following that verbatim is a cross-origin hop, and fetch drops the
 * `Authorization` header across it — so page 1 returns 200 and page 2 returns
 * 401. Rewriting the scheme and host keeps every page on the authenticated
 * origin while preserving the query string that carries the cursor.
 */
export function reanchor(next: string): string {
  const base = new URL(PRETALX_BASE);
  const url = new URL(next);
  // Both setters below are no-ops on opaque-path schemes, so a `data:` or
  // `file:` link would pass through UNCHANGED rather than being pinned to the
  // configured origin — the opposite of what this function promises. Reject
  // those outright instead of returning something that only looks re-anchored.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`[pretalx] refusing a non-HTTP pagination link (${url.protocol})`);
  }
  url.protocol = base.protocol;
  url.host = base.host;
  // Credentials in `next` would be sent to the real host and echoed into build
  // logs by the error path below. Only a compromised Pretalx could plant them,
  // but dropping them costs nothing.
  url.username = "";
  url.password = "";
  return url.toString();
}

/**
 * Turn a parsed body into a page of projected rows.
 *
 * Every failure here is body-free, for the reason `PretalxParseError`
 * documents. `next` is read as a string or dropped: a non-string cursor is a
 * finished walk, never a value to interpolate into a log line.
 */
function projectPage<T>(
  body: unknown,
  project: RowProjection<T>,
  what: string,
  url: string,
  status: number,
): PretalxPage<T> {
  const page = (body ?? {}) as { results?: unknown; next?: unknown };
  if (!Array.isArray(page.results)) throw new PretalxParseError(what, url, status);
  return {
    results: page.results.map(project),
    next: typeof page.next === "string" ? page.next : null,
  };
}

/**
 * Fetch one page, retrying only what a retry can actually fix.
 *
 * A dropped connection, a timeout, a 5xx or a 429 is Pretalx being briefly
 * unavailable, and most real outages are brief. A 401/403 is our token being
 * wrong and any other 4xx is our request being wrong — retrying those just
 * makes the build slower before it fails the same way.
 */
export async function fetchPage<T>(opts: PagedFetch<T>): Promise<PretalxPage<T>> {
  const { url, token, what, project, timeoutMs = 30000 } = opts;
  const prefix = opts.logPrefix ?? DEFAULT_PREFIX;
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
      if (res.status === 401 || res.status === 403) throw new PretalxAuthError(res.status, what);
      if (!res.ok) throw new PretalxHttpError(res.status, what, url);
      // Parse AND project inside one try, so no error carrying body text can
      // escape: `res.json()`'s SyntaxError quotes the body it choked on.
      try {
        return projectPage(await res.json(), project, what, url, res.status);
      } catch (parseErr) {
        if (parseErr instanceof PretalxParseError) throw parseErr;
        throw new PretalxParseError(what, url, res.status);
      }
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
      `${prefix} ${what}: ${messageOf(lastErr)} — retrying in ${delay}ms ` +
        `(${attempt + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }
}

/** Fetch every page of a paginated endpoint, projecting each row as it arrives. */
export async function fetchAllPages<T>(opts: PagedFetch<T>): Promise<T[]> {
  const prefix = opts.logPrefix ?? DEFAULT_PREFIX;
  const out: T[] = [];
  let next: string | null = opts.url;
  // A `next` that points back at a page already fetched would loop forever:
  // the per-request timeout bounds each hop, nothing bounds the walk. The
  // largest endpoint here is ~310 rows at PAGE_SIZE, so this cap is far above
  // any real crawl and only trips on a cursor that is not advancing.
  let pages = 0;
  while (next) {
    if (++pages > MAX_PAGES) {
      throw new Error(`${prefix} ${opts.what} exceeded ${MAX_PAGES} pages — cursor is not advancing`);
    }
    // Annotated because `next` is both the input here and assigned from the
    // result below; without it the inference is circular and `body` lands as
    // an implicit `any`, silently dropping the shape check on `results`.
    const body: PretalxPage<T> = await fetchPage<T>({ ...opts, url: next });
    out.push(...body.results);
    next = body.next ? reanchor(body.next) : null;
  }
  return out;
}

/** Coerce an unknown field to a string, for projections. Never throws. */
export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Coerce an unknown row to something indexable, for projections. Never throws.
 *
 * A non-object value yields an empty record, so every `asString`/`asNumber`
 * read off it falls back rather than throwing on a null row.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

/** Coerce an unknown field to a number, for projections. Never throws. */
export function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
