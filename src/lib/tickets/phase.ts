import type {
  GroupRate,
  Phase,
  PreOpeningPhase,
  TicketingConfig,
  TierDefinition,
  TierId,
} from "@/config/tickets";

export type TierState = "past" | "current" | "upcoming";

export interface TierWithState {
  tier: TierDefinition;
  state: TierState;
}

/** Before the opening: no ticket on sale, no price shown. */
export function isPreOpening(phase: Phase): phase is PreOpeningPhase {
  return phase === "pre_opening" || phase === "pre_opening_dated";
}

export function offerTier(
  config: TicketingConfig,
  phase: TierId,
): TierDefinition {
  const tier = config.tiers.find((t) => t.id === phase);
  if (!tier) throw new Error(`[tickets] unknown phase "${phase}"`);
  return tier;
}

/** A tier before the current one is past, whether it sold out or ran to its date. */
export function tierStates(
  config: TicketingConfig,
  phase: TierId,
): TierWithState[] {
  const current = config.tiers.indexOf(offerTier(config, phase));
  return config.tiers.map(
    (tier, index): TierWithState => ({
      tier,
      state:
        index < current ? "past" : index === current ? "current" : "upcoming",
    }),
  );
}

/**
 * The group rates cheaper than `tier` and orderable within its cap: a tier
 * capped at 5 seats per order cannot sell a group of 10.
 */
export function cheaperGroupRates(
  config: TicketingConfig,
  tier: TierDefinition,
): GroupRate[] {
  return config.groupRates.filter(
    (rate) => rate.price < tier.price && rate.min <= tier.maxPerOrder,
  );
}
