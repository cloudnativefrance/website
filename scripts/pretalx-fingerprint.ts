/**
 * Hourly staging-refresh helper — a hash of the Pretalx data a build would
 * render, so the cron rebuilds staging only when that data changed.
 *
 * The site reads Pretalx at image build time and nothing else triggers a
 * staging build, so without this an edit in Pretalx never reaches staging
 * until someone pushes code. Rebuilding blindly every hour would instead mint
 * a new image and a fluxcdbot commit in cnd-platform each time.
 *
 * Hashes what the loaders produce, not the raw API responses: a pending
 * proposal or an unscheduled speaker changes the API but not the site, and
 * must not cost a rebuild. Prints the hash only — the repo is public, so its
 * Actions logs are too, and a preview edition is embargoed.
 *
 * Usage:
 *   pnpm tsx scripts/pretalx-fingerprint.ts
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { loadLocalEnv } from "./load-local-env.mjs";
import { isEdition } from "../src/lib/editions";
import { PRETALX_EVENT } from "../src/lib/edition-registry";
import { fetchScheduleExport } from "../src/lib/pretalx";
import { loadPreviewEdition } from "../src/lib/pretalx-preview";

loadLocalEnv();

const hash = createHash("sha256");

for (const [key, event] of Object.entries(PRETALX_EVENT)) {
  const year = Number(key);
  // A frozen edition is served from the committed archive; only a push changes it.
  if (!event || event.access === "frozen" || !isEdition(year)) continue;
  const data =
    event.access === "preview"
      ? await loadPreviewEdition(year, event.slug)
      : await fetchScheduleExport(year, event.slug);
  hash.update(`${year}\n${JSON.stringify(data)}\n`);
}

const fingerprint = hash.digest("hex");
console.log(`fingerprint=${fingerprint}`);

const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) fs.appendFileSync(outputFile, `fingerprint=${fingerprint}\n`);
