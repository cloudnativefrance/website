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
  if (t.includes("..")) return null;
  // Absolute public paths ("/sponsors/foo.svg") — reject protocol-relative
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  // https absolute URLs only
  try {
    const u = new URL(t);
    if (u.protocol === "https:") return u.toString();
  } catch {
    /* fallthrough */
  }
  return null;
}
