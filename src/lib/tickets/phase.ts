/**
 * Where the season stands, derived from the config's `currentPhase` alone.
 *
 * Pure and dependency-free: the page, the demo routes and the tests all call
 * the same functions with the same config, so a demo state renders exactly
 * what production would render in that phase.
 */
import type {
  GroupRate,
  Phase,
  TicketingConfig,
  TierDefinition,
} from "@/config/tickets";
import { shown } from "./drafts";

export type TierState = { kind: "past" } | { kind: "current" } | { kind: "upcoming" };

export interface TierWithState {
  tier: TierDefinition;
  state: TierState;
}

export function isSelling(phase: Phase): boolean {
  return phase !== "pre_opening";
}

/**
 * The tier the page offers: the current one while selling, the opening tier
 * before the ticketing opens.
 */
export function offerTier(config: TicketingConfig, phase: Phase): TierDefinition {
  if (phase === "pre_opening") return config.tiers[0];
  const tier = config.tiers.find((t) => t.id === phase);
  if (!tier) throw new Error(`[tickets] unknown phase "${phase}"`);
  return tier;
}

/**
 * Every tier with its state in `phase`. A tier behind the current one is past,
 * full stop: the page says "Épuisé" for all of them, so nothing here has to
 * know whether it sold out or ran to its date.
 */
export function tierStates(config: TicketingConfig, phase: Phase): TierWithState[] {
  const currentIndex =
    phase === "pre_opening" ? -1 : config.tiers.findIndex((t) => t.id === phase);
  if (phase !== "pre_opening" && currentIndex === -1) {
    throw new Error(`[tickets] unknown phase "${phase}"`);
  }

  return config.tiers.map((tier, index) => {
    if (index < currentIndex) return { tier, state: { kind: "past" } };
    if (index === currentIndex) return { tier, state: { kind: "current" } };
    return { tier, state: { kind: "upcoming" } };
  });
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

/**
 * Structural checks on the config. Returns the problems rather than throwing so
 * the test can list them all; the page calls `assertTicketingConfig`.
 */
export function ticketingConfigProblems(config: TicketingConfig): string[] {
  const problems: string[] = [];
  const { tiers } = config;

  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].price <= tiers[i - 1].price) {
      problems.push(`tier "${tiers[i].id}" is not dearer than "${tiers[i - 1].id}"`);
    }
    if (Date.parse(tiers[i].endsAt) <= Date.parse(tiers[i - 1].endsAt)) {
      problems.push(`tier "${tiers[i].id}" does not end after "${tiers[i - 1].id}"`);
    }
  }
  for (const tier of tiers) {
    if (Number.isNaN(Date.parse(tier.endsAt))) {
      problems.push(`tier "${tier.id}" has an unparseable endsAt "${tier.endsAt}"`);
    }
    if (!Number.isInteger(tier.maxPerOrder) || tier.maxPerOrder < 1) {
      problems.push(`tier "${tier.id}" has an invalid maxPerOrder`);
    }
  }

  // Group rates: bigger groups, cheaper seats, no overlap. The page turns them
  // into a price-per-quantity table, which only reads if the ranges climb.
  const rates = config.groupRates;
  for (const rate of rates) {
    if (rate.min < 2) problems.push(`group rate "${rate.id}" starts below 2 people`);
    if (rate.max !== undefined && rate.max < rate.min) {
      problems.push(`group rate "${rate.id}" ends before it starts`);
    }
  }
  for (let i = 1; i < rates.length; i++) {
    const previous = rates[i - 1];
    if (rates[i].min <= previous.min) {
      problems.push(`group rate "${rates[i].id}" does not start above "${previous.id}"`);
    }
    if (previous.max !== undefined && rates[i].min <= previous.max) {
      problems.push(`group rate "${rates[i].id}" overlaps "${previous.id}"`);
    }
    if (rates[i].price >= previous.price) {
      problems.push(`group rate "${rates[i].id}" is not cheaper than "${previous.id}"`);
    }
  }

  const currentIndex =
    config.currentPhase === "pre_opening"
      ? -1
      : tiers.findIndex((t) => t.id === config.currentPhase);
  if (config.currentPhase !== "pre_opening" && currentIndex === -1) {
    problems.push(`currentPhase "${config.currentPhase}" matches no tier`);
  }

  return problems;
}

export function assertTicketingConfig(config: TicketingConfig): void {
  const problems = ticketingConfigProblems(config);
  if (problems.length > 0) {
    throw new Error(`[tickets] src/config/tickets.ts is inconsistent:\n- ${problems.join("\n- ")}`);
  }
}

/**
 * The Strategy & Leadership price to show in `phase`: a fixed amount, or the
 * amount of the tier on offer (the first one before the opening). Undefined
 * while the price is undecided — its row is then not rendered.
 */
export function strategicPrice(config: TicketingConfig, phase: Phase): number | undefined {
  const price = shown(config.strategic.price);
  if (price === undefined) return undefined;
  return price.kind === "fixed" ? price.amount : price.amounts[offerTier(config, phase).id];
}
