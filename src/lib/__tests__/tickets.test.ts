import { describe, it, expect } from "vitest";
import { TICKETING, isTbd, tbd, type TicketingConfig, type TierId } from "@/config/tickets";
import {
  assertTicketingConfig,
  cheaperGroupRates,
  offerTier,
  strategicPrice,
  ticketingConfigProblems,
  tierStates,
} from "@/lib/tickets/phase";
import { alfioHost, codeFallbackAction, codeUrl, listingUrl, onHost, purchaseTarget } from "@/lib/tickets/purchase";
import { openInNewTab } from "@/lib/tickets/url";
import { NEWSLETTER_URL } from "@/lib/event";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  demoPath,
  demoStaticPaths,
  placeholdersAllowed,
  ticketDemosEnabled,
} from "@/lib/tickets/demo";
import { fill, formatDayMonth, formatDiscount, formatPrice } from "@/lib/tickets/format";
import { assertShippable, shippingProblems, shown } from "@/lib/tickets/drafts";

const tier = (id: TierId) => TICKETING.tiers.find((t) => t.id === id)!;

function withPhase(overrides: Partial<TicketingConfig>): TicketingConfig {
  return { ...TICKETING, ...overrides };
}

describe("the committed config", () => {
  it("is internally consistent", () => {
    expect(ticketingConfigProblems(TICKETING)).toEqual([]);
  });

  it("carries the four public tiers at the prices of the pilotage sheet", () => {
    expect(TICKETING.tiers.map((t) => [t.id, t.price, t.maxPerOrder])).toEqual([
      ["seb", 129, 5],
      ["eb", 159, 5],
      ["regular", 199, 20],
      ["last_chance", 229, 20],
    ]);
    expect(TICKETING.groupRates.map((r) => [r.id, r.price])).toEqual([
      ["4_9", 169],
      ["10_plus", 149],
    ]);
  });

  it("never names a tier by its internal abbreviation", () => {
    for (const t of TICKETING.tiers) {
      for (const name of [t.name.fr, t.name.en]) {
        expect(name).not.toMatch(/^(SEB|EB|R|LC)$/);
      }
    }
  });

  it("ends each tier on the date of the key-dates sheet", () => {
    expect(TICKETING.tiers.map((t) => formatDayMonth(t.endsAt, "fr"))).toEqual([
      "dimanche 29 novembre",
      "dimanche 7 février",
      "dimanche 16 mai",
      "jeudi 3 juin",
    ]);
  });
});

describe("tierStates", () => {
  it("shows every tier as upcoming before the opening", () => {
    const states = tierStates(TICKETING, "pre_opening");
    expect(states.map((s) => s.state.kind)).toEqual(["upcoming", "upcoming", "upcoming", "upcoming"]);
    expect(offerTier(TICKETING, "pre_opening").id).toBe("seb");
  });

  it("puts past, current and upcoming tiers in order", () => {
    expect(tierStates(TICKETING, "regular").map((s) => s.state.kind)).toEqual([
      "past",
      "past",
      "current",
      "upcoming",
    ]);
  });

  it("stays consistent once the phase moves on, with nothing else to update", () => {
    const config = withPhase({ currentPhase: "eb" });
    expect(tierStates(config, "eb").map((s) => s.state.kind)).toEqual([
      "past",
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(() => assertTicketingConfig(config)).not.toThrow();
  });
});

describe("group rates", () => {
  const ids = (id: TierId) => cheaperGroupRates(TICKETING, tier(id)).map((r) => r.id);

  it("offers none on the two quota-protected tiers, both on the later ones", () => {
    // Super Early Bird and Early Bird cap an order at 5 seats — that cap is how
    // their quota is protected, so a group of 10 cannot be sold at all, and 4-9
    // at 169 € is dearer than both. Decision of 22/09/2026.
    expect(ids("seb")).toEqual([]);
    expect(ids("eb")).toEqual([]);
    expect(ids("regular")).toEqual(["4_9", "10_plus"]);
    expect(ids("last_chance")).toEqual(["4_9", "10_plus"]);
  });

  it("brings the group rate back on Early Bird the day its order cap is lifted", () => {
    // The one change the ticketing team is weighing: no code follows it.
    const openEb = { ...tier("eb"), maxPerOrder: 20 };
    expect(cheaperGroupRates(TICKETING, openEb).map((r) => r.id)).toEqual(["10_plus"]);
  });

  it("refuses a rate table that does not climb", () => {
    const problems = ticketingConfigProblems({
      ...TICKETING,
      groupRates: [
        { id: "4_9", min: 4, max: 9, price: 169 },
        { id: "10_plus", min: 8, price: 179 },
      ],
    });
    expect(problems).toContain('group rate "10_plus" overlaps "4_9"');
    expect(problems).toContain('group rate "10_plus" is not cheaper than "4_9"');
  });
});

describe("formatDiscount", () => {
  it("rounds down, so a discount never reads bigger than it is", () => {
    expect(formatDiscount(199, 169, "fr")).toBe("−15\u202f%"); // 15.07 %
    expect(formatDiscount(199, 149, "fr")).toBe("−25\u202f%"); // 25.12 %
    expect(formatDiscount(229, 149, "fr")).toBe("−34\u202f%"); // 34.93 %
  });

  it("sets a narrow no-break space before the percent sign in French only", () => {
    expect(formatDiscount(200, 150, "fr")).toBe("−25\u202f%");
    expect(formatDiscount(200, 150, "en")).toBe("−25%");
  });
});

describe("purchaseTarget", () => {
  it("sends every buyer to the listing once the ticketing is open", () => {
    for (const id of ["seb", "eb", "regular", "last_chance"] as const) {
      expect(purchaseTarget(TICKETING, id)).toEqual({
        kind: "listing",
        href: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
        rel: "noopener",
      });
    }
  });

  it("offers the newsletter, not a purchase, before the opening", () => {
    expect(purchaseTarget(TICKETING, "pre_opening")).toEqual({
      kind: "notify",
      href: NEWSLETTER_URL,
      rel: "noopener noreferrer",
    });
  });

  it("names the alf.io host buyers land on", () => {
    expect(alfioHost(TICKETING)).toBe("billetterie.cloudnativedays.fr");
    expect(listingUrl({ ...TICKETING, alfio: { baseUrl: "https://x.test/", eventSlug: "e" } })).toBe(
      "https://x.test/event/e",
    );
  });
});

describe("codeUrl", () => {
  it("refuses an empty code, whitespace included", () => {
    expect(codeUrl(TICKETING, "")).toEqual({ ok: false, reason: "empty" });
    expect(codeUrl(TICKETING, "   \t ")).toEqual({ ok: false, reason: "empty" });
  });

  it("drops every space, including inside the code", () => {
    expect(codeUrl(TICKETING, "  PART NER-27 ")).toEqual({
      ok: true,
      code: "PARTNER-27",
      url: "https://billetterie.cloudnativedays.fr/event/cnd-2027/code/PARTNER-27",
    });
  });

  it("encodes characters that would break out of the path segment", () => {
    const result = codeUrl(TICKETING, "a/b?c#d%é&e");
    expect(result.ok && result.url).toBe(
      "https://billetterie.cloudnativedays.fr/event/cnd-2027/code/a%2Fb%3Fc%23d%25%C3%A9%26e",
    );
  });

  it("falls back to the listing with ?code= without JavaScript", () => {
    expect(codeFallbackAction(TICKETING)).toEqual({
      action: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
      param: "code",
    });
  });
});

describe("buildMailto", () => {
  it("encodes spaces as %20 and line breaks as CRLF", () => {
    expect(buildMailto("billetterie@cloudnativedays.fr", "Billets de groupe", "Société :\nNombre : 12")).toBe(
      "mailto:billetterie@cloudnativedays.fr?subject=Billets%20de%20groupe&body=Soci%C3%A9t%C3%A9%20%3A%0D%0ANombre%20%3A%2012",
    );
  });

  it("omits an empty body", () => {
    expect(buildMailto("a@b.fr", "Objet")).toBe("mailto:a@b.fr?subject=Objet");
  });
});

describe("demo gate", () => {
  const prod = { PUBLIC_SITE_URL: "" };
  const staging = { PUBLIC_SITE_URL: "https://staging.cloudnativedays.fr" };

  it("is closed on a production build, including the empty PUBLIC_SITE_URL CI passes", () => {
    expect(ticketDemosEnabled({ env: prod, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: {}, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: { PUBLIC_SITE_URL: "https://cloudnativedays.fr" }, dev: false })).toBe(false);
    expect(placeholdersAllowed({ env: prod, dev: false })).toBe(false);
  });

  it("is open on staging and in astro dev", () => {
    expect(ticketDemosEnabled({ env: staging, dev: false })).toBe(true);
    expect(ticketDemosEnabled({ env: prod, dev: true })).toBe(true);
  });

  it("emits one page per phase, plus the entry URL", () => {
    const paths = demoStaticPaths();
    expect(paths.map((p) => p.params.demo)).toEqual([
      "demo",
      "demo/avant-ouverture",
      "demo/super-early-bird",
      "demo/early-bird",
      "demo/regular",
      "demo/last-chance",
    ]);
    expect(paths[0].props).toEqual({});
    expect(paths[3].props).toEqual({ phase: "eb" });
    expect(demoPath()).toBe("/billetterie/demo/");
    expect(demoPath("pre_opening")).toBe("/billetterie/demo/avant-ouverture/");
  });

  it("keeps every demo URL under /billetterie/demo/, and none of the old variant URLs", () => {
    for (const p of demoStaticPaths()) {
      expect(`/billetterie/${p.params.demo}/`).toMatch(/^\/billetterie\/demo\//);
      expect(p.params.demo).not.toMatch(/^demo-/);
    }
  });
});

describe("tbd", () => {
  it("is recognisable and carries its note and draft", () => {
    const value = tbd("Heure", "10:00");
    expect(isTbd(value)).toBe(true);
    expect(value).toEqual({ tbd: true, note: "Heure", draft: "10:00" });
    expect(isTbd("10:00")).toBe(false);
    expect(isTbd(null)).toBe(false);
  });
});

describe("format", () => {
  it("formats whole-euro prices per locale", () => {
    expect(formatPrice(129, "fr").replace(/\s/g, " ")).toBe("129 €");
    expect(formatPrice(129, "en")).toBe("€129");
  });

  it("fills named tokens and leaves unknown ones", () => {
    expect(fill("{n} billets à {price}", { n: 3, price: "129 €" })).toBe("3 billets à 129 €");
    expect(fill("{missing}", {})).toBe("{missing}");
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
    expect(shown(tbd("Heure d'ouverture", "10:00"))).toBe("10:00");
    expect(shown(tbd("Taux de TVA"))).toBeUndefined();
  });

  it("lets a fully decided config ship", () => {
    expect(shippingProblems(decided)).toEqual([]);
    expect(() => assertShippable(decided)).not.toThrow();
  });

  it("blocks on a draft wherever it sits, arrays included, and names its path", () => {
    const config = {
      ...decided,
      opening: { ...decided.opening, time: tbd("Heure d'ouverture", "10:00") },
      tiers: decided.tiers.map((t, i) => (i === 0 ? { ...t, name: tbd("Nom public", t.name) } : t)),
    } as unknown as TicketingConfig;
    expect(shippingProblems(config)).toEqual([
      { path: "opening.time", note: "Heure d'ouverture" },
      { path: "tiers.0.name", note: "Nom public" },
    ]);
  });

  it("lets an undecided value with no draft ship — its line is simply not rendered", () => {
    expect(shippingProblems({ ...decided, vatRate: tbd("Taux de TVA") })).toEqual([]);
  });

  it("still requires the Strategy & Leadership price, which has no draft to show", () => {
    const config = { ...decided, strategic: { ...decided.strategic, price: tbd("Prix") } };
    expect(shippingProblems(config)).toEqual([{ path: "strategic.price", note: "Prix" }]);
  });

  it("names every problem at once when it refuses", () => {
    const config = {
      ...decided,
      vatRate: tbd("Taux de TVA", "10 %"),
      strategic: { ...decided.strategic, price: tbd("Prix") },
    };
    expect(() => assertShippable(config)).toThrow(/vatRate — Taux de TVA[\s\S]*strategic\.price — Prix/);
  });

  it("lists what still blocks a production build of the committed config", () => {
    expect(shippingProblems(TICKETING).map((p) => p.path)).toEqual([
      "opening.time",
      "tierNames",
      "strategic.name",
      "strategic.networking",
      "contents",
      "eveningIncluded",
      "managerKitUrl",
      "programmeAnnouncement",
      "strategic.price",
    ]);
  });
});

describe("strategicPrice", () => {
  const withPrice = (price: TicketingConfig["strategic"]["price"]): TicketingConfig => ({
    ...TICKETING,
    strategic: { ...TICKETING.strategic, price },
  });

  it("shows nothing while the price is undecided", () => {
    expect(strategicPrice(withPrice(tbd("Prix")), "regular")).toBeUndefined();
  });

  it("shows a fixed price in every phase", () => {
    const fixed = withPrice({ kind: "fixed", amount: 449 });
    expect(strategicPrice(fixed, "pre_opening")).toBe(449);
    expect(strategicPrice(fixed, "last_chance")).toBe(449);
  });

  it("follows the tier on offer when priced per tier — the first one before the opening", () => {
    const perTier = withPrice({ kind: "per_tier", amounts: { seb: 399, eb: 449, regular: 499, last_chance: 549 } });
    expect(strategicPrice(perTier, "pre_opening")).toBe(399);
    expect(strategicPrice(perTier, "eb")).toBe(449);
    expect(strategicPrice(perTier, "regular")).toBe(499);
  });
});

describe("onHost", () => {
  it("recognises a URL on the alf.io host, and nothing else", () => {
    expect(onHost("https://billetterie.cloudnativedays.fr/terms", "billetterie.cloudnativedays.fr")).toBe(true);
    expect(onHost("https://cloudnativedays.fr/cgv", "billetterie.cloudnativedays.fr")).toBe(false);
    expect(onHost("#convaincre", "billetterie.cloudnativedays.fr")).toBe(false);
  });
});

describe("openInNewTab", () => {
  it("opens the URL in a new tab, cut from this page", () => {
    const tab: { opener: unknown } = { opener: "this page" };
    const opened: string[] = [];
    const assigned: string[] = [];
    openInNewTab("https://x.test/code/A", {
      open: (url, target) => {
        opened.push(`${target} ${url}`);
        return tab;
      },
      location: { assign: (url) => void assigned.push(url) },
    });
    expect(opened).toEqual(["_blank https://x.test/code/A"]);
    expect(tab.opener).toBeNull();
    expect(assigned).toEqual([]);
  });

  it("goes there in this tab when the browser blocks the new one", () => {
    const assigned: string[] = [];
    openInNewTab("https://x.test/code/A", {
      open: () => null,
      location: { assign: (url) => void assigned.push(url) },
    });
    expect(assigned).toEqual(["https://x.test/code/A"]);
  });
});
