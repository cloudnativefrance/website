import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SessionFormat = "keynote" | "talk" | "lightning" | "workshop";
export type SessionStatus = "confirmed" | "tentative" | "cancelled" | "hidden";
export type SessionLevel = "beginner" | "intermediate" | "advanced" | "";

export interface SessionRow {
  id: string;
  title: string;
  /** Array of speaker refs — either a slug matching src/content/speakers/*.md, or a full name if we don't have a profile. */
  speakers: string[];
  /** Optional thematic track (e.g. 'FinOps'). Free text; empty when not classified. */
  track: string;
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
  status: SessionStatus;
  description: string;
}

/**
 * Minimal CSV parser — handles RFC-4180-style quoted fields with escaped `""`.
 * Not a general purpose CSV lib; tailored to the known shape of sessions.csv.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const row: string[] = [];
    let field = "";
    let inQuotes = false;

    while (i < n) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        // Skip \r\n
        if (ch === "\r" && text[i + 1] === "\n") i++;
        i++;
        break;
      } else {
        field += ch;
        i++;
      }
    }

    // End-of-file flush when the file doesn't end with a newline
    if (i >= n && (field.length > 0 || row.length > 0)) {
      row.push(field);
    }

    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }

  return rows;
}

/** Resolve the absolute path of the bootstrap CSV (repo-committed fallback). */
function getCsvPath(): string {
  return join(process.cwd(), "src/content/schedule/sessions.csv");
}

/** Load all sessions from the committed CSV. */
export function loadSessions(): SessionRow[] {
  const raw = readFileSync(getCsvPath(), "utf8");
  const rows = parseCsv(raw);
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  const idx = (col: string) => header.indexOf(col);

  const iId = idx("id");
  const iTitle = idx("title");
  const iSpeakers = idx("speakers");
  const iTrack = idx("track");
  const iLevel = idx("level");
  const iRoom = idx("room");
  const iFormat = idx("format");
  const iStart = idx("start_time");
  const iDuration = idx("duration_min");
  const iTags = idx("tags");
  const iFeedback = idx("feedback_url");
  const iStatus = idx("status");
  const iDescription = idx("description");

  return body
    .map((r): SessionRow => ({
      id: r[iId] ?? "",
      title: r[iTitle] ?? "",
      speakers: (r[iSpeakers] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      track: r[iTrack] ?? "",
      level: iLevel >= 0 ? ((r[iLevel] as SessionLevel) || "") : "",
      room: r[iRoom] ?? "",
      format: ((r[iFormat] as SessionFormat) || "talk"),
      startTime: r[iStart] ?? "",
      durationMin: Number(r[iDuration] ?? 0),
      tags: (r[iTags] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      feedbackUrl: r[iFeedback] ?? "",
      status: ((r[iStatus] as SessionStatus) || "confirmed"),
      description: r[iDescription] ?? "",
    }))
    .filter((s) => s.status !== "hidden" && s.id);
}

/** Unique sorted room list from a set of sessions. */
export function listRooms(sessions: SessionRow[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) if (s.room) set.add(s.room);
  return Array.from(set).sort();
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
    `UID:${session.id}@cloudnativedays.fr`,
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
