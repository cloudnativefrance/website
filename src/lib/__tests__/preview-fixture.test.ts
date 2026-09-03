import { describe, it, expect } from "vitest";
import { resolvePreviewFixture } from "@/lib/preview-fixture";
import { PROD_ORIGIN } from "@/lib/site-env";

describe("resolvePreviewFixture", () => {
  it("is inert when the env var is unset", () => {
    expect(resolvePreviewFixture({}, undefined)).toBeUndefined();
  });

  it("maps the configured edition to the fixture slug", () => {
    expect(
      resolvePreviewFixture({ PRETALX_PREVIEW_SLUG: "democon" }, undefined),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("accepts an explicit edition", () => {
    expect(
      resolvePreviewFixture(
        { PRETALX_PREVIEW_SLUG: "democon", PRETALX_PREVIEW_EDITION: "2027" },
        undefined,
      ),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("REFUSES to apply on a production build, throwing rather than ignoring", () => {
    expect(() =>
      resolvePreviewFixture({ PRETALX_PREVIEW_SLUG: "democon" }, PROD_ORIGIN),
    ).toThrow(/production/i);
  });

  it("rejects an edition outside the union", () => {
    expect(() =>
      resolvePreviewFixture(
        { PRETALX_PREVIEW_SLUG: "democon", PRETALX_PREVIEW_EDITION: "1999" },
        undefined,
      ),
    ).toThrow(/1999/);
  });
});
