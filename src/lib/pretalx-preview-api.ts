/**
 * Authenticated reads of an UNRELEASED schedule.
 *
 * `pretalx.ts` is the public path: the released agenda export, fetched
 * anonymously. `pretalx-private.ts` reads non-public question answers for an
 * event whose schedule IS released. This module is the third case — an event
 * with no released schedule at all, whose grid exists only as a wip version.
 *
 * The transport is not restated here: `pretalx-http.ts` owns pagination,
 * re-anchoring, retries and the error taxonomy, and both authenticated readers
 * import it. This module is only the endpoint list and the row projections.
 *
 * Two rules inherited from `pretalx-private.ts`, both enforced here:
 *
 * 1. **The wip schedule's slots are the allowlist.** With a token,
 *    `/submissions/` returns rejected and pending proposals too. Only
 *    submissions that appear in a slot of the wip schedule may reach the site.
 * 2. **This client never persists a response.** Every request is made at build
 *    time and nothing here writes a file; there is no snapshot of a preview
 *    edition anywhere in the repo, and there deliberately cannot be — the repo
 *    is public. The mapped `SessionRow`s and `SpeakerRecord`s that come out of
 *    `pretalx-preview.ts` do land in Astro's content store under `.astro/`
 *    (`src/content.config.ts`), which is a build artefact, staging-only, and
 *    absent from the runtime image.
 *
 * **PII.** `/speakers/` returns `email` and `internal_notes`. `projectSpeaker`
 * below builds a new object from the five fields the mapper reads, so neither
 * ever exists in memory past the fetch boundary — see rule 3 in
 * `pretalx-http.ts` for why a `res.json() as T` is not good enough.
 */
import { PRETALX_BASE } from "./pretalx";
import {
  PAGE_SIZE,
  asNumber,
  asRecord,
  asString,
  fetchAllPages,
} from "./pretalx-http";

/** Log tag, so a preview build's warnings are attributable to this path. */
const LOG_PREFIX = "[preview]";

/** Localised Pretalx fields come back as `{ "fr": "...", "en": "..." }`, sometimes as a plain string. */
export type Localised = Record<string, string> | string;

/** One row of `GET /slots/` — a talk's placement on the grid. `room` is an id, not an object. */
export interface PreviewSlot {
  submission: string;
  room: number;
  start: string;
  is_visible: boolean;
  /**
   * Minutes, as SCHEDULED — the authoritative length of this talk.
   *
   * `submission.duration` is not: Pretalx leaves it null whenever the
   * submission type's default applies, which is the normal case for a talk
   * nobody edited the length of. The projection coerces that null to 0, and a
   * 0 makes `toFormat` return "lightning" (0 <= 15), so a 45-minute talk
   * rendered as a zero-height "lightning" card and got a DTEND equal to its
   * DTSTART in the ICS feed. The slot carries a real number on every row.
   */
  duration: number;
  /**
   * Which schedule version this slot belongs to.
   *
   * Read by exactly one thing — `fetchPreviewSlots`'s guard — and carried for
   * that reason alone. See the guard for why the request's own `?schedule=`
   * parameter is not enough.
   */
  schedule: number;
}

/** One answer, with `?expand=answers.question` so `question` arrives as an object. */
interface PreviewAnswer {
  question: { id: number };
  answer: string;
}

/**
 * One row of `GET /submissions/`, expanded so track/type/speakers arrive nested
 * rather than as ids.
 *
 * No `state`: the query pins `?state=confirmed`, so every row that arrives is
 * confirmed by construction and re-reading the field would only invite a second,
 * divergent filter.
 */
export interface PreviewSubmission {
  code: string;
  title: string;
  description: string | null;
  abstract: string | null;
  duration: number;
  content_locale: string;
  track: { name: Localised; color: string } | null;
  submission_type: { name: Localised } | null;
  speakers: Array<{ code: string; name: string }>;
  answers: PreviewAnswer[];
}

/** One row of `GET /schedules/` — a version of the schedule, released or not. */
interface PreviewScheduleVersion {
  id: number;
  /**
   * Whether this version has never been released.
   *
   * A boolean rather than the raw `published` date, because only the answer is
   * ever read and the coercion that produces it must happen once. See
   * `isUnpublished` below for why it is strict.
   */
  wip: boolean;
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

// -- Row projections --------------------------------------------------------
//
// Each builds a NEW object holding only the declared fields. None of them
// throws and none of them puts a body value into an error message: an
// unexpected shape degrades to an empty/zero value that `localised`, `toLevel`
// and `toFormat` already handle, rather than failing a build over a field
// nobody reads.
//
// **Two fields are exempt from that, because they grant something.** Degrading
// to a blank is right for a room name and wrong for a permission: an unexpected
// shape must never be read as a yes. Both below therefore demand the exact
// shape they are documented to have and DENY on anything else — see
// `slotIsVisible` and `isUnpublished`.

/**
 * Name a value's shape for a log line WITHOUT quoting it.
 *
 * `/speakers/` bodies carry `email` and `internal_notes`, and a projection's
 * warning goes to the same build log the retry warnings do — so these messages
 * say "string" or "absent", never what the string was. Same rule as
 * `PretalxParseError`.
 */
function shapeOf(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "absent";
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * One warning per field per build, not one per row.
 *
 * A renamed field is renamed on every row, and these endpoints return a few
 * hundred of them. The deny is the safety property; the warning only has to
 * make it attributable.
 */
const warnedFields = new Set<string>();

function warnUnexpectedShape(field: string, value: unknown, consequence: string): void {
  if (warnedFields.has(field)) return;
  warnedFields.add(field);
  console.warn(
    `${LOG_PREFIX} ${field} arrived as ${shapeOf(value)}, not the documented shape — ` +
      `${consequence} This is what a renamed or dropped Pretalx field looks like.`,
  );
}

/**
 * Is this slot visible on the wip schedule? Fails CLOSED.
 *
 * This decides whether an embargoed talk reaches the site, and — through
 * `scheduledPersonCodes` — whether its speaker's name, bio, employer and photo
 * do. It used to be `r.is_visible !== false`, so an absent, renamed or
 * string-valued field meant VISIBLE: exactly the embargoed-speaker leak the
 * shared visibility join was written to close, re-opened by a coercion.
 *
 * Only a literal `true` grants. Anything else hides the slot, which costs at
 * worst an incomplete staging grid and can never publish something unannounced.
 */
function slotIsVisible(value: unknown): boolean {
  if (value === true) return true;
  if (value !== false) {
    warnUnexpectedShape(
      "slots[].is_visible",
      value,
      "treating the slot as HIDDEN, so the preview grid may be short or empty.",
    );
  }
  return false;
}

/**
 * Has this schedule version never been released? Fails CLOSED.
 *
 * `null` is Pretalx's "not published"; a string is the publication timestamp.
 * The old reading — `typeof r.published === "string" ? r.published : null` —
 * collapsed *absent* into *null*, so a renamed field made every version look
 * unpublished and `fetchWipScheduleId` returned the first one, typically the
 * RELEASED one. That is precisely the stale grid its docstring promises it
 * refuses to serve, delivered silently.
 *
 * Only a literal `null` counts as wip. An unrecognised shape counts as
 * published, so no version qualifies and `fetchWipScheduleId` throws.
 */
function isUnpublished(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "string") {
    warnUnexpectedShape(
      "schedules[].published",
      value,
      "treating the version as RELEASED, so no version can qualify as wip.",
    );
  }
  return false;
}

function projectLocalised(value: unknown): Localised {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, string> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string") out[key] = v;
    }
    return out;
  }
  return "";
}

function projectAnswers(value: unknown): PreviewAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const r = asRecord(row);
    const question = asRecord(r.question);
    return { question: { id: asNumber(question.id) }, answer: asString(r.answer) };
  });
}

function projectSlot(row: unknown): PreviewSlot {
  const r = asRecord(row);
  return {
    submission: asString(r.submission),
    room: asNumber(r.room),
    start: asString(r.start),
    is_visible: slotIsVisible(r.is_visible),
    duration: asNumber(r.duration),
    schedule: asNumber(r.schedule),
  };
}

function projectSubmission(row: unknown): PreviewSubmission {
  const r = asRecord(row);
  const track = (r.track ?? null) as Record<string, unknown> | null;
  const type = (r.submission_type ?? null) as Record<string, unknown> | null;
  const speakers = Array.isArray(r.speakers) ? r.speakers : [];
  return {
    code: asString(r.code),
    title: asString(r.title),
    description: typeof r.description === "string" ? r.description : null,
    abstract: typeof r.abstract === "string" ? r.abstract : null,
    duration: asNumber(r.duration),
    content_locale: asString(r.content_locale),
    track: track
      ? { name: projectLocalised(track.name), color: asString(track.color) }
      : null,
    submission_type: type ? { name: projectLocalised(type.name) } : null,
    speakers: speakers.map((person) => {
      const p = asRecord(person);
      return { code: asString(p.code), name: asString(p.name) };
    }),
    answers: projectAnswers(r.answers),
  };
}

function projectScheduleVersion(row: unknown): PreviewScheduleVersion {
  const r = asRecord(row);
  return {
    id: asNumber(r.id),
    wip: isUnpublished(r.published),
  };
}

function projectRoom(row: unknown): PreviewRoom {
  const r = asRecord(row);
  return { id: asNumber(r.id), name: projectLocalised(r.name) };
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
  const versions = await fetchAllPages<PreviewScheduleVersion>({
    url: `${PRETALX_BASE}/api/events/${slug}/schedules/?limit=${PAGE_SIZE}`,
    token,
    what: `schedules for ${slug}`,
    project: projectScheduleVersion,
    logPrefix: LOG_PREFIX,
  });
  const wip = versions.find((v) => v.wip);
  if (!wip) {
    throw new Error(
      `[preview] event "${slug}" has no unpublished schedule version among the ` +
        `${versions.length} returned. A preview edition renders the wip schedule; ` +
        `refusing to fall back to a released one, which would silently show an older ` +
        `grid than the organisers are editing. If the event does have a wip version, ` +
        `check the warning above: an unrecognised "published" shape is read as ` +
        `RELEASED rather than guessed at.`,
    );
  }
  return wip.id;
}

/**
 * Every slot of the given schedule version. Always pinned with `?schedule=`,
 * never left to default — and then VERIFIED, because sending the parameter and
 * having it honoured are two different facts.
 *
 * `fetchWipScheduleId` exists to stop the released grid rendering in place of
 * the wip one, and it throws rather than fall back precisely because that
 * substitution is invisible: same rooms, same shape, older content. But an API
 * that ignored, renamed or dropped support for `?schedule=` would deliver the
 * released grid anyway, past a guard that had already "passed". The rows say
 * which version they belong to, so ask them.
 *
 * The filter is honoured today, across pagination — measured, not assumed.
 * This is a regression guard, and it is the only reason `PreviewSlot` carries
 * `schedule` at all.
 */
export async function fetchPreviewSlots(
  slug: string,
  scheduleId: number,
  token: string,
): Promise<PreviewSlot[]> {
  const slots = await fetchAllPages<PreviewSlot>({
    url: `${PRETALX_BASE}/api/events/${slug}/slots/?schedule=${scheduleId}&limit=${PAGE_SIZE}`,
    token,
    what: `slots for ${slug} (schedule ${scheduleId})`,
    project: projectSlot,
    logPrefix: LOG_PREFIX,
  });

  const foreign = slots.filter((slot) => slot.schedule !== scheduleId);
  if (foreign.length > 0) {
    // Ids only — these are integers, never body text. Same rule as everything
    // else this module logs.
    const versions = [...new Set(foreign.map((slot) => slot.schedule))].sort(
      (a, b) => a - b,
    );
    throw new Error(
      `[preview] GET /slots/?schedule=${scheduleId} for "${slug}" returned ` +
        `${foreign.length} of ${slots.length} rows belonging to schedule ` +
        `version(s) ${versions.join(", ")}. The wip schedule was resolved and ` +
        `requested, but the response is not it — rendering these rows would show ` +
        `a schedule nobody asked for, most likely the released one. Refusing, for ` +
        `the same reason fetchWipScheduleId refuses to fall back.`,
    );
  }
  return slots;
}

/**
 * Every CONFIRMED submission for the event.
 *
 * `?state=confirmed` is the first filter, per spec D-2. Without it the walk
 * pulls rejected and pending proposals into memory, and a proposal that is
 * slotted but not yet accepted would render as a real talk — the grid would
 * announce something the organisers have not decided.
 *
 * It is not the only filter: `/slots/` remains the allowlist, and the caller
 * must still join against the wip schedule's slots and discard anything without
 * one, per the module docstring. Confirmed-but-unslotted is just as unpublished
 * as slotted-but-unconfirmed.
 */
export async function fetchPreviewSubmissions(
  slug: string,
  token: string,
): Promise<PreviewSubmission[]> {
  return fetchAllPages<PreviewSubmission>({
    url:
      `${PRETALX_BASE}/api/events/${slug}/submissions/?state=confirmed` +
      `&expand=track,submission_type,speakers,answers.question&limit=${PAGE_SIZE}`,
    token,
    what: `submissions for ${slug}`,
    project: projectSubmission,
    logPrefix: LOG_PREFIX,
  });
}

/** Room id → localised name, for resolving `PreviewSlot.room`. */
export async function fetchRoomNames(
  slug: string,
  token: string,
): Promise<Map<number, string>> {
  const rooms = await fetchAllPages<PreviewRoom>({
    url: `${PRETALX_BASE}/api/events/${slug}/rooms/?limit=${PAGE_SIZE}`,
    token,
    what: `rooms for ${slug}`,
    project: projectRoom,
    logPrefix: LOG_PREFIX,
  });
  return new Map(rooms.map((r) => [r.id, localised(r.name)]));
}

/**
 * One row of `GET /speakers/`, narrowed to the fields the mapper is allowed to
 * read. The live endpoint also returns `email` and `internal_notes` — this type
 * omits both, and `projectSpeaker` enforces the omission rather than merely
 * declaring it.
 */
export interface PreviewSpeaker {
  code: string;
  name: string;
  biography: string | null;
  avatar_url: string | null;
  answers: PreviewAnswer[];
}

function projectSpeaker(row: unknown): PreviewSpeaker {
  const r = asRecord(row);
  return {
    code: asString(r.code),
    name: asString(r.name),
    biography: typeof r.biography === "string" ? r.biography : null,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
    answers: projectAnswers(r.answers),
  };
}

/**
 * Every speaker who ever submitted to the event — including people whose talk
 * was rejected or is still pending. Same allowlist rule as submissions: the
 * caller must filter to codes that appear on a submission scheduled in the
 * wip slot list before any of this reaches the site.
 *
 * `expand=answers.question` matches `fetchPreviewSubmissions`'s expand, so an
 * answer's `question` always arrives as `{ id, ... }` rather than a bare id.
 */
export async function fetchPreviewSpeakers(
  slug: string,
  token: string,
): Promise<PreviewSpeaker[]> {
  return fetchAllPages<PreviewSpeaker>({
    url: `${PRETALX_BASE}/api/events/${slug}/speakers/?expand=answers.question&limit=${PAGE_SIZE}`,
    token,
    what: `speakers for ${slug}`,
    project: projectSpeaker,
    logPrefix: LOG_PREFIX,
  });
}
