import { CURRENT_EDITION, type Edition } from "./editions";
import { loadFrozenArchive } from "./frozen-archive";
import {
  PRETALX_EVENT,
  collectTalkCodes,
  fetchScheduleExport,
  buildSpeakerResolver,
  toSessionRows,
} from "./pretalx";
import { loadLevelAnswers } from "./pretalx-private";
import { ui, type Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";

export type SessionFormat = "keynote" | "talk" | "lightning" | "workshop";
export type SessionStatus = "confirmed" | "tentative" | "cancelled" | "hidden";
export type SessionLevel = "beginner" | "intermediate" | "advanced" | "";
export type SessionLanguage = "fr" | "en" | "";

export interface SessionRow {
  id: string;
  title: string;
  /** Array of speaker slug references (every speaker has an entry in `src/data/speaker-slugs.ts`). */
  speakers: string[];
  /** Optional thematic track (e.g. 'FinOps'). Free text; empty when not classified. */
  track: string;
  /**
   * Curated per-track accent colour from Pretalx, as a hex string. Undefined for
   * archived editions and unclassified talks. Carried but not yet rendered — the
   * schedule redesign (PR 2) consumes it and drops the name-hash fallback.
   */
  trackColor?: string;
  /** Target audience proficiency. Empty when unclassified. */
  level: SessionLevel;
  /** Physical room — Monet / Debussy / Dumas / Piaf / Ravel. */
  room: string;
  format: SessionFormat;
  /** ISO 8601 start. */
  startTime: string;
  durationMin: number;
  tags: string[];
  feedbackUrl: string;
  /** Post-event: public slides deck URL. */
  slidesUrl: string;
  /** Post-event: YouTube / Vimeo recording. */
  recordingUrl: string;
  /** Session-level hero image shown in the detail modal. */
  coverImageUrl: string;
  /** Spoken language of the session. `fr` / `en` / '' when unknown. */
  language: SessionLanguage;
  status: SessionStatus;
  description: string;
}

/**
 * Load all sessions for an edition.
 *
 * Editions with a public Pretalx event are fetched from its released schedule
 * export at build time, falling back to the committed snapshot when Pretalx is
 * unreachable. Editions without one (2023, and 2027 until its event opens) read
 * a frozen JSON archive.
 */
export async function loadSessions(
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const slug = PRETALX_EVENT[year];
  let rows: SessionRow[];
  if (slug) {
    const doc = await fetchScheduleExport(year, slug);
    // Pure lookup against the committed slug map — no I/O, so nothing to await.
    const resolveSpeaker = buildSpeakerResolver();
    // The released export is the allowlist: levels are looked up only for talks
    // it already contains, so an unannounced submission cannot reach the site
    // through the authenticated answers endpoint.
    const scheduled = new Set(collectTalkCodes(doc));
    const levels = await loadLevelAnswers(year, slug, scheduled);
    rows = toSessionRows(doc, resolveSpeaker, levels);
  } else {
    rows = loadArchivedSessions(year);
  }

  // Applied at this single exit point so both the live Pretalx branch and the
  // archived-JSON branch honour the same contract, instead of duplicating the
  // predicate (or worse, only enforcing it on one branch).
  return rows.filter((s) => s.status !== "hidden" && s.id);
}

/**
 * `sessions-2027.json` is intentionally `[]`. Do not regenerate it from the Sheet:
 * that tab holds a contaminated scratch copy of the 2026 rows (identical ids, all
 * dated 2026-02-03, one with a Linear URL pasted into its title). 2027 gets real
 * data once its Pretalx event is public and `PRETALX_EVENT[2027]` is set.
 */
function loadArchivedSessions(year: Edition): SessionRow[] {
  return loadFrozenArchive<SessionRow>("sessions", year);
}

/**
 * Preferred room order in the schedule grid. Rooms encountered in the data
 * but not listed here are appended alphabetically after the priority set.
 */
const ROOM_ORDER = ["Monet", "Piaf", "Debussy", "Dumas"];

/** Unique room list ordered per the physical floor layout (falls back to alpha). */
export function listRooms(sessions: SessionRow[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) if (s.room) set.add(s.room);
  const priority: string[] = [];
  for (const r of ROOM_ORDER) {
    if (set.has(r)) {
      priority.push(r);
      set.delete(r);
    }
  }
  return [...priority, ...Array.from(set).sort()];
}

/** Unique sorted format list from a set of sessions. */
export function listFormats(sessions: SessionRow[]): SessionFormat[] {
  const set = new Set<SessionFormat>();
  for (const s of sessions) set.add(s.format);
  return Array.from(set).sort() as SessionFormat[];
}

/** Unique sorted thematic-track list (excludes empty values). */
export function listTracks(sessions: SessionRow[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) if (s.track) set.add(s.track);
  return Array.from(set).sort();
}

/** Unique sorted level list (excludes empty values). */
export function listLevels(sessions: SessionRow[]): SessionLevel[] {
  const set = new Set<SessionLevel>();
  for (const s of sessions) if (s.level) set.add(s.level);
  const order: SessionLevel[] = ["beginner", "intermediate", "advanced"];
  return order.filter((l) => set.has(l));
}

/** Format an ISO time to a short HH:mm label (local time of the ISO offset). */
export function formatTime(iso: string): string {
  if (!iso) return "";
  // Preserve the ISO offset — don't rely on the server's local timezone.
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

/** end-time string from start + duration. */
export function endTime(session: SessionRow): string {
  const m = session.startTime.match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  const mins = Number(m[1]) * 60 + Number(m[2]) + session.durationMin;
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const mn = String(mins % 60).padStart(2, "0");
  return `${h}:${mn}`;
}

/**
 * Which view a schedule page opens in by default.
 *
 * `list` for a past edition: the visitor is hunting a replay, and the room
 * column is noise. `grid` for a live or upcoming one: the visitor is
 * planning a day across parallel rooms, which is what the grid is for. An
 * edition with no sessions yet has nothing to be "past", so it defaults to
 * `grid` too.
 *
 * "Past" is whether the LAST session has actually ended, not whether the
 * edition's year is below some constant — the current edition's event date
 * passes months before its year number changes, and this function exists
 * for that edition.
 *
 * Unlike `formatTime`/`endTime`, this compares full instants rather than
 * extracting a wall-clock component, so it does not need their regex trick.
 * `.getHours()`-style getters read a Date in the *runtime's* local timezone,
 * which is the shift those two avoid; `new Date(iso).getTime()` instead
 * yields the absolute instant the ISO string's own offset encodes, and two
 * instants compare correctly with a plain `<` regardless of either side's
 * timezone. No timezone arithmetic of our own is introduced.
 */
export function defaultScheduleView(
  sessions: SessionRow[],
  now: Date = new Date(),
): "grid" | "list" {
  if (sessions.length === 0) return "grid";
  const lastSessionEndsAt = sessions.reduce(
    (latest, s) => Math.max(latest, new Date(s.startTime).getTime() + s.durationMin * 60_000),
    -Infinity,
  );
  return lastSessionEndsAt < now.getTime() ? "list" : "grid";
}

/** Round-trip an ISO datetime into the YYYYMMDDTHHMMSS format ICS wants, preserving the offset. */
function icsDate(iso: string): string {
  // Strip punctuation and keep up to seconds, remove the trailing offset (ics expects Z or floating).
  // The gist data is +01:00; convert to UTC for iCal using a naive offset parse.
  const d = new Date(iso);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const MM = String(d.getUTCMinutes()).padStart(2, "0");
  const SS = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
}

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 UIDs must be a single line of safe chars; strip anything else so
// a forged sheet `id` cell can't inject extra iCal properties.
function icsSafeUid(s: string): string {
  return s.replace(/[^A-Za-z0-9_.-]/g, "_");
}

/** Generate a single iCalendar (VEVENT) for one session. */
export function sessionToIcs(session: SessionRow): string {
  const start = new Date(session.startTime);
  const end = new Date(start.getTime() + session.durationMin * 60000).toISOString();
  const summary = session.title;
  const description = [
    session.speakers.join(", "),
    session.description,
    session.feedbackUrl ? `Feedback: ${session.feedbackUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const location = [session.room, "CENTQUATRE-PARIS, 5 rue Curial, 75019 Paris"]
    .filter(Boolean)
    .join(" / ");

  return [
    "BEGIN:VEVENT",
    `UID:${icsSafeUid(session.id)}@cloudnativedays.fr`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(session.startTime)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(location)}`,
    "END:VEVENT",
  ].join("\r\n");
}

/** Wrap VEVENTs in a VCALENDAR envelope. */
export function buildIcs(sessions: SessionRow[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cloud Native Days France 2027//Schedule//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...sessions.map(sessionToIcs),
    "END:VCALENDAR",
  ].join("\r\n");
}

const KNOWN_PROGRAMME_PDFS: Partial<Record<Edition, string>> = {
  2026: "/programme-cnd-france-2026.pdf",
};

export interface ProgrammeMetadata {
  railLabel: string;
  programmePdfUrl: string | undefined;
  programmePdfLabel: string;
}

export function getProgrammeMetadata(year: Edition, lang: Locale): ProgrammeMetadata {
  const t = useTranslations(lang);
  const yearKey = `schedule.rail_label.${year}`;
  const railLabel =
    (ui[lang] as Record<string, string>)[yearKey] ??
    (ui.fr as Record<string, string>)[yearKey] ??
    t("schedule.rail_label");

  const envOverride =
    typeof process !== "undefined"
      ? (process.env as Record<string, string | undefined>)[`PROGRAMME_PDF_URL_${year}`]
      : undefined;

  return {
    railLabel,
    programmePdfUrl: envOverride ?? KNOWN_PROGRAMME_PDFS[year],
    programmePdfLabel: t("schedule.download_pdf").replace("{year}", String(year)),
  };
}
