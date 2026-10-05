// The page in each selling phase, through the real component: the hard rules
// of the ticketing spec (see the billetterie-2027 skill), never its wording.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import TicketsContent from "../TicketsContent.astro";
import TicketsComingSoon from "../TicketsComingSoon.astro";
import { TICKETING } from "@/config/tickets";
import { ui } from "@/i18n/ui";
import { formatDayMonth } from "@/lib/tickets/format";
import { cheaperGroupRates } from "@/lib/tickets/phase";

const alfioHost = new URL(TICKETING.listingUrl).host;

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

describe.each(TICKETING.tiers)("phase $id", (tier) => {
  let html: string;
  let main: string;
  let text: string;

  beforeAll(async () => {
    html = await container.renderToString(TicketsContent, {
      props: { lang: "fr", phase: tier.id, demo: true },
    });
    main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    text = visibleText(main);
  });

  it("shows no internal tier abbreviation", () => {
    expect(text).not.toMatch(/\b(SEB|EB|LC)\b/);
  });

  it("dates the current tier only", () => {
    // The last tier runs to the event day, whose date the page shows anyway.
    for (const other of TICKETING.tiers.slice(0, -1)) {
      const date = formatDayMonth(other.endsAt, "fr");
      expect(text.includes(date), other.id).toBe(other.id === tier.id);
    }
  });

  it("sends both tickets to the alf.io listing, and never to a code URL", () => {
    expect(main.split(`href="${TICKETING.listingUrl}"`)).toHaveLength(3);
    expect(main).not.toMatch(/href="[^"]*\/code\//);
  });

  it("lists the group rates only when they beat the price of the moment", () => {
    const rates = [
      ...new Set(
        [...main.matchAll(/data-group-rate="([^"]+)"/g)].map((m) => m[1]),
      ),
    ];
    expect(rates).toEqual(cheaperGroupRates(TICKETING, tier).map((r) => r.id));
    expect(main.includes('id="equipe"')).toBe(rates.length > 0);
  });

  it("gives the Stratégie & Leadership ticket one price, with no tier, date or pill", () => {
    const start = main.indexOf('id="strategie-leadership"');
    const card = main.slice(start, main.indexOf("</article>", start));
    expect(card).toContain(`data-price="${TICKETING.strategic.price}"`);
    expect(card).not.toMatch(/data-tier|data-offer-pill|data-offer-deadline/);
  });

  it("opens every hand-off to alf.io in a new tab, and says so to screen readers", () => {
    const newTab = ui.fr["tickets.new_tab"];
    const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(
      (m) => m[0],
    );
    const handOffs = links.filter((a) => a.includes(alfioHost));
    expect(handOffs.length).toBeGreaterThan(0);
    for (const a of handOffs)
      expect(a).toMatch(/target="_blank"[^>]*rel="noopener"/);
    for (const a of links.filter((l) => l.includes('target="_blank"')))
      expect(a).toContain(newTab);
    const form = main.match(
      /<form\b[^>]*data-tickets-code[\s\S]*?<\/form>/,
    )![0];
    expect(form).toContain('target="_blank"');
    expect(form).toContain(newTab);
  });
});

describe("the coming-soon page", () => {
  it("sells nothing: no price, no link to alf.io", async () => {
    for (const lang of ["fr", "en"] as const) {
      const html = await container.renderToString(TicketsComingSoon, {
        props: { lang },
      });
      expect(html).not.toContain(alfioHost);
      expect(html).not.toMatch(/\d\s*€|€\s*\d/);
    }
  });
});

// Source checks: the demo routes, the switcher and the noindex need a build to
// render, and a production build with the demo on is refused anyway.
describe("the demo never reaches production", () => {
  const dir = resolve(import.meta.dirname, "..");
  const read = (path: string) => readFileSync(resolve(dir, path), "utf-8");
  const blocks = (source: string, tag: "style" | "script") =>
    [
      ...source.matchAll(
        new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, "g"),
      ),
    ].map((m) => ({ attrs: m[1], body: m[2] }));

  it("emits the demo routes, the switcher and the noindex only with the demo on", () => {
    for (const route of [
      "../../pages/billetterie/demo/[phase].astro",
      "../../pages/en/tickets/demo/[phase].astro",
    ])
      expect(read(route)).toMatch(
        /ticketDemosEnabled\(\) \? demoStaticPaths\(\) : \[\]/,
      );
    const page = read("TicketsPage.astro");
    expect(page).toMatch(/const switcher = ticketDemosEnabled\(\);/);
    const bars = page.match(/<DemoBar\b/g)!.length;
    expect(page.match(/\{\s*switcher\s*&&\s*\(?\s*<DemoBar\b/g)).toHaveLength(
      bars,
    );
    for (const layout of page.match(/<Layout\b[^>]*>/g)!)
      expect(layout).toContain("noindex={simulated}");
  });

  it("leaves no trace of it in the dictionary, nor in a shared style or script", () => {
    expect(read("../../i18n/ui.ts")).not.toMatch(/tickets\.demo/);
    for (const style of blocks(read("DemoBar.astro"), "style"))
      expect(style.attrs).toContain("is:inline");
    const shared = readdirSync(dir).filter(
      (f) => f.endsWith(".astro") && f !== "DemoBar.astro",
    );
    expect(read("tickets-ui.ts")).not.toMatch(/demo/i);
    for (const file of shared)
      for (const { body } of [
        ...blocks(read(file), "style"),
        ...blocks(read(file), "script"),
      ])
        expect(body, file).not.toMatch(/demo/i);
  });
});
