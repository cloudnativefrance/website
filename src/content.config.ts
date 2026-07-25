import type { Loader, LoaderContext } from "astro/loaders";
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

function csvLoader({ url, fallback, label }: { url?: string; fallback: string; label: string }): Loader {
  return {
    name: `csv:${label}`,
    // Typed from Astro's own LoaderContext rather than a hand-written shape:
    // the local one declared store.set as `(entry) => void` while Astro's is
    // generic over the entry data and returns boolean, so the two drifted.
    load: async ({ store, parseData }: LoaderContext) => {
      const raw = await fetchCsvOrFallback({ url, fallbackRelPath: fallback, label });
      const rows = parseCsv(raw);
      if (rows.length === 0) return;
      const [header, ...body] = rows;
      const keys = header.map((s) => {
        const k = s.trim();
        return HEADER_ALIASES[k] ?? k;
      });
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

// Sheet authors regularly paste cells like `LinkedIn: https://...` or
// `Github: https://x\nLinkedIn: https://y` — strict z.url() rejects those and
// fails the whole build. Extract the first http(s) URL we find and drop the
// rest; empty/no-URL strings become undefined.
const socialUrl = z.preprocess(
  (raw) => {
    if (typeof raw !== "string") return raw;
    const match = raw.match(/https?:\/\/\S+/);
    return match ? match[0].replace(/[),.;]+$/, "") : undefined;
  },
  z.string().url().optional(),
);

const speakerSchema = z.object({
  slug: z.string(),
  name: z.string(),
  photo_url: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  linkedin: socialUrl,
  github: socialUrl,
  bluesky: socialUrl,
  website: socialUrl,
  keynote: z.boolean().optional(),
  keynote_size: z
    .enum(["lead", "guest", "panel"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

// Sheet authors use short/French tier labels; normalize to canonical schema names.
const SPONSOR_TIER_ALIAS: Record<string, string> = {
  enduser: "end_user",
  experience: "experiences",
  presse: "media",
  ecole: "institutional",
};

const HEADER_ALIASES: Record<string, string> = {
  role_eng: "role_en",
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

const TEAM_GROUPS = [
  "equipe-principale",
  "comite-selection",
  "autres-benevoles",
] as const;

// Temporary compatibility map — the published Google Sheet still uses the
// pre-April-2026 group slugs (direction, editorial, ...). They are mapped
// to the new audience-facing categories at load time so the build keeps
// working while the Sheet owner repoints the column. Drop this map after
// the Sheet has been migrated.
const LEGACY_TEAM_GROUP_ALIAS: Record<string, (typeof TEAM_GROUPS)[number]> = {
  direction: "equipe-principale",
  editorial: "equipe-principale",
  communication: "equipe-principale",
  partenariats: "equipe-principale",
  billetterie: "equipe-principale",
  aidants: "autres-benevoles",
  inclusivite: "equipe-principale",
};

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  role_fr: z.string(),
  role_en: z.string(),
  groups: z.preprocess(
    (v) => {
      const items = typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : v;
      if (!Array.isArray(items)) return items;
      const mapped = items
        .map((g) => LEGACY_TEAM_GROUP_ALIAS[g] ?? g)
        // Drop unknown values instead of crashing the build.
        .filter((g) => (TEAM_GROUPS as readonly string[]).includes(g));
      // Dedupe — multiple legacy slugs can collapse to the same new slug.
      return Array.from(new Set(mapped));
    },
    z.array(z.enum(TEAM_GROUPS)).min(0),
  ),
  photo: z.string().optional().or(z.literal("").transform(() => undefined)),
  social_linkedin: socialUrl,
  social_github: socialUrl,
  social_bluesky: socialUrl,
  social_website: socialUrl,
});

export type TeamGroup = (typeof TEAM_GROUPS)[number];
export { TEAM_GROUPS };

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
