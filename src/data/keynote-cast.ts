import type { Edition } from "@/lib/editions";

/**
 * The opening-keynote running order, per edition.
 *
 * This is not speaker metadata — it is the structure of one session: who hosts,
 * who gives the headline keynote, who appears as a guest, who sits on the panel.
 * It drives three different card treatments on the speakers page and changes
 * every edition, so it is editorial config and lives here rather than in Pretalx,
 * which has no field that could express it honestly.
 *
 * Slugs, so it stays readable and matches the URLs.
 */
export type KeynoteRole = "lead" | "guest" | "panel";

export interface KeynoteCast {
  /** Host and headline keynote — largest cards, MC badge. */
  lead: readonly string[];
  /** Invited keynote speakers — medium cards. */
  guest: readonly string[];
  /** Panel participants — compact cards. */
  panel: readonly string[];
}

export const KEYNOTE_CAST: Partial<Record<Edition, KeynoteCast>> = {
  2026: {
    lead: ["petazzoni", "ricardo-rocha"],
    guest: ["florian-caringi", "gaspard-plantrou", "jean-baptiste-kempf", "julien-dauphant", "renaud-fleury"],
    panel: ["denis-germain", "laurent-bernaille", "sebastien-blanc", "sherine-khoury", "victor-boissiere"],
  },
};

/** The role a speaker plays in the keynote, or undefined if they are not in it. */
export function keynoteRoleFor(year: Edition, slug: string): KeynoteRole | undefined {
  const cast = KEYNOTE_CAST[year];
  if (!cast) return undefined;
  if (cast.lead.includes(slug)) return "lead";
  if (cast.guest.includes(slug)) return "guest";
  if (cast.panel.includes(slug)) return "panel";
  return undefined;
}
