/**
 * Pure logic for `scripts/freeze-edition.ts`.
 *
 * The refusal rules, the snapshot-derived floors, the photo resolution plan
 * and the archive serialisation, kept apart from the script's I/O (fetches,
 * sharp, writes, process.argv) so they are testable without any of it — the
 * same split `speaker-slug-sync.ts` makes. See
 * `scripts/lib/__tests__/freeze-edition.test.ts`.
 */
import { allTalks, type PretalxScheduleExport } from "../../src/lib/pretalx";
import type { EditionAccess } from "../../src/lib/edition-registry";

/**
 * Why a live read of `year` is allowed exactly once — as the freeze itself.
 *
 * Freezing is the LAST live read of an edition: it must go through the real
 * public path (`loadSessions` + `loadSpeakers`) so the archive is byte-for-byte
 * the data a live build was already serving. A `preview` edition has no
 * released schedule to freeze; a `frozen` one is already frozen; an unmapped
 * year has no event to read. Anything but `"public"` returns a refusal.
 *
 * `refreeze` lifts exactly one refusal — the already-frozen one. For a frozen
 * edition `loadSessions`/`loadSpeakers` read the COMMITTED archive (frozen
 * issues no network request), so re-running is an archive-to-archive rewrite
 * whose only live effect is re-applying the photo rules (e.g. picking up a
 * committed portrait that was misnamed at freeze time). Every guard — floors,
 * shrink, enrichment, photo planning — still runs. The `preview` and
 * no-registry-entry refusals are never lifted: there is no released data to
 * freeze, and that boundary is the leak the guard exists for.
 */
export function freezeRefusal(
  year: number,
  access: EditionAccess | undefined,
  refreeze = false,
): string | undefined {
  if (access === undefined) {
    return `no PRETALX_EVENT entry for ${year} — nothing to read from Pretalx`;
  }
  if (access === "frozen") {
    if (refreeze) return undefined;
    return (
      `${year} is already frozen — its committed archive is the source of ` +
      "truth; re-freezing would overwrite reviewed data with a live read that " +
      "must not happen. If re-writing the archives from the committed archive " +
      "itself is intended (photo-rule repair), re-run with --refreeze"
    );
  }
  if (access !== "public") {
    return (
      `${year} is access: "${access}" — freeze requires "public", the one mode ` +
      "that reads the released export every build already serves. An unreleased " +
      "schedule must not be committed by a freeze script"
    );
  }
  return undefined;
}

/** What the committed `pretalx-{year}.json` snapshot says the edition held. */
export interface FloorCounts {
  readonly talks: number;
  readonly persons: number;
}

/**
 * Talk count and distinct-person count of a parsed released export — the
 * floors a freeze must not fall below. Derived from the snapshot, never
 * hardcoded: the snapshot is the repo's own record of what the edition was.
 */
export function snapshotFloors(doc: PretalxScheduleExport): FloorCounts {
  const personCodes = new Set<string>();
  for (const talk of allTalks(doc)) {
    for (const person of talk.persons) personCodes.add(person.code);
  }
  return { talks: allTalks(doc).length, persons: personCodes.size };
}

/**
 * Refusals for a fetched result smaller than the snapshot floors — a partial
 * export or a silent upstream regression must not become a frozen archive.
 * Returns one message per violation; the script refuses unless `--force`.
 */
export function shrinkViolations(
  floors: FloorCounts,
  sessionCount: number,
  speakerCount: number,
): string[] {
  const out: string[] = [];
  if (sessionCount < floors.talks) {
    out.push(
      `fetched ${sessionCount} sessions, fewer than the committed snapshot's ` +
        `${floors.talks} talks — refusing to write`,
    );
  }
  if (speakerCount < floors.persons) {
    out.push(
      `fetched ${speakerCount} speakers, fewer than the committed snapshot's ` +
        `${floors.persons} distinct persons — refusing to write`,
    );
  }
  return out;
}

/**
 * Refusal for a speaker set with zero affiliations: without a token
 * `loadSpeakerEnrichment` degrades silently (companies/roles blank), and the
 * freeze would archive the blank version forever. The floors cannot see this —
 * a degraded read still has 77 speakers — so it needs its own guard.
 */
export function enrichmentViolations(
  records: readonly { company: string }[],
): string[] {
  if (records.length === 0 || records.some((r) => r.company)) return [];
  return [
    "no speaker has a company — the enrichment read degraded (missing or " +
      "rejected PRETALX_API_TOKEN); fix the token and re-run rather than " +
      "freezing blank affiliations",
  ];
}

/** The minimum `planPhotos` needs of a fetched speaker record. */
export interface PhotoSourceRecord {
  readonly slug: string;
  readonly photo_url: string;
}

export type PhotoSource = "committed" | "download" | "missing";

export interface PhotoPlanEntry {
  readonly slug: string;
  /** The value to COMMIT: a `/speakers/<slug>.jpg` path, or "" for initials. */
  readonly photo_url: string;
  readonly source: PhotoSource;
  /** Set when `source === "download"`: the Pretalx URL to fetch once. */
  readonly downloadUrl?: string;
  /** Set when a committed file replaces a Pretalx URL the live build served. */
  readonly over?: string;
}

export interface PhotoPlan {
  readonly entries: readonly PhotoPlanEntry[];
  /** Slugs whose portraits must be downloaded once before writing. */
  readonly downloads: readonly PhotoPlanEntry[];
  /** Slugs with no portrait by any route — they render initials. */
  readonly missing: readonly string[];
}

const ABSOLUTE_URL = /^https?:\/\//;

/**
 * Decide each portrait's committed value. 100% local: a committed
 * `public/speakers/<slug>.jpg` wins; else an absolute Pretalx URL is planned
 * for a one-time download to that same path; else the speaker has no portrait
 * and is reported. No frozen record may keep an absolute URL — that would put
 * Pretalx back on the critical path of a page the freeze exists to protect.
 */
export function planPhotos(
  records: readonly PhotoSourceRecord[],
  hasCommittedPhoto: (slug: string) => boolean,
): PhotoPlan {
  const entries: PhotoPlanEntry[] = [];
  for (const record of records) {
    const local = `/speakers/${record.slug}.jpg`;
    if (hasCommittedPhoto(record.slug)) {
      const remote = ABSOLUTE_URL.test(record.photo_url);
      entries.push({
        slug: record.slug,
        photo_url: local,
        source: "committed",
        downloadUrl: undefined,
        over: remote ? record.photo_url : undefined,
      });
    } else if (ABSOLUTE_URL.test(record.photo_url)) {
      entries.push({
        slug: record.slug,
        photo_url: local,
        source: "download",
        downloadUrl: record.photo_url,
      });
    } else {
      entries.push({
        slug: record.slug,
        photo_url: "",
        source: "missing",
        downloadUrl: undefined,
      });
    }
  }
  return {
    entries,
    downloads: entries.filter((e) => e.source === "download"),
    missing: entries.filter((e) => e.source === "missing").map((e) => e.slug),
  };
}

/** Archive JSON: 2-space indent, newline-terminated — as `sync-pretalx.ts` writes. */
export function serializeArchive(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}
