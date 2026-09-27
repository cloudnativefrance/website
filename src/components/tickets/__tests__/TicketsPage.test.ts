// The whole demo — its 5 phases — rendered through the real page component,
// asserting the rules of the spec that a screenshot review would only catch by
// luck: no internal abbreviations, only the current tier's date, "Épuisé" on a
// past tier, every purchase sent to the alf.io listing and none before the
// opening, and group rates only when they beat the current price.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TicketsContent from "../TicketsContent.astro";
import { DEMO_PHASES } from "@/lib/tickets/demo";
import type { Phase } from "@/config/tickets";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

// The content, not the page: the layout needs a site origin the container does
// not provide, and the page wrapper is covered by the source checks below.
async function render(phase: Phase) {
  return container.renderToString(TicketsContent, {
    props: { lang: "fr", phase, demo: true },
  });
}

/** Visible text only: scripts, styles and tags stripped, entities left alone. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

/** The main page region, excluding the mobile bar rendered after it. */
function mainOf(html: string): string {
  const start = html.indexOf("<main");
  const end = html.indexOf("</main>");
  return html.slice(start, end);
}

/** A purchase link to the alf.io listing, as `PurchaseControl` writes it. */
const LISTING_LINK =
  /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr\/event\/cnd-2027"[^>]*data-umami-event="tickets-purchase"[^>]*>/g;

// As the ladder writes them: the box is narrow, so the month is abbreviated.
// The last tier is absent on purpose — it runs to the event day and shows no
// date of its own.
const TIER_END_DATES: Record<Exclude<Phase, "pre_opening" | "last_chance">, string> = {
  seb: "29 nov.",
  eb: "7 févr.",
  regular: "16 mai",
};

describe.each(DEMO_PHASES)("phase %s", (phase) => {
  let html: string;
  let main: string;
  let text: string;

  beforeAll(async () => {
    html = await render(phase);
    main = mainOf(html);
    text = visibleText(main);
  });

  // Regular and Last Chance are the only tiers a group rate applies to: the two
  // early ones cap an order at 5 seats, which is how their quota is protected.
  const selling = phase === "regular" || phase === "last_chance";

  it("never shows an internal tier abbreviation", () => {
    expect(text).not.toMatch(/\b(SEB|EB|LC)\b/);
  });

  it("shows the date of the current tier and of no other", () => {
    const current = phase === "pre_opening" ? "seb" : phase;
    for (const [tier, date] of Object.entries(TIER_END_DATES)) {
      if (tier === current) expect(text).toContain(date);
      else expect(text, `${tier}'s date leaked`).not.toContain(date);
    }
  });

  it("marks every past tier as sold out, with no action", () => {
    const pastItems = [...main.matchAll(/<li[^>]*data-tier-state="past"[\s\S]*?<\/li>/g)];
    const expectedPast = { pre_opening: 0, seb: 0, eb: 1, regular: 2, last_chance: 3 }[phase];
    expect(pastItems).toHaveLength(expectedPast);
    for (const [item] of pastItems) {
      expect(item).toContain("Épuisé");
      expect(item).not.toMatch(/<(a|button|input)\b/);
    }
    // One word for a closed tier, and only that one.
    expect(text).not.toContain("Terminé");
  });

  it("writes what ends the tier on offer inside its ladder box, not above it", () => {
    expect([...main.matchAll(/data-tier-deadline/g)]).toHaveLength(phase === "last_chance" ? 0 : 1);
    expect(text).not.toContain("dans la limite des places disponibles");
    expect(text).not.toContain("limité en nombre de places");
    expect(text).not.toContain("Vous payez par carte");
  });

  it("gives the tier on offer the one pink label that applies to it", () => {
    const early = phase === "pre_opening" || phase === "seb" || phase === "eb";
    expect(text.includes("Stock limité")).toBe(early);
    expect(text.includes("ou épuisement")).toBe(early);
    expect(text.includes("Dernières places")).toBe(phase === "last_chance");
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toContain("Dernières places");
  });

  it("states the price of each tier and nothing else — no step, no state word", () => {
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toMatch(/\+\s*\d+(\s|&nbsp;| | )*€/);
    for (const word of ["En cours", "À venir", "À l'ouverture"]) {
      expect(visibleText(ladder)).not.toContain(word);
    }
  });

  it("sends every purchase to the alf.io listing — door 1 and Strategy & Leadership — and none before the opening", () => {
    const purchases = [...main.matchAll(LISTING_LINK)];
    const notifies = [...main.matchAll(/data-umami-event="tickets-notify"/g)];
    if (phase === "pre_opening") {
      expect(purchases).toHaveLength(0);
      expect(notifies).toHaveLength(2);
    } else {
      expect(purchases).toHaveLength(2);
      expect(notifies).toHaveLength(0);
    }
    // Variant A is gone for good: no quantity is chosen on the site.
    expect(main).not.toContain("data-tickets-reserve");
    expect(main).not.toContain('name="qty"');
  });

  it("never links to an alf.io code URL", () => {
    expect(main).not.toMatch(/href="[^"]*\/code\//);
  });

  if (phase === "pre_opening") {
    it("offers the opening notification instead of any purchase", () => {
      expect(main).toContain('data-umami-event="tickets-notify"');
      expect(text).toContain("13 octobre");
      expect(main).not.toContain("data-tickets-code");
    });
  } else {
    it("keeps the code entry available", () => {
      expect(main).toContain("data-tickets-code");
    });
  }

  it("shows group rates only when they beat the current price and fit the order cap", () => {
    const shown = [...main.matchAll(/data-group-rate="([^"]+)"/g)].map((m) => m[1]);
    const unique = [...new Set(shown)].sort();
    expect(unique).toEqual(selling ? ["10_plus", "4_9"] : []);
  });

  it("opens door 2 only when it has something to sell, and door 3 only once codes work", () => {
    expect(main.includes('id="door-team-title"')).toBe(selling);
    expect(main.includes("data-tickets-code")).toBe(phase !== "pre_opening");
    expect(main).toContain(selling ? "lg:col-span-8" : "lg:col-span-12");
  });

  it("prices each group rate against the price of the moment, in the section's pink", () => {
    const tierPrice = { pre_opening: 129, seb: 129, eb: 159, regular: 199, last_chance: 229 }[phase];
    const rows = [...main.matchAll(/data-group-rate="([^"]+)"[\s\S]*?(?=<li|<\/ul>)/g)];
    expect(rows).toHaveLength(selling ? 2 : 0);
    for (const [row, id] of rows) {
      const price = { "4_9": 169, "10_plus": 149 }[id as "4_9" | "10_plus"];
      const percent = Math.floor(((tierPrice - price) / tierPrice) * 100);
      expect(row).toContain(`−${percent} %`);
      expect(row).toContain("bg-accent");
    }
  });

  it("lists the group rates without making them clickable, and asks for them by mail", () => {
    expect(main).not.toContain("data-group-apply");
    expect(main).not.toContain("data-team-or");
    expect(text).not.toContain("Contacter la billetterie");
    expect(text).not.toContain("Choisir ce tarif");
    expect(text.includes("Demander mon tarif de groupe")).toBe(selling);
  });

  it("leaves the manager kit as the whole bottom section, in every phase", () => {
    expect(main).toContain('id="convaincre"');
    expect(text).toContain("Un kit pour convaincre votre manager");
    expect(text).not.toContain("Chacun prend sa place");
    expect(text).not.toContain("Vous commandez en ligne");
  });

  it("always shows the Strategy & Leadership ticket, apart from the tiers", () => {
    expect(main).toContain('id="strategie-leadership"');
    expect(main).not.toMatch(/data-tier="strategi/);
    expect(main).not.toContain("data-strategic-state");
    expect(text).not.toContain("Mise en vente");
  });

  it("sends the Strategy & Leadership reader to the group rates only where they exist", () => {
    expect([...main.matchAll(/href="#equipe"/g)]).toHaveLength(selling ? 1 : 0);
    expect(main.includes('id="equipe"')).toBe(selling);
  });

  it("renders no placeholder: a draft reads as copy, an undecided line is absent", () => {
    expect(main).not.toContain("data-tbd");
    expect(main).not.toContain("tbd-chip");
    expect(text).not.toMatch(/à confirmer/i);
    // Undecided with no draft: the whole line is gone, its label included.
    for (const absent of ["Taux de TVA", "Conditions générales de vente", "Le détail de la soirée"]) {
      expect(text).not.toContain(absent);
    }
    // No label left pointing at nothing.
    expect(main).not.toMatch(/<(dd|dt)\b[^>]*>\s*<\/\1>/);
    // Drafts show as the copy they will become (Astro escapes `&` and `'`).
    expect(main).toMatch(/Stratégie (&amp;|&) Leadership/);
    expect(text).toContain("en mars 2027");
    expect(text).toContain("soirée comprise");
    // What is left is still the page, not a shell.
    expect(text).toContain("Je prends ma place");
    expect(text).toContain("Ce que comprend votre billet");
    expect(text).toContain("Questions fréquentes");
  });

  it("keeps the manager kit box, linked to its draft URL", () => {
    expect(text).toContain("Un kit pour convaincre votre manager");
    expect(main).toMatch(/<a\b[^>]*href="#convaincre"[^>]*data-umami-event="tickets-manager-kit"/);
  });

  it("lists only the Strategy & Leadership facts that have a value", () => {
    const start = main.indexOf('id="strategie-leadership"');
    const band = main.slice(start, main.indexOf("</section>", start));
    const terms = [...band.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => m[1]);
    // Only the networking area has a draft today; price, contents, programme
    // and access have no row until they are decided.
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatch(/Espace d(&#39;|')échange/);
  });

  it("carries no proof section and no inclusion footer — the FAQ answers that", () => {
    expect(text).not.toContain("2026, en vrai");
    expect(main).not.toContain('id="proof-title"');
    expect(text).not.toContain("Le prix ne doit empêcher personne");
    expect(text).toContain("Existe-t-il un tarif étudiant ou solidaire");
  });

  it("opens every hand-off to alf.io in a new tab, and says so to screen readers", () => {
    const alfioLinks = [
      ...main.matchAll(/<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr[^"]*"[^>]*>[\s\S]*?<\/a>/g),
    ].map((m) => m[0]);
    expect(alfioLinks).toHaveLength(phase === "pre_opening" ? 0 : 2);
    for (const link of alfioLinks) {
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener"');
    }
    // Every link that leaves in a new tab says so, the newsletter included.
    const newTab = [...main.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
    expect(newTab.length).toBeGreaterThan(0);
    for (const link of newTab) expect(link).toContain("(nouvel onglet)");
    // The code form too, with or without JavaScript.
    const codeForm = main.match(/<form\b[^>]*data-tickets-code[^>]*>/)?.[0];
    if (phase === "pre_opening") {
      expect(codeForm).toBeUndefined();
    } else {
      expect(codeForm).toContain('target="_blank"');
      const form = main.slice(main.indexOf(codeForm!), main.indexOf("</form>", main.indexOf(codeForm!)));
      expect(form).toContain("(nouvel onglet)");
    }
    // And the mobile bar, rendered after <main>.
    const sticky = html.match(/<a\b[^>]*data-sticky-action[^>]*>[\s\S]*?<\/a>/)?.[0];
    expect(sticky).toContain('target="_blank"');
    expect(sticky).toContain("(nouvel onglet)");
  });

  it("stripes the mobile bar as a demo", () => {
    expect(html).toContain("demo-stripe");
  });
});

describe("the page wrapper", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../TicketsPage.astro"), "utf-8");

  it("forces noindex whenever it renders a demo", () => {
    expect(source).toMatch(/noindex=\{Boolean\(demo\)\}/);
  });

  it("renders the demo switcher only on demo routes", () => {
    expect(source).toMatch(/\{demo && \(\s*<DemoBar/);
  });
});
