import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "@/i18n/ui";
import { loadSessions, type SessionRow } from "./schedule";

/**
 * Extract the slug from a speaker collection entry id.
 * After the speakers.csv migration, id === slug (no locale prefix).
 */
export function getSlug(entryId: string): string {
  return entryId;
}

/** Get every speaker. The collection is locale-agnostic. */
export async function getAllSpeakers() {
  return await getCollection("speakers");
}

/**
 * Back-compat: used to return FR/EN-filtered collections.
 * The schema is now single-source; we just return every speaker regardless of locale.
 */
export async function getSpeakersByLocale(_locale: Locale) {
  return await getAllSpeakers();
}

/** Get all sessions for a locale (currently locale-agnostic — sessions.csv holds one copy). */
export async function getTalksByLocale(_locale: Locale): Promise<SessionRow[]> {
  return await loadSessions();
}

/** Return the sessions that feature a given speaker slug (primary or co-speaker). */
export async function getTalksForSpeaker(_locale: Locale, speakerSlug: string): Promise<SessionRow[]> {
  const sessions = await loadSessions();
  return sessions.filter((s) => s.speakers.includes(speakerSlug));
}

/** Sort speakers with keynote holders first, then alphabetically by name. */
export async function getSortedSpeakers(_locale: Locale) {
  const speakers = await getAllSpeakers();
  return [...speakers].sort((a, b) => {
    const aKey = !!a.data.keynote;
    const bKey = !!b.data.keynote;
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.data.name.localeCompare(b.data.name);
  });
}

/** Other speaker slugs on the same session, excluding the current one. */
export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  return session.speakers.filter((slug) => slug !== currentSpeakerSlug);
}

export type SpeakerEntry = CollectionEntry<"speakers">;
