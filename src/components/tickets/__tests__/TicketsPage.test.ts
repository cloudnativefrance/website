// The page in each of its 4 selling phases, rendered through the real
// component, asserting the rules of the spec that a screenshot review would
// only catch by luck: no internal abbreviations, only the current tier's date,
// "Épuisé" on a past tier, every purchase sent to the alf.io listing, group
// rates only when they beat the current price, and the Strategy & Leadership
// ticket beside the standard one with no timeline of its own. Before the opening /billetterie
// is the "coming soon" page, checked at the end.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import TicketsContent from "../TicketsContent.astro";
import TicketsComingSoon from "../TicketsComingSoon.astro";
import { TICKETING, type TierId } from "@/config/tickets";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

// The content, not the page: the layout needs a site origin the container does
// not provide, and the page wrapper is covered by the source checks below.
async function render(phase: TierId) {
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

// The standard card writes the month in full under the price; the ladder
// shows no date at all since 27/09/2026 (the short form is how it used to).
// The last tier is absent on purpose — it runs to the event day and shows no
// date of its own.
const TIER_END_DATES: Record<
  Exclude<TierId, "last_chance">,
  { door: string; ladder: string }
> = {
  seb: { door: "29 novembre", ladder: "29 nov." },
  eb: { door: "7 février", ladder: "7 févr." },
  regular: { door: "16 mai", ladder: "16 mai" },
};

const SELLING_PHASES: TierId[] = TICKETING.tiers.map((t) => t.id);

describe.each(SELLING_PHASES)("phase %s", (phase) => {
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

  it("shows the date of the current tier and of no other, and not in the ladder", () => {
    const start = main.indexOf("data-tier-ladder");
    const ladder = visibleText(main.slice(start, main.indexOf("</ol>", start)));
    for (const [tier, { door, ladder: short }] of Object.entries(
      TIER_END_DATES,
    )) {
      if (tier === phase) expect(text).toContain(door);
      else expect(text, `${tier}'s date leaked`).not.toContain(door);
      expect(ladder, "the ladder repeats a date").not.toContain(short);
      expect(ladder, "the ladder repeats a date").not.toContain(door);
    }
  });

  it("marks every past tier as sold out, with no action", () => {
    const pastItems = [
      ...main.matchAll(/<li[^>]*data-tier-state="past"[\s\S]*?<\/li>/g),
    ];
    const expectedPast = { seb: 0, eb: 1, regular: 2, last_chance: 3 }[phase];
    expect(pastItems).toHaveLength(expectedPast);
    for (const [item] of pastItems) {
      expect(item).toContain("Épuisé");
      expect(item).not.toMatch(/<(a|button|input)\b/);
    }
    // One word for a closed tier, and only that one.
    expect(text).not.toContain("Terminé");
  });

  it("writes what ends the tier on offer under the big price, and nowhere else", () => {
    const expected = phase === "last_chance" ? 0 : 1;
    expect([...main.matchAll(/data-offer-deadline/g)]).toHaveLength(expected);
    // The ladder sits in the same card, a few lines down: it does not repeat it.
    expect(main).not.toContain("data-tier-deadline");
    if (expected) {
      const door = main.match(/<p\b[^>]*data-offer-deadline[\s\S]*?<\/p>/)![0];
      expect(visibleText(door)).toContain(
        TIER_END_DATES[phase as keyof typeof TIER_END_DATES].door,
      );
    }
    expect(text).not.toContain("dans la limite des places disponibles");
    expect(text).not.toContain("limité en nombre de places");
    expect(text).not.toContain("Vous payez par carte");
  });

  it("gives the tier on offer its pink label by the name, and only there", () => {
    const early = phase === "seb" || phase === "eb";
    const pill = main
      .match(/<span\b[^>]*data-offer-pill[^>]*>([\s\S]*?)<\/span>/)?.[1]
      .trim();
    expect(pill).toBe(
      early
        ? "Places limitées"
        : phase === "last_chance"
          ? "Dernières places"
          : undefined,
    );
    const ladder = main.slice(
      main.indexOf("data-tier-ladder"),
      main.indexOf("</ol>", main.indexOf("data-tier-ladder")),
    );
    expect(visibleText(ladder)).not.toContain("Places limitées");
    expect(ladder).not.toContain("Dernières places");
    expect(text.includes("ou épuisement")).toBe(early);
  });

  it("states the price of each tier and nothing else — no step, no state word", () => {
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toMatch(/\+\s*\d+(\s|&nbsp;| | )*€/);
    for (const word of ["En cours", "À venir", "À l'ouverture"]) {
      expect(visibleText(ladder)).not.toContain(word);
    }
  });

  it("sends every purchase to the alf.io listing — both tickets of door 1", () => {
    expect([...main.matchAll(LISTING_LINK)]).toHaveLength(2);
    expect(main).not.toContain("tickets-notify");
    // Variant A is gone for good: no quantity is chosen on the site.
    expect(main).not.toContain("data-tickets-reserve");
    expect(main).not.toContain('name="qty"');
  });

  it("never links to an alf.io code URL", () => {
    expect(main).not.toMatch(/href="[^"]*\/code\//);
  });

  it("keeps the code entry available", () => {
    expect(main).toContain("data-tickets-code");
  });

  it("shows group rates only when they beat the current price and fit the order cap", () => {
    const shown = [...main.matchAll(/data-group-rate="([^"]+)"/g)].map(
      (m) => m[1],
    );
    const unique = [...new Set(shown)].sort();
    expect(unique).toEqual(selling ? ["10_plus", "4_9"] : []);
  });

  it("opens door 2 only when it has something to sell, beside the standard ticket", () => {
    expect(main.includes('id="door-team-title"')).toBe(selling);
    // The standard card takes the whole row when door 2 is absent.
    const span = main.match(
      /<div class="flex flex-col lg:col-span-(\d+)"[^>]*>\s*<article\b[^>]*id="offre"/,
    )?.[1];
    expect(span).toBe(selling ? "8" : "12");
    if (selling) {
      // Door 2 is the row's other card: right after the standard one.
      const afterOffer = main.slice(
        main.indexOf("</article>", main.indexOf('id="offre"')),
      );
      expect(afterOffer.match(/<article\b[^>]*id="([^"]+)"/)?.[1]).toBe(
        "equipe",
      );
    }
  });

  it("prices each group rate against the price of the moment, the discount tagged in pink", () => {
    const tierPrice = { seb: 129, eb: 159, regular: 199, last_chance: 229 }[
      phase
    ];
    const rows = [
      ...main.matchAll(/<div\b[^>]*data-group-rate="([^"]+)"[\s\S]*?<\/div>/g),
    ];
    expect(rows).toHaveLength(selling ? 2 : 0);
    for (const [row, id] of rows) {
      const price = { "4_9": 169, "10_plus": 149 }[id as "4_9" | "10_plus"];
      const percent = Math.floor(((tierPrice - price) / tierPrice) * 100);
      const tag = row.match(
        /<dd\b[^>]*data-group-discount[^>]*>([\s\S]*?)<\/dd>/,
      );
      expect(tag?.[1].trim()).toBe(`−${percent} %`);
      expect(tag?.[0]).toContain("bg-accent");
      // Information, not options: nothing in a row looks or acts like a control,
      // and the row itself carries no box.
      expect(row).not.toMatch(/<(a|button|input|label)\b/);
      expect(row).not.toMatch(/hover:|cursor-pointer/);
      expect(row.match(/<div\b[^>]*>/)![0]).not.toMatch(/border|rounded|bg-/);
    }
    if (selling) {
      const list = main.match(
        /<dl\b[^>]*>(?=\s*<div\b[^>]*data-group-rate)/,
      )![0];
      expect(list).not.toMatch(/rounded|bg-/);
      // The prices share one column, so they start on the same line whatever
      // the width of the tag after them.
      expect(list).toContain("grid-cols-[1fr_auto_auto]");
      for (const [row] of rows)
        expect(row.match(/<div\b[^>]*>/)![0]).toContain("grid-cols-subgrid");
    }
  });

  it("lists the group rates without making them clickable, and asks for them by mail", () => {
    expect(main).not.toContain("data-group-apply");
    expect(main).not.toContain("data-team-or");
    expect(text).not.toContain("Contacter la billetterie");
    expect(text).not.toContain("Choisir ce tarif");
    expect(text.includes("Demander mon tarif de groupe")).toBe(selling);
    // Door 1 sells two tickets: the rates name the one they apply to.
    expect(text.includes("Billet standard, par place")).toBe(selling);
  });

  it("has no manager section and no second price list down the page", () => {
    expect(main).not.toContain('id="convaincre"');
    expect(text).not.toMatch(/convaincre votre manager/i);
    expect(text).not.toContain("Chacun prend sa place");
    expect(text).not.toContain("Vous commandez en ligne");
  });

  it("sells two tickets, each in its own card and named by its heading, the standard one first", () => {
    const names = [
      ...main.matchAll(
        /<h2\b[^>]*data-ticket-name="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g,
      ),
    ];
    expect(names.map((m) => [m[1], m[2].trim()])).toEqual([
      ["standard", "Billet standard"],
      ["strategic", "Billet Stratégie &amp; Leadership"],
    ]);
    // No door title above them any more, and no purple band.
    expect(text).not.toContain("Je prends ma place");
    expect(main).not.toContain("bg-chart-5");
    // Two cards: the Stratégie & Leadership one is not inside the standard one.
    const offer = main.slice(
      main.indexOf('id="offre"'),
      main.indexOf("</article>", main.indexOf('id="offre"')),
    );
    expect(offer).not.toContain("data-strategic-ticket");
    expect(offer).toContain("data-tier-ladder");
  });

  it("orders the ways in: standard, the team rates, Stratégie & Leadership, then the code band", () => {
    const at = (marker: string) => main.indexOf(marker);
    expect(at('id="offre"')).toBeGreaterThan(-1);
    if (selling) expect(at('id="equipe"')).toBeGreaterThan(at('id="offre"'));
    expect(at('id="strategie-leadership"')).toBeGreaterThan(
      Math.max(at('id="offre"'), at('id="equipe"')),
    );
    expect(at("data-tickets-code")).toBeGreaterThan(
      at('id="strategie-leadership"'),
    );
  });

  it("gives the Strategy & Leadership ticket one price, no timeline, and says what it adds", () => {
    const start = main.indexOf('id="strategie-leadership"');
    const ticket = main.slice(start, main.indexOf("</article>", start));
    expect(ticket).toContain('data-strategic-price="299"');
    expect(ticket).not.toMatch(/data-tier|data-offer-pill|data-offer-deadline/);
    expect(visibleText(ticket)).not.toMatch(
      /Places limitées|Dernières places|Épuisé/,
    );
    expect(visibleText(ticket)).toContain(
      "Tout ce que comprend le billet standard, avec en plus un accès prioritaire",
    );
    expect(ticket).toMatch(/<a\b[^>]*href="\/track-strategie-leadership"/);
    // The page's own action, and the very same button as the standard ticket's.
    const buy = ticket.match(LISTING_LINK);
    expect(buy).toHaveLength(1);
    expect(buy![0]).toContain('data-umami-event-billet="strategique"');
    const standardBuy = main
      .slice(main.indexOf('id="offre"'))
      .match(LISTING_LINK)![0];
    const classOf = (tag: string) => tag.match(/class="([^"]+)"/)![1];
    expect(classOf(buy![0])).toBe(classOf(standardBuy));
  });

  it("draws both tickets alike, but for the standard card's shadow", () => {
    const card = (id: string) =>
      main.match(new RegExp(`<article\\b[^>]*id="${id}"[^>]*>`))![0];
    const [standard, strategic] = [card("offre"), card("strategie-leadership")];
    for (const tag of [standard, strategic])
      expect(tag).toContain("border-primary/35");
    expect(standard).toContain("shadow-[");
    expect(strategic).not.toContain("shadow-[");
    // Same monumental price scale on both.
    const scale = "text-[clamp(3.5rem,11vw,5.5rem)]";
    const start = main.indexOf('id="strategie-leadership"');
    expect(main.slice(main.indexOf('id="offre"'), start)).toContain(scale);
    expect(main.slice(start, main.indexOf("</article>", start))).toContain(
      scale,
    );
  });

  it("answers in the FAQ that the track is open to every ticket", () => {
    expect(text).toMatch(
      /Le parcours Stratégie (&amp;|&) Leadership est-il réservé au billet Stratégie (&amp;|&) Leadership/,
    );
    expect(text).toContain("ses talks sont ouverts à tous les participant(e)s");
  });

  it("names the standard ticket and its tier in the mobile bar", () => {
    const bar = html.slice(html.indexOf("data-sticky-bar"));
    const tier = TICKETING.tiers.find((t) => t.id === phase)!.name.fr;
    expect(visibleText(bar)).toContain(`Standard · ${tier}`);
  });

  it("renders no placeholder: a draft reads as copy, an undecided line is absent", () => {
    expect(main).not.toContain("data-tbd");
    expect(main).not.toContain("tbd-chip");
    expect(text).not.toMatch(/à confirmer/i);
    // Undecided with no draft: the whole line is gone, its label included.
    for (const absent of [
      "Taux de TVA",
      "Conditions générales de vente",
      "Le détail de la soirée",
    ]) {
      expect(text).not.toContain(absent);
    }
    // No label left pointing at nothing.
    expect(main).not.toMatch(/<(dd|dt)\b[^>]*>\s*<\/\1>/);
    // Drafts show as the copy they will become (Astro escapes `&` and `'`).
    expect(main).toMatch(/Stratégie (&amp;|&) Leadership/);
    expect(text).toContain("Billet standard");
    expect(text).toMatch(/Billet Stratégie (&amp;|&) Leadership/);
    expect(text).toContain("en mars 2027");
    expect(text).toContain("la soirée est comprise");
    // What is left is still the page, not a shell.
    expect(text).toContain("Ce que comprend votre billet");
    expect(text).toContain("Questions fréquentes");
  });

  it("carries no proof section and no inclusion footer — the FAQ answers that", () => {
    expect(text).not.toContain("2026, en vrai");
    expect(main).not.toContain('id="proof-title"');
    expect(text).not.toContain("Le prix ne doit empêcher personne");
    expect(text).toContain("Existe-t-il un tarif étudiant ou solidaire");
  });

  it("opens every hand-off to alf.io in a new tab, and says so to screen readers", () => {
    const alfioLinks = [
      ...main.matchAll(
        /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr[^"]*"[^>]*>[\s\S]*?<\/a>/g,
      ),
    ].map((m) => m[0]);
    expect(alfioLinks).toHaveLength(2);
    for (const link of alfioLinks) {
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener"');
    }
    // Every link that leaves in a new tab says so.
    const newTab = [
      ...main.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g),
    ].map((m) => m[0]);
    expect(newTab.length).toBeGreaterThan(0);
    for (const link of newTab) expect(link).toContain("(nouvel onglet)");
    // The code form too, with or without JavaScript.
    const codeForm = main.match(/<form\b[^>]*data-tickets-code[^>]*>/)![0];
    expect(codeForm).toContain('target="_blank"');
    const form = main.slice(
      main.indexOf(codeForm),
      main.indexOf("</form>", main.indexOf(codeForm)),
    );
    expect(form).toContain("(nouvel onglet)");
    // And the mobile bar, rendered after <main>.
    const sticky = html.match(
      /<a\b[^>]*data-sticky-action[^>]*>[\s\S]*?<\/a>/,
    )?.[0];
    expect(sticky).toContain('target="_blank"');
    expect(sticky).toContain("(nouvel onglet)");
  });

  it("stripes the mobile bar as a demo", () => {
    expect(html).toContain("data-demo-stripe");
  });
});

describe("the coming-soon page", () => {
  it("announces the ticketing and sells nothing — no price, no tier, no alf.io", async () => {
    for (const lang of ["fr", "en"] as const) {
      const html = await container.renderToString(TicketsComingSoon, {
        props: { lang },
      });
      expect(html).toContain("data-tickets-coming-soon");
      expect(html).toContain(
        lang === "fr"
          ? "La billetterie sera bientôt ouverte"
          : "Tickets opening soon",
      );
      expect(html).not.toContain("billetterie.cloudnativedays.fr");
      expect(html).not.toMatch(/\d\s*€|€\s*\d/);
    }
  });
});

describe("the page wrapper", () => {
  const source = readFileSync(
    resolve(import.meta.dirname, "../TicketsPage.astro"),
    "utf-8",
  );

  it("serves the coming-soon page before the opening and the ticketing page after", () => {
    expect(source).toMatch(
      /phase === "pre_opening" \?[\s\S]*<TicketsComingSoon[\s\S]*:[\s\S]*<TicketsContent/,
    );
  });

  it("forces noindex on a simulated phase only — /billetterie must stay indexable", () => {
    const layouts = [...source.matchAll(/<Layout\b[^>]*>/g)].map((m) => m[0]);
    expect(layouts).toHaveLength(2);
    for (const layout of layouts)
      expect(layout).toContain("noindex={simulated}");
  });

  it("renders the demo switcher only when the demo is on", () => {
    expect(source).toMatch(/const switcher = ticketDemosEnabled\(\);/);
    // Whitespace-tolerant: Prettier decides how these expressions wrap.
    expect([
      ...source.matchAll(/\{\s*switcher\s*&&\s*\(?\s*<DemoBar/g),
    ]).toHaveLength(2);
  });

  it("loads the ticketing script only on a selling phase — never on the coming-soon page", () => {
    const scripts = [...source.matchAll(/<script\b/g)];
    expect(scripts).toHaveLength(1);
    expect(source).toMatch(
      /\{\s*phase !== "pre_opening"\s*&&\s*\(?\s*<script>\s*import "\.\/tickets-ui\.ts";/,
    );
  });
});

// Astro bundles a component's <style> into every page that merely imports it,
// and src/i18n/ui.ts is bundled into the home page's islands: either path would
// carry the demo to production even though the switcher is never rendered there.
describe("the demo stays out of what production ships", () => {
  const dir = resolve(import.meta.dirname, "..");
  const read = (path: string) => readFileSync(resolve(dir, path), "utf-8");
  const blocks = (source: string, tag: "style" | "script") =>
    [
      ...source.matchAll(
        new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, "g"),
      ),
    ].map((m) => ({
      attrs: m[1],
      body: m[2],
    }));

  it("keeps the demo copy out of the shared dictionary", () => {
    expect(readFileSync(resolve(dir, "../../i18n/ui.ts"), "utf-8")).not.toMatch(
      /tickets\.demo/,
    );
  });

  it("emits the switcher's styles only where it renders", () => {
    const styles = blocks(read("DemoBar.astro"), "style");
    expect(styles.length).toBeGreaterThan(0);
    for (const style of styles) expect(style.attrs).toContain("is:inline");
  });

  it("names the demo in no shared style or script", () => {
    const shared = [
      "tickets-ui.ts",
      ...readdirSync(dir).filter(
        (f) => f.endsWith(".astro") && f !== "DemoBar.astro",
      ),
    ];
    for (const file of shared) {
      const source = read(file);
      const code = file.endsWith(".ts")
        ? [source]
        : [...blocks(source, "style"), ...blocks(source, "script")].map(
            (b) => b.body,
          );
      for (const body of code) expect(body, file).not.toMatch(/demo/i);
    }
  });
});

describe("the routes", () => {
  const read = (path: string) =>
    readFileSync(resolve(import.meta.dirname, "../../../pages", path), "utf-8");

  it("mount the page in the config's phase at /billetterie and /en/tickets", () => {
    expect(read("billetterie.astro")).toMatch(
      /<TicketsPage lang="fr" phase=\{TICKETING\.currentPhase\} \/>/,
    );
    expect(read("en/tickets.astro")).toMatch(
      /<TicketsPage lang="en" phase=\{TICKETING\.currentPhase\} \/>/,
    );
  });

  it("emit the demo phases only when the demo is enabled, in both languages", () => {
    for (const path of [
      "billetterie/demo/[phase].astro",
      "en/tickets/demo/[phase].astro",
    ]) {
      const source = read(path);
      expect(source).toMatch(
        /return ticketDemosEnabled\(\) \? demoStaticPaths\(\) : \[\];/,
      );
      expect(source).toMatch(
        /<TicketsPage lang="(fr|en)" phase=\{phase\} simulated \/>/,
      );
    }
  });
});
