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
 * Parse a `FLAG_OVERRIDES` string into per-flag overrides.
 *
 * Format: `name=on,name2=off`. One build-arg carries every override, so adding
 * a flag needs no Dockerfile or workflow edit.
 *
 * Every malformed input throws rather than being skipped. A typo like
 * `programe=on` that silently did nothing would be indistinguishable from the
 * feature not working — and on the `programme` flag specifically, the symptom
 * of a swallowed typo is a staging site that looks correctly empty.
 */
export function parseFlagOverrides(raw: string): Map<FlagName, "on" | "off"> {
  const out = new Map<FlagName, "on" | "off">();
  for (const token of raw.split(",")) {
    const entry = token.trim();
    if (!entry) continue;
    const eq = entry.indexOf("=");
    if (eq === -1) {
      throw new Error(
        `[flags] FLAG_OVERRIDES entry "${entry}" is malformed — expected <name>=on|off`,
      );
    }
    const name = entry.slice(0, eq).trim();
    const value = entry.slice(eq + 1).trim();
    if (!(name in FLAGS)) {
      throw new Error(
        `[flags] FLAG_OVERRIDES names unknown flag "${name}". Known flags: ${Object.keys(FLAGS).join(", ")}`,
      );
    }
    if (value !== "on" && value !== "off") {
      throw new Error(
        `[flags] FLAG_OVERRIDES value for "${name}" is "${value}" — expected on or off`,
      );
    }
    if (out.has(name as FlagName)) {
      throw new Error(
        `[flags] FLAG_OVERRIDES sets "${name}" twice — remove the duplicate rather than relying on order`,
      );
    }
    out.set(name as FlagName, value);
  }
  return out;
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
 *
 * Two sources, in precedence order:
 *
 *   1. `FLAG_<NAME>` — the documented local-development mechanism (`.env.local`).
 *   2. `FLAG_OVERRIDES` — the image-level build-arg used by CI.
 *
 * Individual variables win so that a developer's local override still beats
 * one inherited from a build configuration.
 */
export function readEnvOverride(name: FlagName): "on" | "off" | undefined {
  if (typeof process === "undefined") return undefined;

  const direct = process.env[`FLAG_${name.toUpperCase()}`];
  if (direct === "on") return "on";
  if (direct === "off") return "off";

  const bundle = process.env.FLAG_OVERRIDES;
  if (!bundle) return undefined;
  return parseFlagOverrides(bundle).get(name);
}
