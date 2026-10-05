/**
 * Ticketing registry — the single place prices, dates and the selling phase live.
 *
 * In the spirit of `src/config/flags.ts`: typed, committed, reviewed. Nothing
 * else in the codebase may spell a ticket price, a tier date or an alf.io URL;
 * components read them from here and the purchase action is built from here by
 * `src/lib/tickets/purchase.ts` alone.
 *
 * Source of truth for the numbers is the Drive sheet "Pilotage billetterie
 * 2027" (Simulateur and Params tabs) and "Dates clés CND France 2027". This file
 * is their published subset: never quotas, never stock — the team adjusts those
 * live in alf.io.
 *
 * **Changing phase is changing `currentPhase` and shipping.** There is no date
 * logic. `pre_opening` serves the "coming soon" page at /billetterie; on the
 * opening day set it to the first tier, and when a tier ends — early or on its
 * date — to the next one. Every tier behind the current one reads "Épuisé".
 */

export type Localized = { fr: string; en: string };

export type TierId = "seb" | "eb" | "regular" | "last_chance";
/** `pre_opening` is the "coming soon" page; a tier id is the ticketing page selling it. */
export type Phase = "pre_opening" | TierId;

export interface TierDefinition {
  id: TierId;
  name: Localized;
  /** Euros, VAT included. */
  price: number;
  /**
   * Indicative end, ISO-8601 with the Europe/Paris offset. Shown only while the
   * tier is the current one: future tiers never show a date, because the team
   * may extend a tier's period or raise its quota live.
   */
  endsAt: string;
  /** The tier also closes when its alf.io quota runs out, whichever comes first. */
  closesWhenSoldOut: boolean;
  /** alf.io caps a single order at this many tickets. */
  maxPerOrder: number;
}

export interface GroupRate {
  id: "4_9" | "10_plus";
  min: number;
  max?: number;
  /** Euros per person, VAT included. Fixed for the whole season. */
  price: number;
}

/**
 * The dearer ticket, second in door 1 (27/09/2026): the standard ticket plus
 * priority access to the Strategy & Leadership room and a reserved networking
 * area — the track itself is open to every ticket. Always displayed and always
 * on sale; one price for the whole season, so no tier and no timeline.
 */
export interface StrategicTicket {
  /** The ticket's public name — the track's own, "Stratégie & Leadership" (27/09/2026). */
  name: Localized;
  /** Euros, VAT included. */
  price: number;
  /** The page describing the Strategy & Leadership track. */
  trackUrl: Localized;
}

export interface TicketingConfig {
  alfio: { baseUrl: string; eventSlug: string };
  currentPhase: Phase;
  /** Public name of the ticket the tiers price, beside the Strategy & Leadership one. */
  standardName: Localized;
  tiers: readonly TierDefinition[];
  groupRates: readonly GroupRate[];
  strategic: StrategicTicket;
  /** The VAT every price includes, in percent. */
  vatRate: number;
  /** When the programme is announced, as the FAQ words it. */
  programmeAnnouncement: Localized;
}

export const TICKETING: TicketingConfig = {
  alfio: {
    // The new alf.io instance (blue/green upgrade, Sept 2026). Whether this
    // host or tickets.cloudnativedays.fr is the public one after the switch is
    // still open; every URL and the host named in the copy derive from here.
    baseUrl: "https://billetterie.cloudnativedays.fr",
    eventSlug: "cnd-2027",
  },
  // Ticketing opens on 13 October 2026: until then /billetterie is the "coming
  // soon" page. Opening day is this line set to "seb".
  currentPhase: "pre_opening",
  // Lower-case, as prose uses it; the card title capitalises it.
  standardName: { fr: "standard", en: "standard" },
  tiers: [
    {
      id: "seb",
      name: { fr: "Super Early Bird", en: "Super Early Bird" },
      price: 129,
      endsAt: "2026-11-29T23:59:59+01:00",
      closesWhenSoldOut: true,
      maxPerOrder: 5,
    },
    {
      id: "eb",
      name: { fr: "Early Bird", en: "Early Bird" },
      price: 159,
      endsAt: "2027-02-07T23:59:59+01:00",
      closesWhenSoldOut: true,
      maxPerOrder: 5,
    },
    {
      id: "regular",
      name: { fr: "Regular", en: "Regular" },
      price: 199,
      endsAt: "2027-05-16T23:59:59+02:00",
      closesWhenSoldOut: false,
      maxPerOrder: 20,
    },
    {
      id: "last_chance",
      name: { fr: "Last Chance", en: "Last Chance" },
      price: 229,
      endsAt: "2027-06-03T23:59:59+02:00",
      closesWhenSoldOut: false,
      maxPerOrder: 20,
    },
  ],
  // Only offered on a tier whose order cap allows a group that size — see
  // `cheaperGroupRates`. Super Early Bird and Early Bird are quota-protected at
  // 5 seats per order, so they carry no group rate today (22/09/2026); lifting
  // that cap is the one change that brings them back.
  groupRates: [
    { id: "4_9", min: 4, max: 9, price: 169 },
    { id: "10_plus", min: 10, price: 149 },
  ],
  strategic: {
    name: { fr: "Stratégie & Leadership", en: "Strategy & Leadership" },
    price: 299,
    trackUrl: {
      fr: "/track-strategie-leadership",
      en: "/en/track-strategy-leadership",
    },
  },
  vatRate: 20,
  programmeAnnouncement: { fr: "en mars 2027", en: "in March 2027" },
};
