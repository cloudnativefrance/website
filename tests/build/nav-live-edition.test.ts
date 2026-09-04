/**
 * Guards that the Programme nav follows the LIVE edition rather than
 * CURRENT_EDITION, and that finished editions stay reachable once a newer one
 * is featured.
 *
 * Source-shape guard, matching the other tests/build specs: a full build per
 * case is too slow, and the property is structural.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredEdition, archivedEditions } from "@/lib/edition-visibility";
import { stashEnv } from "../support/env-stash";

/**
 * Every case here injects its own `now` and expects the flag's DATE logic to
 * decide — but `isFlagActive` consults FLAG_PROGRAMME / FLAG_OVERRIDES first,
 * and `vitest.config.ts` bridges `.env.local` into `process.env` before any
 * test runs. A developer following this repo's own documented fixture workflow
 * therefore failed this suite on a clean checkout, with the injected clock
 * quietly overridden. The fixture keys go too: `isEditionLoadable` now resolves
 * `PRETALX_EVENT[year] ?? fixtureEvent(year)`, which reads both of those and
 * the origin.
 */
stashEnv([
  "FLAG_PROGRAMME",
  "FLAG_OVERRIDES",
  "PRETALX_PREVIEW_SLUG",
  "PRETALX_PREVIEW_EDITION",
  "PUBLIC_SITE_URL",
]);

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
    expect(archivedEditions(new Date("2026-09-03T12:00:00+02:00"))).toEqual([]);
  });

  it("includes 2026 once 2027 is featured", () => {
    expect(archivedEditions(new Date("2027-04-02T12:00:00+02:00"))).toEqual([2026]);
  });

  it("never offers 2023, which has its own retrospective", () => {
    // The `>= CURRENT_EDITION` rule used to live in Navigation.astro, so this
    // function returned a list its only caller immediately re-filtered. It is
    // part of the answer now, and this pins it so it cannot drift back out.
    for (const now of ["2026-09-03T12:00:00+02:00", "2027-04-02T12:00:00+02:00"]) {
      expect(archivedEditions(new Date(now))).not.toContain(2023);
    }
  });
});

/**
 * The one edit the whole preview design is preparing for.
 *
 * Every case above runs with the real CURRENT_EDITION (2026), and none of them
 * could see the bug: `archivedEditions` filtered `y >= CURRENT_EDITION`, a
 * MOVING value used to express a fixed intent ("not 2023, it has its own
 * retrospective"). The day someone bumps CURRENT_EDITION to 2027 — the reveal —
 * that filter would drop 2026 as well and the Programme menu would silently
 * lose its "Programme 2026" entry, which is the requirement the function exists
 * to satisfy. Mocking the constant is the only way to test the future.
 */
describe("after CURRENT_EDITION is bumped to 2027", () => {
  afterEach(() => {
    // doMock registrations outlive resetModules() — it clears the module cache,
    // not the mock registry — so the static import at the top of this file must
    // not inherit the mocked constant.
    vi.doUnmock("@/lib/editions");
    vi.resetModules();
  });

  async function visibilityWithCurrentEdition2027() {
    vi.resetModules();
    vi.doMock("@/lib/editions", async (orig) => {
      const actual = await orig<typeof import("@/lib/editions")>();
      return { ...actual, CURRENT_EDITION: 2027 };
    });
    return import("@/lib/edition-visibility");
  }

  it("keeps 2026 in the Programme archive", async () => {
    const { featuredEdition: featured, archivedEditions: archived } =
      await visibilityWithCurrentEdition2027();
    const now = new Date("2027-06-04T12:00:00+02:00");
    expect(featured(now)).toBe(2027);
    expect(archived(now)).toEqual([2026]);
  });

  it("keeps 2026 even before the programme flag opens", async () => {
    // A bump to 2027 makes 2027 loadable through the arithmetic branch on its
    // own, flag or no flag — so this is the shape the nav has from the moment
    // of the bump, not only after 2027-04-01.
    const { archivedEditions: archived } = await visibilityWithCurrentEdition2027();
    expect(archived(new Date("2026-09-03T12:00:00+02:00"))).toEqual([2026]);
  });

  it("still never offers 2023", async () => {
    const { archivedEditions: archived } = await visibilityWithCurrentEdition2027();
    expect(archived(new Date("2027-06-04T12:00:00+02:00"))).not.toContain(2023);
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

  it("offers a SPEAKERS archive entry too, not just a programme one", () => {
    // The programme and speakers entries above both follow `featured`. Once
    // 2027 leads, /intervenants/2026 — every speaker record of the last edition
    // that actually happened — has no route from the nav without this.
    expect(NAV).toContain("nav.programme.submenu.archive_intervenants");
    const dd = NAV.slice(NAV.indexOf("const programmeDD"), NAV.indexOf("const aboutDD"));
    expect(dd).toMatch(/speakersBase\}\/\$\{y\}/);
  });

  it("decides `current` the same way for every dropdown item", () => {
    // Featured used startsWith, archives used ===, and Astro serves directory
    // URLs with a trailing slash — so on /programme/2026/ both entries claimed
    // current and the archive one could never highlight. See nav-path.ts.
    expect(NAV).toContain("isCurrentPath");
    const dd = NAV.slice(NAV.indexOf("const programmeDD"), NAV.indexOf("const aboutDD"));
    expect(dd).not.toMatch(/current:\s*currentPath ===/);
    expect(dd).not.toMatch(/current:\s*onProgramme/);
    expect(dd).not.toMatch(/current:\s*onSpeakers/);
  });

  it("does not re-filter what archivedEditions already decided", () => {
    expect(NAV).not.toMatch(/y\s*>=\s*CURRENT_EDITION/);
  });
});
