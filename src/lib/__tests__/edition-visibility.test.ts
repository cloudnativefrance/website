import { describe, it, expect, afterEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertEditionPublishable,
  isEditionLoadable,
  resolveEditionLoadable,
} from "@/lib/edition-visibility";
import { CURRENT_EDITION, EDITIONS } from "@/lib/editions";
import { PRETALX_EVENT } from "@/lib/edition-registry";

const CURRENT = 2026 as const;

describe("resolveEditionLoadable", () => {
  it("loads a past edition with no Pretalx event (2023)", () => {
    expect(resolveEditionLoadable(undefined, 2023, CURRENT, false)).toBe(true);
  });

  it("loads the current public edition regardless of the flag", () => {
    expect(resolveEditionLoadable("public", 2026, CURRENT, false)).toBe(true);
  });

  it("refuses a preview edition while the flag is inactive", () => {
    expect(resolveEditionLoadable("preview", 2027, CURRENT, false)).toBe(false);
  });

  it("loads a preview edition once the flag is active", () => {
    expect(resolveEditionLoadable("preview", 2027, CURRENT, true)).toBe(true);
  });

  it("refuses an unmapped future edition while the flag is inactive", () => {
    expect(resolveEditionLoadable(undefined, 2028, CURRENT, false)).toBe(false);
  });

  it("checks preview access BEFORE CURRENT_EDITION", () => {
    // The spec's D-5 trap: moving CURRENT_EDITION to 2027 must not un-hide a
    // preview edition. With currentEdition === 2027 the arithmetic branch
    // (year > currentEdition) would say "loadable"; access must win.
    expect(resolveEditionLoadable("preview", 2027, 2027, false)).toBe(false);
  });

  it("still gates a FUTURE public edition on the flag", () => {
    // `access` decides how the data is fetched; the flag decides when it is
    // published. Making the 2027 event public in Pretalx — which happens months
    // before the announcement, so the CFP can point at it — must not publish
    // the programme on the site.
    expect(resolveEditionLoadable("public", 2027, CURRENT, false)).toBe(false);
    expect(resolveEditionLoadable("public", 2027, CURRENT, true)).toBe(true);
  });

  // The two rows the "checks preview access BEFORE CURRENT_EDITION" case does
  // NOT cover. Bumping currentEdition to an edition's own year makes it
  // loadable with the flag off — unless that edition is marked `preview`. These
  // assert today's real behaviour rather than the behaviour one might wish for;
  // making the flag authoritative for `year >= currentEdition` instead would
  // gate the *current* edition too, so /programme/2026 would render "coming
  // soon" until 2027-04-01. What keeps these rows from mattering is the
  // "every publishable edition has public data" guard below: it fails the build
  // if CURRENT_EDITION is bumped to an edition whose data is not public yet.
  it("a bump to a PUBLIC edition's own year un-gates it, flag or not", () => {
    expect(resolveEditionLoadable("public", 2027, 2027, false)).toBe(true);
  });

  it("a bump to an UNMAPPED edition's own year un-gates it too", () => {
    // 2027 has no PRETALX_EVENT entry today, so this is the live shape of the
    // trap: `access` is undefined and only the arithmetic is left.
    expect(resolveEditionLoadable(undefined, 2027, 2027, false)).toBe(true);
  });
});

/**
 * The guard that makes the two rows above survivable.
 *
 * `CURRENT_EDITION` is what makes an edition publishable: `resolveEditionLoadable`
 * returns true for every `year <= currentEdition` that is not explicitly marked
 * `preview`. So moving `CURRENT_EDITION` forward is not housekeeping — it is the
 * act of publishing that edition. This asserts the precondition that makes the
 * move safe: the edition being published must already have public data.
 */
describe("every edition up to CURRENT_EDITION has public data", () => {
  const REPO_ROOT = resolve(import.meta.dirname, "../../../");

  /** A frozen archive counts as public data only if it actually has rows. */
  const hasPopulatedArchive = (year: number): boolean => {
    const path = resolve(REPO_ROOT, `src/content/schedule/sessions-${year}.json`);
    if (!existsSync(path)) return false;
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(parsed) && parsed.length > 0;
  };

  const publishable = EDITIONS.filter((year) => year <= CURRENT_EDITION);

  it.each(publishable)(
    "%i is either a public Pretalx event or a populated frozen archive",
    (year) => {
      const access = PRETALX_EVENT[year]?.access;
      const ok = access === "public" || hasPopulatedArchive(year);

      expect(
        ok,
        `Edition ${year} is <= CURRENT_EDITION (${CURRENT_EDITION}), which means ` +
          `isEditionLoadable(${year}) returns true in a PRODUCTION build — the ` +
          `programme flag is not consulted for a past or current edition. But ` +
          `${year} has no public data: its PRETALX_EVENT access is ` +
          `${access === undefined ? "unset (no event mapped)" : `"${access}"`} and ` +
          `src/content/schedule/sessions-${year}.json is missing or empty.\n\n` +
          `If you got here by bumping CURRENT_EDITION: that bump is what publishes ` +
          `an edition. Moving it to an edition whose programme is still being built ` +
          `privately un-hides an unannounced programme on cloudnativedays.fr — the ` +
          `exact outcome the 2027 gating exists to prevent. Bump CURRENT_EDITION ` +
          `only after the reveal, once the edition's Pretalx event is access: "public" ` +
          `(or its schedule is frozen into sessions-${year}.json).`,
      ).toBe(true);
    },
  );
});

describe("assertEditionPublishable", () => {
  const previous = process.env.FLAG_PROGRAMME;
  afterEach(() => {
    if (previous === undefined) delete process.env.FLAG_PROGRAMME;
    else process.env.FLAG_PROGRAMME = previous;
  });

  it("returns silently for the current, public edition", () => {
    expect(() =>
      assertEditionPublishable(CURRENT_EDITION, "programme.ics"),
    ).not.toThrow();
  });

  it("throws naming the edition and the caller that refused", () => {
    // Pin the flag off rather than relying on the wall clock: `programme` opens
    // 2027-04-01, so a clock-dependent assertion would flip on that date.
    process.env.FLAG_PROGRAMME = "off";
    expect(isEditionLoadable(2027)).toBe(false);
    expect(() => assertEditionPublishable(2027, "replays (en)")).toThrow(
      /\[replays \(en\)\] refusing to serve edition 2027/,
    );
  });
});
