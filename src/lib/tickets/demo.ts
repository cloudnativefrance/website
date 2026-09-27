/**
 * Hidden demo routes for the ticketing page, and the gate on unfinished values.
 *
 * The demo exists so the ticketing team can walk the page through every phase
 * on staging before it replaces /billetterie. It must never reach a production
 * build: the gate reads the build's origin, the same fail-closed rule as
 * `src/lib/preview-fixture.ts` — an unset or empty PUBLIC_SITE_URL means
 * production, so a misconfigured pipeline hides the demo rather than
 * publishing it. `astro dev` always has it.
 *
 * The same rule decides whether a draft value may be shown: a production build
 * refuses the page while the config still holds one (`assertShippable`).
 */
import type { Phase } from "@/config/tickets";
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

const DEMO_BASE = "/billetterie/demo";

export interface DemoState {
  /** Undefined on the entry URL: the page then shows the config's own phase. */
  phase?: Phase;
}

export function demoPath(phase?: Phase): string {
  return phase ? `${DEMO_BASE}/${PHASE_SLUGS[phase]}/` : `${DEMO_BASE}/`;
}

/** Every demo URL as `[...demo]` route params, the entry URL first. */
export function demoStaticPaths(): Array<{ params: { demo: string }; props: DemoState }> {
  return [
    { params: { demo: "demo" }, props: {} },
    ...DEMO_PHASES.map((phase) => ({ params: { demo: `demo/${PHASE_SLUGS[phase]}` }, props: { phase } })),
  ];
}
