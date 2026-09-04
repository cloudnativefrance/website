/**
 * Which origin is this build for?
 *
 * `site` in astro.config.mjs is driven by PUBLIC_SITE_URL and defaults to
 * production. Everything that must differ between production and staging —
 * robots.txt and the noindex meta tag — derives from that single origin
 * rather than from a second environment flag that could drift out of sync
 * with it.
 *
 * Both helpers fail closed: an unknown origin is treated as non-production,
 * so a misconfigured build is un-indexable rather than a duplicate of the
 * production site.
 */

export const PROD_ORIGIN = "https://cloudnativedays.fr";

/**
 * The origin THIS build is for.
 *
 * `||`, not `??`: `.github/workflows/build-image.yml` passes an empty
 * `PUBLIC_SITE_URL` on every non-staging branch, and that has to mean the same
 * thing everywhere — production. Trimmed, so a value with a stray space is not
 * a third, un-recognised origin.
 *
 * `astro.config.mjs` derives `site` from this and `preview-fixture.ts` decides
 * whether to refuse from it; they used to each spell it out, and had already
 * drifted apart on the trim.
 */
export function resolveSiteOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  return env.PUBLIC_SITE_URL?.trim() || PROD_ORIGIN;
}

export function isProductionOrigin(origin: string | undefined): boolean {
  return origin === PROD_ORIGIN;
}

export function buildRobotsTxt(origin: string | undefined): string {
  if (!isProductionOrigin(origin)) {
    return "User-agent: *\nDisallow: /\n";
  }
  return `User-agent: *\nAllow: /\nSitemap: ${PROD_ORIGIN}/sitemap-index.xml\n`;
}
