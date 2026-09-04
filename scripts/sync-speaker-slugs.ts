/**
 * Add newly-scheduled Pretalx speakers to src/data/speaker-slugs.ts.
 *
 * `buildSpeakerResolver` (pretalx.ts) throws on any Pretalx speaker name
 * missing from that map, deliberately — a derived slug would produce
 * `/intervenants/Jérôme%20Petazzoni`, a 404 that renders as a working link.
 * Eight of today's 77 entries are hand-shortened in ways no rule derives
 * ("petazzoni", not "jerome-petazzoni"), so the map stays the authority and
 * this script only ever appends to it, never regenerates it.
 *
 * REQUIREMENT 1 — no `loadSpeakers`. That is the very function whose throw
 * this script exists to pre-empt: calling it here would die on the first
 * unmapped name instead of reporting every one of them in one pass. This
 * script fetches the people list directly through the same two Pretalx
 * readers `loadSpeakers` itself dispatches to — `pretalx.ts` for a
 * public/released edition, `pretalx-preview-api.ts` + `pretalx-preview.ts`
 * for a preview one — but never through `buildSpeakerResolver`.
 *
 * REQUIREMENT 2 — allowlist discipline. With an organiser token,
 * `/submissions/` returns rejected and pending proposals too, and
 * `/speakers/` returns everyone who ever submitted. Writing one of those
 * names into a COMMITTED file in a PUBLIC repo would publish, forever, the
 * fact that they submitted. So this script never iterates `/speakers/` on
 * its own: for a preview edition it reuses `scheduledPersonCodes`, the exact
 * allowlist `pretalx-preview.ts` already applies to sessions AND speakers
 * (a slot must be CONFIRMED and VISIBLE on the wip schedule); for a public
 * edition it reuses `peopleInSchedule`, which only ever walks talks that are
 * already in the released export.
 *
 * REQUIREMENT 3 — reads `PRETALX_EVENT` directly, NEVER through
 * `isEditionLoadable`/`loadSessions`/`loadSpeakers`. That gate exists to
 * keep an unpublished edition's data out of a PRODUCTION BUILD; this
 * script's whole job is to prepare an edition that is not yet publishable,
 * so routing it through the gate would silently read the empty frozen
 * archive and report "no new speakers" for the wrong reason — indistinguish-
 * able from a real empty result. The edition, event slug and access mode are
 * always printed before any network call, so that can never happen unnoticed.
 *
 * PII — the only field ever read off a fetched person is their name. Every
 * type this script touches (`PreviewSpeaker`, `PretalxPerson`) already had
 * email/internal_notes stripped at the fetch boundary in the modules it
 * imports; this script does not widen that.
 *
 * Run: pnpm sync:speaker-slugs <year>       e.g. pnpm sync:speaker-slugs 2027
 * Flags:
 *   --dry-run   report what would be added; do not touch the file.
 *
 * REQUIREMENT 9 — dry-run is NOT the default; writing is. Three reasons:
 *
 *   1. The write is append-only and idempotent (diffSpeakerSlugs skips any
 *      name already an exact key), so running it twice, or on a bad day,
 *      adds nothing extra the second time — there is no accumulation risk a
 *      dry-run gate would be protecting against.
 *   2. It refuses to write at all the moment it sees a collision (require-
 *      ment 5) — the one genuinely risky outcome (two names landing on one
 *      slug) is a hard stop, not something a human has to catch in a diff.
 *   3. Nothing is committed by this script under any flag. The reviewable
 *      step this task's own git-hygiene rule asks for is `git diff
 *      src/data/speaker-slugs.ts` before `git add` — a normal, mandatory
 *      step for a human either way, and printing the exact lines added (see
 *      below) makes that diff self-explanatory even before opening it.
 *
 * Matches `sync:pretalx`'s own posture: that script also writes by default
 * and only gates a specific destructive VARIANT (`--allow-shrink`) behind a
 * flag, rather than gating the ordinary case. `--dry-run` exists for anyone
 * who wants the list without touching disk at all — e.g. to paste it into a
 * Slack message before the organisers have finished confirming a batch.
 */
import { readFileSync, writeFileSync } from "node:fs";
// Bridges .env.local's PRETALX_API_TOKEN into process.env for a preview
// edition's authenticated reads — same call astro.config.mjs and
// vitest.config.ts make, for the same reason: Node reads process.env, not
// Astro's import.meta.env, and tsx does not load .env files on its own.
import { loadLocalEnv } from "./load-local-env.mjs";
import { isEdition, type Edition } from "../src/lib/editions";
import { PRETALX_EVENT, type EditionAccess } from "../src/lib/edition-registry";
import { SPEAKER_SLUGS } from "../src/data/speaker-slugs";
import { fetchScheduleExport } from "../src/lib/pretalx";
import { peopleInSchedule } from "../src/lib/speaker-source";
import { requireToken } from "../src/lib/pretalx-private";
import {
  fetchPreviewSlots,
  fetchPreviewSpeakers,
  fetchPreviewSubmissions,
  fetchWipScheduleId,
} from "../src/lib/pretalx-preview-api";
import { scheduledPersonCodes } from "../src/lib/pretalx-preview";
import { diffSpeakerSlugs, insertSlugEntries } from "./lib/speaker-slug-sync";

loadLocalEnv();

const SLUGS_FILE = "src/data/speaker-slugs.ts";
const TAG = "[sync-speaker-slugs]";

function usageError(message: string): never {
  console.error(`${TAG} ${message}`);
  console.error(`${TAG} usage: pnpm sync:speaker-slugs <year> [--dry-run]`);
  process.exit(1);
}

/**
 * Names of speakers who actually hold a slot in `year`'s relevant schedule —
 * released for a public edition, wip for a preview one. Never the raw
 * `/speakers/` (or `/submissions/`) list; see the module docstring,
 * requirement 2.
 */
async function scheduledNames(
  year: Edition,
  slug: string,
  access: EditionAccess,
): Promise<string[]> {
  if (access === "preview") {
    const token = requireToken();
    const scheduleId = await fetchWipScheduleId(slug, token);
    const [slots, submissions, speakers] = await Promise.all([
      fetchPreviewSlots(slug, scheduleId, token),
      fetchPreviewSubmissions(slug, token),
      fetchPreviewSpeakers(slug, token),
    ]);
    const allowed = scheduledPersonCodes(slots, submissions);
    console.log(
      `${TAG} wip schedule ${scheduleId}: ${allowed.size} scheduled speaker(s) ` +
        `across ${submissions.length} confirmed submission(s)`,
    );
    return speakers.filter((s) => allowed.has(s.code)).map((s) => s.name);
  }

  const doc = await fetchScheduleExport(year, slug);
  const people = peopleInSchedule(doc);
  console.log(`${TAG} released schedule: ${people.size} scheduled speaker(s)`);
  return [...people.values()].map((p) => p.name);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((a) => !a.startsWith("--"));

  const yearArg = positional[0];
  if (!yearArg) usageError("missing <year>");
  const yearNum = Number(yearArg);
  if (!isEdition(yearNum)) usageError(`"${yearArg}" is not a known edition`);
  const year = yearNum;

  const event = PRETALX_EVENT[year];
  if (!event) usageError(`no PRETALX_EVENT entry for ${year} — nothing to read yet`);

  // Requirement 3: name the edition, event slug and access mode BEFORE any
  // network call, so an empty result can never be mistaken for a read that
  // silently fell back to the frozen archive.
  console.log(
    `${TAG} edition ${year}, event slug "${event.slug}", access "${event.access}"` +
      (dryRun ? " (dry run)" : ""),
  );

  const names = await scheduledNames(year, event.slug, event.access);
  const { toAdd, collisions } = diffSpeakerSlugs(names, SPEAKER_SLUGS);

  if (collisions.length > 0) {
    console.error(
      `${TAG} ${collisions.length} slug collision(s) — refusing to write. ` +
        `A human has to pick the disambiguation:`,
    );
    for (const c of collisions) {
      const owner = c.existingOwner
        ? ` — already owned by "${c.existingOwner}"`
        : "";
      console.error(
        `  "${c.slug}"${owner}: ${c.names.map((n) => `"${n}"`).join(", ")}`,
      );
    }
    process.exit(1);
  }

  if (toAdd.length === 0) {
    console.log(
      `${TAG} ${names.length} scheduled speaker(s), all already in ${SLUGS_FILE} ` +
        `— no new speakers.`,
    );
    return;
  }

  console.log(`${TAG} ${toAdd.length} new speaker(s) of ${names.length} scheduled:`);
  for (const entry of toAdd) {
    console.log(`  "${entry.name}": "${entry.slug}",`);
  }

  if (dryRun) {
    console.log(
      `${TAG} dry run — ${SLUGS_FILE} not written. Re-run without --dry-run ` +
        `to append the entries above.`,
    );
    return;
  }

  const source = readFileSync(SLUGS_FILE, "utf8");
  const updated = insertSlugEntries(source, toAdd);
  writeFileSync(SLUGS_FILE, updated, "utf8");
  console.log(
    `${TAG} wrote ${toAdd.length} new entrie(s) to ${SLUGS_FILE}. Review with ` +
      `\`git diff ${SLUGS_FILE}\` before committing.`,
  );
}

main().catch((err) => {
  console.error(`${TAG} ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
