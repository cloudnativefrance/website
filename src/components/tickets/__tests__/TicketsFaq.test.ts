// The FAQ once the ticketing team decides what is still open: a decided value
// must show up — replacing the waiting copy where there is one — and an
// undecided one must leave no label behind.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import TicketsFaq from "../TicketsFaq.astro";

const base = {
  lang: "fr" as const,
  host: "billetterie.cloudnativedays.fr",
  email: "billetterie@cloudnativedays.fr",
  inclusionMailto: "mailto:billetterie@cloudnativedays.fr",
  perOrder: { early: 5, later: 20 },
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: Record<string, unknown>) =>
  container.renderToString(TicketsFaq, { props: { ...base, ...props } });

describe("TicketsFaq", () => {
  it("leaves an undecided answer out, or on its waiting copy", async () => {
    const html = await render({});
    expect(html).not.toContain("Taux de TVA");
    expect(html).not.toContain("Conditions générales de vente");
    expect(html).toContain("Nous le vérifions avec notre billetterie");
    expect(html).toContain("en cours de validation");
    expect(html).not.toContain("Quand le programme sera-t-il publié");
  });

  it("states a decided answer, in place of the waiting copy", async () => {
    const html = await render({
      vatRate: "10 %",
      invoice: "Oui, la facture est émise au nom de votre société.",
      transfer: "Le changement de nom est gratuit.",
      termsUrl: "https://cloudnativedays.fr/cgv",
      programmeWhen: "en mars 2027",
    });
    expect(html).toContain("Taux de TVA : 10 %.");
    expect(html).toContain("Oui, la facture est émise au nom de votre société.");
    expect(html).not.toContain("Nous le vérifions");
    expect(html).toContain("Le changement de nom est gratuit.");
    expect(html).not.toContain("en cours de validation");
    expect(html).toMatch(/<a\b[^>]*href="https:\/\/cloudnativedays\.fr\/cgv"[^>]*>\s*Conditions générales de vente/);
    expect(html).toContain("Le programme 2027 sera publié en mars 2027.");
  });
});
