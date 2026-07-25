/**
 * Unit tests for src/lib/site-env.ts.
 *
 * The production robots.txt body is asserted byte-for-byte against the content
 * of the public/robots.txt file this module replaces — production output must
 * not change.
 */
import { describe, it, expect } from "vitest";
import {
  PROD_ORIGIN,
  isProductionOrigin,
  buildRobotsTxt,
} from "@/lib/site-env";

const STAGING_ORIGIN = "https://staging.cloudnativedays.fr";
const DISALLOW_ALL = "User-agent: *\nDisallow: /\n";

describe("isProductionOrigin", () => {
  it("is true only for the exact production origin", () => {
    expect(isProductionOrigin(PROD_ORIGIN)).toBe(true);
    expect(isProductionOrigin(STAGING_ORIGIN)).toBe(false);
    expect(isProductionOrigin(undefined)).toBe(false);
    expect(isProductionOrigin("http://cloudnativedays.fr")).toBe(false);
  });
});

describe("buildRobotsTxt", () => {
  it("reproduces the previous public/robots.txt byte-for-byte in production", () => {
    expect(buildRobotsTxt(PROD_ORIGIN)).toBe(
      "User-agent: *\nAllow: /\nSitemap: https://cloudnativedays.fr/sitemap-index.xml\n",
    );
  });

  it("disallows everything outside production", () => {
    expect(buildRobotsTxt(STAGING_ORIGIN)).toBe(DISALLOW_ALL);
  });

  it("fails closed when the origin is unknown", () => {
    expect(buildRobotsTxt(undefined)).toBe(DISALLOW_ALL);
  });
});
