/**
 * Refresh the committed Pretalx snapshots that builds fall back to when the
 * instance is unreachable. Run before a release so the fallback cannot silently
 * drift the way the old sessions CSV did.
 *
 * Only editions whose Pretalx event is `access: "public"` are snapshotted — the
 * output is a committed file in a public repo, so see the loop below.
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
import {
  PRETALX_EVENT,
  scheduleExportUrl,
  talkRecordingUrl,
  type PretalxScheduleExport,
  type PretalxTalk,
} from "../src/lib/pretalx";
import type { Edition } from "../src/lib/editions";

/** All talks in an already-parsed export document, flattened across days and rooms. */
function allTalks(doc: PretalxScheduleExport): PretalxTalk[] {
  return doc.schedule.conference.days.flatMap((d) => Object.values(d.rooms).flat());
}

const allowShrink = process.argv.includes("--allow-shrink");

let failed = false;

for (const [yearStr, event] of Object.entries(PRETALX_EVENT)) {
  const year = Number(yearStr) as Edition;
  const url = scheduleExportUrl(event.slug);
  const out = `src/content/schedule/pretalx-${year}.json`;

  // The snapshot is a COMMITTED file in a PUBLIC repository. Writing one for a
  // non-public edition publishes its full programme — every talk title, room
  // and speaker name — to github.com, which is exactly the leak the 2027
  // gating exists to prevent, and no amount of route gating undoes a git push.
  //
  // `access` is not merely about whether the anonymous fetch below would
  // succeed. In the months between the 2027 event being flipped to `public` in
  // Pretalx (so the CFP can link to it) and the programme announcement, this
  // fetch WOULD succeed — and silently commit the unannounced schedule. So the
  // check is on `access`, the site's own word for "may this be published",
  // rather than on whether the export happens to be readable.
  if (event.access !== "public") {
    console.log(
      `${out}: skipped — ${year} is access: "${event.access}", and a committed ` +
        `snapshot would publish it. Flip it to "public" only after the reveal.`,
    );
    continue;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = (await res.json()) as PretalxScheduleExport;
    const talks = allTalks(doc);
    if (talks.length === 0) throw new Error("export contains no talks");

    // The snapshot is the site's offline fallback: a fetched export that
    // parses fine but returns materially fewer talks (a partial export, a
    // transient upstream bug) must not silently shrink it. Cancellations do
    // happen though, so the refusal is overridable via --allow-shrink.
    if (existsSync(out)) {
      const existingCount = allTalks(
        JSON.parse(readFileSync(out, "utf8")) as PretalxScheduleExport,
      ).length;
      if (talks.length < existingCount && !allowShrink) {
        throw new Error(
          `fetched export has ${talks.length} talks, fewer than the committed snapshot's ` +
            `${existingCount} — refusing to overwrite; re-run with --allow-shrink if the ` +
            `reduction is expected`,
        );
      }
    }

    writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");
    // Same rule toSessionRows uses to populate recordingUrl (see
    // talkRecordingUrl in src/lib/pretalx.ts), so the count printed here is
    // the same number the merge-gate decision is made against.
    const recordings = talks.filter((t) => talkRecordingUrl(t)).length;
    console.log(`${out}: ${talks.length} talks, ${recordings} with a replay link`);
  } catch (err) {
    failed = true;
    console.error(`${out}: FAILED — ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failed) process.exit(1);
