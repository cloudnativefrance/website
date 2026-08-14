/**
 * Refresh the committed Pretalx snapshots that builds fall back to when the
 * instance is unreachable. Run before a release so the fallback cannot silently
 * drift the way the old sessions CSV did.
 *
 * Run: pnpm sync:pretalx
 */
import { writeFileSync } from "node:fs";
import { PRETALX_EVENT, scheduleExportUrl } from "../src/lib/pretalx";
import type { Edition } from "../src/lib/editions";

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
