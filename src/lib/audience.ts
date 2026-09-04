import { normalise } from "./schedule-filter";

/**
 * Which audience a session belongs to.
 *
 * Derived from the TRACK, never the room. Room-derived membership breaks
 * silently the day a leadership keynote is moved to a bigger room for capacity,
 * or a technical talk is scheduled into Eiffel: the session lands in the wrong
 * lens with no error anywhere. The track follows the session wherever it goes.
 *
 * A SET of track names rather than one, currently holding a single entry. A set
 * costs nothing today and avoids a rework if the leadership programme later
 * splits (a "Strategy" and a "Leadership" track, say).
 */
export type Audience = "tech" | "leadership";

/**
 * Track names that place a session in the leadership lens.
 *
 * Must match the track name as Pretalx serves it. Compared accent- and
 * case-insensitively so a cosmetic rename in Pretalx does not silently move
 * every leadership session into the technical lens — which would look like a
 * scheduling error rather than a configuration one.
 */
export const LEADERSHIP_TRACKS: readonly string[] = ["Strategy & Leadership"];

const foldTrack = (track: string) => normalise(track.trim());

const LEADERSHIP_FOLDED = new Set(LEADERSHIP_TRACKS.map(foldTrack));

export function audienceOf(track: string): Audience {
  return LEADERSHIP_FOLDED.has(foldTrack(track)) ? "leadership" : "tech";
}

/**
 * Whether an edition has both audiences, and therefore needs the control.
 *
 * False for an edition that is entirely one or the other — including a
 * hypothetical all-leadership edition. One lens means no choice to offer, and
 * an absent control is better than a control with one option.
 */
export function hasBothAudiences(sessions: readonly { track: string }[]): boolean {
  let tech = false;
  let leadership = false;
  for (const s of sessions) {
    if (audienceOf(s.track) === "leadership") leadership = true;
    else tech = true;
    if (tech && leadership) return true;
  }
  return false;
}
