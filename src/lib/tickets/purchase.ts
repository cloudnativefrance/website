/**
 * The purchase action — built here and nowhere else.
 *
 * Variant A (the page replaces the alf.io listing) sends the buyer straight to
 * alf.io's booking step; variant B (showcase) sends every buyer to the listing.
 * How A reaches the booking step is not settled on the alf.io side — a patched
 * `/code/<category>?qty=N` link or a small backend calling
 * `/api/v2/public/event/<slug>/reserve-tickets`. Swapping the mechanism must
 * only touch this file: components receive a `PurchaseTarget` and render it.
 *
 * Every A target is a GET form, never an `<a href>`: each hit on the alf.io
 * link creates a reservation that blocks tickets until it expires, so nothing
 * a crawler or a prefetcher follows may point at it.
 *
 * Pure: no environment reads. Callers pass `allowDrafts` from
 * `placeholdersAllowed()` so a production build refuses to ship a demo code.
 */
import {
  isTbd,
  type GroupRate,
  type Maybe,
  type Phase,
  type TicketingConfig,
  type TierDefinition,
} from "@/config/tickets";
import { NEWSLETTER_URL } from "@/lib/event";
import { clampQuantity, codeUrlFrom, type CodeResult } from "./url";

export { clampQuantity, type CodeResult };

export type Variant = "a" | "b";

/**
 * What the buyer is buying: one of the four tiers, the same tier at a group
 * rate, or the Strategy & Leadership ticket.
 *
 * A group order is the same seats at another price, so it still travels through
 * the tier's order cap; only the alf.io code changes. Which alf.io mechanism
 * carries that code — an automatic promo code above a threshold, a forced
 * category with a patched minimum, or a small backend calling
 * `/api/v2/public/event/<slug>/reserve-tickets` — is still open, and swapping it
 * must only touch this file.
 */
export type Product =
  | { kind: "tier"; tier: TierDefinition }
  | { kind: "group"; tier: TierDefinition; rate: GroupRate }
  | { kind: "strategic"; categoryCode: Maybe<string>; maxPerOrder: Maybe<number> };

export type PurchaseTarget =
  | {
      kind: "reserve";
      /** Form action; the quantity travels as `?<qtyParam>=N`. */
      action: string;
      qtyParam: "qty";
      min: 1;
      max: number;
    }
  | { kind: "listing"; href: string }
  | { kind: "notify"; href: string };

/** alf.io's own ceiling for one order, used when a product's cap is not decided. */
export const ALFIO_MAX_PER_ORDER = 20;

export function listingUrl(config: TicketingConfig): string {
  return `${trimSlash(config.alfio.baseUrl)}/event/${encodeURIComponent(config.alfio.eventSlug)}`;
}

/** Hostname buyers land on, named in the copy so the hand-off is never a surprise. */
export function alfioHost(config: TicketingConfig): string {
  return new URL(config.alfio.baseUrl).host;
}

export function purchaseTarget(
  config: TicketingConfig,
  variant: Variant,
  product: Product,
  phase: Phase,
  { allowDrafts }: { allowDrafts: boolean },
): PurchaseTarget {
  if (phase === "pre_opening") return { kind: "notify", href: NEWSLETTER_URL };
  if (variant === "b") return { kind: "listing", href: listingUrl(config) };

  const code = resolve(codeOf(product), allowDrafts, "alf.io code");
  return {
    kind: "reserve",
    action: codePath(config, code),
    qtyParam: "qty",
    min: 1,
    max: maxPerOrder(product, allowDrafts),
  };
}

function codeOf(product: Product): Maybe<string> {
  if (product.kind === "tier") return product.tier.alfioCategoryCode;
  if (product.kind === "group") return product.rate.alfioCode;
  return product.categoryCode;
}

export function maxPerOrder(product: Product, allowDrafts: boolean): number {
  if (product.kind === "tier" || product.kind === "group") return product.tier.maxPerOrder;
  if (!isTbd(product.maxPerOrder)) return product.maxPerOrder;
  if (!allowDrafts) {
    throw new Error("[tickets] Strategy & Leadership maxPerOrder is still tbd on a production build");
  }
  return product.maxPerOrder.draft ?? ALFIO_MAX_PER_ORDER;
}

/** The URL a variant-A form submits to for `quantity` tickets (what the browser will open). */
export function reserveUrl(target: Extract<PurchaseTarget, { kind: "reserve" }>, quantity: number): string {
  return `${target.action}?${target.qtyParam}=${clampQuantity(quantity, target.max)}`;
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

function codePath(config: TicketingConfig, code: string): string {
  const result = codeUrlFrom(listingUrl(config), code);
  if (!result.ok) throw new Error("[tickets] an alf.io category code cannot be empty");
  return result.url;
}

function resolve<T>(value: Maybe<T>, allowDrafts: boolean, what: string): T {
  if (!isTbd(value)) return value;
  if (!allowDrafts || value.draft === undefined) {
    throw new Error(`[tickets] ${what} is still tbd ("${value.note}") and cannot be built here`);
  }
  return value.draft;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
