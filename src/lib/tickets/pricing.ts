/**
 * What a seat costs at a given quantity — the table behind "the discount
 * applies on its own".
 *
 * A buyer never picks a product: they pick a number of seats, and the price per
 * person follows. Going from 3 to 4 seats during Regular *is* choosing the
 * group rate. So the page holds one control (the stepper) and this module turns
 * it into a price and a purchase action.
 *
 * Pure and dependency-free: the server renders the segments into the form and
 * `tickets-ui.ts` only walks them, so the browser never re-derives a rule.
 */
import type { GroupRate, TierDefinition } from "@/config/tickets";

export type SegmentProduct = { kind: "tier" } | { kind: "group"; rateId: GroupRate["id"] };

export interface OrderSegment {
  product: SegmentProduct;
  /** Inclusive quantity bounds. */
  min: number;
  max: number;
  /** Euros per person, VAT included. */
  price: number;
}

/**
 * The tier's order range split into stretches of equal unit price, cheapest
 * price first at every quantity.
 *
 * `rates` must already be the ones that apply to this tier — `cheaperGroupRates`
 * — which is also what guarantees there is no unreachable quantity: the tier's
 * own price covers 1…`maxPerOrder`, so every quantity is orderable and the
 * segments always tile the range.
 *
 *   Regular (199 €, cap 20) → [1–3] 199 €, [4–9] 169 €, [10–20] 149 €
 *   Early Bird (159 €, cap 5, no applicable rate) → [1–5] 159 €
 */
export function orderSegments(tier: TierDefinition, rates: GroupRate[]): OrderSegment[] {
  const segments: OrderSegment[] = [];

  for (let quantity = 1; quantity <= tier.maxPerOrder; quantity += 1) {
    const { product, price } = cheapestAt(tier, rates, quantity);
    const last = segments[segments.length - 1];
    if (last && sameProduct(last.product, product)) last.max = quantity;
    else segments.push({ product, min: quantity, max: quantity, price });
  }

  return segments;
}

/** The segment `quantity` falls in. */
export function segmentAt(segments: OrderSegment[], quantity: number): OrderSegment {
  const found = segments.find((s) => quantity >= s.min && quantity <= s.max);
  if (!found) throw new Error(`[tickets] no order segment holds ${quantity}`);
  return found;
}

function cheapestAt(
  tier: TierDefinition,
  rates: GroupRate[],
  quantity: number,
): { product: SegmentProduct; price: number } {
  let best: { product: SegmentProduct; price: number } = { product: { kind: "tier" }, price: tier.price };
  for (const rate of rates) {
    const applies = quantity >= rate.min && quantity <= (rate.max ?? Number.POSITIVE_INFINITY);
    if (applies && rate.price < best.price) {
      best = { product: { kind: "group", rateId: rate.id }, price: rate.price };
    }
  }
  return best;
}

function sameProduct(a: SegmentProduct, b: SegmentProduct): boolean {
  return a.kind === "group" && b.kind === "group" ? a.rateId === b.rateId : a.kind === b.kind;
}
