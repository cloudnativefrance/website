/**
 * Pure, dependency-free flag state evaluator.
 *
 * Safe to import from both server (.astro) and client (.tsx) contexts — does
 * not pull in any other module beyond the typed registry.
 *
 * State machine:
 *   pending  —  now < opens
 *   active   —  opens <= now <= closes   (bounds inclusive)
 *   ended    —  now > closes
 *
 * Missing opens is treated as -Infinity; missing closes as +Infinity.
 *
 * Override semantics ("on" -> active, "off" -> ended) short-circuit the date
 * logic. This is how env vars (FLAG_<NAME>=on|off) force state at build time.
 */

import { FLAGS, type FlagDefinition, type FlagName } from "@/config/flags";

export type FlagState = "pending" | "active" | "ended";

export function getFlagState(
  flag: FlagDefinition,
  now: Date = new Date(),
  override?: "on" | "off",
): FlagState {
  if (override === "on") return "active";
  if (override === "off") return "ended";

  const t = now.getTime();
  const opens = flag.opens ? new Date(flag.opens).getTime() : Number.NEGATIVE_INFINITY;
  const closes = flag.closes ? new Date(flag.closes).getTime() : Number.POSITIVE_INFINITY;

  if (t < opens) return "pending";
  if (t <= closes) return "active";
  return "ended";
}

export function isFlagActive(name: FlagName, now: Date = new Date()): boolean {
  const flag = FLAGS[name];
  const override = readEnvOverride(name);
  return getFlagState(flag, now, override) === "active";
}

export function readEnvOverride(name: FlagName): "on" | "off" | undefined {
  const key = `FLAG_${name.toUpperCase()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (import.meta.env as any)[key];
  if (raw === "on") return "on";
  if (raw === "off") return "off";
  return undefined;
}
