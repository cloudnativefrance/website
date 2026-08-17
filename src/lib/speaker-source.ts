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
  photo_fallback: string;
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
 * Where a speaker's portrait comes from, in priority order.
 *
 * Pretalx first. This used to be the other way round — a committed file always
 * won — which made the portrait the one field Pretalx did not own, and left the
 * module docstring's erasure promise (delete in Pretalx, rebuild, gone) false
 * for photos specifically, since they also lived in git. It also meant a
 * speaker who updated their portrait in Pretalx never saw it change on the site.
 *
 * `public/speakers/<slug>.jpg` survives as a FALLBACK for the people who have
 * no Pretalx avatar yet — 12 of 77 at the time of writing. Each avatar uploaded
 * moves one more person onto the Pretalx path with no code change, and once
 * nobody is left the whole directory can be deleted as pure cleanup.
 *
 * The returned string is a URL, not a file: an absolute Pretalx one gets
 * downloaded and optimised at build time by SpeakerAvatar — Pretalx serves
 * unoptimised originals from the CFP host, and no visitor may be sent there —
 * a `/speakers/…` one is served straight from `public/`, and an empty one
 * renders initials.
 */
function committedPhoto(slug: string): string {
  const local = `/speakers/${slug}.jpg`;
  return existsSync(join(process.cwd(), "public", local)) ? local : "";
}

function photoFor(slug: string, avatar: string | null | undefined): string {
  return avatar || committedPhoto(slug);
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
      // Carried separately, not collapsed into photo_url, because the Pretalx
      // URL can only be found unreadable at RENDER time — by which point the
      // knowledge that a committed portrait exists would otherwise be gone. An
      // avatar outage would then blank 65 of 77 faces in a release image, past
      // the very flag that exists to stop silent regressions shipping.
      photo_fallback: person.avatar ? committedPhoto(slug) : "",
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
