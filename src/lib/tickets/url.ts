/**
 * The purchase logic the browser also runs: the "I have a code" URL.
 * Dependency-free on purpose: `tickets-ui.ts` imports this module, and
 * anything it imports ships in the client bundle.
 */

export type CodeResult = { ok: true; code: string; url: string } | { ok: false; reason: "empty" };

/**
 * "I have a code": the site validates nothing and prices nothing — alf.io
 * knows the codes. Whitespace anywhere is dropped (codes never contain it and
 * copy-paste adds it), an empty code is refused, the rest is URL-encoded as a
 * single path segment of the event listing URL.
 */
export function codeUrlFrom(listingUrl: string, raw: string): CodeResult {
  const code = raw.replace(/\s+/g, "");
  if (!code) return { ok: false, reason: "empty" };
  return { ok: true, code, url: `${listingUrl}/code/${encodeURIComponent(code)}` };
}
