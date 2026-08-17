import type { SessionRow } from "./schedule";

/**
 * Filter and search state for the programme page.
 *
 * Facets are sets so a facet with several values reads as OR, while different
 * facets combine as AND — which is what a visitor expects from "Monet or Piaf,
 * but only lightning talks".
 */
export interface FilterState {
  room: Set<string>;
  format: Set<string>;
  track: Set<string>;
  level: Set<string>;
  query: string;
}

export function emptyFilterState(): FilterState {
  return {
    room: new Set(),
    format: new Set(),
    track: new Set(),
    level: new Set(),
    query: "",
  };
}

/**
 * Lowercase and strip diacritics so "securite" finds "sécurité".
 *
 * French talk titles are full of accents and nobody types them into a search
 * box, so an accent-sensitive match would fail on the majority of queries.
 */
export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** An empty facet means "no opinion"; several values in one mean OR. */
export function facetMatches(selected: Set<string>, value: string): boolean {
  return selected.size === 0 || selected.has(value);
}

export function matchesSession(
  session: SessionRow,
  state: FilterState,
  /** Display names for this session's speakers, so search can match them. */
  speakerNames: string[] = [],
): boolean {
  // A keynote occupies every room at once, so a room filter must not hide it —
  // it is the one session the entire audience is in.
  const roomOk = session.format === "keynote" || facetMatches(state.room, session.room);
  if (!roomOk) return false;
  if (!facetMatches(state.format, session.format)) return false;
  if (!facetMatches(state.track, session.track)) return false;
  if (!facetMatches(state.level, session.level)) return false;

  const query = normalise(state.query.trim());
  if (!query) return true;

  const haystack = normalise(
    [session.title, session.description, session.track, ...speakerNames].join(" "),
  );
  return haystack.includes(query);
}

/** Selected facet values, plus one for a non-empty query. */
export function activeFilterCount(state: FilterState): number {
  return (
    state.room.size +
    state.format.size +
    state.track.size +
    state.level.size +
    (state.query.trim() ? 1 : 0)
  );
}

/** Sessions sharing a start time, in chronological order. */
export interface Slot {
  startTime: string;
  sessions: SessionRow[];
}

export function groupIntoSlots(sessions: SessionRow[]): Slot[] {
  const byStart = new Map<string, SessionRow[]>();
  for (const session of sessions) {
    const list = byStart.get(session.startTime);
    if (list) list.push(session);
    else byStart.set(session.startTime, [session]);
  }
  return [...byStart.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startTime, list]) => ({ startTime, sessions: list }));
}

/** Where one session sits in the grid, as CSS grid line numbers. */
export interface GridPlacement {
  session: SessionRow;
  /** 1-based grid line the card starts on. */
  rowStart: number;
  /** Grid line the card ends on, exclusive — i.e. the session's end time. */
  rowEnd: number;
}

/** A stretch of the day with nothing running in any room. */
export interface GridGap {
  rowStart: number;
  rowEnd: number;
  startTime: string;
  endTime: string;
  minutes: number;
}

export interface TimeGrid {
  /** Number of row tracks. Grid lines run 1 … rowCount + 1. */
  rowCount: number;
  placements: GridPlacement[];
  /** Time labels for the gutter, at the lines where something starts. */
  labels: { line: number; label: string }[];
  gaps: GridGap[];
}

/**
 * Lay the day out so a card's height is its actual duration.
 *
 * The grid used to be one independent CSS grid per start time, stacked in a
 * flex column. Duration could not be expressed at all: every card in a row
 * stretched to the same height, so a 10-minute lightning talk looked exactly as
 * long as a 75-minute keynote, and the rows below a long talk sat empty in its
 * own column — reading as "nothing is on in Monet at 10:45" when the 10:30 talk
 * still had 30 minutes to run.
 *
 * Row lines are every distinct start AND end time, so a card can span from its
 * own start line to its own end line. Rows are content-sized rather than a
 * fixed pixels-per-minute scale: at a scale coarse enough to keep a 10-minute
 * card readable, this day would render about 8550px tall — taller than the list
 * view, which defeats the point of the grid. Content-sized rows keep the
 * ordering and the spans honest at roughly a third of that.
 *
 * Ordering uses absolute instants, so a multi-day edition cannot interleave
 * two days that share a wall-clock time.
 */
export function buildTimeGrid(sessions: SessionRow[], minGapMinutes = 20): TimeGrid {
  if (sessions.length === 0) return { rowCount: 0, placements: [], labels: [], gaps: [] };

  const spans = sessions.map((session) => {
    const startsAt = new Date(session.startTime).getTime();
    return { session, startsAt, endsAt: startsAt + session.durationMin * 60_000 };
  });

  // Sorted once and used twice below: the labels come out in line order, and
  // the first element is the earliest session, which the gap labels offset from.
  const byStart = [...spans].sort((a, b) => a.startsAt - b.startsAt);

  const boundaries = [...new Set(spans.flatMap((s) => [s.startsAt, s.endsAt]))].sort(
    (a, b) => a - b,
  );
  const lineOf = new Map(boundaries.map((value, index) => [value, index + 1]));
  const rowCount = boundaries.length - 1;
  /** The instant a grid line sits at. Lines are 1-based, `boundaries` is not. */
  const epochAt = (line: number) => boundaries[line - 1];

  const placements = spans.map(({ session, startsAt, endsAt }) => ({
    session,
    rowStart: lineOf.get(startsAt)!,
    rowEnd: lineOf.get(endsAt)!,
  }));

  // Only start times get a label. An end-only boundary — a lightning talk
  // finishing at 10:40 with nothing beginning there — would just be clutter,
  // and it is the one boundary kind with no ISO string to read the time off.
  const labels: { line: number; label: string }[] = [];
  const seen = new Set<number>();
  for (const { session, startsAt } of byStart) {
    const line = lineOf.get(startsAt)!;
    if (seen.has(line)) continue;
    seen.add(line);
    labels.push({ line, label: session.startTime.slice(11, 16) });
  }

  // Wall-clock labels are derived by offsetting from a session whose ISO string
  // we can read, never by formatting an epoch — `new Date(ms).getHours()` would
  // render the event in the BUILD MACHINE's timezone, so a UTC runner would
  // print an 12:10 break as 11:10.
  const reference = byStart[0];
  const refMinutes = minutesOf(reference.session.startTime);
  const labelAt = (epoch: number) =>
    hhmm(refMinutes + Math.round((epoch - reference.startsAt) / 60_000));

  // A gap is a row track no session covers. Derived from coverage rather than
  // from "the previous slot's end", which is why a slot holding a 10-minute and
  // a 45-minute talk in parallel cannot invent a break while the long one runs.
  const gaps: GridGap[] = [];
  let runStart: number | null = null;
  for (let row = 1; row <= rowCount; row++) {
    const covered = placements.some((p) => p.rowStart <= row && p.rowEnd > row);
    if (!covered && runStart === null) runStart = row;
    if ((covered || row === rowCount) && runStart !== null) {
      const runEnd = covered ? row : row + 1;
      const minutes = Math.round((epochAt(runEnd) - epochAt(runStart)) / 60_000);
      if (minutes >= minGapMinutes) {
        gaps.push({
          rowStart: runStart,
          rowEnd: runEnd,
          startTime: labelAt(epochAt(runStart)),
          endTime: labelAt(epochAt(runEnd)),
          minutes,
        });
      }
      runStart = null;
    }
  }

  return { rowCount, placements, labels, gaps };
}

/** Minutes past midnight, read from the ISO string without timezone maths. */
function minutesOf(iso: string): number {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

function hhmm(minutes: number): string {
  // Wrapped so a multi-day edition cannot print "25:30" for a second-day slot.
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const m = String(wrapped % 60).padStart(2, "0");
  return `${h}:${m}`;
}
