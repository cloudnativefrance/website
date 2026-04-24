export const EDITIONS = [2023, 2026, 2027] as const;

export type Edition = (typeof EDITIONS)[number];

export const CURRENT_EDITION: Edition = 2027;

export function isEdition(value: number): value is Edition {
  return (EDITIONS as readonly number[]).includes(value);
}
