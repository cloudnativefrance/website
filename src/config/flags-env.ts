/**
 * Generates the `env.schema` block for astro.config.mjs from the flag registry.
 *
 * Consumed only at build time. The output is spread into the Astro config's
 * env.schema field so that adding a flag automatically surfaces a typed
 * FLAG_<NAME> env var without hand-editing astro.config.mjs.
 *
 * This module returns plain config objects (not envField() calls) so it stays
 * testable without pulling in `astro/config`. astro.config.mjs wraps each
 * entry with envField.enum() at load time.
 */

import { FLAGS } from "./flags";

export interface FlagEnvEntry {
  context: "server";
  access: "public";
  values: readonly ["on", "off", ""];
  optional: true;
  default: "";
}

export function generateFlagEnvSchema(): Record<string, FlagEnvEntry> {
  const schema: Record<string, FlagEnvEntry> = {};
  for (const name of Object.keys(FLAGS)) {
    const key = `FLAG_${name.toUpperCase()}`;
    schema[key] = {
      context: "server",
      access: "public",
      values: ["on", "off", ""] as const,
      optional: true,
      default: "",
    };
  }
  return schema;
}
