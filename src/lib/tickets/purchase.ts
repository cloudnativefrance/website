/**
 * The purchase action — built here and nowhere else.
 *
 * The page is a showcase: every buyer is sent to the alf.io listing, where the
 * quantity and the category are chosen and any group discount applies. Before
 * the ticketing opens there is nothing to buy, so the action is the newsletter.
 * Components receive a `PurchaseTarget` and render it; they never build an
 * alf.io URL of their own.
 *
 * Nothing here points at `/event/<slug>/code/<CODE>`: a real code creates a
 * reservation that blocks tickets, so the only code URL is the one a visitor
 * types into the code form (`codeUrl`).
 *
 * Pure: no environment reads.
 */
import type { Phase, TicketingConfig } from "@/config/tickets";
import { NEWSLETTER_URL } from "@/lib/event";
import { codeUrlFrom, type CodeResult } from "./url";

export type { CodeResult };

export type PurchaseTarget = { kind: "listing"; href: string } | { kind: "notify"; href: string };

export function listingUrl(config: TicketingConfig): string {
  return `${trimSlash(config.alfio.baseUrl)}/event/${encodeURIComponent(config.alfio.eventSlug)}`;
}

/** Hostname buyers land on, named in the copy so the hand-off is never a surprise. */
export function alfioHost(config: TicketingConfig): string {
  return new URL(config.alfio.baseUrl).host;
}

/** Before the opening: the newsletter. Once selling: the alf.io listing. */
export function purchaseTarget(config: TicketingConfig, phase: Phase): PurchaseTarget {
  if (phase === "pre_opening") return { kind: "notify", href: NEWSLETTER_URL };
  return { kind: "listing", href: listingUrl(config) };
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
export function codeFallbackAction(config: TicketingConfig): { action: string; param: "code" } {
  return { action: listingUrl(config), param: "code" };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
