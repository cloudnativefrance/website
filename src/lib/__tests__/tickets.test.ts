import { describe, it, expect, vi } from "vitest";

// The demo gate reads TICKETS_DEMO from astro:env, which only exists under the
// Astro runtime. Unset here; every gate case passes its own `toggle`.
vi.mock("astro:env/server", () => ({ TICKETS_DEMO: undefined }));

import { TICKETING, isTbd, tbd, type TicketingConfig } from "@/config/tickets";
import {
  cheaperGroupRates,
  ticketingConfigProblems,
  tierStates,
  tierUrgency,
} from "@/lib/tickets/phase";
import { codeUrl, listingUrl, purchaseTarget } from "@/lib/tickets/purchase";
import { handOffOnce, openInNewTab } from "@/lib/tickets/url";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  demoPath,
  demoStaticPaths,
  placeholdersAllowed,
  ticketDemosEnabled,
} from "@/lib/tickets/demo";
import { formatDiscount } from "@/lib/tickets/format";
import { assertShippable, shippingProblems, shown } from "@/lib/tickets/drafts";

const alfio = {
  ...TICKETING,
  alfio: { baseUrl: "https://x.test/", eventSlug: "e" },
};

describe("the committed config", () => {
  it("is consistent, and names no tier by its internal abbreviation", () => {
    expect(ticketingConfigProblems(TICKETING)).toEqual([]);
    for (const t of TICKETING.tiers)
      for (const name of Object.values(t.name))
        expect(name).not.toMatch(/^(SEB|EB|R|LC)$/);
  });
});

describe("tiers", () => {
  it("puts past, current and upcoming tiers in order", () => {
    const [, , third] = TICKETING.tiers;
    expect(tierStates(TICKETING, third.id).map((s) => s.state.kind)).toEqual([
      "past",
      "past",
      "current",
      "upcoming",
    ]);
  });

  it("dates every tier but the last, and limits the stock of those that close when sold out", () => {
    const last = TICKETING.tiers.at(-1);
    for (const t of TICKETING.tiers) {
      const urgency = tierUrgency(TICKETING, t);
      expect(urgency.endsAt).toBe(t === last ? undefined : t.endsAt);
      expect(urgency.limitedStock).toBe(t.closesWhenSoldOut);
    }
  });
});

describe("cheaperGroupRates", () => {
  // A config of its own: the rule, not today's prices.
  const config: TicketingConfig = {
    ...TICKETING,
    groupRates: [
      { id: "4_9", min: 4, max: 9, price: 169 },
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

describe("formatDiscount", () => {
  it("rounds down, so a discount never reads bigger than it is", () => {
    expect(formatDiscount(199, 169, "en")).toBe("−15%"); // 15.07 %
  });
});

describe("purchase", () => {
  it("sends every buyer to the alf.io listing", () => {
    expect(listingUrl(alfio)).toBe("https://x.test/event/e");
    expect(purchaseTarget(alfio)).toMatchObject({
      kind: "listing",
      href: "https://x.test/event/e",
    });
  });

  it("builds the code URL: spaces dropped, path characters encoded, empty refused", () => {
    expect(codeUrl(alfio, " \t ")).toEqual({ ok: false, reason: "empty" });
    expect(codeUrl(alfio, " PART NER ")).toEqual({
      ok: true,
      code: "PARTNER",
      url: "https://x.test/event/e/code/PARTNER",
    });
    expect(codeUrl(alfio, "a/b?c#d")).toMatchObject({
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
    expect(placeholdersAllowed({ env: staging, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: prod, dev: true })).toBe(true);
    expect(ticketDemosEnabled({ toggle: false, env: prod, dev: true })).toBe(
      false,
    );
  });

  it("is on for a staging build with TICKETS_DEMO=true", () => {
    expect(ticketDemosEnabled({ toggle: true, env: staging, dev: false })).toBe(
      true,
    );
    expect(
      placeholdersAllowed({ toggle: true, env: staging, dev: false }),
    ).toBe(true);
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
      expect(() =>
        placeholdersAllowed({ toggle: true, env, dev: false }),
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

describe("drafts", () => {
  // Every tbd() replaced by its draft, or by a stand-in when it has none: the
  // config as it will be once the team has decided everything.
  const decided = JSON.parse(JSON.stringify(TICKETING), (_key, value) =>
    isTbd(value) ? (value.draft ?? "decided") : value,
  ) as TicketingConfig;

  it("shows the decided value, else the draft, else nothing", () => {
    expect(shown("10:00")).toBe("10:00");
    expect(shown(tbd("Heure", "10:00"))).toBe("10:00");
    expect(shown(tbd("Heure"))).toBeUndefined();
  });

  it("lets a decided config ship, and an undecided value with no draft — its line is not rendered", () => {
    expect(shippingProblems(decided)).toEqual([]);
    expect(
      shippingProblems({ ...decided, programmeAnnouncement: tbd("Date") }),
    ).toEqual([]);
  });

  it("blocks on any draft, and on the two ticket names and the S&L price even without one", () => {
    expect(() =>
      assertShippable({
        ...decided,
        programmeAnnouncement: tbd("Date", { fr: "en mars", en: "in March" }),
      }),
    ).toThrow(/programmeAnnouncement/);
    const required = {
      ...decided,
      standardName: tbd("Nom"),
      strategic: { ...decided.strategic, name: tbd("Nom"), price: tbd("Prix") },
    };
    expect(shippingProblems(required).map((p) => p.path)).toEqual([
      "standardName",
      "strategic.name",
      "strategic.price",
    ]);
  });
});
