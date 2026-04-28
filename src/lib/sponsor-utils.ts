import { getCollection, type CollectionEntry } from "astro:content";
import { CURRENT_EDITION, type Edition } from "./editions";

/**
 * Sponsor URL & logo-path allowlist helpers.
 *
 * Extracted from src/components/sponsors/SponsorCard.astro (Phase 24-01) so
 * that the Phase 24 SponsorsPlatinumStrip.astro can import the same gates
 * without duplicating security-critical allowlist logic.
 *
 * Threat mitigations:
 *   - T-05-02 (Information Disclosure / unsafe URL injection) — safeUrl
 *   - T-05-03 (Path traversal / unsafe logo source) — safeLogoPath
 */

/**
 * URL allowlist — threat T-05-02 mitigation.
 * Only http(s) URLs are rewritten into an anchor href.
 * Pattern copied verbatim from src/components/speakers/SocialLinks.astro.
 */
export function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

/**
 * Logo path allowlist — threat T-05-03 mitigation.
 * Accepts either an absolute public path (`/sponsors/foo.svg`) or an
 * `https://` URL. Rejects `javascript:`, `data:`, `//protocol-relative`,
 * and any path containing `..` traversal.
 */
export function safeLogoPath(raw: string | undefined): string | null {
  const t = (raw || "").trim();
  if (!t) return null;
  if (t.includes("..")) {
    warnRejectedLogo(t, "contains '..'");
    return null;
  }
  // Absolute public paths ("/sponsors/foo.svg") — reject protocol-relative
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  // https absolute URLs only
  try {
    const u = new URL(t);
    if (u.protocol === "https:") return u.toString();
    warnRejectedLogo(t, `unsupported protocol ${u.protocol}`);
  } catch {
    warnRejectedLogo(t, "not a leading-slash path nor an https URL");
  }
  return null;
}

/**
 * Surface logo paths that the allowlist rejected. Build-time only — runs
 * once per row during Astro's content-collection load, not on every page
 * render. Used to debug Sheet entries whose logo column is malformed
 * (typical: missing leading slash, e.g. `wescale.webp` instead of
 * `/sponsors/wescale.webp`).
 */
function warnRejectedLogo(value: string, reason: string): void {
  if (typeof process === "undefined" || process.env.NODE_ENV === "test") return;
  console.warn(`[safeLogoPath] rejected logo "${value}" — ${reason}. Expected /sponsors/<file>.<ext> or https://…`);
}

type SponsorsCollection = "sponsors-2023" | "sponsors-2026" | "sponsors-2027";

function sponsorsCollectionName(year: Edition): SponsorsCollection {
  return `sponsors-${year}` as SponsorsCollection;
}

export async function getSponsors(year: Edition = CURRENT_EDITION) {
  return await getCollection(sponsorsCollectionName(year));
}

export type SponsorEntry = CollectionEntry<SponsorsCollection>;
