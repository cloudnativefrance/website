// The whole demo matrix — 2 variants × 5 phases × 3 Strategy & Leadership
// states — rendered through the real page component, asserting the rules of
// the spec that a screenshot review would only catch by luck: no internal
// abbreviations, only the current tier's date, the true reason on a past tier,
// the purchase action each variant is allowed, no purchase before opening, and
// group rates only when they beat the current price.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TicketsContent from "../TicketsContent.astro";
import { DEMO_PHASES, DEMO_STRATEGIC_STATES } from "@/lib/tickets/demo";
import type { Phase, StrategicState } from "@/config/tickets";
import type { Variant } from "@/lib/tickets/purchase";

const rex = { sessions: 17, organisations: ["SNCF", "Mistral AI"] };
let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

// The content, not the page: the layout needs a site origin the container does
// not provide, and the page wrapper is covered by the source checks below.
async function render(variant: Variant, phase: Phase, strategicState: StrategicState) {
  return container.renderToString(TicketsContent, {
    props: { lang: "fr", variant, phase, strategicState, rex, demo: true },
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

/**
 * The page as the demo's "hide the placeholders" switch shows it: the CSS drops
 * every `.tbd-chip`, and every `[data-tbd-only]` line the chip was the whole
 * point of. Applied here the same way, so a test can read what is left.
 */
function withoutPlaceholders(html: string): string {
  let out = html;
  for (const pattern of [/<span\b[^>]*\bclass="tbd-chip/, /<(\w+)\b[^>]*\bdata-tbd-only\b/]) {
    for (let guard = 0; guard < 200; guard += 1) {
      const match = pattern.exec(out);
      if (!match) break;
      const tag = match[1] ?? "span";
      out = out.slice(0, match.index) + out.slice(endOfElement(out, match.index, tag));
    }
  }
  return out;
}

/** Index just past the element opening at `start`, counting nested `<tag>`s. */
function endOfElement(html: string, start: number, tag: string): number {
  const scan = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  scan.lastIndex = start;
  let depth = 0;
  for (let m = scan.exec(html); m; m = scan.exec(html)) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return scan.lastIndex;
  }
  throw new Error(`unbalanced <${tag}> from ${start}`);
}

/** The main page region, excluding the demo switcher (which names phases). */
function mainOf(html: string): string {
  const start = html.indexOf("<main");
  const end = html.indexOf("</main>");
  return html.slice(start, end);
}

// As the ladder writes them: the box is narrow, so the month is abbreviated.
// The last tier is absent on purpose — it runs to the event day and shows no
// date of its own.
const TIER_END_DATES: Record<Exclude<Phase, "pre_opening" | "last_chance">, string> = {
  seb: "29 nov.",
  eb: "7 févr.",
  regular: "16 mai",
};

const cases = DEMO_PHASES.flatMap((phase) =>
  (["a", "b"] as const).flatMap((variant) => DEMO_STRATEGIC_STATES.map((sl) => [variant, phase, sl] as const)),
);

describe.each(cases)("variant %s · %s · S&L %s", (variant, phase, strategicState) => {
  let html: string;
  let main: string;
  let text: string;

  beforeAll(async () => {
    html = await render(variant, phase, strategicState);
    main = mainOf(html);
    text = visibleText(main);
  });

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
    // One box carries it — the tier on offer — and only when there is
    // something to put in it: the last tier has neither date nor pill.
    expect([...main.matchAll(/data-tier-deadline/g)]).toHaveLength(phase === "last_chance" ? 0 : 1);
    // It used to be a sentence under the monumental price. Nothing is left
    // there now — no rule, no explanation, no hand-off steps.
    expect(text).not.toContain("dans la limite des places disponibles");
    expect(text).not.toContain("limité en nombre de places");
    expect(text).not.toContain("Vous payez par carte");
  });

  it("gives the tier on offer the one pink label that applies to it", () => {
    // A tier that can sell out says so in its ladder box, next to the date
    // that is not its only end. The last tier has no date to sit beside, so
    // its pink goes up beside the price. Regular, which runs to its date with
    // no quota of its own, wears neither.
    const early = phase === "pre_opening" || phase === "seb" || phase === "eb";
    expect(text.includes("Stock limité")).toBe(early);
    expect(text.includes("ou épuisement")).toBe(early);
    expect(text.includes("Dernières places")).toBe(phase === "last_chance");
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toContain("Dernières places");
  });

  it("states the price of each tier and nothing else — no step, no state word", () => {
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toMatch(/\+\s*\d+(\s|&nbsp;| | )*€/);
    for (const word of ["En cours", "À venir", "À l'ouverture"]) {
      expect(visibleText(ladder)).not.toContain(word);
    }
  });

  it("offers only the purchase action the variant allows", () => {
    const reserveForms = [...main.matchAll(/<form[^>]*data-tickets-reserve[^>]*>/g)];
    const listingLinks = [...main.matchAll(/href="https:\/\/billetterie\.cloudnativedays\.fr\/event\/cnd-2027"[^>]*data-umami-event="tickets-purchase"/g)];
    const strategicSells = strategicState === "on_sale";
    const expected = phase === "pre_opening" ? 0 : strategicSells ? 2 : 1;
    if (variant === "a") {
      expect(reserveForms).toHaveLength(expected);
      expect(listingLinks).toHaveLength(0);
    } else {
      expect(reserveForms).toHaveLength(0);
      expect(main).not.toContain('name="qty"');
      expect(listingLinks).toHaveLength(expected);
    }
  });

  it("never exposes the reservation link as an href", () => {
    expect(main).not.toMatch(/href="[^"]*\/code\/DEMO-/);
  });

  if (variant === "a" && phase !== "pre_opening") {
    it("bounds the stepper by the tier's order cap and posts to its category", () => {
      const max = phase === "seb" || phase === "eb" ? 5 : 20;
      expect(main).toMatch(new RegExp(`<form[^>]*action="https://billetterie\\.cloudnativedays\\.fr/event/cnd-2027/code/DEMO-[A-Z-]+"[^>]*data-max="${max}"`));
      expect(main).toMatch(new RegExp(`id="offer-qty"[^>]*max="${max}"|max="${max}"[^>]*id="offer-qty"`));
    });
  }

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

  // Regular and Last Chance are the only tiers a group rate applies to: the two
  // early ones cap an order at 5 seats, which is how their quota is protected.
  const selling = phase === "regular" || phase === "last_chance";

  it("shows group rates only when they beat the current price and fit the order cap", () => {
    const shown = [...main.matchAll(/data-group-rate="([^"]+)"/g)].map((m) => m[1]);
    const unique = [...new Set(shown)].sort();
    expect(unique).toEqual(selling ? ["10_plus", "4_9"] : []);
  });

  it("opens door 2 only when it has something to sell, and door 3 only once codes work", () => {
    expect(main.includes('id="door-team-title"')).toBe(selling);
    expect(main.includes("data-tickets-code")).toBe(phase !== "pre_opening");
    // With no door 2, door 1 takes the whole grid rather than leaving a hollow
    // right column, and the code entry becomes a band under it.
    expect(main).toContain(selling ? "lg:col-span-8" : "lg:col-span-12");
  });

  it("prices each group rate against the price of the moment, in the section's pink", () => {
    const tierPrice = { pre_opening: 129, seb: 129, eb: 159, regular: 199, last_chance: 229 }[phase];
    const rows = [...main.matchAll(/data-group-rate="([^"]+)"[\s\S]*?(?=<li|<\/ul>)/g)];
    // Door 2 and nowhere else: the rates are stated once on the page.
    expect(rows).toHaveLength(selling ? 2 : 0);
    for (const [row, id] of rows) {
      const price = { "4_9": 169, "10_plus": 149 }[id as "4_9" | "10_plus"];
      const percent = Math.floor(((tierPrice - price) / tierPrice) * 100);
      // On the raw row: `visibleText` would collapse the narrow no-break space.
      expect(row).toContain(`−${percent}\u202f%`);
      expect(row).toContain("bg-accent");
    }
  });

  it("makes a group rate a one-click quantity in variant A, and an ask in variant B", () => {
    const shortcuts = [...main.matchAll(/data-group-apply="([^"]+)"[^>]*data-qty="(\d+)"/g)];
    if (variant === "a" && selling) {
      expect(shortcuts.map((m) => [m[1], m[2]])).toEqual([
        ["4_9", "4"],
        ["10_plus", "10"],
      ]);
      // Two ways of buying for a team, drawn as two: the rates, an "ou" rule,
      // then the path for what the site cannot do.
      expect(main).toContain("data-team-or");
      expect(text).toContain("Contacter la billetterie");
      expect(text).not.toContain("Demander mon tarif de groupe");
    } else {
      expect(shortcuts).toHaveLength(0);
      // No online group purchase in variant B: no fork to draw.
      expect(main).not.toContain("data-team-or");
      expect(text).not.toContain("Contacter la billetterie");
      expect(text.includes("Demander mon tarif de groupe")).toBe(selling);
    }
    // Both said out loud what the buttons already do.
    expect(text).not.toContain("La réduction s'applique automatiquement");
    expect(text).not.toContain("accordés par l'équipe billetterie");
  });

  it("leaves the manager kit as the whole bottom section, in every phase", () => {
    expect(main).toContain('id="convaincre"');
    expect(text).toContain("Un kit pour convaincre votre manager");
    // What used to sit down there repeated door 2 or said nothing the rest of
    // the page did not: the rates, the two ways to order, "everyone books
    // their own seat".
    expect(text).not.toContain("Chacun prend sa place");
    expect(text).not.toContain("Vous commandez en ligne");
    expect(main).not.toContain('data-umami-event-source="team-section"');
  });

  it("sends the Strategy & Leadership reader to the group rates only where they exist", () => {
    const links = [...main.matchAll(/href="#equipe"/g)];
    expect(links).toHaveLength(selling && strategicState !== "hidden" ? 1 : 0);
    expect(main.includes('id="equipe"')).toBe(selling);
  });

  it("renders the Strategy & Leadership ticket in its state, apart from the tiers", () => {
    if (strategicState === "hidden") {
      expect(main).not.toContain('id="strategie-leadership"');
    } else {
      expect(main).toContain(`data-strategic-state="${strategicState}"`);
      expect(main).not.toMatch(/data-tier="strategi/);
    }
  });

  it("marks every placeholder as such", () => {
    expect(main).toContain('class="tbd-chip');
    expect(text).toContain("À confirmer");
  });

  it("still reads as finished copy once the demo hides the placeholders", () => {
    const left = visibleText(withoutPlaceholders(main));
    // Every chip must sit beside copy that stands on its own. These labels are
    // the ones that do not — they exist only to introduce a chip — so their
    // whole line carries `data-tbd-only` and goes with it.
    for (const dangling of ["Taux de TVA", "Conditions générales de vente", "Le détail de la soirée"]) {
      expect(left).not.toContain(dangling);
    }
    expect(left).not.toContain("À confirmer");
    expect(left).not.toContain("à confirmer");
    // No label left pointing at a value that just went away — a Strategy &
    // Leadership fact whose value is only a placeholder drops its whole row.
    expect(withoutPlaceholders(main)).not.toMatch(/<(dd|dt)\b[^>]*>\s*<\/\1>/);
    // What is left is still the page, not a shell.
    expect(left).toContain("Je prends ma place");
    expect(left).toContain("Ce que comprend votre billet");
    expect(left).toContain("Questions fréquentes");
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
