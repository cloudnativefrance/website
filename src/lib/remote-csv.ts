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
 *   SPONSORS_CSV_URL_2023 / _2026 / _2027
 *   TEAM_CSV_URL
 *
 * An UNSET or empty override falls through to the hardcoded published URL
 * below, not to the committed local CSV — `||` cannot distinguish the two.
 * The local copies are the fallback for a failed *fetch*, in `remote-fetch.ts`.
 */
const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub";

const csv = (gid: number) => `${SHEET_BASE}?gid=${gid}&single=true&output=csv`;

export const CSV_URLS: {
  sponsors: Record<Edition, string>;
  team: string;
} = {
  sponsors: {
    2023: process.env.SPONSORS_CSV_URL_2023 || csv(1892473186),
    2026: process.env.SPONSORS_CSV_URL_2026 || csv(1833117198),
    2027: process.env.SPONSORS_CSV_URL_2027 || csv(1121832483),
  },
  team: process.env.TEAM_CSV_URL || csv(440809363),
};

// Exported for iteration in collections config.
export { EDITIONS };
