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

export function isProductionOrigin(origin: string | undefined): boolean {
  return origin === PROD_ORIGIN;
}

export function buildRobotsTxt(origin: string | undefined): string {
  if (!isProductionOrigin(origin)) {
    return "User-agent: *\nDisallow: /\n";
  }
  return `User-agent: *\nAllow: /\nSitemap: ${PROD_ORIGIN}/sitemap-index.xml\n`;
}
