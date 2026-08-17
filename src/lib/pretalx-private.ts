/**
 * Authenticated reads from the Pretalx REST API.
 *
 * Everything in `pretalx.ts` is public: the released schedule export, fetched
 * anonymously, with a committed snapshot beneath it. This module is the opposite
 * — it needs an organiser token, and it reads data that is deliberately NOT
 * public in Pretalx (question answers marked `is_public: false`, several of them
 * flagged `contains_personal_data`).
 *
 * Two rules follow from that, and both are enforced here rather than left to
 * call sites:
 *
 * 1. **The released schedule is the allowlist.** With a token, `/submissions/`
 *    returns every submission including rejected and pending ones, and
 *    `/speakers/` returns every person who ever submitted, with their email.
 *    Publishing any of that would leak the programme before its announcement.
 *    So this module never enumerates those endpoints to decide what exists — the
 *    caller passes the set of codes taken from the public released export, and
 *    answers are only ever returned for members of that set.
 *
 * 2. **Nothing here is cached to disk.** The values are fetched at build time and
 *    discarded. A speaker asking to be removed is handled by deleting them in
 *    Pretalx and rebuilding; there is no snapshot or git history to rewrite.
 */
import { readFileSync } from "node:fs";
import type { Edition } from "./editions";
import { PRETALX_BASE } from "./pretalx";

export type SpeakerField =
  | "company"
  | "role"
  | "linkedin"
  | "github"
  | "bluesky"
  | "website";

/**
 * Question ids, per edition.
 *
 * Pretalx question ids belong to the question object, not to a per-event slot:
 * the 2027 event's "Entreprise" will not be id 15. Hardcoding one set and
 * applying it to every event would query ids that do not exist for that event,
 * get zero results back, and build a site with every company, role and level
 * blank — while succeeding, because the token was present. That is precisely the
 * silent regression PRETALX_TOKEN_REQUIRED exists to prevent, so the ids are
 * keyed per edition and a missing entry is surfaced rather than assumed.
 *
 * Find a new edition's ids with:
 *   curl -H "Authorization: Token $TOKEN" \
 *     https://cfp.cloudnativedays.fr/api/events/<slug>/questions/
 */
export const SPEAKER_QUESTIONS: Partial<Record<Edition, Record<SpeakerField, number>>> = {
  2026: { company: 15, role: 16, linkedin: 17, github: 18, bluesky: 19, website: 20 },
};

/**
 * "Niveau de la présentation" — how demanding the TALK is.
 *
 * Pinned by id, not by matching on the word "niveau": question 1 is
 * "Quel est votre niveau en tant qu'intervenant(e) ?", which records how
 * experienced the SPEAKER is. The two read almost identically and mean entirely
 * different things; only this one belongs on the schedule.
 */
export const LEVEL_QUESTION_ID: Partial<Record<Edition, number>> = {
  2026: 4,
};

/** Per-speaker answers, keyed by Pretalx person code. */
export type SpeakerEnrichment = Map<string, Partial<Record<SpeakerField, string>>>;

/** Talk level answers, keyed by submission code. */
export type LevelAnswers = Map<string, string>;

function readToken(): string | undefined {
  const direct = process.env.PRETALX_API_TOKEN?.trim();
  if (direct) return direct;
  const path = process.env.PRETALX_API_TOKEN_FILE?.trim();
  if (!path) return undefined;
  try {
    // Docker BuildKit mounts secrets as files; a trailing newline is normal.
    const body = readFileSync(path, "utf8").trim();
    return body || undefined;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[pretalx] PRETALX_API_TOKEN_FILE unreadable (${msg})`);
    return undefined;
  }
}

/**
 * How to obtain a token, appended to whichever error surfaces first.
 */
const TOKEN_HELP =
  "Set PRETALX_API_TOKEN, or PRETALX_API_TOKEN_FILE to a file containing it. " +
  `Create one at ${PRETALX_BASE}/orga/me with read access to questions and answers.`;

/** Thrown when there is no token at all, so the policy check has one thing to catch. */
class MissingTokenError extends Error {
  constructor() {
    super(`No API token. ${TOKEN_HELP}`);
    this.name = "MissingTokenError";
  }
}

/**
 * 401/403 — the token is wrong or under-permissioned.
 *
 * Grouped with `MissingTokenError` as a CONFIGURATION failure: it is our
 * mistake, retrying cannot fix it, and it must never be degraded past.
 */
class PretalxAuthError extends Error {
  constructor(status: number, what: string) {
    super(`HTTP ${status} fetching ${what} — token rejected or lacking access. ${TOKEN_HELP}`);
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

/** True for the failures that mean "we configured this wrong", not "Pretalx is down". */
function isConfigurationFailure(err: unknown): boolean {
  return err instanceof MissingTokenError || err instanceof PretalxAuthError;
}

/**
 * Resolve the token or throw.
 *
 * Deliberately not deciding whether that is fatal: "no token" and "the fetch
 * failed" are the same policy — no data, and the flag says whether shipping
 * without it is acceptable — so `degradeOnFailure` is the single place that
 * reads `PRETALX_TOKEN_REQUIRED`. Checking it here too produced an error that
 * asserted the flag twice and buried this message inside a generic wrapper.
 */
export function requireToken(): string {
  const token = readToken();
  if (!token) throw new MissingTokenError();
  return token;
}

const PAGE_SIZE = 50;
/** Backstop for a non-advancing cursor; see `fetchAllPages`. */
const MAX_PAGES = 200;

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
 * Fetch every page of a paginated endpoint.
 *
 * Pretalx caps page size well below what `limit` requests — asking for 400 returns
 * 50 — so a single request silently truncates. Always follow `next`.
 */
async function fetchAllPages<T>(
  url: string,
  token: string,
  what: string,
  timeoutMs = 30000,
): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  // A `next` that points back at a page already fetched would loop forever:
  // the per-request timeout bounds each hop, nothing bounds the walk. The
  // largest endpoint here is ~310 rows at PAGE_SIZE, so this cap is far above
  // any real crawl and only trips on a cursor that is not advancing.
  let pages = 0;
  while (next) {
    if (++pages > MAX_PAGES) {
      throw new Error(`[pretalx] ${what} exceeded ${MAX_PAGES} pages — cursor is not advancing`);
    }
    const body = await fetchPage<T>(next, token, what, timeoutMs);
    out.push(...body.results);
    next = body.next ? reanchor(body.next) : null;
  }
  return out;
}

/** Backoff between attempts. Length is the retry count; short, since this blocks a build. */
const RETRY_DELAYS_MS = [500, 2000, 5000];

/**
 * Fetch one page, retrying only what a retry can actually fix.
 *
 * A dropped connection, a timeout, a 5xx or a 429 is Pretalx being briefly
 * unavailable, and most real outages are brief. A 401/403 is our token being
 * wrong and any other 4xx is our request being wrong — retrying those just
 * makes the build slower before it fails the same way.
 */
async function fetchPage<T>(
  url: string,
  token: string,
  what: string,
  timeoutMs: number,
): Promise<{ results: T[]; next: string | null }> {
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
      return (await res.json()) as { results: T[]; next: string | null };
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
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    console.warn(
      `[pretalx] ${what}: ${msg} — retrying in ${delay}ms ` +
        `(${attempt + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }
}

interface PretalxAnswer {
  question: number;
  answer: string;
  person: string | null;
  submission: string | null;
}

function answersUrl(eventSlug: string, questionId: number): string {
  return `${PRETALX_BASE}/api/events/${eventSlug}/answers/?question=${questionId}&limit=${PAGE_SIZE}`;
}

/**
 * Memoised per event slug.
 *
 * `fetchTextOrFallback` memoises the public reads, so `loadSessions` is cheap
 * after its first call. These authenticated crawls had no such cache: every
 * caller re-ran a full paginated walk. A build currently calls each once — Astro
 * runs `getStaticPaths` a single time per route — but that is a property of the
 * page layout, not a guarantee, and one `loadSessions()` added to a per-page
 * render would quietly multiply it by the number of speakers.
 *
 * The key is the event slug ALONE, not the allowlist — so a second caller
 * passing a NARROWER set would be served the wider cached map. That is safe
 * only because both callers derive their set from the same memoised export,
 * and because consumers read the map with `.get(code)` for a code taken from
 * the public export rather than iterating it. Narrow the allowlist for one
 * caller and you must key the cache on it too.
 */
const ENRICHMENT_CACHE = new Map<string, Promise<SpeakerEnrichment>>();
const LEVEL_CACHE = new Map<string, Promise<LevelAnswers>>();

/**
 * Run an authenticated read, degrading rather than failing on a transient error.
 *
 * Without this, the snapshot fallback below it was unreachable: `fetchScheduleExport`
 * falls back to the committed export when Pretalx is down, and the very next call
 * would then throw on the same outage — so a blip that the public path survives
 * killed the build anyway.
 *
 * `PRETALX_TOKEN_REQUIRED=1` keeps the strict behaviour where it matters: a
 * release must not ship a speakers page with no affiliations, so there it still
 * throws. Local builds warn and carry on.
 *
 * Under that flag the two failure kinds are NOT the same, though they were
 * treated as one:
 *
 * - A missing or rejected token is a CONFIGURATION error. Ours, permanent until
 *   someone fixes it, and always fatal — degrading past it is how a release
 *   silently ships every affiliation blank.
 * - An unreachable Pretalx is an OUTAGE. Not ours, usually brief (hence the
 *   retries in `fetchPage`), and the public half of the build has already
 *   fallen back to the committed snapshot by the time we get here. Failing
 *   anyway made that fallback unreachable in the one environment that sets this
 *   flag, so a Pretalx blip blocked every deploy — including deploys that had
 *   nothing to do with the schedule.
 *
 * A sustained outage is still fatal by default, because shipping a speakers page
 * with no affiliations and a schedule with no level chips is a visible
 * regression that should be a decision rather than an accident.
 * `PRETALX_ALLOW_DEGRADED=1` is that decision, made explicitly and logged.
 */
async function degradeOnFailure<T>(what: string, run: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.PRETALX_TOKEN_REQUIRED === "1") {
      if (isConfigurationFailure(err)) {
        throw new Error(`[pretalx] ${what}: ${msg} (PRETALX_TOKEN_REQUIRED=1)`);
      }
      if (process.env.PRETALX_ALLOW_DEGRADED !== "1") {
        throw new Error(
          `[pretalx] ${what}: ${msg} (PRETALX_TOKEN_REQUIRED=1). Pretalx looks ` +
            `unreachable rather than misconfigured, and the retries are spent. ` +
            `Set PRETALX_ALLOW_DEGRADED=1 to ship this build anyway — it will ` +
            `have no speaker affiliations and no level chips.`,
        );
      }
      console.warn(
        `[pretalx] ${what}: ${msg} — PRETALX_ALLOW_DEGRADED=1, shipping without it. ` +
          `Rebuild once Pretalx is back.`,
      );
      return empty;
    }
    console.warn(
      `[pretalx] ${what}: ${msg} — continuing without it. ` +
        `Fine for local work, never for a release.`,
    );
    return empty;
  }
}

/**
 * Speaker fields for exactly the people in `allowedPersonCodes`.
 *
 * Returns an empty map when there is no token, so callers degrade rather than
 * crash — `requireToken` has already decided whether that is acceptable.
 */
export async function loadSpeakerEnrichment(
  year: Edition,
  eventSlug: string,
  allowedPersonCodes: ReadonlySet<string>,
): Promise<SpeakerEnrichment> {
  const cached = ENRICHMENT_CACHE.get(eventSlug);
  if (cached) return cached;

  const promise = degradeOnFailure(
    "speaker enrichment",
    async () => {
      const token = requireToken();
      const out: SpeakerEnrichment = new Map();
      const questions = SPEAKER_QUESTIONS[year];
      if (!questions) {
        throw new Error(
          `No speaker question ids configured for ${year} in SPEAKER_QUESTIONS. ` +
            `Pretalx ids are per-question, not per-event — list them with ` +
            `GET /api/events/${eventSlug}/questions/ and add the mapping.`,
        );
      }

      // The six questions are independent — each only writes its own key — so
      // fetch them concurrently. Sequentially this was the sum of six paginated
      // crawls; now it is the slowest one.
      const perField = await Promise.all(
        (Object.entries(questions) as [SpeakerField, number][]).map(
          async ([field, questionId]) => ({
            field,
            answers: await fetchAllPages<PretalxAnswer>(
              answersUrl(eventSlug, questionId),
              token,
              `speaker field "${field}" (question ${questionId})`,
            ),
          }),
        ),
      );

      for (const { field, answers } of perField) {
        for (const a of answers) {
          // Allowlist: a person absent from the released schedule never reaches the site.
          if (!a.person || !allowedPersonCodes.has(a.person)) continue;
          const value = (a.answer || "").trim();
          if (!value) continue;
          const entry = out.get(a.person) ?? {};
          entry[field] = value;
          out.set(a.person, entry);
        }
      }
      console.log(
        `[pretalx] speaker enrichment: ${out.size}/${allowedPersonCodes.size} people have at least one field`,
      );
      return out;
    },
    new Map() as SpeakerEnrichment,
  );

  ENRICHMENT_CACHE.set(eventSlug, promise);
  return promise;
}

/** Raw "Niveau de la présentation" answers for the given submissions. */
export async function loadLevelAnswers(
  year: Edition,
  eventSlug: string,
  allowedSubmissionCodes: ReadonlySet<string>,
): Promise<LevelAnswers> {
  const cached = LEVEL_CACHE.get(eventSlug);
  if (cached) return cached;

  const promise = degradeOnFailure(
    "talk levels",
    async () => {
      const token = requireToken();
      const out: LevelAnswers = new Map();
      const questionId = LEVEL_QUESTION_ID[year];
      if (!questionId) {
        throw new Error(
          `No level question id configured for ${year} in LEVEL_QUESTION_ID. ` +
            `List them with GET /api/events/${eventSlug}/questions/ and add the mapping.`,
        );
      }

      const answers = await fetchAllPages<PretalxAnswer>(
        answersUrl(eventSlug, questionId),
        token,
        `talk level (question ${questionId})`,
      );
      for (const a of answers) {
        if (!a.submission || !allowedSubmissionCodes.has(a.submission)) continue;
        const value = (a.answer || "").trim();
        if (value) out.set(a.submission, value);
      }
      console.log(
        `[pretalx] levels: ${out.size}/${allowedSubmissionCodes.size} scheduled talks answered`,
      );
      return out;
    },
    new Map() as LevelAnswers,
  );

  LEVEL_CACHE.set(eventSlug, promise);
  return promise;
}
