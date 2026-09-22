/**
 * The two pieces of purchase logic the browser also runs (quantity bounds and
 * the "I have a code" URL). Dependency-free on purpose: `tickets-ui.ts` imports
 * this module, and anything it imports ships in the client bundle.
 */

/** Whole number within [1, max]; anything unparseable falls back to 1. */
export function clampQuantity(raw: number | string, max: number): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.trunc(n)));
}

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
