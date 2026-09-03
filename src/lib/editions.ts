export const EDITIONS = [2023, 2026, 2027] as const;

export type Edition = (typeof EDITIONS)[number];

export const CURRENT_EDITION: Edition = 2026;

/**
 * The oldest edition the Programme menu offers as an archive entry.
 *
 * 2023 is excluded: it has a dedicated /2023 retrospective — photos, replays, a
 * narrative — that the About menu already links, so listing it under Programme
 * would be a second, worse route to the same content.
 *
 * A FIXED year, and that is the whole point of it existing. The rule used to be
 * written `>= CURRENT_EDITION`, which produced the right answer only because
 * CURRENT_EDITION happened to be 2026: it expressed a moving value where the
 * intent is a fixed one. Bumping CURRENT_EDITION to 2027 — the edit this whole
 * design is preparing for — would have made `archivedEditions()` return [] and
 * silently dropped "Programme 2026" out of the nav, which is the requirement
 * the function exists to satisfy.
 */
export const FIRST_PROGRAMME_EDITION: Edition = 2026;

export function isEdition(value: number): value is Edition {
  return (EDITIONS as readonly number[]).includes(value);
}

/**
 * Editions newest-first — the order every edition menu, archive list and
 * "which one leads?" derivation wants.
 *
 * A module-level constant rather than a function: `EDITIONS` is a literal, so
 * the sorted copy is build-invariant and there is nothing to recompute. Typed
 * `readonly` because callers only ever `.filter()` / `.map()` it, and a shared
 * array that one caller could sort in place would be a trap.
 */
export const EDITIONS_DESC: readonly Edition[] = [...EDITIONS].sort((a, b) => b - a);
