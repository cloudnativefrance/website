/**
 * The experience reports ("REX") of a past edition, read from its sessions.
 *
 * Since 2026 a REX carries its organisation in the title — "REX <Organisation>
 * - <topic>" — so the list on the ticketing page is derived from the Pretalx
 * data, never typed into a component.
 */
import type { SessionRow } from "@/lib/schedule";

const REX_TITLE = /^REX\s+(.+?)\s+[-–—]\s+/;

export interface RexSummary {
  sessions: number;
  /** Distinct organisations, in first-appearance order. */
  organisations: string[];
}

export function rexSummary(sessions: readonly SessionRow[]): RexSummary {
  const organisations: string[] = [];
  let count = 0;
  for (const session of sessions) {
    const match = REX_TITLE.exec(session.title);
    if (!match) continue;
    count++;
    const organisation = match[1].trim();
    if (!organisations.includes(organisation)) organisations.push(organisation);
  }
  return { sessions: count, organisations };
}
