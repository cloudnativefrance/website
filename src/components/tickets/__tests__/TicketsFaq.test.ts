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
  strategicName: "Stratégie & Leadership",
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: Record<string, unknown>) =>
  container.renderToString(TicketsFaq, { props: { ...base, ...props } });

describe("TicketsFaq", () => {
  it("says the Strategy & Leadership track is open to every ticket, under the ticket's own name", async () => {
    const html = await render({ strategicName: "Nom décidé" });
    const item = html.match(
      /<details\b[^>]*data-faq="strategic"[\s\S]*?<\/details>/,
    )?.[0];
    expect(item).toMatch(
      /Le parcours Stratégie (&amp;|&) Leadership est-il réservé au billet Nom décidé/,
    );
    expect(item).toContain("ses talks sont ouverts à tous les participant(e)s");
    expect(item).toContain(
      "Le billet Nom décidé y ajoute un accès prioritaire",
    );
  });

  it("leaves an undecided answer out, or on its waiting copy", async () => {
    const html = await render({});
    expect(html).not.toContain("Taux de TVA");
    expect(html).not.toContain("Conditions générales de vente");
    expect(html).toContain(
      "On vérifie ce que permet notre outil de billetterie",
    );
    expect(html).toContain("On finalise les conditions");
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
    expect(html).toContain(
      "Oui, la facture est émise au nom de votre société.",
    );
    expect(html).not.toContain("On vérifie ce que permet");
    expect(html).toContain("Le changement de nom est gratuit.");
    expect(html).not.toContain("On finalise les conditions");
    expect(html).toMatch(
      /<a\b[^>]*href="https:\/\/cloudnativedays\.fr\/cgv"[^>]*>\s*Conditions générales de vente/,
    );
    expect(html).toContain("Le programme 2027 sera publié en mars 2027.");
  });

  it("opens the terms of sale in a new tab when they live on alf.io", async () => {
    const onAlfio = await render({
      termsUrl: "https://billetterie.cloudnativedays.fr/terms",
    });
    expect(onAlfio).toMatch(
      /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr\/terms"[^>]*target="_blank"[^>]*rel="noopener"/,
    );
    expect(onAlfio).toContain("(nouvel onglet)");
    const onSite = await render({ termsUrl: "https://cloudnativedays.fr/cgv" });
    expect(onSite).not.toContain('target="_blank"');
  });
});
