/**
 * Pure logic for `scripts/sync-speaker-slugs.ts`.
 *
 * Slugification, diffing a list of Pretalx names against the committed
 * `src/data/speaker-slugs.ts` map, and inserting new entries into that file's
 * TEXT — never by parsing it into an object and re-serialising, which would
 * lose comments, quote style, and the docstring. Kept apart from the script
 * so it is importable by tests with no network, filesystem or process.argv
 * involved — see `scripts/lib/__tests__/speaker-slug-sync.test.ts`.
 */

/**
 * Lowercase, NFD-normalise, strip diacritics, non-alphanumerics to `-`,
 * collapse repeats, trim leading/trailing `-`.
 *
 * Matches the rule the 69 "regular" entries in `src/data/speaker-slugs.ts`
 * already follow (verified in the test suite against the live map) — the
 * eight hand-shortened exceptions are exactly that, exceptions, and stay
 * hand-written; this function is never used to touch them.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // combining diacritical marks (post-NFD)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface NewSlugEntry {
  readonly name: string;
  readonly slug: string;
}

export interface SlugCollision {
  readonly slug: string;
  /** Every newly-seen name whose derived slug is this one. */
  readonly names: readonly string[];
  /** The name that already owns this slug in the committed map, if any. */
  readonly existingOwner?: string;
}

export interface SlugDiff {
  readonly toAdd: readonly NewSlugEntry[];
  readonly collisions: readonly SlugCollision[];
}

/**
 * Diff a list of scheduled-speaker names against the committed map.
 *
 * A name already present as an exact key (after trimming, matching
 * `buildSpeakerResolver`'s own lookup) is skipped — it is already mapped,
 * possibly to one of the eight hand-shortened slugs no rule derives, and this
 * function must never suggest touching it. That is also what makes a second
 * run idempotent: nothing this run added is a "new" name on the next one.
 *
 * Everything else is a candidate, grouped by its derived slug. A slug shared
 * by two or more candidates, or one that lands on a slug some other name
 * already owns, is a COLLISION — reported, never resolved automatically,
 * because only a human can pick the disambiguation (requirement 5).
 */
export function diffSpeakerSlugs(
  names: readonly string[],
  existing: Readonly<Record<string, string>>,
): SlugDiff {
  const existingNames = new Set(Object.keys(existing));
  const existingSlugs = new Map(
    Object.entries(existing).map(([n, s]) => [s, n] as const),
  );

  const candidates = new Map<string, string>(); // trimmed name -> derived slug
  for (const raw of names) {
    const name = raw.trim();
    if (!name || existingNames.has(name)) continue;
    candidates.set(name, slugify(name));
  }

  const bySlug = new Map<string, string[]>();
  for (const [name, slug] of candidates) {
    const bucket = bySlug.get(slug);
    if (bucket) bucket.push(name);
    else bySlug.set(slug, [name]);
  }

  const toAdd: NewSlugEntry[] = [];
  const collisions: SlugCollision[] = [];
  for (const [slug, bucketNames] of bySlug) {
    const existingOwner = existingSlugs.get(slug);
    if (bucketNames.length > 1 || existingOwner) {
      collisions.push({ slug, names: bucketNames, existingOwner });
      continue;
    }
    toAdd.push({ name: bucketNames[0], slug });
  }

  toAdd.sort((a, b) => a.slug.localeCompare(b.slug));
  collisions.sort((a, b) => a.slug.localeCompare(b.slug));
  return { toAdd, collisions };
}

/** One `"Name": "slug",` line in `src/data/speaker-slugs.ts`. */
const ENTRY_LINE_RE = /^(\s*)"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)",\s*$/;

function escapeForDoubleQuotedString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Insert new entries into `source` (the raw text of `speaker-slugs.ts`),
 * keeping the map's existing alphabetical-by-slug ordering, and touching
 * NOTHING else — every untouched line keeps its exact original bytes.
 *
 * This is a text splice, not a parse-and-reserialise: it never builds a JS
 * object from the file, so the docstring, comments, and the eight
 * hand-shortened entries cannot be reordered or reformatted by this
 * function even by accident (requirement 6).
 *
 * Refuses (throws) if it cannot find a single line matching the entry
 * pattern anywhere in `source` — that means the file's format is not what
 * this function assumes, and guessing an insertion point would risk
 * corrupting it. Better to fail loudly than to silently misplace a line in a
 * committed, routing-critical file.
 */
export function insertSlugEntries(
  source: string,
  entries: readonly NewSlugEntry[],
): string {
  if (entries.length === 0) return source;

  const lines = source.split("\n");

  let indent: string | undefined;
  for (const line of lines) {
    const m = ENTRY_LINE_RE.exec(line);
    if (m) {
      indent = m[1];
      break;
    }
  }
  if (indent === undefined) {
    throw new Error(
      "insertSlugEntries: no line in the source matches the expected " +
        '`"Name": "slug",` shape — refusing to write, to avoid corrupting ' +
        "the file. Has speaker-slugs.ts's format changed?",
    );
  }

  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const entry of sorted) {
    const newLine =
      `${indent}"${escapeForDoubleQuotedString(entry.name)}": ` +
      `"${escapeForDoubleQuotedString(entry.slug)}",`;

    let insertAt = -1;
    let lastEntryLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const m = ENTRY_LINE_RE.exec(lines[i]);
      if (!m) continue;
      lastEntryLine = i;
      if (insertAt === -1 && m[3] > entry.slug) insertAt = i;
    }
    // No existing entry sorts after this one: it becomes the new last entry,
    // right after the current last one (still before the closing `};`).
    if (insertAt === -1) insertAt = lastEntryLine + 1;

    lines.splice(insertAt, 0, newLine);
  }

  return lines.join("\n");
}
