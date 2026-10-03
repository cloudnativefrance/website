import { describe, it, expect, vi } from "vitest";

// The demo gate reads TICKETS_DEMO from astro:env, which only exists under the
// Astro runtime. Unset here; every gate case passes its own `toggle`.
vi.mock("astro:env/server", () => ({ TICKETS_DEMO: undefined }));

import {
  TICKETING,
  isTbd,
  tbd,
  type TicketingConfig,
  type TierId,
} from "@/config/tickets";
import {
  assertTicketingConfig,
  cheaperGroupRates,
  offerTier,
  ticketingConfigProblems,
  tierStates,
  tierUrgency,
} from "@/lib/tickets/phase";
import {
  alfioHost,
  codeFallbackAction,
  codeUrl,
  listingUrl,
  onHost,
  purchaseTarget,
} from "@/lib/tickets/purchase";
import { handOffOnce, openInNewTab } from "@/lib/tickets/url";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  demoPath,
  demoStaticPaths,
  placeholdersAllowed,
  ticketDemosEnabled,
} from "@/lib/tickets/demo";
import {
  fill,
  formatDayMonth,
  formatDiscount,
  formatPrice,
} from "@/lib/tickets/format";
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
      "29 novembre",
      "7 février",
      "16 mai",
      "3 juin",
    ]);
    // Every tier but the last ends on a Sunday night, as the sheet says.
    const weekday = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      timeZone: "Europe/Paris",
    });
    expect(
      TICKETING.tiers.map((t) => weekday.format(new Date(t.endsAt))),
    ).toEqual(["dimanche", "dimanche", "dimanche", "jeudi"]);
  });
});

describe("tierStates", () => {
  it("offers the tier the phase names", () => {
    expect(offerTier(TICKETING, "seb").id).toBe("seb");
    expect(tierStates(TICKETING, "seb").map((s) => s.state.kind)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
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

  it("accepts the coming-soon phase as the config's own, and nothing unknown", () => {
    expect(
      ticketingConfigProblems(withPhase({ currentPhase: "pre_opening" })),
    ).toEqual([]);
    expect(
      ticketingConfigProblems(withPhase({ currentPhase: "vip" as TierId })),
    ).toContain('currentPhase "vip" matches no tier');
  });
});

describe("tierUrgency", () => {
  it("gives the early tiers a date and a limited stock", () => {
    expect(tierUrgency(TICKETING, tier("seb"))).toEqual({
      endsAt: "2026-11-29T23:59:59+01:00",
      limitedStock: true,
      lastTier: false,
    });
    expect(tierUrgency(TICKETING, tier("eb")).limitedStock).toBe(true);
  });

  it("gives Regular its date alone", () => {
    expect(tierUrgency(TICKETING, tier("regular"))).toEqual({
      endsAt: "2027-05-16T23:59:59+02:00",
      limitedStock: false,
      lastTier: false,
    });
  });

  it("gives the last tier no date — it runs to the event day", () => {
    expect(tierUrgency(TICKETING, tier("last_chance"))).toEqual({
      endsAt: undefined,
      limitedStock: false,
      lastTier: true,
    });
  });
});

describe("group rates", () => {
  const ids = (id: TierId) =>
    cheaperGroupRates(TICKETING, tier(id)).map((r) => r.id);

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
    expect(cheaperGroupRates(TICKETING, openEb).map((r) => r.id)).toEqual([
      "10_plus",
    ]);
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
    expect(problems).toContain(
      'group rate "10_plus" is not cheaper than "4_9"',
    );
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
  it("sends every buyer to the listing", () => {
    expect(purchaseTarget(TICKETING)).toEqual({
      kind: "listing",
      href: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
      rel: "noopener",
    });
  });

  it("names the alf.io host buyers land on", () => {
    expect(alfioHost(TICKETING)).toBe("billetterie.cloudnativedays.fr");
    expect(
      listingUrl({
        ...TICKETING,
        alfio: { baseUrl: "https://x.test/", eventSlug: "e" },
      }),
    ).toBe("https://x.test/event/e");
  });
});

describe("codeUrl", () => {
  it("refuses an empty code, whitespace included", () => {
    expect(codeUrl(TICKETING, "")).toEqual({ ok: false, reason: "empty" });
    expect(codeUrl(TICKETING, "   \t ")).toEqual({
      ok: false,
      reason: "empty",
    });
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
    expect(
      buildMailto(
        "billetterie@cloudnativedays.fr",
        "Billets de groupe",
        "Société :\nNombre : 12",
      ),
    ).toBe(
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

  it("is closed in any build that does not set TICKETS_DEMO — a non-production origin is not enough", () => {
    expect(ticketDemosEnabled({ env: prod, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: {}, dev: false })).toBe(false);
    expect(ticketDemosEnabled({ env: staging, dev: false })).toBe(false);
    expect(placeholdersAllowed({ env: prod, dev: false })).toBe(false);
    expect(placeholdersAllowed({ env: staging, dev: false })).toBe(false);
  });

  it("is open under astro dev unless TICKETS_DEMO=false", () => {
    expect(ticketDemosEnabled({ env: prod, dev: true })).toBe(true);
    expect(ticketDemosEnabled({ toggle: true, env: prod, dev: true })).toBe(
      true,
    );
    expect(ticketDemosEnabled({ toggle: false, env: prod, dev: true })).toBe(
      false,
    );
    expect(placeholdersAllowed({ toggle: false, env: prod, dev: true })).toBe(
      false,
    );
  });

  it("is open on a non-production build that sets TICKETS_DEMO=true — the staging image", () => {
    expect(ticketDemosEnabled({ toggle: true, env: staging, dev: false })).toBe(
      true,
    );
    expect(
      placeholdersAllowed({ toggle: true, env: staging, dev: false }),
    ).toBe(true);
    expect(
      ticketDemosEnabled({ toggle: false, env: staging, dev: false }),
    ).toBe(false);
  });

  it("refuses TICKETS_DEMO=true on a production-origin build, including the empty PUBLIC_SITE_URL CI passes", () => {
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

  it("emits one page per phase, the coming-soon page included — /billetterie is the config's own", () => {
    const paths = demoStaticPaths();
    expect(paths.map((p) => p.params.phase)).toEqual([
      "avant-ouverture",
      "super-early-bird",
      "early-bird",
      "regular",
      "last-chance",
    ]);
    expect(paths[0].props).toEqual({ phase: "pre_opening" });
    expect(paths[2].props).toEqual({ phase: "eb" });
  });

  it("keeps every demo URL under /billetterie/demo/ and /en/tickets/demo/", () => {
    expect(demoPath("pre_opening", "fr")).toBe(
      "/billetterie/demo/avant-ouverture/",
    );
    expect(demoPath("eb", "fr")).toBe("/billetterie/demo/early-bird/");
    expect(demoPath("eb", "en")).toBe("/en/tickets/demo/early-bird/");
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
    expect(fill("{n} billets à {price}", { n: 3, price: "129 €" })).toBe(
      "3 billets à 129 €",
    );
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
      alfio: {
        ...decided.alfio,
        eventSlug: tbd("Slug de l'événement", "cnd-2027"),
      },
      tiers: decided.tiers.map((t, i) =>
        i === 0 ? { ...t, name: tbd("Nom public", t.name) } : t,
      ),
    } as unknown as TicketingConfig;
    expect(shippingProblems(config)).toEqual([
      { path: "alfio.eventSlug", note: "Slug de l'événement" },
      { path: "tiers.0.name", note: "Nom public" },
    ]);
  });

  it("lets an undecided value with no draft ship — its line is simply not rendered", () => {
    expect(
      shippingProblems({ ...decided, vatRate: tbd("Taux de TVA") }),
    ).toEqual([]);
  });

  it("still requires the two ticket names and the Strategy & Leadership price, even with no draft", () => {
    const config = {
      ...decided,
      standardName: tbd("Nom du billet"),
      strategic: { ...decided.strategic, name: tbd("Nom"), price: tbd("Prix") },
    };
    expect(shippingProblems(config)).toEqual([
      { path: "standardName", note: "Nom du billet" },
      { path: "strategic.name", note: "Nom" },
      { path: "strategic.price", note: "Prix" },
    ]);
  });

  it("lets the track page stay undecided — the link is simply not rendered", () => {
    const config = {
      ...decided,
      strategic: { ...decided.strategic, trackUrl: tbd("Page du parcours") },
    };
    expect(shippingProblems(config)).toEqual([]);
  });

  it("names every problem at once when it refuses", () => {
    const config = {
      ...decided,
      vatRate: tbd("Taux de TVA", "10 %"),
      strategic: { ...decided.strategic, price: tbd("Prix") },
    };
    expect(() => assertShippable(config)).toThrow(
      /vatRate — Taux de TVA[\s\S]*strategic\.price — Prix/,
    );
  });

  it("lists what still blocks a production build of the committed config", () => {
    expect(shippingProblems(TICKETING).map((p) => p.path)).toEqual([
      "standardName",
      "tierNames",
      "strategic.name",
      "strategic.price",
      "strategic.trackUrl",
      "contents",
      "eveningIncluded",
      "programmeAnnouncement",
    ]);
  });
});

describe("onHost", () => {
  it("recognises a URL on the alf.io host, and nothing else", () => {
    expect(
      onHost(
        "https://billetterie.cloudnativedays.fr/terms",
        "billetterie.cloudnativedays.fr",
      ),
    ).toBe(true);
    expect(
      onHost(
        "https://cloudnativedays.fr/cgv",
        "billetterie.cloudnativedays.fr",
      ),
    ).toBe(false);
    expect(onHost("#equipe", "billetterie.cloudnativedays.fr")).toBe(false);
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

describe("handOffOnce", () => {
  // Each hand-off of a real code creates an alf.io reservation that holds
  // tickets: a double-click must not open a second tab, and a second hold.
  it("lets the first hand-off through and ignores a repeat within the window", () => {
    let now = 1_000;
    const handOff = handOffOnce(3_000, () => now);
    expect(handOff()).toBe(true);
    now += 400;
    expect(handOff()).toBe(false);
    now += 2_500;
    expect(handOff()).toBe(false);
  });

  it("lets a deliberate new hand-off through once the window has passed", () => {
    let now = 0;
    const handOff = handOffOnce(3_000, () => now);
    expect(handOff()).toBe(true);
    now += 3_000;
    expect(handOff()).toBe(true);
  });
});
