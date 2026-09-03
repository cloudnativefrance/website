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
 *
 * **The origin is resolved the way the rest of the codebase resolves it** —
 * `resolveSiteOrigin`, the same call `astro.config.mjs` derives `site` from and
 * the same origin `robots.txt.ts` reads its policy off. So an unset or empty value
 * means PRODUCTION and the fixture refuses: fail closed. That is not pedantry.
 * `.github/workflows/build-image.yml` passes `PUBLIC_SITE_URL=''` for every
 * non-staging branch, so a guard that only refused on the literal production
 * origin would never fire on the one pipeline it was written for. The price is
 * that a local validation build has to name its own origin:
 *
 *     PUBLIC_SITE_URL=http://localhost:4321 \
 *       FLAG_OVERRIDES=programme=on PRETALX_PREVIEW_SLUG=democon pnpm build
 *
 * **Do not over-trust this guard.** What actually contains the fixture today is
 * that `Dockerfile` declares no `PRETALX_PREVIEW_SLUG` ARG and the build
 * workflow passes none — an image build cannot set it at all — plus the
 * `programme` flag being closed in production. This function is the last line
 * of defence, not the first, and it only protects builds that can set the
 * variable in the first place.
 */
import { isEdition, type Edition } from "./editions";
import { PROD_ORIGIN, isProductionOrigin, resolveSiteOrigin } from "./site-env";
import type { PretalxEventEntry } from "./edition-registry";

const DEFAULT_FIXTURE_EDITION = 2027;

export function resolvePreviewFixture(
  env: Record<string, string | undefined>,
): { year: Edition; slug: string } | undefined {
  const slug = env.PRETALX_PREVIEW_SLUG?.trim();
  if (!slug) return undefined;

  const origin = resolveSiteOrigin(env);
  if (isProductionOrigin(origin)) {
    throw new Error(
      `[preview] PRETALX_PREVIEW_SLUG=${slug} is set on a PRODUCTION build ` +
        `(PUBLIC_SITE_URL=${env.PUBLIC_SITE_URL ?? "<unset>"} resolves to ` +
        `${PROD_ORIGIN}). The fixture exists for local and staging validation ` +
        `only — unset it, or set PUBLIC_SITE_URL to the non-production origin ` +
        `this build is for.`,
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
): PretalxEventEntry | undefined {
  const fixture = resolvePreviewFixture(env);
  if (!fixture || fixture.year !== year) return undefined;
  return { slug: fixture.slug, access: "preview" };
}
