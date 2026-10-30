/**
 * What the Programme section shows for an edition, and which editions the
 * Programme menu offers.
 *
 * Until its programme is announced, an upcoming edition's page follows the
 * CFP: it is being built from the proposals, so it says so and points at the
 * call — "opens soon", "submit a talk", "selection under way". The CFP's own
 * phase already says which of the three it is (`src/config/cfp.ts`), so there
 * is no second switch to keep in step with it.
 *
 * "announced" is the `programme` flag's DATE, read without FLAG_OVERRIDES.
 * Staging forces that flag on so `isEditionLoadable` lets it fetch the wip
 * grid for the demo (`src/lib/programme/demo.ts`), but its default pages must
 * read exactly as production will. Loadable and announced are two facts that
 * flip on different days on staging, so they are two answers here.
 */
// Relative imports: astro.config.mjs loads this module before the `@` alias
// exists, to point the /programme and /intervenants short links.
import { CFP, type CfpPhase } from "../config/cfp";
import { FLAGS } from "../config/flags";
import { getFlagState } from "./flags";
import {
  CURRENT_EDITION,
  EDITIONS_DESC,
  FIRST_PROGRAMME_EDITION,
  type Edition,
} from "./editions";

export type ProgrammePhase = CfpPhase | "announced";

export const PROGRAMME_PHASES: readonly ProgrammePhase[] = [
  "coming_soon",
  "open",
  "closed",
  "announced",
];

export function programmePhase(
  year: Edition,
  now: Date = new Date(),
): ProgrammePhase {
  // A finished edition's programme is, by definition, out.
  if (year <= CURRENT_EDITION) return "announced";
  return getFlagState(FLAGS.programme, now) === "active"
    ? "announced"
    : CFP.currentPhase;
}

/**
 * The edition the Programme menu leads with: the newest one, announced or not.
 * Before the announcement its page is the "being built" page, which is the
 * point — the menu entry is how a visitor finds the call for proposals.
 */
export const LEAD_EDITION: Edition = EDITIONS_DESC[0];

/**
 * Finished editions, one "Programme <year>" entry each. Not 2023: it has its
 * own /2023 retrospective in the About menu (see FIRST_PROGRAMME_EDITION).
 */
export const ARCHIVED_EDITIONS: readonly Edition[] = EDITIONS_DESC.filter(
  (y) => y !== LEAD_EDITION && y >= FIRST_PROGRAMME_EDITION,
);

/**
 * The edition whose speakers /intervenants leads with: the newest one with an
 * announced programme. A speakers page for an edition still being built would
 * be an empty promise, or worse, a list of people not yet told they were picked.
 */
export function speakersEdition(now?: Date): Edition {
  return (
    EDITIONS_DESC.find((y) => programmePhase(y, now) === "announced") ??
    CURRENT_EDITION
  );
}
