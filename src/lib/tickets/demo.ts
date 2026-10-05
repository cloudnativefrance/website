/**
 * Hidden demo routes for the ticketing page.
 *
 * /billetterie and /en/tickets serve the config's own phase everywhere. The
 * demo adds one page per phase under /billetterie/demo/ and /en/tickets/demo/
 * so the ticketing team can walk the whole season on staging, and a switcher
 * on every ticketing page.
 *
 * One switch decides: `TICKETS_DEMO`, an `astro:env` boolean (astro.config.mjs).
 * An explicit value always wins; unset, the demo is on under `astro dev` and
 * off in any build — so production, which never sets it, has no demo, and the
 * staging image turns it on with a build-arg (.github/workflows/build-image.yml).
 * The build's origin only vetoes: a production-origin build refuses the demo,
 * so `TICKETS_DEMO=true` landing on `main` by mistake is a red build, never a
 * demo on cloudnativedays.fr.
 */
import { TICKETS_DEMO } from "astro:env/server";
import type { Phase } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { getLocalePath } from "@/i18n/utils";
import { isProductionOrigin, resolveSiteOrigin } from "@/lib/site-env";

interface GateInput {
  /** `TICKETS_DEMO`; undefined when unset. */
  toggle?: boolean;
  env?: Record<string, string | undefined>;
  dev?: boolean;
}

export function ticketDemosEnabled({
  toggle = TICKETS_DEMO,
  env = process.env,
  dev = import.meta.env.DEV,
}: GateInput = {}): boolean {
  const enabled = toggle ?? dev;
  if (enabled && !dev && isProductionOrigin(resolveSiteOrigin(env))) {
    throw new Error(
      "[tickets] TICKETS_DEMO=true on a production-origin build: the demo must never reach " +
        "cloudnativedays.fr. Unset TICKETS_DEMO, or set PUBLIC_SITE_URL to a non-production origin.",
    );
  }
  return enabled;
}

export const DEMO_PHASES: readonly Phase[] = [
  "pre_opening",
  "seb",
  "eb",
  "regular",
  "last_chance",
];

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
export function demoStaticPaths(): Array<{
  params: { phase: string };
  props: { phase: Phase };
}> {
  return DEMO_PHASES.map((phase) => ({
    params: { phase: PHASE_SLUGS[phase] },
    props: { phase },
  }));
}
