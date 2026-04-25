/**
 * Feature flag registry — single source of truth.
 *
 * Each entry describes a date-windowed flag with an optional opens/closes
 * boundary and a kind that determines how the flag is consumed:
 *
 *   - "page"    — gates an entire route. Must have matching i18n copy under
 *                 flags.<name>.soon.{title,body} in both FR and EN.
 *   - "element" — gates a single UI element via <FeatureGate>. No i18n required.
 *
 * Dates use ISO-8601 with explicit Europe/Paris offsets (+02:00 summer / +01:00 winter)
 * matching the convention used throughout the codebase.
 *
 * Omitting `opens` → active from the start.
 * Omitting `closes` → never closes.
 * Omitting both + no env override → always active.
 *
 * See docs/feature-flags.md for the operator's guide.
 */

export interface FlagDefinition {
  /** ISO-8601 timestamp with Europe/Paris offset. */
  opens?: string;
  /** ISO-8601 timestamp with Europe/Paris offset. */
  closes?: string;
  /** Drives consumer contract and i18n-completeness enforcement. */
  kind: "page" | "element";
}

export const FLAGS = {
  cfp: {
    opens: "2026-09-01T00:00:00+02:00",
    closes: "2027-02-28T23:59:59+01:00",
    kind: "page",
  },
  tickets: {
    opens: "2027-01-15T00:00:00+01:00",
    kind: "page",
  },
  programme: {
    opens: "2027-04-01T09:00:00+02:00",
    kind: "page",
  },
  homepage_countdown: {
    opens: "2026-07-01T00:00:00+02:00",
    kind: "element",
  },
  homepage_sponsors: {
    opens: "2026-12-01T00:00:00+01:00",
    kind: "element",
  },
} as const satisfies Record<string, FlagDefinition>;

export type FlagName = keyof typeof FLAGS;
