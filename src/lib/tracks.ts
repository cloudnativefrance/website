import { PRETALX_BASE } from "./pretalx";
import { PRETALX_EVENT } from "./edition-registry";
import { readToken } from "./pretalx-private";
import { messageOf } from "./pretalx-http";
import { localised } from "./pretalx-preview-api";
import type { Edition } from "./editions";

/** One parcours as the organisers wrote it in Pretalx. */
export interface EventTrack {
  name: string;
  /** Pretalx's own ordering. Absent on a track nobody has ranked. */
  position?: number;
  /** Empty when nobody has written one; the caller decides whether to render. */
  description: string;
  color?: string;
}

/**
 * The edition's parcours, straight from Pretalx.
 *
 * NOT derived from the sessions. `listTracks(sessions)` only knows the tracks
 * that already have a talk on the grid, which is wrong for a page that exists
 * to tell people what they can submit to — before the CFP closes, most
 * parcours have nothing in them yet.
 *
 * Descriptions live only on the REST API: the released schedule export carries
 * a track's name, colour and slug and nothing else. So this needs a token, and
 * without one it returns nothing rather than failing the build. A programme
 * page that renders without its parcours strip is a smaller problem than a
 * deploy that will not run, and the strip is presentational — every other part
 * of the page stands on its own.
 */
export async function loadEventTracks(year: Edition): Promise<EventTrack[]> {
  const slug = PRETALX_EVENT[year]?.slug;
  if (!slug) return [];
  const token = readToken();
  if (!token) return [];

  try {
    const res = await fetch(`${PRETALX_BASE}/api/events/${slug}/tracks/?limit=100`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) {
      console.warn(`[tracks] ${slug}: HTTP ${res.status} — the parcours strip will not render.`);
      return [];
    }
    const body: unknown = await res.json();
    const rows = (body as { results?: unknown[] })?.results;
    if (!Array.isArray(rows)) return [];

    return rows
      .map((row) => {
        const r = row as {
          name?: unknown; description?: unknown; color?: unknown; position?: unknown;
        };
        return {
          name: localised(r.name as never),
          description: localised(r.description as never),
          color: typeof r.color === "string" ? r.color : undefined,
          position: typeof r.position === "number" ? r.position : undefined,
        };
      })
      .filter((t) => t.name)
      // Ordered by the organisers, in Pretalx, not by the id the API happens to
      // return them in — creation order put the two newest parcours last, which
      // is the opposite of their priority. Anything unranked sorts to the end
      // rather than jumping the queue, and ties fall back to the name so the
      // build output is stable.
      .sort((a, b) => {
        const pa = a.position ?? Number.MAX_SAFE_INTEGER;
        const pb = b.position ?? Number.MAX_SAFE_INTEGER;
        return pa - pb || a.name.localeCompare(b.name, "fr");
      });
  } catch (err) {
    console.warn(`[tracks] ${slug}: ${messageOf(err)} — the parcours strip will not render.`);
    return [];
  }
}
