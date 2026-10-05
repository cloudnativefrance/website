import { describe, it, expect, vi } from "vitest";

// The demo gate reads TICKETS_DEMO from astro:env, which only exists under the
// Astro runtime. Unset here; every gate case passes its own `toggle`.
vi.mock("astro:env/server", () => ({ TICKETS_DEMO: undefined }));

import { TICKETING, type TicketingConfig } from "@/config/tickets";
import { cheaperGroupRates, offerTier, tierStates } from "@/lib/tickets/phase";
import { codeUrl, handOffOnce, openInNewTab } from "@/lib/tickets/alfio";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  demoPath,
  demoStaticPaths,
  ticketDemosEnabled,
} from "@/lib/tickets/demo";
import { formatDiscount } from "@/lib/tickets/format";
import { ticketOffers } from "@/lib/event-schema";

describe("tiers", () => {
  it("puts past, current and upcoming tiers in order", () => {
    const [, , third] = TICKETING.tiers;
    expect(tierStates(TICKETING, third.id).map((s) => s.state)).toEqual([
      "past",
      "past",
      "current",
      "upcoming",
    ]);
  });
});

describe("cheaperGroupRates", () => {
  // A config of its own: the rule, not today's prices.
  const config: TicketingConfig = {
    ...TICKETING,
    groupRates: [
      { id: "4_9", min: 4, price: 169 },
      { id: "10_plus", min: 10, price: 149 },
    ],
  };
  const rates = (price: number, maxPerOrder: number) =>
    cheaperGroupRates(config, {
      ...TICKETING.tiers[0],
      price,
      maxPerOrder,
    }).map((r) => r.id);

  it("keeps a rate only when it is cheaper than the tier and fits its order cap", () => {
    expect(rates(199, 20)).toEqual(["4_9", "10_plus"]);
    expect(rates(159, 20)).toEqual(["10_plus"]);
    expect(rates(199, 5)).toEqual(["4_9"]);
  });
});

describe("ticketOffers", () => {
  it("prices nothing before the opening, then the standard price of the moment", () => {
    expect(ticketOffers("pre_opening", "/billetterie/")).toBeUndefined();
    expect(ticketOffers("regular", "/billetterie/")).toMatchObject({
      price: offerTier(TICKETING, "regular").price,
    });
  });
});

describe("formatDiscount", () => {
  it("rounds down, so a discount never reads bigger than it is", () => {
    expect(formatDiscount(199, 169, "en")).toBe("−15%"); // 15.07 %
  });
});

describe("codeUrl", () => {
  const listing = "https://x.test/event/e";

  it("drops spaces, encodes path characters, refuses an empty code", () => {
    expect(codeUrl(listing, " \t ")).toEqual({ ok: false });
    expect(codeUrl(listing, " PART NER ")).toEqual({
      ok: true,
      code: "PARTNER",
      url: "https://x.test/event/e/code/PARTNER",
    });
    expect(codeUrl(listing, "a/b?c#d")).toMatchObject({
      url: "https://x.test/event/e/code/a%2Fb%3Fc%23d",
    });
  });
});

describe("openInNewTab", () => {
  it("opens a new tab cut from this page, or this tab when the browser blocks it", () => {
    const tab = { opener: "this page" as unknown };
    const assigned: string[] = [];
    const location = { assign: (url: string) => void assigned.push(url) };
    openInNewTab("https://x.test/a", { open: () => tab, location });
    expect(tab.opener).toBeNull();
    expect(assigned).toEqual([]);
    openInNewTab("https://x.test/a", { open: () => null, location });
    expect(assigned).toEqual(["https://x.test/a"]);
  });
});

describe("handOffOnce", () => {
  // A real code creates an alf.io reservation that holds tickets: a
  // double-click must not open a second tab, and a second hold.
  it("ignores a repeat within the window, not after it", () => {
    let now = 0;
    const handOff = handOffOnce(3_000, () => now);
    expect(handOff()).toBe(true);
    now = 2_900;
    expect(handOff()).toBe(false);
    now = 3_000;
    expect(handOff()).toBe(true);
  });
});

describe("buildMailto", () => {
  it("encodes spaces as %20 and line breaks as CRLF", () => {
    expect(buildMailto("a@b.fr", "Un objet", "A\nB")).toBe(
      "mailto:a@b.fr?subject=Un%20objet&body=A%0D%0AB",
    );
  });
});

describe("demo gate", () => {
  const prod = { PUBLIC_SITE_URL: "" };
  const staging = { PUBLIC_SITE_URL: "https://staging.cloudnativedays.fr" };

  it("is off in any build without TICKETS_DEMO, on under astro dev unless TICKETS_DEMO=false", () => {
    for (const env of [prod, staging])
      expect(ticketDemosEnabled({ env, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: prod, dev: true })).toBe(true);
    expect(ticketDemosEnabled({ toggle: false, env: prod, dev: true })).toBe(
      false,
    );
  });

  it("is on for a staging build with TICKETS_DEMO=true", () => {
    expect(ticketDemosEnabled({ toggle: true, env: staging, dev: false })).toBe(
      true,
    );
  });

  it("refuses TICKETS_DEMO=true on a production-origin build, the empty PUBLIC_SITE_URL of CI included", () => {
    for (const env of [
      prod,
      {},
      { PUBLIC_SITE_URL: "https://cloudnativedays.fr" },
    ]) {
      expect(() =>
        ticketDemosEnabled({ toggle: true, env, dev: false }),
      ).toThrow(/TICKETS_DEMO/);
    }
  });

  it("keeps every demo URL under /billetterie/demo/ and /en/tickets/demo/ — the sitemap excludes them", () => {
    for (const { props } of demoStaticPaths()) {
      expect(demoPath(props.phase, "fr")).toMatch(
        /^\/billetterie\/demo\/[a-z-]+\/$/,
      );
      expect(demoPath(props.phase, "en")).toMatch(
        /^\/en\/tickets\/demo\/[a-z-]+\/$/,
      );
    }
  });
});
