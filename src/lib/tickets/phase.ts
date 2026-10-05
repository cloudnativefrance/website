/**
 * Where the season stands, derived from the config's `currentPhase` alone.
 *
 * Pure and dependency-free: the page, the demo routes and the tests all call
 * the same functions with the same config, so a demo state renders exactly
 * what production would render in that phase.
 */
import type {
  GroupRate,
  TicketingConfig,
  TierDefinition,
  TierId,
} from "@/config/tickets";

export type TierState =
  | { kind: "past" }
  | { kind: "current" }
  | { kind: "upcoming" };

export interface TierWithState {
  tier: TierDefinition;
  state: TierState;
}

/** The tier `phase` sells. Every caller renders a selling phase: `pre_opening` is the "coming soon" page. */
export function offerTier(
  config: TicketingConfig,
  phase: TierId,
): TierDefinition {
  const tier = config.tiers.find((t) => t.id === phase);
  if (!tier) throw new Error(`[tickets] unknown phase "${phase}"`);
  return tier;
}

/**
 * Every tier with its state in `phase`. A tier behind the current one is past,
 * full stop: the page says "Épuisé" for all of them, so nothing here has to
 * know whether it sold out or ran to its date.
 */
export function tierStates(
  config: TicketingConfig,
  phase: TierId,
): TierWithState[] {
  const currentIndex = config.tiers.findIndex((t) => t.id === phase);
  if (currentIndex === -1)
    throw new Error(`[tickets] unknown phase "${phase}"`);

  return config.tiers.map((tier, index) => {
    if (index < currentIndex) return { tier, state: { kind: "past" } };
    if (index === currentIndex) return { tier, state: { kind: "current" } };
    return { tier, state: { kind: "upcoming" } };
  });
}

/** What ends the price of a tier. Never a quota, never a count. */
export interface TierUrgency {
  /** ISO end date; undefined on the last tier. */
  endsAt?: string;
  /** The tier also closes when its quota runs out: "Places limitées". */
  limitedStock: boolean;
  /** Nothing follows it: "Dernières places". */
  lastTier: boolean;
}

/**
 * What ends the price of `tier`, as door 1 and the ladder both say it: the
 * date — never on the last tier, which runs to the event day the page already
 * gives — and whether its stock can run out before that. One rule for both, so
 * the big price and the timeline cannot disagree.
 */
export function tierUrgency(
  config: TicketingConfig,
  tier: TierDefinition,
): TierUrgency {
  const lastTier = config.tiers[config.tiers.length - 1]?.id === tier.id;
  return {
    endsAt: lastTier ? undefined : tier.endsAt,
    limitedStock: tier.closesWhenSoldOut,
    lastTier,
  };
}

/**
 * Group rates worth showing next to `tier`: cheaper than it, **and** small
 * enough to be ordered at all — a tier capped at 5 seats per order cannot sell
 * a group of 10, and that cap is exactly how a quota-protected tier is
 * protected. Today that leaves Regular and Last Chance with both rates, and the
 * two early tiers with none.
 *
 * Derived, never configured separately, so it cannot drift from the prices and
 * so lifting a tier's `maxPerOrder` brings its group rates back on its own.
 */
export function cheaperGroupRates(
  config: TicketingConfig,
  tier: TierDefinition,
): GroupRate[] {
  return config.groupRates.filter(
    (rate) => rate.price < tier.price && rate.min <= tier.maxPerOrder,
  );
}
