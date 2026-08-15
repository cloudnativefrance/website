import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Edition } from "./editions";

/**
 * Read a frozen JSON archive for an edition that predates — or does not yet
 * have — a Pretalx event.
 *
 * Unlike the live Pretalx reads, which fall back to a committed snapshot when
 * the instance is unreachable, an archive has nothing beneath it: it is the sole
 * source for that edition. A missing, unparseable or wrongly-shaped file is a
 * deterministic repo defect — a bad merge, an accidental deletion, a JSON typo —
 * not transient unreachability, so it fails loudly instead of silently
 * rendering an empty page that only manual QA would ever notice.
 *
 * Sessions and speakers both need exactly this, and any future Pretalx-owned
 * data will too, so the policy lives in one place rather than being asserted
 * once per consumer.
 */
export function loadFrozenArchive<T>(
  kind: "sessions" | "speakers",
  year: Edition,
): T[] {
  const relPath = `src/content/schedule/${kind}-${year}.json`;
  const path = join(process.cwd(), relPath);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[${kind}] ${kind}-${year}.json unreadable at ${path}: ${msg}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `[${kind}] ${kind}-${year}.json must be a JSON array, got ${typeof parsed}`,
    );
  }

  console.log(`[${kind}] ${year}: ${parsed.length} archived`);
  return parsed as T[];
}
