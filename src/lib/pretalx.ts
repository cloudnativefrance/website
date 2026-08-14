import type { Edition } from "./editions";
// Type-only: schedule.ts imports this module at runtime, so a value import here
// would create a cycle. TypeScript erases `import type`.
import type { SessionFormat, SessionLanguage, SessionRow } from "./schedule";

export const PRETALX_BASE =
  process.env.PRETALX_BASE_URL || "https://cfp.cloudnativedays.fr";

/**
 * Editions whose Pretalx event is public. 2023 predates the instance; 2027 is
 * added here the day its event goes public — until then the fetch would 404 on
 * every build, so it is deliberately absent rather than mapped and failing.
 */
export const PRETALX_EVENT: Partial<Record<Edition, string>> = {
  2026: "2026",
};

export function scheduleExportUrl(slug: string): string {
  return `${PRETALX_BASE}/${slug}/schedule/export/schedule.json`;
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

export function toSessionRows(
  doc: PretalxScheduleExport,
  resolveSpeaker: SpeakerResolver,
): SessionRow[] {
  const conference = doc.schedule.conference;
  const trackColor = new Map(conference.tracks.map((t) => [t.name, t.color]));

  const rows: SessionRow[] = [];
  for (const day of conference.days) {
    for (const talks of Object.values(day.rooms)) {
      for (const talk of talks) {
        const durationMin = durationToMinutes(talk.duration);
        const track = talk.track ?? "";
        rows.push({
          id: talk.code,
          title: talk.title,
          speakers: talk.persons.map((p) => resolveSpeaker(p.name, talk.code)),
          track,
          trackColor: trackColor.get(track),
          level: "",
          room: talk.room,
          format: toFormat(talk.type, durationMin),
          startTime: talk.date,
          durationMin,
          tags: [],
          feedbackUrl: talk.feedback_url ?? "",
          slidesUrl: pickResource(talk, (r) => SLIDES_LABEL.test(r.title)),
          recordingUrl: pickResource(
            talk,
            (r) => VIDEO_HOST.test(r.url) || REPLAY_LABEL.test(r.title),
          ),
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
