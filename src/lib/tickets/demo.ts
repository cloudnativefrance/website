/**
 * The ticketing demo: one pre-rendered page per phase under /billetterie/demo/
 * and /en/tickets/demo/, and the "DÉMO" switcher on every ticketing page.
 *
 * `TICKETS_DEMO` decides; unset, the demo is on under `astro dev` and off in
 * any build. The staging image sets it to true. A production-origin build
 * refuses it, so a stray `TICKETS_DEMO=true` on `main` is a red build, never a
 * demo on cloudnativedays.fr.
 */
import { TICKETS_DEMO } from "astro:env/server";
import type { Phase } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { getLocalePath } from "@/i18n/utils";
import { isProductionOrigin, resolveSiteOrigin } from "@/lib/site-env";

export function ticketDemosEnabled({
  toggle = TICKETS_DEMO,
  env = process.env,
  dev = import.meta.env.DEV,
}: {
  toggle?: boolean;
  env?: Record<string, string | undefined>;
  dev?: boolean;
} = {}): boolean {
  const enabled = toggle ?? dev;
  if (enabled && !dev && isProductionOrigin(resolveSiteOrigin(env))) {
    throw new Error(
      "[tickets] TICKETS_DEMO=true on a production-origin build: the demo must never reach " +
        "cloudnativedays.fr. Unset TICKETS_DEMO, or set PUBLIC_SITE_URL to a non-production origin.",
    );
  }
  return enabled;
}

const PHASE_SLUGS: Record<Phase, string> = {
  pre_opening: "avant-ouverture",
  seb: "super-early-bird",
  eb: "early-bird",
  regular: "regular",
  last_chance: "last-chance",
};

export const DEMO_PHASES = Object.keys(PHASE_SLUGS) as Phase[];

/** /billetterie/demo/early-bird/, /en/tickets/demo/early-bird/. */
export function demoPath(phase: Phase, lang: Locale): string {
  return `${getLocalePath(lang, "/tickets/demo")}/${PHASE_SLUGS[phase]}/`;
}

export function demoStaticPaths() {
  return DEMO_PHASES.map((phase) => ({
    params: { phase: PHASE_SLUGS[phase] },
    props: { phase },
  }));
}
