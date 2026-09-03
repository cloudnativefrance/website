/**
 * Development-only fixture selection for the preview path.
 *
 * The 2027 Pretalx event does not exist yet, but `democon` — an existing
 * non-public event on the same instance, 36 confirmed submissions across a wip
 * and a released schedule — exercises exactly the code path 2027 will use.
 * Pointing an edition at it is a VALIDATION affordance and never a committed
 * fact, which is why it lives in an env var and not in `PRETALX_EVENT`.
 *
 * It throws rather than silently ignoring itself on a production build. A
 * fixture that quietly disabled itself would let a misconfigured pipeline look
 * like it was validating something it was not.
 */
import { isEdition, type Edition } from "./editions";
import { isProductionOrigin } from "./site-env";
import type { PretalxEventEntry } from "./pretalx";

const DEFAULT_FIXTURE_EDITION = 2027;

export function resolvePreviewFixture(
  env: Record<string, string | undefined>,
  siteOrigin: string | undefined,
): { year: Edition; slug: string } | undefined {
  const slug = env.PRETALX_PREVIEW_SLUG?.trim();
  if (!slug) return undefined;

  if (isProductionOrigin(siteOrigin)) {
    throw new Error(
      `[preview] PRETALX_PREVIEW_SLUG=${slug} is set on a PRODUCTION build. ` +
        `The fixture exists for local and staging validation only — unset it, or ` +
        `build for a non-production origin.`,
    );
  }

  const raw = env.PRETALX_PREVIEW_EDITION?.trim();
  const year = raw ? Number(raw) : DEFAULT_FIXTURE_EDITION;
  if (!isEdition(year)) {
    throw new Error(
      `[preview] PRETALX_PREVIEW_EDITION=${raw} is not a known edition. ` +
        `Known editions: 2023, 2026, 2027.`,
    );
  }
  return { year, slug };
}

/** The synthetic PRETALX_EVENT entry the fixture stands in for. */
export function fixtureEvent(
  year: Edition,
  env: Record<string, string | undefined> = process.env,
  siteOrigin: string | undefined = process.env.PUBLIC_SITE_URL,
): PretalxEventEntry | undefined {
  const fixture = resolvePreviewFixture(env, siteOrigin);
  if (!fixture || fixture.year !== year) return undefined;
  return { slug: fixture.slug, access: "preview" };
}
