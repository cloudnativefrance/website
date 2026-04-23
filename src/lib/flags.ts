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

/**
 * Read from node's `process.env` at build time — safe in server contexts,
 * returns undefined in client contexts where `process` is not defined.
 *
 * Astro 5's typed env vars declared with `context: "server"` are not
 * exposed via `import.meta.env`; they are only reachable through the
 * `astro:env/server` module (which requires static per-variable imports).
 * Reading `process.env` directly avoids that constraint and works for any
 * dynamically-derived key such as `FLAG_${name.toUpperCase()}`.
 */
export function readEnvOverride(name: FlagName): "on" | "off" | undefined {
  const key = `FLAG_${name.toUpperCase()}`;
  const raw = typeof process !== "undefined" ? process.env[key] : undefined;
  if (raw === "on") return "on";
  if (raw === "off") return "off";
  return undefined;
}
