import { describe, it, expect } from "vitest";
import { resolvePreviewFixture } from "@/lib/preview-fixture";
import { PROD_ORIGIN } from "@/lib/site-env";

/** A non-production origin, the way a local or staging build supplies one. */
const STAGING = "https://staging.cloudnativedays.fr";

describe("resolvePreviewFixture", () => {
  it("is inert when the env var is unset", () => {
    expect(resolvePreviewFixture({})).toBeUndefined();
  });

  it("maps the configured edition to the fixture slug", () => {
    expect(
      resolvePreviewFixture({
        PRETALX_PREVIEW_SLUG: "democon",
        PUBLIC_SITE_URL: STAGING,
      }),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("accepts an explicit edition", () => {
    expect(
      resolvePreviewFixture({
        PRETALX_PREVIEW_SLUG: "democon",
        PRETALX_PREVIEW_EDITION: "2027",
        PUBLIC_SITE_URL: STAGING,
      }),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("REFUSES to apply on a production build, throwing rather than ignoring", () => {
    expect(() =>
      resolvePreviewFixture({
        PRETALX_PREVIEW_SLUG: "democon",
        PUBLIC_SITE_URL: PROD_ORIGIN,
      }),
    ).toThrow(/production/i);
  });

  /**
   * The case the first version of this guard got wrong, and the only one that
   * describes the real release pipeline.
   *
   * `.github/workflows/build-image.yml` passes `PUBLIC_SITE_URL=''` for every
   * non-staging branch, so the production image is built with an EMPTY origin,
   * never the literal production URL. `isProductionOrigin("")` is false, so a
   * guard keyed on it alone refused nothing where it mattered. The origin must
   * therefore resolve `PUBLIC_SITE_URL || PROD_ORIGIN` — the same `||` as
   * astro.config.mjs — and both absent forms must refuse.
   */
  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["whitespace", "   "],
  ])(
    "treats a %s PUBLIC_SITE_URL as production and refuses",
    (_label, origin) => {
      expect(() =>
        resolvePreviewFixture({
          PRETALX_PREVIEW_SLUG: "democon",
          ...(origin === undefined ? {} : { PUBLIC_SITE_URL: origin }),
        }),
      ).toThrow(/production/i);
    },
  );

  it("rejects an edition outside the union", () => {
    expect(() =>
      resolvePreviewFixture({
        PRETALX_PREVIEW_SLUG: "democon",
        PRETALX_PREVIEW_EDITION: "1999",
        PUBLIC_SITE_URL: STAGING,
      }),
    ).toThrow(/1999/);
  });
});
