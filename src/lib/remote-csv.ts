import { fetchTextOrFallback } from "./remote-fetch";

export interface FetchOptions {
  url?: string;
  fallbackRelPath: string;
  label?: string;
  timeoutMs?: number;
}

/** CSV-validating wrapper over the shared transport. */
export async function fetchCsvOrFallback(opts: FetchOptions): Promise<string> {
  return fetchTextOrFallback({
    ...opts,
    validate: (body) => {
      if (!body || body.length < 20 || !body.includes(",")) {
        throw new Error("Response does not look like CSV");
      }
    },
  });
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
const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub";

const csv = (gid: number) => `${SHEET_BASE}?gid=${gid}&single=true&output=csv`;

export const CSV_URLS: {
  sessions: Record<Edition, string>;
  speakers: Record<Edition, string>;
  sponsors: Record<Edition, string>;
  team: string;
} = {
  sessions: {
    2023: process.env.SESSIONS_CSV_URL_2023 || csv(985867274),
    2026: process.env.SESSIONS_CSV_URL_2026 || csv(178765557),
    2027: process.env.SESSIONS_CSV_URL_2027 || csv(299000330),
  },
  speakers: {
    2023: process.env.SPEAKERS_CSV_URL_2023 || csv(762540077),
    2026: process.env.SPEAKERS_CSV_URL_2026 || csv(124864767),
    2027: process.env.SPEAKERS_CSV_URL_2027 || csv(1713930040),
  },
  sponsors: {
    2023: process.env.SPONSORS_CSV_URL_2023 || csv(1892473186),
    2026: process.env.SPONSORS_CSV_URL_2026 || csv(1833117198),
    2027: process.env.SPONSORS_CSV_URL_2027 || csv(1121832483),
  },
  team: process.env.TEAM_CSV_URL || csv(440809363),
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
