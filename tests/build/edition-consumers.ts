/**
 * The one list of everything that can reach a preview edition's data.
 *
 * Shared by `edition-gating.test.ts` and `edition-2027-prod-isolation.test.ts`
 * so the two guards cannot drift apart — and, more importantly, so the list is
 * not the only thing standing between an unannounced programme and a
 * production build. A hand-written list is exactly what missed
 * `src/content.config.ts` for three commits; `edition-gating.test.ts` therefore
 * *enumerates* `src/` and fails on any consumer that appears in neither list
 * below.
 */

/** Loaders that fetch or read an edition's sessions or speakers. */
export const EDITION_DATA_LOADERS = [
  "loadSessions",
  "loadSpeakers",
  "getAllSpeakers",
  "getSpeakersByLocale",
  "getSortedSpeakers",
  "getTalksByLocale",
  "getTalksForSpeaker",
] as const;

/** Matches a *call* to one of them (an import naming one does not match). */
export const LOADER_CALL_RE = new RegExp(
  `\\b(${EDITION_DATA_LOADERS.join("|")})\\s*\\(`,
);

/**
 * The data layer itself: these modules define the loaders above and call each
 * other. They are not consumers, and they are where PR 2's gate belongs — see
 * NON_ROUTE_CONSUMERS.
 */
export const DATA_LAYER = [
  "src/lib/schedule.ts",
  "src/lib/speakers.ts",
  "src/lib/speaker-source.ts",
  // The authenticated preview reader (PR 2): schedule.ts and speaker-source.ts
  // call into loadPreviewEdition for an access: "preview" edition instead of
  // calling loadSessions/loadSpeakers on themselves, so neither file matches
  // LOADER_CALL_RE — they belong here, not in NON_ROUTE_CONSUMERS, whose test
  // requires every declared entry to match that regex.
  "src/lib/pretalx-preview.ts",
  "src/lib/pretalx-preview-api.ts",
] as const;

/** Every route that can reach a preview edition's sessions or speakers. */
export const ROUTE_CONSUMERS = [
  "src/pages/programme/[year].astro",
  "src/pages/en/programme/[year].astro",
  "src/pages/intervenants/[year]/index.astro",
  "src/pages/en/speakers/[year]/index.astro",
  "src/pages/intervenants/[year]/[slug].astro",
  "src/pages/en/speakers/[year]/[slug].astro",
  "src/pages/intervenants/[slug].astro",
  "src/pages/en/speakers/[slug].astro",
  "src/pages/programme.ics.ts",
  "src/pages/replays/index.astro",
  "src/pages/en/replays/index.astro",
] as const;

/**
 * Consumers that reach an edition's data WITHOUT being a route.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  READ THIS BEFORE WRITING PR 2 (the authenticated Pretalx reader).
 *
 *  `isEditionLoadable` must move INSIDE `loadSessions` / `loadSpeakers`
 *  themselves. Gating the routes is NOT sufficient and never was.
 *
 *  A content collection loader is not a route. It runs during `astro sync`,
 *  before any page is rendered, on every single build — including a production
 *  build with every route correctly gated. If PR 2 puts the authenticated fetch
 *  behind `loadSpeakers(2027)` and the gate only in `src/pages/**`, then a
 *  production build *fetches the 2027 speaker records, parses them against
 *  `speakerSchema`, and holds them in the content store* while faithfully
 *  rendering "coming soon". The invariant — no fact about a preview edition may
 *  appear in a production build — is enforced by never fetching the data, and
 *  this is the code path that fetches it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const NON_ROUTE_CONSUMERS = [
  {
    file: "src/content.config.ts",
    /** Why it reaches the data. */
    why:
      "speakersCollection(year)'s loader calls loadSpeakers(year) unconditionally, " +
      "for every edition registered in `collections` — speakers-2027 included. It " +
      "runs at `astro sync` time, so it cannot consult a route's gate.",
    /** What keeps it harmless *today*, and only today. */
    safeBecause:
      "loadSpeakers(2027) resolves to the frozen archive at " +
      "src/content/schedule/speakers-2027.json, which is [] and is asserted to " +
      "stay [] by edition-2027-prod-isolation.test.ts. The moment PR 2 gives " +
      "loadSpeakers a real 2027 source, that assurance is gone.",
  },
] as const;
