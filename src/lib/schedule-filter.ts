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
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function facetMatches(selected: Set<string>, value: string): boolean {
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

/** A labelled break between two slots. */
export interface Gap {
  afterSlotIndex: number;
  /** "HH:MM" when the previous slot finishes. */
  startTime: string;
  /** "HH:MM" when the next slot begins. */
  endTime: string;
  minutes: number;
}

/** Minutes past midnight, read from the ISO string without timezone maths. */
function minutesOf(iso: string): number {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

function hhmm(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Gaps between slots worth labelling as a break.
 *
 * Measured from the LATEST end in the slot: a slot holds parallel talks of
 * different lengths, so using the first session's end would invent a gap while
 * a 45-minute talk was still running.
 */
export function findGaps(slots: Slot[], minMinutes = 20): Gap[] {
  const gaps: Gap[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const endsAt = Math.max(
      ...slots[i].sessions.map((s) => minutesOf(s.startTime) + s.durationMin),
    );
    const nextStart = minutesOf(slots[i + 1].startTime);
    const minutes = nextStart - endsAt;
    if (minutes >= minMinutes) {
      gaps.push({
        afterSlotIndex: i,
        startTime: hhmm(endsAt),
        endTime: hhmm(nextStart),
        minutes,
      });
    }
  }
  return gaps;
}
