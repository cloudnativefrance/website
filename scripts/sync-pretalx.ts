/**
 * Refresh the committed Pretalx snapshots that builds fall back to when the
 * instance is unreachable. Run before a release so the fallback cannot silently
 * drift the way the old sessions CSV did.
 *
 * Run: pnpm sync:pretalx
 *
 * Flags:
 *   --allow-shrink   permit writing a snapshot with fewer talks than the one
 *                    it replaces (e.g. organisers cancelled talks). Without
 *                    it, a fetched export with fewer talks than the committed
 *                    snapshot is refused — see the shrink guard below.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PRETALX_EVENT, scheduleExportUrl } from "../src/lib/pretalx";
import type { Edition } from "../src/lib/editions";

type ScheduleExportShape = { schedule: { conference: { days: { rooms: Record<string, unknown[]> }[] } } };

/** Count talks in an already-parsed export document. */
function countTalks(doc: ScheduleExportShape): number {
  return doc.schedule.conference.days.flatMap((d) => Object.values(d.rooms).flat()).length;
}

const allowShrink = process.argv.includes("--allow-shrink");

let failed = false;

for (const [yearStr, slug] of Object.entries(PRETALX_EVENT)) {
  const year = Number(yearStr) as Edition;
  const url = scheduleExportUrl(slug as string);
  const out = `src/content/schedule/pretalx-${year}.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    const talks = doc.schedule.conference.days.flatMap((d: { rooms: Record<string, unknown[]> }) =>
      Object.values(d.rooms).flat(),
    );
    if (talks.length === 0) throw new Error("export contains no talks");

    // The snapshot is the site's offline fallback: a fetched export that
    // parses fine but returns materially fewer talks (a partial export, a
    // transient upstream bug) must not silently shrink it. Cancellations do
    // happen though, so the refusal is overridable via --allow-shrink.
    if (existsSync(out)) {
      const existingCount = countTalks(JSON.parse(readFileSync(out, "utf8")) as ScheduleExportShape);
      if (talks.length < existingCount && !allowShrink) {
        throw new Error(
          `fetched export has ${talks.length} talks, fewer than the committed snapshot's ` +
            `${existingCount} — refusing to overwrite; re-run with --allow-shrink if the ` +
            `reduction is expected`,
        );
      }
    }

    writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");
    const recordings = talks.filter((t: { links?: { url: string }[] }) =>
      (t.links ?? []).some((l) => /youtube\.com|youtu\.be|vimeo\.com/i.test(l.url)),
    ).length;
    console.log(`${out}: ${talks.length} talks, ${recordings} with a replay link`);
  } catch (err) {
    failed = true;
    console.error(`${out}: FAILED — ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failed) process.exit(1);
