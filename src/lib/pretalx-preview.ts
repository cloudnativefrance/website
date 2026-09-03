/**
 * Maps an unreleased ("wip") Pretalx schedule into the site's existing
 * `SessionRow` / `SpeakerRecord` shapes, so consumers — the schedule grid,
 * speaker pages, the ICS feed — read the same fields regardless of which
 * ingestion path produced them.
 *
 * `pretalx-preview-api.ts` is the client: it fetches, retries and paginates.
 * This module only joins and reshapes what that client returns; the actual
 * requests happen in `loadPreviewEdition`, the memoised I/O wrapper around
 * the pure `toPreviewSessions` / `toPreviewSpeakers` functions below.
 *
 * Two rules inherited from `pretalx-private.ts` and `pretalx-preview-api.ts`,
 * both enforced here:
 *
 * 1. **The wip schedule's slots are the allowlist**, for speakers too. A
 *    person is only ever mapped when their code appears on a submission that
 *    has a VISIBLE slot in the wip schedule — never by iterating `/speakers/`
 *    directly, which (with a token) returns every person who ever submitted.
 *    Visibility matters on both halves: `scheduledPersonCodes` skips an
 *    invisible slot for the same reason `loadSessions` filters out its row.
 * 2. **The client never persists a response.** `pretalx-preview-api.ts` writes
 *    no file, and no snapshot of a preview edition is committed — the repo is
 *    public, which is why one cannot be. The mapped records this module
 *    returns do land in Astro's content store under `.astro/`
 *    (`src/content.config.ts` writes every `SpeakerRecord` there), which is a
 *    build artefact: staging-only, carrying no PII field, and absent from the
 *    runtime image nginx serves.
 */
import type { Edition } from "./editions";
// Type-only: schedule.ts and speaker-source.ts will import this module at
// runtime (Task 6), so a value import of either here would create a cycle.
import type { SessionRow, SessionLanguage } from "./schedule";
import type { SpeakerRecord } from "./speaker-source";
import {
  buildSpeakerResolver,
  toFormat,
  toLevel,
  type SpeakerResolver,
} from "./pretalx";
import {
  LEVEL_QUESTION_ID,
  SPEAKER_QUESTIONS,
  requireToken,
  type SpeakerField,
} from "./pretalx-private";
import {
  fetchPreviewSlots,
  fetchPreviewSpeakers,
  fetchPreviewSubmissions,
  fetchRoomNames,
  fetchWipScheduleId,
  localised,
  type PreviewSlot,
  type PreviewSpeaker,
  type PreviewSubmission,
} from "./pretalx-preview-api";
import { keynoteRoleFor } from "@/data/keynote-cast";

export interface PreviewEdition {
  sessions: SessionRow[];
  speakers: SpeakerRecord[];
}

/** One wip-schedule slot paired with the submission it schedules. */
export interface ScheduledTalk {
  slot: PreviewSlot;
  submission: PreviewSubmission;
  /**
   * Whether the organisers have this slot visible on the wip schedule.
   *
   * Derived HERE and nowhere else, which is the point of this type. The two
   * consumers below used to each restate the coercion, and they disagreed: the
   * session mapper honoured it and the speaker allowlist did not, so a talk the
   * organisers had deliberately hidden left the grid while still publishing its
   * speaker's name, bio, employer and photo.
   */
  visible: boolean;
}

/**
 * The one join between the wip schedule's slots and their submissions.
 *
 * Iterates `slots`, not `submissions`: a slot whose submission is missing is
 * dropped, and a submission with no slot in the wip schedule is never visited
 * at all. That is the allowlist rule from the module docstring, enforced by the
 * shape of the loop rather than by a separate filter step — and enforced once,
 * for sessions and for speakers alike.
 *
 * Order is preserved from `slots`; callers sort their own output.
 */
export function joinScheduledTalks(
  slots: readonly PreviewSlot[],
  submissions: readonly PreviewSubmission[],
): ScheduledTalk[] {
  const byCode = new Map(submissions.map((s) => [s.code, s] as const));
  const talks: ScheduledTalk[] = [];
  for (const slot of slots) {
    const submission = byCode.get(slot.submission);
    if (!submission) continue;
    // No coercion here. `projectSlot` already resolved the field to a strict
    // boolean that fails CLOSED on an unexpected shape; restating a looser rule
    // at this second site is how the two halves disagreed in the first place.
    talks.push({ slot, submission, visible: slot.is_visible });
  }
  return talks;
}

/**
 * Join the wip schedule's slots to their submissions and shape the result as
 * `SessionRow[]`.
 *
 * Pure — no network, so the test suite exercises this directly. The
 * slot/submission pairing comes from `joinScheduledTalks`; this function only
 * reshapes. An invisible slot still produces a row, marked `status: "hidden"`,
 * which `loadSessions`'s shared exit filter drops — the grid must not render it
 * and neither must any other consumer decide that for itself.
 *
 * `levelQuestionId` is `undefined` when the edition has no configured
 * question id yet (see `loadPreviewEdition`) — every row then gets
 * `level: ""` rather than throwing, which is this module's one deliberate
 * divergence from `pretalx-private.ts`'s fatal policy.
 */
export function toPreviewSessions(
  slots: readonly PreviewSlot[],
  submissions: readonly PreviewSubmission[],
  rooms: ReadonlyMap<number, string>,
  resolveSpeaker: SpeakerResolver,
  levelQuestionId: number | undefined,
): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const { slot, submission, visible } of joinScheduledTalks(slots, submissions)) {
    // The SLOT's duration wins. `submission.duration` is null whenever the
    // submission type's default applies — the ordinary case — and the fetch
    // boundary coerces that null to 0, which `toFormat` reads as a lightning
    // talk and the ICS feed as a zero-length event. `||`, not `??`: 0 is the
    // shape a missing value actually takes here, so it must fall through to
    // the submission's value the same way an absent field does.
    const durationMin = slot.duration || submission.duration;
    const levelAnswer =
      levelQuestionId === undefined
        ? undefined
        : submission.answers.find((a) => a.question.id === levelQuestionId)
            ?.answer;
    const contentLocale = submission.content_locale;
    const language: SessionLanguage =
      contentLocale === "fr" || contentLocale === "en" ? contentLocale : "";

    rows.push({
      id: submission.code,
      title: submission.title,
      speakers: submission.speakers.map((p) =>
        resolveSpeaker(p.name, submission.code),
      ),
      track: localised(submission.track?.name),
      trackColor: submission.track?.color,
      level: toLevel(levelAnswer),
      room: localised(rooms.get(slot.room)),
      format: toFormat(
        localised(submission.submission_type?.name),
        durationMin,
      ),
      startTime: slot.start,
      durationMin,
      tags: submission.tags,
      feedbackUrl: "",
      slidesUrl: "",
      recordingUrl: "",
      coverImageUrl: "",
      language,
      status: visible ? "confirmed" : "hidden",
      description: submission.description ?? submission.abstract ?? "",
    });
  }

  return rows.sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) || a.room.localeCompare(b.room),
  );
}

/**
 * Shape `/speakers/` rows as `SpeakerRecord[]`, restricted to `allowedCodes`.
 *
 * Pure, mirroring `toPreviewSessions`. `allowedCodes` is computed by
 * `loadPreviewEdition` from the same slot/submission join used for sessions —
 * a person who submitted but has no scheduled slot is never mapped, which is
 * the allowlist rule applied to `/speakers/` the way it is already applied to
 * `/submissions/`.
 *
 * `fieldQuestionIds` is `undefined` when `SPEAKER_QUESTIONS[year]` has no
 * entry yet; every record then gets blank company/role/socials rather than
 * throwing, for the same reason `toPreviewSessions` does not throw on a
 * missing level question id.
 *
 * `photo_fallback` is always `""`: the committed `public/speakers/<slug>.jpg`
 * fallback exists for people already announced on the public site, and a
 * preview edition's speakers are — by construction — not that.
 */
export function toPreviewSpeakers(
  speakers: readonly PreviewSpeaker[],
  allowedCodes: ReadonlySet<string>,
  resolveSpeaker: SpeakerResolver,
  fieldQuestionIds: Partial<Record<SpeakerField, number>> | undefined,
  year: Edition,
): SpeakerRecord[] {
  const records: SpeakerRecord[] = [];

  for (const speaker of speakers) {
    if (!allowedCodes.has(speaker.code)) continue;

    const slug = resolveSpeaker(speaker.name, speaker.code);
    const fields: Partial<Record<SpeakerField, string>> = {};
    if (fieldQuestionIds) {
      for (const [field, questionId] of Object.entries(
        fieldQuestionIds,
      ) as Array<[SpeakerField, number]>) {
        const value = speaker.answers
          .find((a) => a.question.id === questionId)
          ?.answer.trim();
        if (value) fields[field] = value;
      }
    }
    const role = keynoteRoleFor(year, slug);

    records.push({
      slug,
      name: speaker.name.trim(),
      photo_url: speaker.avatar_url ?? "",
      photo_fallback: "",
      company: fields.company ?? "",
      role: fields.role ?? "",
      bio: (speaker.biography ?? "").trim(),
      linkedin: fields.linkedin ?? "",
      github: fields.github ?? "",
      bluesky: fields.bluesky ?? "",
      website: fields.website ?? "",
      keynote: role !== undefined,
      keynote_size: role,
    });
  }

  return records.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * The person codes a preview edition is allowed to publish.
 *
 * The same `joinScheduledTalks` result `toPreviewSessions` reshapes, read for
 * codes rather than rows — and `/speakers/` must never be iterated directly
 * (module docstring, rule 1).
 *
 * An INVISIBLE slot is skipped here, exactly as its session is dropped at
 * `loadSessions`'s exit filter. Without that the two halves were asymmetric:
 * a talk the organisers had deliberately hidden left the grid, but still
 * published its speaker's `SpeakerRecord` and their `/intervenants/<year>/<slug>`
 * page — name, bio, employer and photo, for a talk nobody was meant to see yet.
 * That asymmetry was possible because each half owned its own copy of the join;
 * now there is one, and `visible` means the same thing on both sides. A person
 * with a second, visible slot still qualifies through that one.
 *
 * Pure, so the asymmetry is testable without a network stub.
 */
export function scheduledPersonCodes(
  slots: readonly PreviewSlot[],
  submissions: readonly PreviewSubmission[],
): Set<string> {
  const codes = new Set<string>();
  for (const { submission, visible } of joinScheduledTalks(slots, submissions)) {
    if (!visible) continue;
    for (const person of submission.speakers) codes.add(person.code);
  }
  return codes;
}

/**
 * Memoised per `(year, slug)` for the process lifetime — Astro invokes
 * loaders many times per build and every page must see the same data. The
 * promise itself is cached (not just its resolved value), matching
 * `pretalx-private.ts`'s `ENRICHMENT_CACHE`/`LEVEL_CACHE`: a build that hits a
 * genuine failure fails the same way on every subsequent call rather than
 * retrying per page.
 */
const CACHE = new Map<string, Promise<PreviewEdition>>();

/**
 * `PRETALX_ALLOW_DEGRADED` does NOT apply to this path. A deliberate choice,
 * not an omission — `pretalx-private.ts` wraps its reads in `degradeOnFailure`
 * and this module wraps nothing, so a failed preview read is always fatal,
 * whatever the flag says.
 *
 * Four reasons, in the order that decided it:
 *
 * 1. **There is nothing to degrade TO.** The private path degrades onto a
 *    committed snapshot the public half of the build has already loaded: the
 *    site still renders, minus affiliations and level chips. A preview edition
 *    has no snapshot beneath it and cannot have one — the repo is public, so
 *    committing an unreleased programme is the leak the whole design exists to
 *    prevent. "Degraded" here means the entire programme is missing.
 * 2. **An empty grid is indistinguishable from a legitimate one.** The spec
 *    lists "wip schedule has no slots yet → empty session list, build
 *    succeeds" as a success case. Degrading past an outage would produce a
 *    byte-identical result from a completely different cause, and the operator
 *    reviewing staging cannot tell which they are looking at.
 * 3. **The flag's own error text would become a lie.** It promises a build
 *    with "no speaker affiliations and no level chips" — a visible but partial
 *    loss. It has never promised, and must not quietly come to mean, "no
 *    schedule at all".
 * 4. **Nothing is unblocked by allowing it.** The override exists so a Pretalx
 *    outage cannot block a PRODUCTION deploy. Production never fetches a
 *    preview edition — that is the invariant — so no production deploy is ever
 *    held up by this code. Only staging is, and a staging build whose one
 *    purpose is to show the preview programme has nothing worth shipping when
 *    the programme cannot be read. Rebuild when Pretalx is back.
 *
 * `docs/superpowers/specs/2026-09-02-edition-2027-preview-design.md`'s failure
 * table records the same decision; change both together.
 */

export async function loadPreviewEdition(
  year: Edition,
  slug: string,
): Promise<PreviewEdition> {
  const key = `${year}:${slug}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<PreviewEdition> => {
    const token = requireToken();
    // Only the slot list depends on which schedule version is the wip one; the
    // other three are addressed by event slug alone. Starting all four together
    // takes the schedule-version round trip off the critical path instead of
    // making every other request queue behind it.
    const scheduleId = fetchWipScheduleId(slug, token);
    const [slots, submissions, rooms, speakers] = await Promise.all([
      scheduleId.then((id) => fetchPreviewSlots(slug, id, token)),
      fetchPreviewSubmissions(slug, token),
      fetchRoomNames(slug, token),
      fetchPreviewSpeakers(slug, token),
    ]);

    const resolveSpeaker = buildSpeakerResolver();

    // Neither question id is configured for a fixture event (democon has zero
    // questions) and 2027's cannot be read until its event exists — so these
    // warn once per build rather than throwing. See the module docstring and
    // the corresponding jsdoc on toPreviewSessions/toPreviewSpeakers.
    const levelQuestionId = LEVEL_QUESTION_ID[year];
    if (levelQuestionId === undefined) {
      console.warn(
        `[preview] no LEVEL_QUESTION_ID configured for ${year} — every session's ` +
          `level will be blank. Expected until the ${year} event exists in Pretalx ` +
          `and its question ids are read.`,
      );
    }
    const fieldQuestionIds = SPEAKER_QUESTIONS[year];
    if (!fieldQuestionIds) {
      console.warn(
        `[preview] no SPEAKER_QUESTIONS configured for ${year} — every speaker's ` +
          `company/role/socials will be blank. Expected until the ${year} event ` +
          `exists in Pretalx and its question ids are read.`,
      );
    }

    const sessions = toPreviewSessions(
      slots,
      submissions,
      rooms,
      resolveSpeaker,
      levelQuestionId,
    );

    const allowedPersonCodes = scheduledPersonCodes(slots, submissions);
    const speakerRecords = toPreviewSpeakers(
      speakers,
      allowedPersonCodes,
      resolveSpeaker,
      fieldQuestionIds,
      year,
    );

    console.log(
      `[preview] ${year} (${slug}): ${sessions.length} sessions, ${speakerRecords.length} speakers`,
    );
    return { sessions, speakers: speakerRecords };
  })();

  CACHE.set(key, promise);
  return promise;
}
