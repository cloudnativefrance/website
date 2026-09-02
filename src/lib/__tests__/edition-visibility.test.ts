import { describe, it, expect } from "vitest";
import { resolveEditionLoadable } from "@/lib/edition-visibility";

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
});
