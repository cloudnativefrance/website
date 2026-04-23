/**
 * Daily GH Actions cron helper — determines whether any flag's state changed
 * in the last 24 hours. Emits GitHub Actions output `should-rebuild=true|false`
 * and logs the transition for audit.
 *
 * Usage:
 *   pnpm tsx scripts/check-flag-transitions.ts
 *   pnpm tsx scripts/check-flag-transitions.ts --dry-run    (skip the output write)
 */

import * as fs from "node:fs";
import { FLAGS, type FlagDefinition } from "../src/config/flags.ts";
import { getFlagState } from "../src/lib/flags.ts";

const DRY_RUN = process.argv.includes("--dry-run");
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const now = new Date();
const yesterday = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);

let shouldRebuild = false;

for (const [name, flag] of Object.entries(FLAGS) as Array<[string, FlagDefinition]>) {
  // No override in CI-cron context; pure date-driven comparison.
  const before = getFlagState(flag, yesterday);
  const after = getFlagState(flag, now);
  if (before !== after) {
    console.log(`${name}: ${before} → ${after} (at ${now.toISOString()})`);
    shouldRebuild = true;
  }
}

if (!shouldRebuild) {
  console.log("No flag transitions in the last 24h.");
}

if (!DRY_RUN) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `should-rebuild=${shouldRebuild}\n`);
  } else {
    console.log(`should-rebuild=${shouldRebuild}`);
  }
}

process.exit(0);
