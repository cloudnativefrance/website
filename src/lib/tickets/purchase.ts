/**
 * The purchase action — built here and nowhere else.
 *
 * The page is a showcase: every buyer is sent to the alf.io listing, where the
 * quantity and the category are chosen and any group discount applies. Before
 * the ticketing opens the page is not rendered at all (/billetterie is the
 * "coming soon" page), so there is no other kind of action. Components receive
 * a `PurchaseTarget` and render it; they never build an alf.io URL of their own.
 *
 * Nothing here points at `/event/<slug>/code/<CODE>`: a real code creates a
 * reservation that blocks tickets, so the only code URL is the one a visitor
 * types into the code form (`codeUrl`).
 *
 * Pure: no environment reads.
 */
import type { TicketingConfig } from "@/config/tickets";
import { codeUrlFrom, type CodeResult } from "./url";

export type { CodeResult };

/**
 * Where a purchase action sends the buyer: a new tab, so the site stays where
 * the buyer left it, without `noreferrer` so alf.io keeps the referrer.
 */
export interface PurchaseTarget {
  kind: "listing";
  href: string;
  rel: "noopener";
}

export function listingUrl(config: TicketingConfig): string {
  return `${trimSlash(config.alfio.baseUrl)}/event/${encodeURIComponent(config.alfio.eventSlug)}`;
}

/** Hostname buyers land on, named in the copy so the hand-off is never a surprise. */
export function alfioHost(config: TicketingConfig): string {
  return new URL(config.alfio.baseUrl).host;
}

/** Whether `href` points at `host` — a relative or unparseable href never does. */
export function onHost(href: string, host: string): boolean {
  try {
    return new URL(href).host === host;
  } catch {
    return false;
  }
}

/** The alf.io listing, whatever the tier: the quantity and the category are chosen there. */
export function purchaseTarget(config: TicketingConfig): PurchaseTarget {
  return { kind: "listing", href: listingUrl(config), rel: "noopener" };
}

/** "I have a code" → the alf.io URL that applies it (see `codeUrlFrom`). */
export function codeUrl(config: TicketingConfig, raw: string): CodeResult {
  return codeUrlFrom(listingUrl(config), raw);
}

/**
 * No-JS fallback for the code form: a plain GET to the listing with `?code=`.
 * alf.io's support for it is still to be confirmed with JC; the script
 * upgrades the form to `/code/<CODE>`.
 */
export function codeFallbackAction(config: TicketingConfig): {
  action: string;
  param: "code";
} {
  return { action: listingUrl(config), param: "code" };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
