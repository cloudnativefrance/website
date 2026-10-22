// The CFP phase pages through the real components (astro-container, like the
// tickets page): the editorial pass' approved copy, and the closed page
// keeping the shared themes/formats grids from src/components/cfp/cfp-content.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CfpOpen from "../CfpOpen.astro";
import CfpClosed from "../CfpClosed.astro";
import { CFP_CONTENT } from "../cfp-content";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (component: any, lang: "fr" | "en") =>
  container.renderToString(component, { props: { lang } });

// The container escapes entities (&#39;, &amp;) and injects dev-mode
// data-astro-source-* attributes; assert on the text it renders, not its raw
// markup. NBSP (\u00a0, the FR colon convention) is kept; ASCII runs of
// whitespace are collapsed.
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t\n\r]+/g, " ");

const mainText = async (component: any, lang: "fr" | "en") => {
  const html = await render(component, lang);
  return text(html.slice(html.indexOf("<main"), html.indexOf("</main>")));
};

const OPEN_SRC = readFileSync(
  resolve(import.meta.dirname, "../CfpOpen.astro"),
  "utf-8",
);
const CLOSED_SRC = readFileSync(
  resolve(import.meta.dirname, "../CfpClosed.astro"),
  "utf-8",
);

describe("CfpOpen — editorial pass copy", () => {
  it("fr hero states the deadline in red under the CTA, badge green", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain("Date limite\u00a0: 31 janvier 2027");
    expect(m).not.toContain("réponse du comité fin février");
    expect(m).not.toContain("Soumissions ouvertes jusqu'au");
    expect(m).toContain("CFP 2027 · ouvert");
    const html = await render(CfpOpen, "fr");
    // The badge is the green state pill; the deadline rides under the CTA
    // in the red urgency treatment (mirroring the billetterie's).
    expect(html).toContain("bg-green-600");
    expect(html).toContain("text-white");
    expect(html).toContain("text-red-600");
    expect(html).not.toContain("⏱");
  });

  it("the previous round's two-pill row is gone", () => {
    expect(OPEN_SRC).not.toContain("deadlineBadge");
    expect(OPEN_SRC).not.toContain("flex flex-wrap items-center gap-2");
  });

  it("en hero mirrors it", async () => {
    const m = await mainText(CfpOpen, "en");
    expect(m).toContain("Deadline: January 31, 2027");
    expect(m).not.toContain("committee responds by the end of February");
  });

  it("the closing banner keeps its own deadline line", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Clôture le 31 janvier 2027",
    );
  });

  it("fr themes sub reassures about reassignment", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Choisissez celui qui correspond le mieux à votre sujet. En cas de doute, choisissez le thème le plus proche, le comité s'occupera de réaffecter votre proposition.",
    );
  });

  it("en themes sub mirrors it", async () => {
    expect(await mainText(CfpOpen, "en")).toContain(
      "Pick the one that fits your topic best. If in doubt, pick the closest theme — the committee will take care of reassigning your proposal.",
    );
  });

  it("DevEx theme names CI/CD and GitOps, both locales", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Golden paths, self-service, CI/CD, GitOps.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Golden paths, self-service, CI/CD, GitOps.",
    );
  });

  it("Fondations: storage-focused title, resilience, FinOps and GreenOps named", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain("Fondations\u00a0: infrastructure, stockage, réseau");
    expect(m).toContain("Calcul, stockage, réseau, bases de données.");
    expect(m).toContain(
      "Maîtrise des coûts (FinOps) et impact environnemental (GreenOps).",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Cost control (FinOps) and environmental impact (GreenOps).",
    );
  });

  it("Autonomie numérique: plural dependencies, contribution angle", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Protection des données, alternatives et contribution open source.",
    );
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Réversibilité : préserver sa liberté de choix technologique.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Reversibility: preserving your freedom of technological choice.",
    );
  });

  it("IA body: three pillars, guardrails kept, no anti-demo line", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain(
      "Concevoir des applications intégrant l'IA : LLM, RAG, agents, garde-fous.",
    );
    expect(m).not.toContain("pas des démos");
    expect(await mainText(CfpOpen, "en")).toContain(
      "Building AI-integrated applications: LLMs, RAG, agents, guardrails.",
    );
  });

  it("Observabilité: concrete signals over the old stance wording, dashboards kept", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Métriques, logs et traces plutôt que des dashboards.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Metrics, logs and traces rather than dashboards.",
    );
  });

  it("Sécurité: concrete enumeration keeps the without-blocking stance", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Sécuriser de la conception à la production, sans bloquer le travail des équipes.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Securing from design to production, without blocking teams' work.",
    );
  });

  it("the no-pitch rule is stated boldly, both locales", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Les présentations promotionnelles ou commerciales ne sont pas acceptées et sont automatiquement refusées.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Promotional or commercial talks are not accepted and will be automatically rejected.",
    );
  });

  it("the coaching rides its own callout, before and after the CFP closes", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain(
      "Première fois sur scène, ou envie d'un regard extérieur ?",
    );
    expect(m).toContain("avant comme après la clôture du CFP");
    expect(m).not.toContain("primo-oratrices");
  });

  it("co-speakers are welcome on every format, inclusively worded", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Toutes les personnes co-intervenantes sont bienvenues sur tous les formats",
    );
    expect(await mainText(CfpOpen, "fr")).toContain(
      "chaque personne complète son profil",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "All co-speakers are welcome on every format",
    );
  });

  it("the criteria are rewritten: failures included, bingo framing gone", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain("de réussites comme d'échecs");
    expect(m).toContain("Écosystème francophone");
    expect(m).toContain(
      "Il n'est pas nécessaire de répondre à tous ces critères",
    );
    expect(m).not.toContain("au plus grand nombre des critères");
  });

  it("the lightning talk leads with the idea", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Un sujet, une idée forte, un message à retenir.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "One topic, one strong idea, one message to remember.",
    );
  });

  it("the multi-topics callout: bold lead, line break, bolded quality line", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain(
      "Envie de proposer plusieurs sujets ? Soumettez une proposition séparée pour chacun et le comité les évaluera indépendamment. Privilégiez la qualité plutôt que la quantité\u00a0: présenter plusieurs sujets n'augmente pas vos chances automatiquement.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Favour quality over quantity: submitting multiple proposals does not automatically increase your chances.",
    );
    // Structure: <strong>lead</strong> <br /> rest <strong>strong</strong>tail
    const block = OPEN_SRC.slice(
      OPEN_SRC.indexOf("multiTopics.lead"),
      OPEN_SRC.indexOf("multiTopics.tail"),
    );
    expect(block).toMatch(/<\/strong>\s*<br\s*\/>/);
    expect(block).toContain("multiTopics.strong");
  });

  it("the fr page carries no em-dash prose", async () => {
    expect(await mainText(CfpOpen, "fr")).not.toContain(" — ");
  });

  it("the closing section shows the 2026 stage photo with an accurate alt", async () => {
    const html = await render(CfpOpen, "fr");
    expect(html).toContain(
      "Deux intervenantes sur scène à Cloud Native Days France 2026",
    );
    const htmlEn = await render(CfpOpen, "en");
    expect(htmlEn).toContain("Two speakers on stage at Cloud Native Days France 2026");
    // Its own asset: contact/participant.jpg stays on the contact pages.
    expect(OPEN_SRC).toContain("photos/cfp/intervenantes-scene.jpg");
    expect(OPEN_SRC).not.toContain("contact/participant.jpg");
  });
});

describe("CfpOpen — themes/formats live in the shared module", () => {
  it("imports them from ./cfp-content instead of defining them inline", () => {
    expect(OPEN_SRC).toMatch(/from\s*["']\.\/cfp-content["']/);
    expect(OPEN_SRC).not.toMatch(/parcours:\s*\[/);
    expect(OPEN_SRC).not.toMatch(/formats:\s*\[/);
    expect(OPEN_SRC).not.toMatch(/horsPiste:\s*\{/);
  });

  it("every theme card is a 2 to 4 item bullet list, both locales", () => {
    for (const locale of ["fr", "en"] as const) {
      const c = CFP_CONTENT[locale];
      for (const th of [...c.parcours, c.horsPiste]) {
        expect(th.bullets.length).toBeGreaterThanOrEqual(2);
        expect(th.bullets.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe("CfpClosed — keeps the themes and formats", () => {
  it("fr: closed message, then the shared grids under the section heading", async () => {
    const m = await mainText(CfpClosed, "fr");
    expect(m).toContain("Le CFP est clôturé"); // the closed message stays
    expect(m).toContain("Les thèmes et les formats de l'édition 2027");
    expect(m).toContain("Autonomie numérique et open source");
    expect(m).toContain("Hors-piste, sujets divers");
    expect(m).toContain("Présentation éclair");
    expect(m).toContain("Deep dive");
    expect(m).toContain("CI/CD, GitOps"); // the grids read the shared module
    expect(m).toContain("reprise après défaillance"); // round-2 wording flows through
  });

  it("en: mirrors fr", async () => {
    const m = await mainText(CfpClosed, "en");
    expect(m).toContain("The themes and formats of the 2027 edition");
    expect(m).toContain("Digital autonomy & open source");
    expect(m).toContain("Off-piste & misc");
    expect(m).toContain("Lightning talk");
    expect(m).toContain("CI/CD, GitOps");
  });

  it("renders the grids from the shared module", () => {
    expect(CLOSED_SRC).toMatch(/from\s*["']\.\/cfp-content["']/);
  });
});
