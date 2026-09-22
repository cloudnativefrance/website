/**
 * Hidden demo routes for the ticketing page, and the placeholder guard.
 *
 * The two demos (variant A and B) exist so the team can compare purchase paths
 * on staging before the real page replaces /billetterie. They must never reach
 * a production build: the gate reads the build's origin, the same fail-closed
 * rule as `src/lib/preview-fixture.ts` — an unset or empty PUBLIC_SITE_URL
 * means production, so a misconfigured pipeline hides the demos rather than
 * publishing them. `astro dev` always has them.
 *
 * The same rule decides whether an "À confirmer" placeholder may render: a
 * production build that would show one fails instead of shipping an unknown as
 * if it were decided.
 */
import type { Phase, StrategicState } from "@/config/tickets";
import type { Variant } from "./purchase";
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

export const DEMO_VARIANTS: readonly Variant[] = ["a", "b"];

export const DEMO_PHASES: readonly Phase[] = ["pre_opening", "seb", "eb", "regular", "last_chance"];

export const DEMO_STRATEGIC_STATES: readonly StrategicState[] = ["hidden", "announced", "on_sale"];

/** URL segments. The demo is internal, but tier ids are never shown to visitors. */
export const PHASE_SLUGS: Record<Phase, string> = {
  pre_opening: "avant-ouverture",
  seb: "super-early-bird",
  eb: "early-bird",
  regular: "regular",
  last_chance: "last-chance",
};

export const STRATEGIC_SLUGS: Record<StrategicState, string> = {
  hidden: "masque",
  announced: "annonce",
  on_sale: "en-vente",
};

export interface DemoState {
  variant: Variant;
  /** Undefined on the entry URL: the page then shows the config's own phase and state. */
  phase?: Phase;
  strategicState?: StrategicState;
}

export function demoBasePath(variant: Variant): string {
  return `/billetterie/demo-${variant}`;
}

export function demoPath({ variant, phase, strategicState }: DemoState): string {
  const base = demoBasePath(variant);
  if (!phase || !strategicState) return `${base}/`;
  return `${base}/${PHASE_SLUGS[phase]}/${STRATEGIC_SLUGS[strategicState]}/`;
}

/** Every demo URL as `[...demo]` route params, entry URLs included. */
export function demoStaticPaths(): Array<{ params: { demo: string }; props: DemoState }> {
  const paths: Array<{ params: { demo: string }; props: DemoState }> = [];
  for (const variant of DEMO_VARIANTS) {
    paths.push({ params: { demo: `demo-${variant}` }, props: { variant } });
    for (const phase of DEMO_PHASES) {
      for (const strategicState of DEMO_STRATEGIC_STATES) {
        paths.push({
          params: {
            demo: `demo-${variant}/${PHASE_SLUGS[phase]}/${STRATEGIC_SLUGS[strategicState]}`,
          },
          props: { variant, phase, strategicState },
        });
      }
    }
  }
  return paths;
}
