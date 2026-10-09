/**
 * Ticketing registry: the only place prices, dates and the selling phase live.
 * Numbers come from the Drive sheets "Pilotage billetterie 2027" and "Dates
 * clés CND France 2027" — never quotas or stock, which the team adjusts live
 * in alf.io.
 *
 * Changing phase is changing `currentPhase` and shipping: `pre_opening` serves
 * the "coming soon" page, `pre_opening_dated` the one announcing the opening
 * date, a tier id sells that tier, and every tier before it reads "Épuisé".
 */

export type Localized = { fr: string; en: string };

export type TierId = "seb" | "eb" | "regular" | "last_chance";
export type PreOpeningPhase = "pre_opening" | "pre_opening_dated";
export type Phase = PreOpeningPhase | TierId;

export interface TierDefinition {
  id: TierId;
  name: Localized;
  /** Euros, VAT included. */
  price: number;
  /**
   * Shown only while the tier is on sale: the team may extend a tier or raise
   * its quota live, so a future tier never shows a date.
   */
  endsAt: string;
  /**
   * The tier has its own alf.io quota and closes when it runs out: the
   * "Places limitées" pill. Any tier also ends if the event sells out.
   */
  closesWhenSoldOut: boolean;
  maxPerOrder: number;
}

export interface GroupRate {
  id: "4_9" | "10_plus";
  min: number;
  /** Euros per person, VAT included. */
  price: number;
}

export interface TicketingConfig {
  /** The alf.io event listing: every purchase lands there. */
  listingUrl: string;
  currentPhase: Phase;
  standardName: Localized;
  tiers: readonly TierDefinition[];
  groupRates: readonly GroupRate[];
  /**
   * The standard ticket plus the Stratégie & Leadership track and its lounge,
   * both reserved for its holders, at one price for the whole season.
   * `seats` is fixed, the room's capacity: the one number of places the page
   * shows (08/10/2026).
   */
  strategic: {
    name: Localized;
    price: number;
    /**
     * The price is the launch price: the track's page says so. It will rise
     * closer to the event, at no announced date, so the page never names the
     * next price (09/10/2026). Set to false the day the price changes.
     */
    launchPrice: boolean;
    seats: number;
    trackUrl: Localized;
    /** The track's room, as the 2027 programme names it. */
    room: string;
    /** The lounge next to it, reserved for the ticket's holders. */
    lounge: Localized;
  };
  /** In percent. */
  vatRate: number;
  programmeAnnouncement: Localized;
}

export const TICKETING: TicketingConfig = {
  listingUrl: "https://billetterie.cloudnativedays.fr/event/cndfr2027",
  // Ticketing opens on 13 October 2026: set to "seb" that day.
  currentPhase: "pre_opening_dated",
  // Lower-case, as prose uses it; card titles capitalise it.
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
  // Offered only where cheaper than the tier and within its order cap
  // (`cheaperGroupRates`): the 5-seat cap of the two early tiers, which
  // protects their quota, leaves them without (22/09/2026).
  groupRates: [
    { id: "4_9", min: 4, price: 169 },
    { id: "10_plus", min: 10, price: 149 },
  ],
  strategic: {
    name: { fr: "Stratégie & Leadership", en: "Strategy & Leadership" },
    price: 399,
    launchPrice: true,
    seats: 200,
    trackUrl: {
      fr: "/parcours-strategie-leadership",
      en: "/en/track-strategy-leadership",
    },
    room: "Eiffel",
    lounge: { fr: "Salon Eiffel", en: "Salon Eiffel" },
  },
  vatRate: 10,
  programmeAnnouncement: { fr: "en mars 2027", en: "in March 2027" },
};
