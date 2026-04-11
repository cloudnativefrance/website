import { getCollection } from "astro:content";
import type { Locale } from "@/i18n/ui";

/** Extract the slug (without locale prefix) from a collection entry ID */
export function getSlug(entryId: string): string {
  return entryId.replace(/^(fr|en)\//, "");
}

/** Extract locale from a collection entry ID */
export function getLocale(entryId: string): Locale {
  return entryId.startsWith("en/") ? "en" : "fr";
}

/** Get all speakers for a given locale */
export async function getSpeakersByLocale(locale: Locale) {
  const allSpeakers = await getCollection("speakers");
  return allSpeakers.filter((s) => s.id.startsWith(`${locale}/`));
}

/** Get all talks for a given locale */
export async function getTalksByLocale(locale: Locale) {
  const allTalks = await getCollection("talks");
  return allTalks.filter((t) => t.id.startsWith(`${locale}/`));
}

/** Get talks for a specific speaker slug (matches speaker + cospeakers) */
export async function getTalksForSpeaker(
  locale: Locale,
  speakerSlug: string,
) {
  const talks = await getTalksByLocale(locale);
  return talks.filter(
    (t) =>
      t.data.speaker === speakerSlug ||
      t.data.cospeakers?.includes(speakerSlug),
  );
}

/** Get speakers sorted: keynotes first, then alphabetical by name */
export async function getSortedSpeakers(locale: Locale) {
  const speakers = await getSpeakersByLocale(locale);
  const talks = await getTalksByLocale(locale);

  // Build a Set of speaker slugs who have keynote talks
  const keynoteSpeakerSlugs = new Set<string>();
  for (const talk of talks) {
    if (talk.data.format === "keynote") {
      keynoteSpeakerSlugs.add(talk.data.speaker);
      talk.data.cospeakers?.forEach((cs) => keynoteSpeakerSlugs.add(cs));
    }
  }

  // Sort: keynotes first, then alphabetical by name
  return speakers.sort((a, b) => {
    const aKey = keynoteSpeakerSlugs.has(getSlug(a.id));
    const bKey = keynoteSpeakerSlugs.has(getSlug(b.id));
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.data.name.localeCompare(b.data.name);
  });
}

/** Get all other speaker slugs for a talk, excluding the current speaker */
export function getCoSpeakersForTalk(
  talk: { data: { speaker: string; cospeakers?: string[] } },
  currentSpeakerSlug: string,
): string[] {
  return [talk.data.speaker, ...(talk.data.cospeakers ?? [])].filter(
    (slug) => slug !== currentSpeakerSlug,
  );
}
