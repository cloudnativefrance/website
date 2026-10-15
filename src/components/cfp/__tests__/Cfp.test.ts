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
  it("fr hero states the deadline buffed to a pill beside the badge", async () => {
    const m = await mainText(CfpOpen, "fr");
    expect(m).toContain("⏱ Date limite\u00a0: 31 janvier 2027");
    expect(m).not.toContain("réponse du comité fin février");
    expect(m).not.toContain("Soumissions ouvertes jusqu'au");
    // The old muted deadline line below the CTAs is gone — the date rides
    // in the pill row now.
    expect(m).toContain("CFP 2027 — ouvert");
    const html = await render(CfpOpen, "fr");
    expect(html).toContain("bg-primary text-primary-foreground");
  });

  it("the hero's two pills share one row", async () => {
    const html = await render(CfpOpen, "fr");
    const i = html.indexOf('class="flex flex-wrap items-center gap-2"');
    expect(i).toBeGreaterThan(0);
    const row = html.slice(i, html.indexOf("</div>", i));
    expect(row).toContain("bg-accent");
    expect(row).toContain("⏱");
  });

  it("the old strong-span deadline paragraph no longer exists", () => {
    expect(OPEN_SRC).not.toContain("deadlineLine");
  });

  it("en hero mirrors it", async () => {
    const m = await mainText(CfpOpen, "en");
    expect(m).toContain("⏱ Deadline: January 31, 2027");
    expect(m).not.toContain("committee responds by the end of February");
  });

  it("the closing banner keeps its own deadline line", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Clôture le 31 janvier 2027",
    );
  });

  it("fr themes sub reassures about reassignment", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Choisissez celui qui correspond le mieux à votre sujet. En cas de doute, choisissez le thème le plus proche, le comité peut réaffecter une proposition.",
    );
  });

  it("en themes sub mirrors it", async () => {
    expect(await mainText(CfpOpen, "en")).toContain(
      "Pick the one that fits your topic best. If in doubt, pick the closest theme — the committee can reassign a proposal.",
    );
  });

  it("DevEx theme names CI/CD and GitOps, both locales", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "golden paths, self-service, CI/CD et GitOps, et la mesure de ce qui leur fait réellement gagner du temps.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "golden paths, self-service, CI/CD and GitOps, and measuring what actually saves them time.",
    );
  });

  it("Fondations body ends on cost and footprint, both locales", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Les couches sur lesquelles tout repose : Kubernetes, stockage, réseau, bases de données, leur exploitation à l'échelle, leur coût et leur empreinte.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "The layers everything rests on: Kubernetes, storage, networking, databases, running them at scale, their cost and their footprint.",
    );
  });

  it("Autonomie numérique is plural in fr", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Maîtriser ses dépendances",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "Mastering your dependencies",
    );
  });

  it("IA body splits infrastructure and usage sides, both locales", async () => {
    expect(await mainText(CfpOpen, "fr")).toContain(
      "Ce que l'IA change en production, côté infrastructure (inférence, GPU, coûts, latence) comme côté usages (agents, données, garde-fous). Des retours d'expérience, pas des démos.",
    );
    expect(await mainText(CfpOpen, "en")).toContain(
      "What AI changes in production — infrastructure side (inference, GPUs, cost, latency) and usage side (agents, data, guardrails). Experience reports, not demos.",
    );
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
    expect(m).toContain("CI/CD et GitOps"); // the grids read the shared module
  });

  it("en: mirrors fr", async () => {
    const m = await mainText(CfpClosed, "en");
    expect(m).toContain("The themes and formats of the 2027 edition");
    expect(m).toContain("Digital sovereignty & open source");
    expect(m).toContain("Off-piste & misc");
    expect(m).toContain("Lightning talk");
    expect(m).toContain("CI/CD and GitOps");
  });

  it("renders the grids from the shared module", () => {
    expect(CLOSED_SRC).toMatch(/from\s*["']\.\/cfp-content["']/);
  });
});
