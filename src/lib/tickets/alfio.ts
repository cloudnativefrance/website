/**
 * The hand-off to alf.io that the browser runs. Imported by `tickets-ui.ts`:
 * keep it free of runtime imports, they would ship in the client bundle.
 */

export type CodeResult =
  | { ok: true; code: string; url: string }
  | { ok: false };

/**
 * The URL that applies a code a visitor typed. The site checks nothing: alf.io
 * knows the codes. Whitespace is dropped (copy-paste adds it), an empty code
 * is refused.
 */
export function codeUrl(listingUrl: string, raw: string): CodeResult {
  const code = raw.replace(/\s+/g, "");
  if (!code) return { ok: false };
  return {
    ok: true,
    code,
    url: `${listingUrl}/code/${encodeURIComponent(code)}`,
  };
}

export interface TabOpener {
  open(url: string, target: string): { opener: unknown } | null;
  location: { assign(url: string): void };
}

/** A new tab cut from this page, or this tab when a popup blocker refuses it. */
export function openInNewTab(url: string, win: TabOpener): void {
  const tab = win.open(url, "_blank");
  if (tab) tab.opener = null;
  else win.location.assign(url);
}

/**
 * Lets one hand-off through, then ignores repeats for `ms`: each code hand-off
 * creates an alf.io reservation that holds tickets, so a double-click must not
 * open a second tab.
 */
export function handOffOnce(
  ms: number,
  now: () => number = Date.now,
): () => boolean {
  let last = Number.NEGATIVE_INFINITY;
  return () => {
    const t = now();
    if (t - last < ms) return false;
    last = t;
    return true;
  };
}
