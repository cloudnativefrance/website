export const EDITIONS = [2023, 2026, 2027] as const;

export type Edition = (typeof EDITIONS)[number];

export const CURRENT_EDITION: Edition = 2026;

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
