import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  fetchCsvOrFallback,
  SPEAKERS_CSV_URL,
  SPONSORS_CSV_URL,
  TEAM_CSV_URL,
} from "./lib/remote-csv";

/**
 * Minimal CSV parser — handles RFC-4180 quoted fields with escaped `""`.
 * Duplicated here (and in src/lib/schedule.ts) to keep the content loader
 * self-contained — the content pipeline runs before user-facing modules.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const row: string[] = [];
    let field = "";
    let inQ = false;
    while (i < n) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; }
          else { inQ = false; i++; }
        } else { field += ch; i++; }
        continue;
      }
      if (ch === '"') { inQ = true; i++; }
      else if (ch === ",") { row.push(field); field = ""; i++; }
      else if (ch === "\n" || ch === "\r") {
        row.push(field);
        if (ch === "\r" && text[i + 1] === "\n") i++;
        i++;
        break;
      } else { field += ch; i++; }
    }
    if (i >= n && (field.length > 0 || row.length > 0)) row.push(field);
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

/**
 * Custom CSV loader for Astro content collections.
 * The CSV's `slug` column becomes the entry id.
 * Fetches the published Google Sheet at build time; falls back to the
 * repo-committed CSV when the remote is unreachable.
 */
function csvLoader({ url, fallback, label }: { url?: string; fallback: string; label: string }) {
  return {
    name: `csv:${label}`,
    load: async ({ store, parseData }: {
      store: { set: (entry: { id: string; data: unknown }) => void; clear: () => void };
      parseData: (opts: { id: string; data: unknown }) => Promise<unknown>;
    }) => {
      const raw = await fetchCsvOrFallback({ url, fallbackRelPath: fallback, label });
      const rows = parseCsv(raw);
      if (rows.length === 0) return;
      const [header, ...body] = rows;
      const normalizeKey = (s: string) => s.trim();
      const keys = header.map(normalizeKey);
      store.clear();
      for (const row of body) {
        const obj: Record<string, string> = {};
        keys.forEach((k, i) => { obj[k] = (row[i] ?? "").trim(); });
        const id = obj.slug || obj.id;
        if (!id) continue;
        // Coerce booleans where relevant — Sheets emits 'TRUE' uppercase.
        const data: Record<string, unknown> = { ...obj };
        if ("keynote" in obj) {
          const v = String(obj.keynote || "").toLowerCase();
          data.keynote = v === "true" || v === "1" || v === "yes";
        }
        const parsed = await parseData({ id, data });
        store.set({ id, data: parsed });
      }
    },
  };
}

const socialUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));

const speakers = defineCollection({
  loader: csvLoader({
    url: SPEAKERS_CSV_URL,
    fallback: "src/content/schedule/speakers.csv",
    label: "speakers.csv",
  }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    photo_url: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    bio: z.string().optional(),
    twitter: socialUrl,
    linkedin: socialUrl,
    github: socialUrl,
    bluesky: socialUrl,
    website: socialUrl,
    keynote: z.boolean().optional(),
  }),
});

const sponsors = defineCollection({
  loader: csvLoader({
    url: SPONSORS_CSV_URL,
    fallback: "src/content/sponsors/sponsors.csv",
    label: "sponsors.csv",
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(["platinum", "gold", "silver", "community"]),
    logo: z.string(),
    url: z.string().url(),
    description_fr: z.string(),
    description_en: z.string(),
  }),
});

const team = defineCollection({
  loader: csvLoader({
    url: TEAM_CSV_URL,
    fallback: "src/content/team/team.csv",
    label: "team.csv",
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role_fr: z.string(),
    role_en: z.string(),
    group: z.enum(["core", "program-committee", "volunteers"]),
    photo: z.string().optional().or(z.literal("").transform(() => undefined)),
    social_linkedin: socialUrl,
    social_github: socialUrl,
    social_bluesky: socialUrl,
    social_twitter: socialUrl,
    social_website: socialUrl,
  }),
});

export const collections = { speakers, sponsors, team };
