import { describe, it, expect } from "vitest";
import { TICKETING, isTbd, tbd, type TicketingConfig, type TierId } from "@/config/tickets";
import {
  assertTicketingConfig,
  cheaperGroupRates,
  offerTier,
  ticketingConfigProblems,
  tierStates,
} from "@/lib/tickets/phase";
import { orderSegments, segmentAt } from "@/lib/tickets/pricing";
import {
  ALFIO_MAX_PER_ORDER,
  alfioHost,
  clampQuantity,
  codeFallbackAction,
  codeUrl,
  listingUrl,
  purchaseTarget,
  reserveUrl,
} from "@/lib/tickets/purchase";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  demoPath,
  demoStaticPaths,
  placeholdersAllowed,
  ticketDemosEnabled,
} from "@/lib/tickets/demo";
import { fill, formatDayMonth, formatDiscount, formatPrice } from "@/lib/tickets/format";
import { rexSummary } from "@/lib/tickets/rex";
import type { SessionRow } from "@/lib/schedule";

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
        { id: "4_9", min: 4, max: 9, price: 169, alfioCode: "A" },
        { id: "10_plus", min: 8, price: 179, alfioCode: "B" },
      ],
    });
    expect(problems).toContain('group rate "10_plus" overlaps "4_9"');
    expect(problems).toContain('group rate "10_plus" is not cheaper than "4_9"');
  });
});

describe("orderSegments", () => {
  const segmentsOf = (id: TierId) =>
    orderSegments(tier(id), cheaperGroupRates(TICKETING, tier(id))).map((s) => [
      s.min,
      s.max,
      s.price,
      s.product.kind === "group" ? s.product.rateId : "tier",
    ]);

  it("prices a tier with no group rate as one stretch", () => {
    expect(segmentsOf("seb")).toEqual([[1, 5, 129, "tier"]]);
    expect(segmentsOf("eb")).toEqual([[1, 5, 159, "tier"]]);
  });

  it("drops to the cheaper rate as soon as its threshold is crossed", () => {
    expect(segmentsOf("regular")).toEqual([
      [1, 3, 199, "tier"],
      [4, 9, 169, "4_9"],
      [10, 20, 149, "10_plus"],
    ]);
    expect(segmentsOf("last_chance")).toEqual([
      [1, 3, 229, "tier"],
      [4, 9, 169, "4_9"],
      [10, 20, 149, "10_plus"],
    ]);
  });

  it("leaves no quantity unpriced, on any tier", () => {
    for (const t of TICKETING.tiers) {
      const segments = orderSegments(t, cheaperGroupRates(TICKETING, t));
      expect(segments[0].min).toBe(1);
      expect(segments[segments.length - 1].max).toBe(t.maxPerOrder);
      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].min).toBe(segments[i - 1].max + 1);
        expect(segments[i].price).toBeLessThan(segments[i - 1].price);
      }
      for (let q = 1; q <= t.maxPerOrder; q++) {
        expect(segmentAt(segments, q).price).toBeLessThanOrEqual(t.price);
      }
    }
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
  const drafts = { allowDrafts: true };

  it("sends every buyer to the listing in variant B", () => {
    for (const id of ["seb", "eb", "regular", "last_chance"] as const) {
      expect(purchaseTarget(TICKETING, "b", { kind: "tier", tier: tier(id) }, id, drafts)).toEqual({
        kind: "listing",
        href: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
      });
    }
  });

  it("offers no purchase before the opening, in either variant", () => {
    for (const variant of ["a", "b"] as const) {
      expect(purchaseTarget(TICKETING, variant, { kind: "tier", tier: tier("seb") }, "pre_opening", drafts).kind).toBe(
        "notify",
      );
    }
  });

  it.each([
    ["seb", 5, "DEMO-SEB"],
    ["eb", 5, "DEMO-EB"],
    ["regular", 20, "DEMO-REGULAR"],
    ["last_chance", 20, "DEMO-LAST-CHANCE"],
  ] as const)("reserves %s tickets through its category code, 1 to %i per order", (id, max, code) => {
    const target = purchaseTarget(TICKETING, "a", { kind: "tier", tier: tier(id) }, id, drafts);
    expect(target).toEqual({
      kind: "reserve",
      action: `https://billetterie.cloudnativedays.fr/event/cnd-2027/code/${code}`,
      qtyParam: "qty",
      min: 1,
      max,
    });
    if (target.kind !== "reserve") throw new Error("unreachable");
    expect(reserveUrl(target, 1)).toBe(`${target.action}?qty=1`);
    expect(reserveUrl(target, max)).toBe(`${target.action}?qty=${max}`);
    expect(reserveUrl(target, max + 1)).toBe(`${target.action}?qty=${max}`);
    expect(reserveUrl(target, 0)).toBe(`${target.action}?qty=1`);
  });

  it("reserves a group order through the rate's own alf.io code, under the tier's cap", () => {
    const rate = TICKETING.groupRates[1];
    expect(purchaseTarget(TICKETING, "a", { kind: "group", tier: tier("regular"), rate }, "regular", drafts)).toEqual({
      kind: "reserve",
      action: "https://billetterie.cloudnativedays.fr/event/cnd-2027/code/DEMO-GROUPE-10",
      qtyParam: "qty",
      min: 1,
      max: 20,
    });
  });

  it("uses the same action for the Strategy & Leadership ticket, capped by alf.io while undecided", () => {
    const { strategic } = TICKETING;
    const target = purchaseTarget(
      TICKETING,
      "a",
      { kind: "strategic", categoryCode: strategic.alfioCategoryCode, maxPerOrder: strategic.maxPerOrder },
      "seb",
      drafts,
    );
    expect(target).toMatchObject({ kind: "reserve", max: ALFIO_MAX_PER_ORDER });
  });

  it("refuses to build a demo category code on a production build", () => {
    expect(() =>
      purchaseTarget(TICKETING, "a", { kind: "tier", tier: tier("seb") }, "seb", { allowDrafts: false }),
    ).toThrow(/still tbd/);
  });

  it("names the alf.io host buyers land on", () => {
    expect(alfioHost(TICKETING)).toBe("billetterie.cloudnativedays.fr");
    expect(listingUrl({ ...TICKETING, alfio: { baseUrl: "https://x.test/", eventSlug: "e" } })).toBe(
      "https://x.test/event/e",
    );
  });
});

describe("clampQuantity", () => {
  it.each([
    [3, 5, 3],
    ["4", 5, 4],
    [9, 5, 5],
    [-2, 5, 1],
    ["", 5, 1],
    ["abc", 20, 1],
    [2.7, 20, 2],
  ] as const)("%s within 1..%i → %i", (raw, max, expected) => {
    expect(clampQuantity(raw, max)).toBe(expected);
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

  it("emits both variants × 5 phases × 3 Strategy & Leadership states, plus the entry URLs", () => {
    const paths = demoStaticPaths();
    expect(paths).toHaveLength(2 * (1 + 5 * 3));
    expect(new Set(paths.map((p) => p.params.demo)).size).toBe(paths.length);
    expect(paths.map((p) => p.params.demo)).toContain("demo-a/early-bird/annonce");
    expect(demoPath({ variant: "b", phase: "pre_opening", strategicState: "hidden" })).toBe(
      "/billetterie/demo-b/avant-ouverture/masque/",
    );
  });

  it("keeps every demo URL under /billetterie/demo-", () => {
    for (const p of demoStaticPaths()) expect(`/billetterie/${p.params.demo}`).toMatch(/^\/billetterie\/demo-[ab]/);
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

describe("rexSummary", () => {
  const row = (title: string) => ({ title }) as SessionRow;

  it("lists distinct organisations from REX titles and counts the sessions", () => {
    const summary = rexSummary([
      row("REX SNCF - Kube managé"),
      row("Keynote d'ouverture"),
      row("REX Air France-KLM - Vers le cloud"),
      row("REX SNCF - Des rails aux nuages"),
      row("REX bpifrance - FinOps en action – la suite"),
    ]);
    expect(summary).toEqual({ sessions: 4, organisations: ["SNCF", "Air France-KLM", "bpifrance"] });
  });
});
