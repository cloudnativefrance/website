import type { Edition } from "./editions";
// Type-only: schedule.ts imports this module at runtime, so a value import here
// would create a cycle. TypeScript erases `import type`.
import type {
  SessionFormat,
  SessionLanguage,
  SessionLevel,
  SessionRow,
} from "./schedule";
import { fetchTextOrFallback } from "./remote-fetch";
import { SPEAKER_SLUGS } from "../data/speaker-slugs";

export const PRETALX_BASE =
  process.env.PRETALX_BASE_URL || "https://cfp.cloudnativedays.fr";

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

/**
 * The event slug /cfp points submitters at: the newest edition flagged `cfpOpen`.
 *
 * Deliberately independent of `access`. When the 2027 event opens for proposals it
 * will be `access: "preview"` (nothing released yet) and `cfpOpen: true` — pointing
 * the CFP at it must not disturb how the programme is fetched or whether it renders.
 */
export function pickCfpEvent(
  events: Partial<Record<Edition, PretalxEventEntry>> = PRETALX_EVENT,
): string {
  const open = Object.entries(events)
    .filter(([, e]) => e?.cfpOpen)
    .sort(([a], [b]) => Number(b) - Number(a));
  if (open.length === 0) {
    throw new Error(
      "[pretalx] no edition in PRETALX_EVENT is flagged cfpOpen — /cfp has nowhere " +
        "to send submitters. Set cfpOpen on the edition currently accepting proposals.",
    );
  }
  return open[0][1]!.slug;
}

export function cfpEventUrl(): string {
  return `${PRETALX_BASE}/${pickCfpEvent()}/`;
}

/**
 * The same URL as a display string: no scheme, no trailing slash.
 *
 * Both /cfp pages printed this under the submit button and each carried its own
 * copy of the two `.replace()` calls, so the FR and EN pages could quietly
 * start rendering the link differently.
 */
export function cfpEventLabel(): string {
  return cfpEventUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function scheduleExportUrl(slug: string): string {
  return `${PRETALX_BASE}/${slug}/schedule/export/schedule.json`;
}

/**
 * Map a "Niveau de la présentation" answer to the site's level union.
 *
 * "Tout public" is not "débutant" — the speaker said *anyone can follow this*,
 * not *this is basic*. It maps to `beginner` because that is the union's lowest
 * rung, and `schedule.level.beginner` is labelled "Tout public" / "All levels"
 * in `src/i18n/ui.ts` so the display matches what the speaker actually answered.
 * Keep those two in step if either ever changes.
 *
 * Unknown answers return "" rather than guessing: an unclassified talk simply
 * has no level chip, which is how the UI already handles missing data.
 */
export function toLevel(answer: string | undefined): SessionLevel {
  switch ((answer || "").trim().toLowerCase()) {
    case "tout public":
      return "beginner";
    case "intermédiaire":
    case "intermediaire":
      return "intermediate";
    case "confirmé":
    case "confirme":
      return "advanced";
    default:
      return "";
  }
}

// -- Export document shape (c3voc/frab schema, as emitted by pretalx 2026.2.1) --

export interface PretalxResource {
  title: string;
  url: string;
  type?: string;
}

export interface PretalxPerson {
  code: string;
  name: string;
  public_name?: string;
  avatar?: string | null;
  biography?: string | null;
}

export interface PretalxTalk {
  code: string;
  title: string;
  subtitle?: string;
  /** ISO 8601 start, offset included, e.g. 2026-02-03T10:30:00+01:00 */
  date: string;
  /** "HH:MM" */
  duration: string;
  room: string;
  track: string | null;
  type: string;
  language: string;
  abstract: string | null;
  description: string | null;
  logo: string | null;
  url: string;
  feedback_url?: string;
  persons: PretalxPerson[];
  links?: PretalxResource[];
  attachments?: PretalxResource[];
}

export interface PretalxScheduleExport {
  schedule: {
    version: string;
    conference: {
      title: string;
      tracks: { name: string; slug: string; color: string }[];
      days: { date: string; rooms: Record<string, PretalxTalk[]> }[];
    };
  };
}

/** Maps a Pretalx person name to the speaker slug the site routes on. */
export type SpeakerResolver = (personName: string, talkCode: string) => string;

// -- Normalization ---------------------------------------------------------

/** "01:15" -> 75. Throws rather than silently yielding NaN. */
export function durationToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Pretalx: unparseable duration ${JSON.stringify(hhmm)}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Submission type alone is not enough: two 10-minute sessions are typed
 * "Conférence" / "Retour d'expérience". Duration is the honest signal, and this
 * rule reproduces the Sheet's hand-classification on all 51 talks.
 */
export function toFormat(type: string, durationMin: number): SessionFormat {
  if (/^keynote/i.test(type)) return "keynote";
  if (durationMin <= 15) return "lightning";
  return "talk";
}

const VIDEO_HOST = /(?:youtube\.com|youtu\.be|vimeo\.com)/i;
const SLIDES_LABEL = /slide|deck|pr[ée]sentation/i;
const REPLAY_LABEL = /replay|vid[ée]o|video|rediff/i;

/** Pretalx emits uploaded files as site-relative paths; links are absolute. */
function absolutise(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${PRETALX_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function pickResource(
  talk: PretalxTalk,
  match: (r: PretalxResource) => boolean,
): string {
  // Organisers should not have to care whether something was uploaded as a file
  // or pasted as a URL, so scan both buckets.
  const all = [...(talk.links ?? []), ...(talk.attachments ?? [])];
  const hit = all.find(match);
  return hit ? absolutise(hit.url) : "";
}

/**
 * A talk's replay/recording resource URL, or "" when none is attached. Scans
 * both `links` and `attachments`, matching on video hostname or a
 * replay-labelled resource title.
 *
 * This is the single source of truth for "does this talk have a replay" —
 * `toSessionRows` uses it to populate `recordingUrl`, and
 * `scripts/sync-pretalx.ts` uses it for the replay count it prints, so the
 * two never disagree the way a restated inline rule could drift.
 */
export function talkRecordingUrl(talk: PretalxTalk): string {
  return pickResource(talk, (r) => VIDEO_HOST.test(r.url) || REPLAY_LABEL.test(r.title));
}

/**
 * Every talk in a released export, flattened.
 *
 * The export nests days -> rooms -> talks, and three separate consumers need to
 * walk it (session rows, the allowlist of codes, the set of people). One shared
 * traversal means a change to the export's shape is a single edit with a single
 * compiler error, not three copies that drift.
 */
export function allTalks(doc: PretalxScheduleExport): PretalxTalk[] {
  return doc.schedule.conference.days.flatMap((day) =>
    Object.values(day.rooms).flatMap((talks) => talks),
  );
}

/** Every talk code in a released export — the allowlist for authenticated reads. */
export function collectTalkCodes(doc: PretalxScheduleExport): string[] {
  return allTalks(doc).map((t) => t.code);
}

export function toSessionRows(
  doc: PretalxScheduleExport,
  resolveSpeaker: SpeakerResolver,
  /** Raw "Niveau de la présentation" answers by talk code; empty without a token. */
  levels: ReadonlyMap<string, string> = new Map(),
): SessionRow[] {
  const conference = doc.schedule.conference;
  const trackColor = new Map(conference.tracks.map((t) => [t.name, t.color]));

  const rows: SessionRow[] = [];
  for (const talk of allTalks(doc)) {
    {
      {
        const durationMin = durationToMinutes(talk.duration);
        const track = talk.track ?? "";
        rows.push({
          id: talk.code,
          title: talk.title,
          speakers: talk.persons.map((p) => resolveSpeaker(p.name, talk.code)),
          track,
          trackColor: trackColor.get(track),
          level: toLevel(levels.get(talk.code)),
          room: talk.room,
          format: toFormat(talk.type, durationMin),
          startTime: talk.date,
          durationMin,
          tags: [],
          feedbackUrl: talk.feedback_url ?? "",
          slidesUrl: pickResource(talk, (r) => SLIDES_LABEL.test(r.title)),
          recordingUrl: talkRecordingUrl(talk),
          coverImageUrl: talk.logo ? absolutise(talk.logo) : "",
          language: (talk.language as SessionLanguage) || "",
          // The export contains only talks in the released schedule version.
          status: "confirmed",
          description: talk.description ?? talk.abstract ?? "",
        });
      }
    }
  }

  // The export groups by room, so impose a stable order the site can rely on.
  return rows.sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.room.localeCompare(b.room),
  );
}

// -- Speaker resolution and fetch layer -------------------------------------

/**
 * Build a Pretalx-name -> site-slug resolver from the speakers Sheet.
 *
 * The Sheet's `speakers` column holds slugs, and speaker URLs plus
 * getTalksForSpeaker() route on them, so the normalizer must emit slugs too.
 * Slugifying the Pretalx name is not good enough: the Sheet uses shortened
 * slugs ("petazzoni" for "Jérôme Petazzoni") and that approach misses 8 of 67.
 * Exact match on the `name` column hits 67/67.
 */
/**
 * Resolve a Pretalx person name to the slug the site routes on.
 *
 * The map is `src/data/speaker-slugs.ts`, committed to the repo — not the
 * speakers Sheet. Slugs are URL identity: `/intervenants/petazzoni` is live, and
 * eight of them are hand-shortened in ways no rule derives from the name, so
 * they cannot be generated and must not be able to drift when a Sheet tab is
 * edited or emptied.
 *
 * An unknown name throws. Emitting the raw name would produce
 * `/intervenants/Jérôme%20Petazzoni` — a 404 that renders as a working link.
 */
export function buildSpeakerResolver(
  slugs: Readonly<Record<string, string>> = SPEAKER_SLUGS,
): SpeakerResolver {
  return (personName, talkCode) => {
    const slug = slugs[personName.trim()];
    if (!slug) {
      throw new Error(
        `Pretalx speaker "${personName}" (talk ${talkCode}) has no entry in ` +
          `src/data/speaker-slugs.ts. Add one keyed by their exact Pretalx name.`,
      );
    }
    return slug;
  };
}


export async function fetchScheduleExport(
  year: Edition,
  slug: string,
): Promise<PretalxScheduleExport> {
  const body = await fetchTextOrFallback({
    url: scheduleExportUrl(slug),
    fallbackRelPath: `src/content/schedule/pretalx-${year}.json`,
    label: `pretalx-${year}.json`,
    validate: (text) => {
      const doc = JSON.parse(text) as Partial<PretalxScheduleExport>;
      const days = doc?.schedule?.conference?.days;
      if (!Array.isArray(days) || days.length === 0) {
        throw new Error("Pretalx export has no schedule days");
      }
      // The structural precondition (days present) isn't enough: a fresh event,
      // a reset schedule version, or a released-but-empty version all satisfy it
      // while carrying zero talks. That would render the "coming soon" empty
      // state with the build succeeding silently, leaving the committed 51-talk
      // snapshot unused. Mirror scripts/sync-pretalx.ts's guard so both paths
      // agree on what counts as "no usable export".
      const talkCount = days.reduce(
        (sum, day) => sum + Object.values(day.rooms ?? {}).flat().length,
        0,
      );
      if (talkCount === 0) {
        throw new Error("Pretalx export contains no talks");
      }
    },
  });
  // `validate` above only runs on a remote body — the readFileSync fallback path
  // in fetchTextOrFallback returns unvalidated. If Pretalx is unreachable *and*
  // the committed snapshot is corrupt, this parse is the only thing that would
  // fail, and a bare SyntaxError names no file. Name it here instead.
  const snapshotPath = `src/content/schedule/pretalx-${year}.json`;
  try {
    return JSON.parse(body) as PretalxScheduleExport;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[pretalx] ${snapshotPath} is not valid JSON: ${msg}`);
  }
}
