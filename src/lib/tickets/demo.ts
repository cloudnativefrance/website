/**
 * Hidden demo routes for the ticketing page, and the gate on unfinished values.
 *
 * /billetterie and /en/tickets serve the config's own phase everywhere. The
 * demo adds one page per phase under /billetterie/demo/ and /en/tickets/demo/
 * so the ticketing team can walk the whole season on staging, and a switcher
 * on every ticketing page. Neither may reach a production build: the gate
 * reads the build's origin, the same fail-closed rule as
 * `src/lib/preview-fixture.ts` — an unset or empty PUBLIC_SITE_URL means
 * production, so a misconfigured pipeline hides the demo rather than
 * publishing it. `astro dev` always has it.
 *
 * The same rule decides whether a draft value may be shown: a production build
 * refuses the page while the config still holds one (`assertShippable`).
 */
import type { Phase } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { getLocalePath } from "@/i18n/utils";
import { isProductionOrigin, resolveSiteOrigin } from "@/lib/site-env";

interface GateInput {
  env?: Record<string, string | undefined>;
  dev?: boolean;
}

export function ticketDemosEnabled({ env = process.env, dev = import.meta.env.DEV }: GateInput = {}): boolean {
  return dev || !isProductionOrigin(resolveSiteOrigin(env));
}

export function placeholdersAllowed(input: GateInput = {}): boolean {
  return ticketDemosEnabled(input);
}

export const DEMO_PHASES: readonly Phase[] = ["pre_opening", "seb", "eb", "regular", "last_chance"];

/** URL segments. The demo is internal, but tier ids are never shown to visitors. */
export const PHASE_SLUGS: Record<Phase, string> = {
  pre_opening: "avant-ouverture",
  seb: "super-early-bird",
  eb: "early-bird",
  regular: "regular",
  last_chance: "last-chance",
};

/** The URL of one simulated phase: /billetterie/demo/early-bird/, /en/tickets/demo/early-bird/. */
export function demoPath(phase: Phase, lang: Locale): string {
  return `${getLocalePath(lang, "/tickets/demo")}/${PHASE_SLUGS[phase]}/`;
}

/** Every demo phase as `demo/[phase]` route params — the same slugs in both languages. */
export function demoStaticPaths(): Array<{ params: { phase: string }; props: { phase: Phase } }> {
  return DEMO_PHASES.map((phase) => ({ params: { phase: PHASE_SLUGS[phase] }, props: { phase } }));
}
