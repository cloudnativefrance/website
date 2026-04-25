/**
 * Event-lifecycle constants + helpers.
 *
 * Formerly cfp.ts; renamed when the ad-hoc CFP state machine was subsumed by
 * the feature flag system (src/lib/flags.ts, src/config/flags.ts). This file
 * now holds only the event anchor (TARGET_DATE, isPostEvent), outbound URLs,
 * and locale-aware path helpers. CFP date logic lives in FLAGS.cfp.
 */

/**
 * Epoch ms for 2027-06-03T09:00:00+02:00 (Cloud Native Days France 2027 start).
 *
 * MUST match src/components/hero/CountdownTimer.tsx so the countdown and
 * post-event flip share a single temporal anchor.
 */
export const TARGET_DATE = new Date("2027-06-03T09:00:00+02:00").getTime();

export const CONFERENCE_HALL_URL =
  "https://conference-hall.io/public/event/TODO_EVENT_ID";

/**
 * Hosted Brevo newsletter signup form.
 *
 * Used by the hero's "Restez informé" button and by <ComingSoonLayout>'s
 * "Notify me" CTA. Extracted from an inline string in HeroSection.astro
 * when the feature flag system landed.
 */
export const NEWSLETTER_URL =
  "https://d820b57b.sibforms.com/serve/MUIFAMhQae0KzNYxFvx6QSRhBI9sMf8V95ghzeac7poMILWncQNi6r_1yx56s6zfRIyfhiGqhx24CmxsMTthOrreePBCipj7yL0_QdwgtcZxfkzzebIQKjwCga2lb7IOvyDV9qZBzHh-wJVW5k8zHIKorqxmkJDZ3-wxP_jPo7z-0nQBCgoiXjTLPwEAMI52iPoy5OLEibdt3bnF";

/**
 * Public social profiles for Cloud Native France.
 *
 * Surfaced in the footer and (potentially) anywhere we want to point at the
 * organisation. Centralised here so a handle change is a one-file edit.
 * The trust boundary (http(s)-only allowlist) is enforced where these are
 * rendered (see safeUrl() in Footer.astro).
 */
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/cloud-native-france/",
  youtube: "https://www.youtube.com/@cloudnativedays",
  bluesky: "https://bsky.app/profile/cloudnativedays.fr",
  twitter: "https://x.com/cloudnativedays",
} as const;

export const YOUTUBE_2026_PLAYLIST_URL =
  "https://www.youtube.com/@cloudnativedays";

/**
 * Return the locale-aware path to the /replays page.
 *
 * Kept dependency-free (no import from @/i18n/utils) so this module stays
 * loadable from both server (.astro) and client (.tsx) contexts without
 * pulling the full i18n dictionary into client bundles.
 */
export function getReplaysPath(lang: "fr" | "en"): string {
  return lang === "fr" ? "/replays" : "/en/replays";
}

/**
 * Whether the event has already happened (used to flip CTAs to "Watch replays").
 */
export function isPostEvent(now: Date = new Date()): boolean {
  return now.getTime() > TARGET_DATE;
}
