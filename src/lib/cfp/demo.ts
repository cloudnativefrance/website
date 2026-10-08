/**
 * The CFP demo: one pre-rendered page per phase under /cfp/demo/ and
 * /en/cfp/demo/, and the "DÉMO" switcher on every CFP page.
 *
 * `CFP_DEMO` decides; unset, the demo is on under `astro dev` and off in any
 * build. The staging image sets it to true. A production-origin build refuses
 * it, so a stray `CFP_DEMO=true` on `main` is a red build, never a demo on
 * cloudnativedays.fr.
 */
import { CFP_DEMO } from "astro:env/server";
import type { CfpPhase } from "@/config/cfp";
import type { Locale } from "@/i18n/ui";
import { getLocalePath } from "@/i18n/utils";
import { isProductionOrigin, resolveSiteOrigin } from "@/lib/site-env";

export function cfpDemosEnabled({
  toggle = CFP_DEMO,
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
      "[cfp] CFP_DEMO=true on a production-origin build: the demo must never reach " +
        "cloudnativedays.fr. Unset CFP_DEMO, or set PUBLIC_SITE_URL to a non-production origin.",
    );
  }
  return enabled;
}

const PHASE_SLUGS: Record<CfpPhase, string> = {
  coming_soon: "avant-ouverture",
  open: "ouvert",
  closed: "cloture",
};

export const DEMO_PHASES = Object.keys(PHASE_SLUGS) as CfpPhase[];

/** /cfp/demo/ouvert/, /en/cfp/demo/ouvert/. */
export function demoPath(phase: CfpPhase, lang: Locale): string {
  return `${getLocalePath(lang, "/cfp/demo")}/${PHASE_SLUGS[phase]}/`;
}

export function demoStaticPaths() {
  return DEMO_PHASES.map((phase) => ({
    params: { phase: PHASE_SLUGS[phase] },
    props: { phase },
  }));
}
