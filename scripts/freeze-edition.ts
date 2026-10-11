/**
 * Freeze a finished edition: the LAST live read of its Pretalx data, written to
 * the committed archives `src/content/schedule/sessions-{year}.json` and
 * `speakers-{year}.json`.
 *
 * Run while the edition is still `access: "public"`, then flip the registry to
 * `access: "frozen"` — the one-word edit that makes the site stop fetching.
 * Frozen editions issue NO network request at all (see edition-registry.ts);
 * this script is the only thing that may still read them from Pretalx, once,
 * and only before the flip.
 *
 * Reads through the EXACT site code paths — `loadSessions` + `loadSpeakers` —
 * never re-deriving the join or the shape. `speaker-source.ts`'s docstring is
 * explicit that re-derivation is the bug class; a freeze that drifts from what
 * the live build served is worse than no freeze.
 *
 * Shrink guards refuse a smaller archive than the committed
 * `pretalx-{year}.json` snapshot (talks and distinct persons), same philosophy
 * as `sync-pretalx.ts --allow-shrink`; override with `--force`. A blank
 * affiliation set (no token — enrichment degraded) is refused the same way.
 *
 * Photos are made 100% local so a frozen page never depends on Pretalx again:
 * a committed `public/speakers/<slug>.jpg` wins; else an absolute Pretalx URL
 * is downloaded ONCE and optimised into that same path (the sharp settings
 * mirror the existing committed portraits: ~400px, progressive mozjpeg); else
 * the record gets `photo_url: ""` and renders initials — reported loudly.
 *
 * Run: pnpm freeze:edition <year>        e.g. pnpm freeze:edition 2026
 * Flags:
 *   --force   write even when a shrink/enrichment guard trips.
 *
 * This script does NOT edit the registry. Data first; the flip is the PR's own
 * visible edit.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
// Bridges .env.local's PRETALX_API_TOKEN into process.env — the enrichment
// half of loadSpeakers needs it, same as sync-speaker-slugs.ts explains.
// Note the shell may export PRETALX_API_KEY; nothing in this codebase reads
// that name. Only PRETALX_API_TOKEN / _FILE matter.
import { loadLocalEnv } from "./load-local-env.mjs";
import { isEdition } from "../src/lib/editions";
import { PRETALX_EVENT } from "../src/lib/edition-registry";
import { loadSessions } from "../src/lib/schedule";
import { loadSpeakers, type SpeakerRecord } from "../src/lib/speaker-source";
import type { PretalxScheduleExport } from "../src/lib/pretalx";
import {
  enrichmentViolations,
  freezeRefusal,
  planPhotos,
  serializeArchive,
  shrinkViolations,
  snapshotFloors,
  type PhotoPlanEntry,
} from "./lib/freeze-edition";

loadLocalEnv();

const TAG = "[freeze-edition]";

/** Portrait settings matching the committed `public/speakers/*.jpg` masters. */
const PHOTO_MAX = 400;

function fail(message: string): never {
  console.error(`${TAG} ${message}`);
  console.error(`${TAG} usage: pnpm freeze:edition <year> [--force]`);
  process.exit(1);
}

async function downloadPortrait(
  entry: PhotoPlanEntry,
  outPath: string,
): Promise<void> {
  const res = await fetch(entry.downloadUrl!, {
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  // Throws on a zero-byte or corrupt upload — a known real case ("one 2026
  // avatar is a zero-byte file"); the caller degrades that speaker to initials.
  await sharp(Buffer.from(buf))
    .rotate()
    .resize({
      width: PHOTO_MAX,
      height: PHOTO_MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 80,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
      progressive: true,
    })
    .toFile(outPath);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const yearArg = args.filter((a) => !a.startsWith("--"))[0];
  if (!yearArg) fail("missing <year>");
  const yearNum = Number(yearArg);
  if (!isEdition(yearNum)) fail(`"${yearArg}" is not a known edition`);
  const year = yearNum;

  const event = PRETALX_EVENT[year];
  const refusal = freezeRefusal(year, event?.access);
  if (refusal) fail(refusal);

  // Floors derive from the repo's own record of what the edition held — never
  // hardcoded, so the next freeze works without editing this file.
  const snapshotPath = `src/content/schedule/pretalx-${year}.json`;
  if (!existsSync(snapshotPath)) {
    fail(`no committed ${snapshotPath} to derive floors from`);
  }
  const floors = snapshotFloors(
    JSON.parse(readFileSync(snapshotPath, "utf8")) as PretalxScheduleExport,
  );
  console.log(
    `${TAG} freezing ${year} (slug "${event!.slug}", access "${event!.access}") — ` +
      `floors from ${snapshotPath}: ${floors.talks} talks, ${floors.persons} distinct persons`,
  );

  console.log(`${TAG} LAST live read of ${year}: loadSessions + loadSpeakers`);
  const sessions = await loadSessions(year);
  const records = await loadSpeakers(year);

  const violations = [
    ...shrinkViolations(floors, sessions.length, records.length),
    ...enrichmentViolations(records),
  ];
  if (violations.length > 0 && !force) {
    for (const v of violations)
      console.error(`${TAG} ${v} — re-run with --force if expected`);
    process.exit(1);
  }
  for (const v of violations) {
    console.error(`${TAG} GUARD TRIPPED, --force given: ${v}`);
  }

  // Photos: decide every portrait's committed value, then fetch what must be
  // localised. A failed download degrades that ONE speaker to initials —
  // the same way SpeakerAvatar degrades at render time — never the whole freeze.
  const plan = planPhotos(records, (slug) =>
    existsSync(join(process.cwd(), "public", "speakers", `${slug}.jpg`)),
  );
  mkdirSync(join(process.cwd(), "public", "speakers"), { recursive: true });
  const failed: string[] = [];
  for (const entry of plan.downloads) {
    const outPath = join(
      process.cwd(),
      "public",
      "speakers",
      `${entry.slug}.jpg`,
    );
    try {
      await downloadPortrait(entry, outPath);
      console.log(
        `[photo] downloaded ${entry.slug}.jpg from ${entry.downloadUrl}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failed.push(entry.slug);
      console.warn(
        `[photo] FAILED ${entry.slug}: could not fetch/optimize ${entry.downloadUrl} (${msg}) ` +
          `— committing no portrait; this speaker renders initials.`,
      );
    }
  }

  const bySlug = new Map(plan.entries.map((e) => [e.slug, e]));
  const frozen: SpeakerRecord[] = records.map((record) => {
    const entry = bySlug.get(record.slug)!;
    const photoUrl = failed.includes(entry.slug) ? "" : entry.photo_url;
    // photo_fallback "" — the archive is self-contained; nothing left to fall
    // back FROM.
    return { ...record, photo_url: photoUrl, photo_fallback: "" };
  });

  const sessionsOut = `src/content/schedule/sessions-${year}.json`;
  const speakersOut = `src/content/schedule/speakers-${year}.json`;
  writeFileSync(sessionsOut, serializeArchive(sessions), "utf8");
  writeFileSync(speakersOut, serializeArchive(frozen), "utf8");

  const over = plan.entries
    .filter((e) => e.over !== undefined)
    .map((e) => e.slug);
  const missing = plan.missing.filter((slug) => !failed.includes(slug));
  console.log(`${TAG} summary for ${year}:`);
  console.log(
    `  sessions: ${sessions.length} (floor ${floors.talks}) → ${sessionsOut}`,
  );
  console.log(
    `  speakers: ${frozen.length} (floor ${floors.persons}) → ${speakersOut}`,
  );
  console.log(
    `  photos: ${plan.entries.length - plan.downloads.length - plan.missing.length} committed ` +
      `(${over.length} replaced a Pretalx URL), ${plan.downloads.length - failed.length} downloaded, ` +
      `${failed.length} download FAILED, ${plan.missing.length} with no portrait (initials)`,
  );
  if (over.length > 0)
    console.log(`    committed file wins for: ${over.join(", ")}`);
  for (const entry of plan.downloads) {
    if (!failed.includes(entry.slug))
      console.log(`    downloaded: ${entry.slug}`);
  }
  if (missing.length > 0) {
    console.log(
      `    NO PORTRAIT ANYWHERE (renders initials): ${missing.join(", ")}`,
    );
  }
  if (failed.length > 0) {
    console.log(
      `    PORTRAIT FETCH FAILED (renders initials): ${failed.join(", ")}`,
    );
  }

  console.log(
    `${TAG} done. Now flip access to "frozen" in src/lib/edition-registry.ts ` +
      `for edition ${year} — until then the site still fetches it live.`,
  );
}

main().catch((err) => {
  console.error(`${TAG} ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
