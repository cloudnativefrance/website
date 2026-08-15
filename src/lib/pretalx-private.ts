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
 * Resolve the token, or explain precisely what is missing.
 *
 * Absent token is fatal only when `PRETALX_TOKEN_REQUIRED=1`, which the
 * production image sets. Locally it degrades with a warning so that working on
 * layout does not require a credential — but shipping a speakers page stripped
 * of every company is a visible regression, so production fails instead.
 */
export function requireToken(): string | undefined {
  const token = readToken();
  if (token) return token;
  const required = process.env.PRETALX_TOKEN_REQUIRED === "1";
  const how =
    "Set PRETALX_API_TOKEN, or PRETALX_API_TOKEN_FILE to a file containing it. " +
    "Create one at " + PRETALX_BASE + "/orga/me with read access to questions and answers.";
  if (required) {
    throw new Error(`[pretalx] No API token, and PRETALX_TOKEN_REQUIRED=1. ${how}`);
  }
  console.warn(
    `[pretalx] No API token — speaker company/role/socials and talk levels will be ` +
      `empty in this build. Fine for local work, never for a release. ${how}`,
  );
  return undefined;
}

const PAGE_SIZE = 50;

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
  url.protocol = base.protocol;
  url.host = base.host;
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
  while (next) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(next, {
        signal: controller.signal,
        headers: {
          Authorization: `Token ${token}`,
          Accept: "application/json",
          "User-Agent": "cndfrance-website-build/1.0",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${what} from ${next}`);
      const body = (await res.json()) as { results: T[]; next: string | null };
      out.push(...body.results);
      next = body.next ? reanchor(body.next) : null;
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
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
 */
const ENRICHMENT_CACHE = new Map<string, Promise<SpeakerEnrichment>>();
const LEVEL_CACHE = new Map<string, Promise<LevelAnswers>>();

/** Test-only: drop the memo so cases can vary the environment independently. */
export function __clearPrivateCachesForTests(): void {
  ENRICHMENT_CACHE.clear();
  LEVEL_CACHE.clear();
}

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
 */
async function degradeOnFailure<T>(what: string, run: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.PRETALX_TOKEN_REQUIRED === "1") {
      throw new Error(`[pretalx] ${what} failed (${msg}), and PRETALX_TOKEN_REQUIRED=1.`);
    }
    console.warn(`[pretalx] ${what} failed (${msg}); continuing without it.`);
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
      if (!token) return out;
      const questions = SPEAKER_QUESTIONS[year];
      if (!questions) {
        throw new Error(
          `No speaker question ids configured for ${year} in SPEAKER_QUESTIONS. ` +
            `Pretalx ids are per-question, not per-event — list them with ` +
            `GET /api/events/${eventSlug}/questions/ and add the mapping.`,
        );
      }

      for (const [field, questionId] of Object.entries(questions) as [
        SpeakerField,
        number,
      ][]) {
        const answers = await fetchAllPages<PretalxAnswer>(
          answersUrl(eventSlug, questionId),
          token,
          `speaker field "${field}" (question ${questionId})`,
        );
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
      if (!token) return out;
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
