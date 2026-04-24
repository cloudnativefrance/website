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

import { EDITIONS, type Edition } from "./editions";

/**
 * Per-year CSV URLs for each editable data type. Each entry points at a
 * published-to-web tab in the single upstream Google Sheet.
 *
 * Override via env in staging/preview:
 *   SESSIONS_CSV_URL_2023 / _2026 / _2027
 *   SPEAKERS_CSV_URL_2023 / _2026 / _2027
 *   SPONSORS_CSV_URL_2023 / _2026 / _2027
 *   TEAM_CSV_URL
 *
 * Empty string → the content loader falls back to the committed local CSV.
 */
const SESSIONS_2026_DEFAULT =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=178765557&single=true&output=csv";

const SPEAKERS_2026_DEFAULT =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=124864767&single=true&output=csv";

export const CSV_URLS: {
  sessions: Record<Edition, string>;
  speakers: Record<Edition, string>;
  sponsors: Record<Edition, string>;
  team: string;
} = {
  sessions: {
    2023: process.env.SESSIONS_CSV_URL_2023 || "",
    2026: process.env.SESSIONS_CSV_URL_2026 || SESSIONS_2026_DEFAULT,
    2027: process.env.SESSIONS_CSV_URL_2027 || "",
  },
  speakers: {
    2023: process.env.SPEAKERS_CSV_URL_2023 || "",
    2026: process.env.SPEAKERS_CSV_URL_2026 || SPEAKERS_2026_DEFAULT,
    2027: process.env.SPEAKERS_CSV_URL_2027 || "",
  },
  sponsors: {
    2023: process.env.SPONSORS_CSV_URL_2023 || "",
    2026: process.env.SPONSORS_CSV_URL_2026 || "",
    2027: process.env.SPONSORS_CSV_URL_2027 || "",
  },
  team: process.env.TEAM_CSV_URL || "",
};

export type EditionScopedType = "sessions" | "speakers" | "sponsors";

export function getCsvUrl(type: EditionScopedType, year: Edition): string {
  return CSV_URLS[type][year];
}

/**
 * Legacy convenience — current-edition (2026) URLs for callers that have not
 * yet been migrated to `getCsvUrl(type, year)`. These back-compat shims are
 * removed by Task 5 (loadSessions) and Task 4 (content.config.ts).
 */
export const SESSIONS_CSV_URL = CSV_URLS.sessions[2026];
export const SPEAKERS_CSV_URL = CSV_URLS.speakers[2026];
export const SPONSORS_CSV_URL = CSV_URLS.sponsors[2026];
export const TEAM_CSV_URL = CSV_URLS.team;

// Exported for iteration in collections config.
export { EDITIONS };
