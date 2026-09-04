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
 * 2. **This client never persists a response.** The values are fetched at build
 *    time, held in the two memo maps below for the life of the process, and
 *    discarded with it — nothing here writes a file, and no snapshot of these
 *    answers is committed. What the build does with the mapped values
 *    afterwards is a separate question: `loadSpeakerEnrichment`'s output is
 *    merged into `SpeakerRecord`s that `src/content.config.ts` writes into
 *    Astro's content store under `.astro/`, a build artefact absent from the
 *    runtime image. A speaker asking to be removed is still handled by deleting
 *    them in Pretalx and rebuilding; there is no git history to rewrite.
 */
import { readFileSync } from "node:fs";
import type { Edition } from "./editions";
import { PRETALX_BASE } from "./pretalx";
import { localised, type Localised } from "./pretalx-preview-api";
import {
  PAGE_SIZE,
  PretalxAuthError,
  PretalxHttpError,
  TOKEN_HELP,
  asString,
  fetchAllPages,
  messageOf,
} from "./pretalx-http";

// `reanchor` moved into the shared HTTP layer with the rest of the pagination
// logic; re-exported so its tests (tests/build/pretalx-levels.test.ts) and any
// existing importer keep the path they had.
export { reanchor } from "./pretalx-http";

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
  2027: { company: 32, role: 33, linkedin: 34, github: 35, bluesky: 36, website: 37 },
};

/**
 * "Niveau de la présentation" — how demanding the TALK is.
 *
 * Pinned by id, not by matching on the word "niveau": on both 2026 (question 1)
 * and 2027 (question 23) there is a second question, "Quel est votre niveau en
 * tant qu'intervenant(e) ?", which records how experienced the SPEAKER is. The
 * two read almost identically, their option sets overlap, and only one belongs
 * on the schedule.
 *
 * An id alone is not proof it is still the right one — a question could be
 * deleted and its id reused, or this constant edited by hand and pointed at
 * the wrong row. `assertLevelQuestionText` / `verifyLevelQuestion` below fetch
 * the id's actual text at build time and refuse to proceed if it does not look
 * like the talk-level question; every reader of this map (`loadLevelAnswers`
 * here, `loadPreviewEdition` in pretalx-preview.ts) calls one of them before
 * trusting the id.
 */
export const LEVEL_QUESTION_ID: Partial<Record<Edition, number>> = {
  2026: 4,
  2027: 22,
};

/** Per-speaker answers, keyed by Pretalx person code. */
export type SpeakerEnrichment = Map<string, Partial<Record<SpeakerField, string>>>;

/** Talk level answers, keyed by submission code. */
export type LevelAnswers = Map<string, string>;

/** Exported so sibling loaders reuse one token resolution, not three copies. */
export function readToken(): string | undefined {
  const direct = process.env.PRETALX_API_TOKEN?.trim();
  if (direct) return direct;
  const path = process.env.PRETALX_API_TOKEN_FILE?.trim();
  if (!path) return undefined;
  try {
    // Docker BuildKit mounts secrets as files; a trailing newline is normal.
    const body = readFileSync(path, "utf8").trim();
    return body || undefined;
  } catch (err) {
    console.warn(`[pretalx] PRETALX_API_TOKEN_FILE unreadable (${messageOf(err)})`);
    return undefined;
  }
}

/** Thrown when there is no token at all, so the policy check has one thing to catch. */
class MissingTokenError extends Error {
  constructor() {
    super(`No API token. ${TOKEN_HELP}`);
    this.name = "MissingTokenError";
  }
}

/** Raised when an edition has no question-id mapping — ours to fix, never an outage. */
class MissingQuestionIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingQuestionIdError";
  }
}

/**
 * Raised by `assertLevelQuestionText` when `LEVEL_QUESTION_ID[year]` does not
 * point at the talk-level question — see that function for the check itself.
 * Ours to fix, never an outage: grouped with `MissingQuestionIdError` in
 * `isConfigurationFailure` and never degraded past, because a wrong question
 * id does not fail the build — it ships every level chip wrong on an
 * otherwise green one, which is strictly worse than shipping none.
 */
class LevelQuestionMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LevelQuestionMismatchError";
  }
}

/**
 * True for the failures that mean "we configured this wrong", not "Pretalx is
 * down" — the ones PRETALX_ALLOW_DEGRADED must never wave through.
 *
 * A non-retryable HTTP error belongs here too. A 404 or a 400 is our request
 * being wrong, which `PretalxHttpError` already knows via `retryable`; without
 * this the build told the operator Pretalx looked unreachable and advised them
 * to set PRETALX_ALLOW_DEGRADED, which shipped a release with every company and
 * role blank — the precise regression the flag exists to prevent.
 */
function isConfigurationFailure(err: unknown): boolean {
  if (err instanceof MissingTokenError) return true;
  if (err instanceof PretalxAuthError) return true;
  if (err instanceof MissingQuestionIdError) return true;
  if (err instanceof LevelQuestionMismatchError) return true;
  return err instanceof PretalxHttpError && !err.retryable;
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

/**
 * One row of `GET /answers/`, narrowed to the three fields this module reads.
 *
 * The endpoint returns more than this. `projectAnswer` below builds a fresh
 * object rather than asserting a type over the raw row, so the rest never
 * enters memory — see rule 3 in `pretalx-http.ts`. `question` is deliberately
 * absent: the URL already filters by question id, so nothing here re-reads it.
 */
interface PretalxAnswer {
  answer: string;
  person: string | null;
  submission: string | null;
}

/**
 * Narrow one raw `/answers/` row.
 *
 * The coercions preserve the previous behaviour exactly: consumers already
 * wrote `(a.answer || "").trim()` and `if (!a.person)`, so a missing value
 * arriving as `""`/`null` reads the same as the `undefined` an unchecked
 * `res.json() as T` used to hand them.
 */
function projectAnswer(row: unknown): PretalxAnswer {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    answer: asString(r.answer),
    person: typeof r.person === "string" ? r.person : null,
    submission: typeof r.submission === "string" ? r.submission : null,
  };
}

function answersUrl(eventSlug: string, questionId: number): string {
  return `${PRETALX_BASE}/api/events/${eventSlug}/answers/?question=${questionId}&limit=${PAGE_SIZE}`;
}

// -- Level-question hardening ------------------------------------------------
//
// `LEVEL_QUESTION_ID[year]` is a number someone typed by hand from a `curl`
// output. Nothing before this stopped a transposed digit, or the id of the
// SPEAKER-experience question ("Quel est votre niveau en tant
// qu'intervenant(e) ?") being copied in by mistake, from silently shipping
// every level chip wrong on an otherwise green build — plausible values, all
// of them meaningless, because the design spec's first draft of this check
// ("does the text contain the word niveau?") passes on EITHER question: both
// contain it. That is not a hypothetical — it is the exact mistake that draft
// made.

/** One row of `GET /questions/`, narrowed to id and localised text. */
interface PretalxQuestionRow {
  id: number;
  text: Localised;
}

function questionsUrl(eventSlug: string): string {
  return `${PRETALX_BASE}/api/events/${eventSlug}/questions/?limit=${PAGE_SIZE}`;
}

function projectQuestionRow(row: unknown): PretalxQuestionRow {
  const r = (row ?? {}) as Record<string, unknown>;
  const id = typeof r.id === "number" ? r.id : -1;
  const question = r.question;
  const text =
    typeof question === "string" || (question && typeof question === "object")
      ? (question as Localised)
      : "";
  return { id, text };
}

/**
 * Every question's id and localised text for the event, fetched once per
 * build and memoised per slug — this is the ONE extra authenticated request
 * `verifyLevelQuestion` costs, beyond what `loadLevelAnswers` /
 * `loadPreviewEdition` already make. `/answers/?question=<id>` (the endpoint
 * both readers use for the actual data) never echoes the question's own text,
 * only ids — this is the cheapest correct way to see it.
 */
const QUESTION_TEXT_CACHE = new Map<string, Promise<Map<number, string>>>();

function fetchQuestionTexts(
  eventSlug: string,
  token: string,
): Promise<Map<number, string>> {
  const cached = QUESTION_TEXT_CACHE.get(eventSlug);
  if (cached) return cached;
  const promise = fetchAllPages<PretalxQuestionRow>({
    url: questionsUrl(eventSlug),
    token,
    what: `questions for ${eventSlug}`,
    project: projectQuestionRow,
  }).then((rows) => new Map(rows.map((q) => [q.id, localised(q.text)])));
  QUESTION_TEXT_CACHE.set(eventSlug, promise);
  return promise;
}

/**
 * Confirms `questionId` is actually "Niveau de la présentation" (the TALK's
 * level) rather than its near-identical sibling, "Quel est votre niveau en
 * tant qu'intervenant(e) ?" (the SPEAKER's own experience) — see
 * `LEVEL_QUESTION_ID` above for why the two must never be swapped.
 *
 * "Contains niveau" is NOT the check, on purpose: both questions contain that
 * word, so a check that only looked for it would pass on either one — the
 * exact swap this function exists to catch. The rule is instead two-sided:
 * the text must contain "niveau" AND must NOT contain "intervenant". That is
 * the actual semantic split between "how demanding is the TALK" and "how
 * experienced is the SPEAKER" rather than a substring the two happen to
 * share, so id 23's real 2027 text ("Quel est votre niveau en tant
 * qu'intervenant(e) ?") is correctly rejected — it contains both words — while
 * id 22's ("Niveau de la présentation") passes.
 *
 * A pure function of the fetched text, so it is unit-testable without a
 * network stub: the three cases that matter are the right question passing,
 * id 23's text being rejected, and a missing/renamed question (no id 22 in
 * the response at all) being rejected too.
 */
export function assertLevelQuestionText(
  year: Edition,
  eventSlug: string,
  questionId: number,
  text: string | undefined,
): void {
  const normalized = (text ?? "").toLowerCase();
  const mentionsLevel = normalized.includes("niveau");
  const mentionsSpeakerExperience = normalized.includes("intervenant");
  if (mentionsLevel && !mentionsSpeakerExperience) return;

  throw new LevelQuestionMismatchError(
    `[pretalx] LEVEL_QUESTION_ID[${year}] = ${questionId} on event "${eventSlug}" does ` +
      `not look like the talk-level question. Its text is ` +
      `${text ? JSON.stringify(text) : "(no question with that id in GET /questions/)"}, ` +
      `but the talk-level question must contain "niveau" and must NOT contain ` +
      `"intervenant" (e.g. "Niveau de la présentation"). This is very likely question ` +
      `23, "Quel est votre niveau en tant qu'intervenant(e) ?" — the SPEAKER's own ` +
      `experience, which reads almost identically but means something else, and reading ` +
      `it as the level would ship every level chip wrong on an otherwise green build. ` +
      `Fix LEVEL_QUESTION_ID[${year}] in pretalx-private.ts; do not remove this check.`,
  );
}

/**
 * Fetches `questionId`'s text for `eventSlug` and asserts it is the
 * talk-level question. Exported so both live Pretalx readers run the exact
 * same check before trusting `LEVEL_QUESTION_ID[year]`: `loadLevelAnswers`
 * below (released schedule) and `loadPreviewEdition` in `pretalx-preview.ts`
 * (wip schedule, no release yet).
 */
export async function verifyLevelQuestion(
  year: Edition,
  eventSlug: string,
  questionId: number,
  token: string,
): Promise<void> {
  const texts = await fetchQuestionTexts(eventSlug, token);
  assertLevelQuestionText(year, eventSlug, questionId, texts.get(questionId));
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
    const msg = messageOf(err);
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
        throw new MissingQuestionIdError(
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
            answers: await fetchAllPages<PretalxAnswer>({
              url: answersUrl(eventSlug, questionId),
              token,
              what: `speaker field "${field}" (question ${questionId})`,
              project: projectAnswer,
            }),
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
        throw new MissingQuestionIdError(
          `No level question id configured for ${year} in LEVEL_QUESTION_ID. ` +
            `List them with GET /api/events/${eventSlug}/questions/ and add the mapping.`,
        );
      }

      // Refuse to read answers for a question that is not actually the
      // talk-level one — see assertLevelQuestionText's docstring. Runs before
      // the answers fetch below: a wrong id must fail loudly, never blank the
      // level or (worse) silently render the speaker-experience answer as it.
      await verifyLevelQuestion(year, eventSlug, questionId, token);

      const answers = await fetchAllPages<PretalxAnswer>({
        url: answersUrl(eventSlug, questionId),
        token,
        what: `talk level (question ${questionId})`,
        project: projectAnswer,
      });
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
