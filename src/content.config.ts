import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  fetchCsvOrFallback,
  CSV_URLS,
  EDITIONS,
} from "./lib/remote-csv";
import type { Edition } from "./lib/editions";

// -- CSV parser (unchanged) ------------------------------------------------

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

// -- csvLoader (unchanged) -------------------------------------------------

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
      const keys = header.map((s) => s.trim());
      store.clear();
      // Prefix the store key with a zero-padded row index so Astro's
      // alphabetical getCollection() order matches CSV order, and so that a
      // sponsor appearing in multiple tiers (e.g. Chainguard in both Gold and
      // Experience) gets a unique key per row instead of overwriting itself.
      for (let rowIndex = 0; rowIndex < body.length; rowIndex++) {
        const row = body[rowIndex];
        const obj: Record<string, string> = {};
        keys.forEach((k, i) => { obj[k] = (row[i] ?? "").trim(); });
        const naturalId = obj.slug || obj.id;
        if (!naturalId) continue;
        const storeKey = `${String(rowIndex).padStart(4, "0")}-${naturalId}`;
        const data: Record<string, unknown> = { ...obj };
        if ("keynote" in obj) {
          const v = String(obj.keynote || "").toLowerCase();
          data.keynote = v === "true" || v === "1" || v === "yes";
        }
        const parsed = await parseData({ id: storeKey, data });
        store.set({ id: storeKey, data: parsed });
      }
    },
  };
}

// -- Schemas ---------------------------------------------------------------

const socialUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));

const speakerSchema = z.object({
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
});

// Sheet authors use short/French tier labels; normalize to canonical schema names.
const SPONSOR_TIER_ALIAS: Record<string, string> = {
  enduser: "end_user",
  experience: "experiences",
  presse: "media",
  ecole: "institutional",
};

const sponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.preprocess(
    (v) => (typeof v === "string" ? (SPONSOR_TIER_ALIAS[v.trim()] ?? v.trim()) : v),
    z.enum([
      "platinum",
      "gold",
      "silver",
      "end_user",
      "community",
      "experiences",
      "media",
      "institutional",
    ]),
  ),
  logo: z.string(),
  url: socialUrl,
  description_fr: z.string(),
  description_en: z.string(),
});

const teamSchema = z.object({
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
});

// -- Per-year collection factories -----------------------------------------

function speakersCollection(year: Edition) {
  return defineCollection({
    loader: csvLoader({
      url: CSV_URLS.speakers[year],
      fallback: `src/content/schedule/speakers-${year}.csv`,
      label: `speakers-${year}.csv`,
    }),
    schema: speakerSchema,
  });
}

function sponsorsCollection(year: Edition) {
  return defineCollection({
    loader: csvLoader({
      url: CSV_URLS.sponsors[year],
      fallback: `src/content/sponsors/sponsors-${year}.csv`,
      label: `sponsors-${year}.csv`,
    }),
    schema: sponsorSchema,
  });
}

const team = defineCollection({
  loader: csvLoader({
    url: CSV_URLS.team,
    fallback: "src/content/team/team.csv",
    label: "team.csv",
  }),
  schema: teamSchema,
});

// Collections must be statically keyed so Astro can type-check getCollection().
export const collections = {
  "speakers-2023": speakersCollection(2023),
  "speakers-2026": speakersCollection(2026),
  "speakers-2027": speakersCollection(2027),
  "sponsors-2023": sponsorsCollection(2023),
  "sponsors-2026": sponsorsCollection(2026),
  "sponsors-2027": sponsorsCollection(2027),
  team,
};

// Re-export for convenience at call sites.
export { EDITIONS };
