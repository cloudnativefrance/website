import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fetch a text payload from a remote URL with a build-tolerant fallback: if the
 * remote is unreachable, slow, or returns something that fails `validate`, use
 * the committed repo copy at `fallbackRelPath`.
 *
 * Logs which source was used so build logs make data provenance obvious.
 *
 * Results are memoised per URL for the process lifetime — Astro calls loaders
 * multiple times during a single build, and every page must see the same
 * snapshot.
 */
const CACHE = new Map<string, Promise<string>>();
const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchTextOptions {
  url?: string;
  fallbackRelPath: string;
  label?: string;
  timeoutMs?: number;
  /** Throw to reject a body that arrived HTTP 200 but is not what we asked for. */
  validate?: (body: string) => void;
}

/** Test-only: drop the memo so cases can stub `fetch` independently. */
export function __clearCacheForTests(): void {
  CACHE.clear();
}

export async function fetchTextOrFallback({
  url,
  fallbackRelPath,
  label = fallbackRelPath,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  validate,
}: FetchTextOptions): Promise<string> {
  const cacheKey = url || `file:${fallbackRelPath}`;
  const cached = CACHE.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const fallbackPath = join(process.cwd(), fallbackRelPath);
    if (!url) {
      const body = readFileSync(fallbackPath, "utf8");
      console.log(`[remote] ${label}: using local fallback (no URL configured, ${body.length} bytes)`);
      return body;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "cndfrance-website-build/1.0" },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      validate?.(body);
      console.log(`[remote] ${label}: fetched remote (${body.length} bytes)`);
      return body;
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      const body = readFileSync(fallbackPath, "utf8");
      console.warn(`[remote] ${label}: remote fetch failed (${msg}); using local fallback (${body.length} bytes)`);
      return body;
    }
  })();

  CACHE.set(cacheKey, promise);
  return promise;
}
