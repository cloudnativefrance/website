/**
 * Guards that the Programme nav follows the LIVE edition rather than
 * CURRENT_EDITION, and that finished editions stay reachable once a newer one
 * is featured.
 *
 * Source-shape guard, matching the other tests/build specs: a full build per
 * case is too slow, and the property is structural.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredEdition, archivedEditions } from "@/lib/edition-visibility";

const NAV = readFileSync(
  resolve(import.meta.dirname, "../../src/components/Navigation.astro"),
  "utf-8",
);

describe("featuredEdition", () => {
  it("is the newest loadable edition", () => {
    // With the programme flag inactive, 2027 is not loadable, so 2026 leads.
    expect(featuredEdition(new Date("2026-09-03T12:00:00+02:00"))).toBe(2026);
  });

  it("moves to 2027 once the programme flag has opened", () => {
    expect(featuredEdition(new Date("2027-04-02T12:00:00+02:00"))).toBe(2027);
  });
});

describe("archivedEditions", () => {
  it("is empty while the featured edition is the newest one shown", () => {
    expect(archivedEditions(new Date("2026-09-03T12:00:00+02:00"))).toEqual([2023]);
  });

  it("includes 2026 once 2027 is featured", () => {
    expect(archivedEditions(new Date("2027-04-02T12:00:00+02:00"))).toEqual([2026, 2023]);
  });
});

describe("Navigation.astro", () => {
  it("derives the programme link from featuredEdition, not CURRENT_EDITION", () => {
    expect(NAV).toContain("featuredEdition");
    const dd = NAV.slice(NAV.indexOf("const programmeDD"), NAV.indexOf("</script>"));
    expect(dd).not.toMatch(/programmeBase\}\/\$\{CURRENT_EDITION\}/);
  });

  it("offers an archive entry per finished edition", () => {
    expect(NAV).toContain("archivedEditions");
    expect(NAV).toContain("nav.programme.submenu.archive");
  });
});
