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
 * 2. **Nothing is cached to disk.** Fetched at build time and discarded.
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

/**
 * Join the wip schedule's slots to their submissions and shape the result as
 * `SessionRow[]`.
 *
 * Pure — no network, so the test suite exercises this directly. Iterates
 * `slots`, not `submissions`: a slot whose submission is missing is dropped,
 * and a submission with no slot in the wip schedule is never visited at all.
 * That is the allowlist rule from the module docstring, enforced by the shape
 * of the loop rather than by a separate filter step.
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
  const byCode = new Map(submissions.map((s) => [s.code, s] as const));

  const rows: SessionRow[] = [];
  for (const slot of slots) {
    const submission = byCode.get(slot.submission);
    if (!submission) continue;

    const durationMin = submission.duration;
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
      status: slot.is_visible === false ? "hidden" : "confirmed",
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
 * The same slot→submission join `toPreviewSessions` walks, restated because
 * that function returns rows rather than codes — and `/speakers/` must never be
 * iterated directly (module docstring, rule 1).
 *
 * An INVISIBLE slot is skipped here, exactly as its session is dropped at
 * `loadSessions`'s exit filter. Without that the two halves were asymmetric:
 * a talk the organisers had deliberately hidden left the grid, but still
 * published its speaker's `SpeakerRecord` and their `/intervenants/<year>/<slug>`
 * page — name, bio, employer and photo, for a talk nobody was meant to see yet.
 * A person with a second, visible slot still qualifies through that one.
 *
 * Pure, so the asymmetry is testable without a network stub.
 */
export function scheduledPersonCodes(
  slots: readonly PreviewSlot[],
  submissions: readonly PreviewSubmission[],
): Set<string> {
  const byCode = new Map(submissions.map((s) => [s.code, s] as const));
  const codes = new Set<string>();
  for (const slot of slots) {
    if (slot.is_visible === false) continue;
    const submission = byCode.get(slot.submission);
    if (!submission) continue;
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

export async function loadPreviewEdition(
  year: Edition,
  slug: string,
): Promise<PreviewEdition> {
  const key = `${year}:${slug}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<PreviewEdition> => {
    const token = requireToken();
    const scheduleId = await fetchWipScheduleId(slug, token);
    const [slots, submissions, rooms, speakers] = await Promise.all([
      fetchPreviewSlots(slug, scheduleId, token),
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
