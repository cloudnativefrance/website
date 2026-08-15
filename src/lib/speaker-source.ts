/**
 * Speaker records, assembled from Pretalx plus the two things Pretalx cannot own.
 *
 * The shape returned here is exactly `speakerSchema` in `src/content.config.ts`,
 * so swapping the loader changes no consumer: the `intervenants` pages, the
 * speaker cards and `src/lib/speakers.ts` all keep reading the same fields.
 *
 * Where each field comes from:
 *
 *   name, bio, photo_url   the released schedule export (public, no token)
 *   company, role, socials  Pretalx speaker questions (authenticated)
 *   slug                    src/data/speaker-slugs.ts — URL identity
 *   keynote, keynote_size   src/data/keynote-cast.ts — editorial layout
 *
 * The last two are deliberately not in Pretalx. `slug` is routing: eight of them
 * are hand-shortened (`petazzoni`, not `jerome-petazzoni`) and moving them would
 * 404 every existing link. `keynote_size` is the running order of the opening
 * session — who hosts, who headlines, who sits on the panel — which is a layout
 * decision that changes every edition, not a fact about a person.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Edition } from "./editions";
import { loadFrozenArchive } from "./frozen-archive";
import {
  PRETALX_EVENT,
  allTalks,
  fetchScheduleExport,
  type PretalxPerson,
  type PretalxScheduleExport,
} from "./pretalx";
import { loadSpeakerEnrichment } from "./pretalx-private";
import { SPEAKER_SLUGS } from "@/data/speaker-slugs";
import { keynoteRoleFor } from "@/data/keynote-cast";

export interface SpeakerRecord {
  slug: string;
  name: string;
  photo_url: string;
  company: string;
  role: string;
  bio: string;
  linkedin: string;
  github: string;
  bluesky: string;
  website: string;
  keynote: boolean;
  keynote_size?: "lead" | "guest" | "panel";
}

/** Every distinct person in a released export, keyed by code. */
function peopleInSchedule(doc: PretalxScheduleExport): Map<string, PretalxPerson> {
  const out = new Map<string, PretalxPerson>();
  for (const talk of allTalks(doc)) {
    for (const person of talk.persons) {
      if (!out.has(person.code)) out.set(person.code, person);
    }
  }
  return out;
}

/**
 * Prefer the committed image over the Pretalx original.
 *
 * `public/speakers/<slug>.jpg` holds 78 optimised, self-hosted portraits. Pretalx
 * serves unoptimised originals from the CFP host, so using those would make every
 * speaker card a cross-origin request for a larger file — and two of the
 * scheduled speakers have no Pretalx avatar at all despite having a local photo.
 * The Pretalx avatar remains the fallback for anyone with no committed image.
 */
function photoFor(slug: string, avatar: string | null | undefined): string {
  const local = `/speakers/${slug}.jpg`;
  if (existsSync(join(process.cwd(), "public", local))) return local;
  return avatar ?? "";
}

export async function loadSpeakers(year: Edition): Promise<SpeakerRecord[]> {
  const eventSlug = PRETALX_EVENT[year];
  if (!eventSlug) return loadArchivedSpeakers(year);

  const doc = await fetchScheduleExport(year, eventSlug);
  const people = peopleInSchedule(doc);
  const enrichment = await loadSpeakerEnrichment(year, eventSlug, new Set(people.keys()));

  const records: SpeakerRecord[] = [];
  const unmapped: string[] = [];

  for (const person of people.values()) {
    const slug = SPEAKER_SLUGS[person.name.trim()];
    if (!slug) {
      unmapped.push(person.name);
      continue;
    }
    const extra = enrichment.get(person.code) ?? {};
    const role = keynoteRoleFor(year, slug);
    records.push({
      slug,
      name: person.name.trim(),
      photo_url: photoFor(slug, person.avatar),
      company: extra.company ?? "",
      role: extra.role ?? "",
      bio: (person.biography ?? "").trim(),
      linkedin: extra.linkedin ?? "",
      github: extra.github ?? "",
      bluesky: extra.bluesky ?? "",
      website: extra.website ?? "",
      // Membership of the keynote cast IS being a keynote speaker; there is no
      // separate flag to drift out of step with the running order.
      keynote: role !== undefined,
      keynote_size: role,
    });
  }

  if (unmapped.length > 0) {
    // Emitting a derived slug would produce /intervenants/Jérôme%20Petazzoni —
    // a 404 that renders as a working link. Fail with the names to add instead.
    throw new Error(
      `[speakers] ${unmapped.length} Pretalx speaker(s) have no slug in ` +
        `src/data/speaker-slugs.ts: ${unmapped.join(", ")}. Add them there, keyed ` +
        `by their exact Pretalx name.`,
    );
  }

  records.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  console.log(`[speakers] ${year}: ${records.length} from Pretalx`);
  return records;
}

function loadArchivedSpeakers(year: Edition): SpeakerRecord[] {
  return loadFrozenArchive<SpeakerRecord>("speakers", year);
}
