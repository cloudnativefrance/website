import type { Loader, LoaderContext } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  fetchCsvOrFallback,
  CSV_URLS,
  EDITIONS,
} from "./lib/remote-csv";
import type { Edition } from "./lib/editions";
import { parseCsv } from "./lib/csv";
import { loadSpeakers } from "./lib/speaker-source";

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
    if (match) return match[0].replace(/[),.;]+$/, "");

    // Speakers answer these questions in Pretalx by hand, and routinely type a
    // bare handle or a scheme-less host — "@ada", "linkedin.com/in/ada",
    // "github.com/ada". Requiring a full URL dropped all of those silently, so
    // the profile simply lost its link. Normalise the common shapes instead.
    const value = raw.trim().replace(/[),.;]+$/, "");
    if (!value) return undefined;
    if (/^[a-z0-9-]+\.[a-z]{2,}\//i.test(value)) return `https://${value}`;
    const handle = value.replace(/^@/, "");
    if (!handle || /\s/.test(handle)) return undefined;
    if (/^[\w.-]+\.[a-z]{2,}$/i.test(handle)) return `https://${handle}`;
    return undefined;
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

/**
 * Speakers come from Pretalx, merged with the repo's slug map and keynote cast.
 *
 * The store key keeps the `${rowIndex}-${slug}` shape the csvLoader used, because
 * `getSlug()` in src/lib/speakers.ts strips that prefix and every speaker URL is
 * built from the result.
 */
function speakersCollection(year: Edition) {
  return defineCollection({
    loader: {
      name: `pretalx:speakers-${year}`,
      load: async ({ store, parseData }: LoaderContext) => {
        const records = await loadSpeakers(year);
        store.clear();
        for (let i = 0; i < records.length; i++) {
          const id = `${String(i).padStart(4, "0")}-${records[i].slug}`;
          // Spread into a plain record: parseData wants an index-signature type,
          // and an interface has none.
          const data = { ...records[i] } as Record<string, unknown>;
          store.set({ id, data: await parseData({ id, data }) });
        }
      },
    },
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
