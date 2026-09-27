/**
 * The purchase logic the browser also runs: the "I have a code" URL, and how it is opened.
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

/** The part of `window` that `openInNewTab` uses — a stand-in in tests. */
export interface TabOpener {
  open(url: string, target: string): { opener: unknown } | null;
  location: { assign(url: string): void };
}

/**
 * Open `url` in a new tab, cut from this page — the `rel="noopener"` of a
 * script. Called from a submit handler, so popup blockers let it through; if
 * one still blocks it, the buyer goes there in this tab rather than nothing
 * happening.
 */
export function openInNewTab(url: string, win: TabOpener): void {
  const tab = win.open(url, "_blank");
  if (tab) tab.opener = null;
  else win.location.assign(url);
}

/**
 * Lets one hand-off through, then ignores repeats for `ms`. Each hand-off of a
 * real code creates an alf.io reservation that holds tickets, and the page now
 * stays put behind the new tab — so a double-click must not open a second tab,
 * and a second hold. Once the window has passed, a new submit is a deliberate
 * one (the buyer closed the tab and came back) and goes through.
 */
export function handOffOnce(ms: number, now: () => number = Date.now): () => boolean {
  let last = Number.NEGATIVE_INFINITY;
  return () => {
    const t = now();
    if (t - last < ms) return false;
    last = t;
    return true;
  };
}
