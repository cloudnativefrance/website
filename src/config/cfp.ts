/**
 * CFP registry: the only place the Call for Papers phase lives.
 *
 * There are no dates here. The CFP 2027 is not announced yet, so nothing can
 * flip the page automatically; a cron would only guess. Changing phase is
 * changing `currentPhase` and shipping: `coming_soon` serves the "ouvre
 * bientôt" newsletter page, `open` serves the CFP page itself, and `closed`
 * serves the "programme coming soon" page. Same commit-flipped mechanism as
 * the ticketing registry (`src/config/tickets.ts`).
 */

export type CfpPhase = "coming_soon" | "open" | "closed";

export interface CfpConfig {
  currentPhase: CfpPhase;
}

export const CFP: CfpConfig = {
  // Flip to "open" the day the CFP 2027 is announced.
  currentPhase: "coming_soon",
};
