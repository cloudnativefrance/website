import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fetch a CSV from a remote URL (Google Sheets publish-to-web) with a
 * build-tolerant fallback: if the remote is unreachable or times out, use
 * the committed repo copy at `fallbackRelPath`.
 *
 * Returns the CSV body as a UTF-8 string, and logs which source was used
 * so build logs make the data provenance obvious.
 *
 * Results are memoized per URL for the lifetime of the process — Astro calls
 * loaders multiple times during a single build, and we want the same snapshot
 * across all pages.
 */
const CACHE = new Map<string, Promise<string>>();
const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchOptions {
  url?: string;
  fallbackRelPath: string;
  label?: string;
  timeoutMs?: number;
}

export async function fetchCsvOrFallback({
  url,
  fallbackRelPath,
  label = fallbackRelPath,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: FetchOptions): Promise<string> {
  const cacheKey = url || `file:${fallbackRelPath}`;
  const cached = CACHE.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const fallbackPath = join(process.cwd(), fallbackRelPath);
    if (!url) {
      const body = readFileSync(fallbackPath, "utf8");
      console.log(`[csv] ${label}: using local fallback (no URL configured, ${body.length} bytes)`);
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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = await res.text();
      if (!body || body.length < 20 || !body.includes(",")) {
        throw new Error("Response does not look like CSV");
      }
      console.log(`[csv] ${label}: fetched remote (${body.length} bytes)`);
      return body;
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      const body = readFileSync(fallbackPath, "utf8");
      console.warn(`[csv] ${label}: remote fetch failed (${msg}); using local fallback (${body.length} bytes)`);
      return body;
    }
  })();

  CACHE.set(cacheKey, promise);
  return promise;
}

/**
 * Environment-overridable URLs. Set via
 *   SCHEDULE_SESSIONS_CSV_URL, SCHEDULE_SPEAKERS_CSV_URL, SPONSORS_CSV_URL, TEAM_CSV_URL
 * to point at a staging sheet; unset defaults to the production publish-to-web URLs
 * (or empty string for collections whose sheet has not yet been provisioned — the
 * loader then reads the committed local CSV directly).
 */
export const SESSIONS_CSV_URL =
  process.env.SCHEDULE_SESSIONS_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=178765557&single=true&output=csv";

export const SPEAKERS_CSV_URL =
  process.env.SCHEDULE_SPEAKERS_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=124864767&single=true&output=csv";

export const SPONSORS_CSV_URL =
  process.env.SPONSORS_CSV_URL || "";

export const TEAM_CSV_URL =
  process.env.TEAM_CSV_URL || "";
