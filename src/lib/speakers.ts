import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "@/i18n/ui";
import { loadSessions, type SessionRow } from "./schedule";
import { CURRENT_EDITION, type Edition } from "./editions";

/** Year-scoped speaker collection name (must match keys in src/content.config.ts). */
type SpeakersCollection = "speakers-2023" | "speakers-2026" | "speakers-2027";

function speakersCollectionName(year: Edition): SpeakersCollection {
  return `speakers-${year}` as SpeakersCollection;
}

/**
 * Extract the slug from a speaker collection entry id. After the speakers.csv
 * migration, id === slug (no locale prefix); still true per-year.
 */
export function getSlug(entryId: string): string {
  return entryId;
}

/** Get every speaker for the given year. The collection is locale-agnostic. */
export async function getAllSpeakers(year: Edition = CURRENT_EDITION) {
  return await getCollection(speakersCollectionName(year));
}

/**
 * Back-compat wrapper. FR/EN are served from the same collection — the `locale`
 * param is kept to avoid churning every call site, but it has no effect.
 */
export async function getSpeakersByLocale(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
) {
  return await getAllSpeakers(year);
}

export async function getTalksByLocale(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  return await loadSessions(year);
}

export async function getTalksForSpeaker(
  _locale: Locale,
  speakerSlug: string,
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const sessions = await loadSessions(year);
  return sessions.filter((s) => s.speakers.includes(speakerSlug));
}

export async function getSortedSpeakers(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
) {
  const speakers = await getAllSpeakers(year);
  return [...speakers].sort((a, b) => {
    const aKey = !!a.data.keynote;
    const bKey = !!b.data.keynote;
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.data.name.localeCompare(b.data.name);
  });
}

export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  const speakers = session.speakers ?? [];
  return speakers.filter((slug) => slug !== currentSpeakerSlug);
}

/**
 * D-04: Pick the speaker's "primary" session for grid display.
 * Order: keynote first, then earliest startTime (lexicographic ISO compare is correct here).
 * Returns undefined when the speaker has no sessions (D-05 — caller renders graceful fallback).
 */
export function getPrimaryTalk(
  speakerSlug: string,
  sessions: SessionRow[],
): SessionRow | undefined {
  const list = sessions.filter((s) => (s.speakers ?? []).includes(speakerSlug));
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aKey = a.format === "keynote" ? 0 : 1;
    const bKey = b.format === "keynote" ? 0 : 1;
    if (aKey !== bKey) return aKey - bKey;
    return a.startTime.localeCompare(b.startTime);
  })[0];
}

/** Generic — matches whichever year was requested. */
export type SpeakerEntry = CollectionEntry<SpeakersCollection>;
