/**
 * Event-lifecycle configuration (Phase 8).
 *
 * Single source of truth for:
 *   - TARGET_DATE            — epoch ms of the conference start (kept in lock-step
 *                              with src/components/hero/CountdownTimer.tsx so the
 *                              countdown and post-event flip cannot drift).
 *   - CFP_OPENS / CFP_CLOSES — ISO date constants driving the CFP state machine
 *                              (coming-soon / open / closed).
 *   - CONFERENCE_HALL_URL    — outbound target for the "Submit a talk" CTA.
 *   - getCfpState()          — pure state computation, usable in both
 *                              server (.astro) and client (.tsx) contexts.
 *   - getReplaysPath()       — locale-aware path helper for /replays.
 *   - isPostEvent()          — true once the event date has passed.
 *
 * This module has no imports: safe to load from any context without pulling
 * the full i18n module into client bundles.
 */

/**
 * Epoch ms for 2027-06-03T09:00:00+02:00 (Cloud Native Days France 2027 start).
 *
 * MUST match src/components/hero/CountdownTimer.tsx so the countdown and
 * post-event flip share a single temporal anchor.
 */
export const TARGET_DATE = new Date("2027-06-03T09:00:00+02:00").getTime();

// TODO(staff): replace these placeholders with the real CFP window when confirmed.
// Edit only these three constants — all CFP UI reads from here.
export const CFP_OPENS = new Date("2026-09-01T00:00:00+02:00");
export const CFP_CLOSES = new Date("2027-02-28T23:59:59+01:00");
export const CONFERENCE_HALL_URL =
  "https://conference-hall.io/public/event/TODO_EVENT_ID";

/** Lifecycle states of the Call for Proposals window. */
export type CfpState = "coming-soon" | "open" | "closed";

/**
 * Compute the CFP state for a given instant.
 *
 * - `coming-soon` when `now < CFP_OPENS`
 * - `open`         when `CFP_OPENS <= now <= CFP_CLOSES`
 * - `closed`       when `now > CFP_CLOSES`
 *
 * @param now — instant to evaluate against (defaults to the current time).
 */
export function getCfpState(now: Date = new Date()): CfpState {
  const t = now.getTime();
  if (t < CFP_OPENS.getTime()) return "coming-soon";
  if (t <= CFP_CLOSES.getTime()) return "open";
  return "closed";
}

/**
 * Return the locale-aware path to the /replays page.
 *
 * Kept dependency-free (no import from @/i18n/utils) so this module stays
 * loadable from both server (.astro) and client (.tsx) contexts without
 * pulling the full i18n dictionary into client bundles.
 *
 * - `fr` → `/replays`
 * - `en` → `/en/replays`
 */
export function getReplaysPath(lang: "fr" | "en"): string {
  return lang === "fr" ? "/replays" : "/en/replays";
}

/**
 * Whether the event has already happened (used to flip CTAs to "Watch replays").
 *
 * @param now — instant to evaluate against (defaults to the current time).
 */
export function isPostEvent(now: Date = new Date()): boolean {
  return now.getTime() > TARGET_DATE;
}
