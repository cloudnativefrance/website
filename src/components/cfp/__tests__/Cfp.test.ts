// The CFP phase pages through the real components (astro-container, like the
// tickets page): the editorial pass' approved copy, and the closed page
// keeping the shared themes/formats grids from src/components/cfp/cfp-content.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CfpOpen from "../CfpOpen.astro";
import CfpClosed from "../CfpClosed.astro";

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
      "golden paths, self-service, CI/CD, GitOps, réduction de la charge cognitive et autonomie des équipes.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "golden paths, self-service, CI/CD, GitOps, reduced cognitive load and team autonomy.",
    );
  });

  it("Fondations: storage-focused title, resilience, FinOps and GreenOps named", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain("Fondations\u00a0: infrastructure, stockage, réseau");
    expect(m).toContain(
      "Les couches sur lesquelles tout repose : calcul, stockage, réseau, bases de données, architectures résilientes, performance et passage à l'échelle, maîtrise des coûts (FinOps) et impact environnemental (GreenOps).",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "The layers everything rests on: compute, storage, networking, databases, resilient architectures, performance and scaling, cost control (FinOps) and environmental impact (GreenOps).",
    );
  });

  it("Autonomie numérique: plural dependencies, contribution angle", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Maîtriser ses dépendances technologiques : protection des données, alternatives et contribution open source, portabilité des applications et des infrastructures, interopérabilité et réversibilité pour préserver sa liberté de choix technologique.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Mastering your technology dependencies: data protection, open source alternatives and contribution, application and infrastructure portability, interoperability and reversibility to preserve your freedom of technological choice.",
    );
  });

  it("IA body: three pillars, guardrails kept, no anti-demo line", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain(
      "Déployer et exploiter l'IA en production (GPU, inférence, performances, coûts), concevoir des applications intégrant l'IA (LLM, RAG, agents et garde-fous) et mettre l'IA au service des métiers Cloud Native (développement, CI/CD, observabilité, opérations).",
    );
    expect(m).not.toContain("pas des démos");
    expect(await mainText(CfpOpen, "en")).toContain(
      "Deploying and operating AI in production (GPUs, inference, performance, cost), building AI-integrated applications (LLMs, RAG, agents and guardrails), and putting AI to work for Cloud Native practices (development, CI/CD, observability, operations).",
    );
  });

  it("Observabilité: concrete signals over the old stance wording, dashboards kept", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Comprendre, surveiller et fiabiliser les systèmes en production : métriques, logs et traces plutôt que des dashboards, SLO tenables et pratiques SRE, disponibilité, gestion des incidents et reprise après défaillance.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Understanding, monitoring and making production systems reliable: metrics, logs and traces rather than dashboards, sustainable SLOs and SRE practices, availability, incident management and disaster recovery.",
    );
  });

  it("Sécurité: concrete enumeration keeps the without-blocking stance", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Sécuriser les applications et les infrastructures cloud native, de la conception à la production, sans bloquer le travail des équipes : dépendances logicielles, CI/CD, identités, accès et secrets, gestion des vulnérabilités, détection et réponse aux menaces, conformité.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Securing cloud native applications and infrastructure from design to production, without blocking teams' work: software dependencies, CI/CD, identities, access and secrets, vulnerability management, threat detection and response, compliance.",
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

  it("co-speakers are welcome on every format", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Les co-intervenants sont les bienvenus sur tous les formats",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Co-speakers are welcome on every format",
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
