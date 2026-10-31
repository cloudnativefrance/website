/**
 * The Programme demo: one pre-rendered page per phase under /programme/demo/
 * and /en/programme/demo/, switched from the same "DÉMO" pill as the CFP.
 *
 * Rides on the CFP demo's switch (`CFP_DEMO`, src/lib/cfp/demo.ts) rather than
 * a second one: three of its four phases ARE the CFP's phases, and the two
 * demos are previewed together. Production refuses that switch, so these
 * pages cannot exist on cloudnativedays.fr.
 */
import type { Locale } from "@/i18n/ui";
import { getLocalePath } from "@/i18n/utils";
import { PROGRAMME_PHASES, type ProgrammePhase } from "@/lib/programme-phase";

export { cfpDemosEnabled as programmeDemosEnabled } from "@/lib/cfp/demo";

const PHASE_SLUGS: Record<ProgrammePhase, string> = {
  coming_soon: "cfp-avant-ouverture",
  open: "cfp-ouvert",
  closed: "cfp-cloture",
  announced: "annonce",
};

/** /programme/demo/cfp-ouvert/, /en/programme/demo/cfp-ouvert/. */
export function programmeDemoPath(phase: ProgrammePhase, lang: Locale): string {
  return `${getLocalePath(lang, "/programme/demo")}/${PHASE_SLUGS[phase]}/`;
}

export function programmeDemoStaticPaths() {
  return PROGRAMME_PHASES.map((phase) => ({
    params: { phase: PHASE_SLUGS[phase] },
    props: { phase },
  }));
}
