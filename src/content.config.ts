import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
 */
function csvLoader(relPath: string) {
  return {
    name: `csv:${relPath}`,
    load: async ({ store, parseData }: {
      store: { set: (entry: { id: string; data: unknown }) => void; clear: () => void };
      parseData: (opts: { id: string; data: unknown }) => Promise<unknown>;
    }) => {
      const raw = readFileSync(join(process.cwd(), relPath), "utf8");
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
        // Coerce booleans where relevant
        const data: Record<string, unknown> = { ...obj };
        if ("keynote" in obj) data.keynote = obj.keynote === "true" || obj.keynote === "1";
        const parsed = await parseData({ id, data });
        store.set({ id, data: parsed });
      }
    },
  };
}

const socialUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));

const speakers = defineCollection({
  loader: csvLoader("src/content/schedule/speakers.csv"),
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
  loader: file("src/content/sponsors/sponsors.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(["platinum", "gold", "silver", "community"]),
    logo: z.string(),
    url: z.string().url(),
    description: z.object({
      fr: z.string(),
      en: z.string(),
    }),
  }),
});

const team = defineCollection({
  loader: file("src/content/team/team.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.object({
      fr: z.string(),
      en: z.string(),
    }),
    group: z.enum(["core", "program-committee", "volunteers"]),
    photo: z.string().optional(),
    social: z
      .object({
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        bluesky: z.string().url().optional(),
      })
      .optional(),
  }),
});

export const collections = { speakers, sponsors, team };
