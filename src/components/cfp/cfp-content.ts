/**
 * The CFP's themes and formats, both locales, in one place.
 *
 * Extracted from `CfpOpen.astro` so `CfpClosed.astro` can keep showing them
 * after the deadline (the editorial pass of 2026-10): the closed page points
 * at the programme, but the 2027 edition's themes and formats stay useful
 * context — and one copy of the data means the open and closed pages cannot
 * drift. The remaining CFP page copy (hero, criteria, closing banner) lives
 * in `CfpOpen.astro`, which only the open phase renders.
 */
import type { Locale } from "@/i18n/ui";

export interface CfpTheme {
  emoji: string;
  title: string;
  body: string;
}

export interface CfpFormat {
  duration: string;
  title: string;
  body: string;
}

export interface CfpContent {
  themesTitle: string;
  themesSub: string;
  formatsTitle: string;
  /** Heading of the themes + formats block the closed page keeps. */
  closedSectionTitle: string;
  parcours: CfpTheme[];
  horsPiste: CfpTheme;
  formats: CfpFormat[];
}

export const CFP_CONTENT: Record<Locale, CfpContent> = {
  fr: {
    themesTitle: "Les 7 thèmes",
    themesSub:
      "Choisissez celui qui correspond le mieux à votre sujet. En cas de doute, choisissez le thème le plus proche, le comité peut réaffecter une proposition.",
    formatsTitle: "Les formats",
    closedSectionTitle: "Les thèmes et les formats de l'édition 2027",
    parcours: [
      {
        emoji: "🧭",
        title: "Autonomie numérique et open source",
        body: "Maîtriser ses dépendances : souveraineté des données, alternatives ouvertes, contribution amont, et le coût réel de la réversibilité.",
      },
      {
        emoji: "🧰",
        title: "DevEx et Platform Engineering",
        body: "Construire une plateforme que les équipes choisissent d'utiliser : golden paths, self-service, CI/CD et GitOps, et la mesure de ce qui leur fait réellement gagner du temps.",
      },
      {
        emoji: "🤖",
        title: "L'IA à l'épreuve du réel",
        body: "Ce que l'IA change en production, côté infrastructure (inférence, GPU, coûts, latence) comme côté usages (agents, données, garde-fous). Des retours d'expérience, pas des démos.",
      },
      {
        emoji: "🔭",
        title: "Observabilité et fiabilité",
        body: "Comprendre un système en production : des signaux utiles plutôt que des tableaux de bord, des SLO tenables, et ce qu'on apprend d'un incident.",
      },
      {
        emoji: "🛡️",
        title: "Sécurité et confiance",
        body: "Sécuriser sans bloquer : chaîne d'approvisionnement, secrets, identités et conformité, intégrés au travail des équipes plutôt qu'ajoutés après.",
      },
      {
        emoji: "🧱",
        title: "Fondations\u00a0: infrastructure, données, réseau",
        body: "Les couches sur lesquelles tout repose : Kubernetes, stockage, réseau, bases de données, leur exploitation à l'échelle, leur coût et leur empreinte.",
      },
    ],
    horsPiste: {
      emoji: "⛷️",
      title: "Hors-piste, sujets divers",
      body: "Ce qui n'entre nulle part ailleurs et mérite d'être entendu : expérimentations, angles inattendus, et le retour d'expérience qu'on n'ose pas raconter.",
    },
    formats: [
      {
        duration: "10 min",
        title: "Présentation éclair",
        body: "Un format court et synthétique pour aller droit au but. Le temps est votre principal défi — assurez-vous que votre contenu soit concis et percutant.",
      },
      {
        duration: "30 min",
        title: "Cas concret",
        body: "Idéal pour partager des cas concrets en entreprise, des retours sur des projets open source, ou une expérience personnelle. Q&A incluses.",
      },
      {
        duration: "45 min",
        title: "Deep dive",
        body: "Pour approfondir un sujet complexe, entrer dans les détails techniques, avec éventuellement des démonstrations. Q&A incluses.",
      },
    ],
  },
  en: {
    themesTitle: "The 7 themes",
    themesSub:
      "Pick the one that fits your topic best. If in doubt, pick the closest theme — the committee can reassign a proposal.",
    formatsTitle: "The formats",
    closedSectionTitle: "The themes and formats of the 2027 edition",
    parcours: [
      {
        emoji: "🧭",
        title: "Digital sovereignty & open source",
        body: "Mastering your dependencies: data sovereignty, open alternatives, upstream contribution, and the real cost of reversibility.",
      },
      {
        emoji: "🧰",
        title: "DevEx & Platform Engineering",
        body: "Building a platform teams choose to use: golden paths, self-service, CI/CD and GitOps, and measuring what actually saves them time.",
      },
      {
        emoji: "🤖",
        title: "AI put to the test",
        body: "What AI changes in production — infrastructure side (inference, GPUs, cost, latency) and usage side (agents, data, guardrails). Experience reports, not demos.",
      },
      {
        emoji: "🔭",
        title: "Observability & reliability",
        body: "Understanding a system in production: useful signals over dashboards, sustainable SLOs, and what an incident teaches you.",
      },
      {
        emoji: "🛡️",
        title: "Security & trust",
        body: "Securing without blocking: supply chain, secrets, identities and compliance, built into the work of teams rather than bolted on after.",
      },
      {
        emoji: "🧱",
        title: "Foundations: infrastructure, data, networking",
        body: "The layers everything rests on: Kubernetes, storage, networking, databases, running them at scale, their cost and their footprint.",
      },
    ],
    horsPiste: {
      emoji: "⛷️",
      title: "Off-piste & misc",
      body: "What fits nowhere else and deserves to be heard: experiments, unexpected angles, and the experience report you don't dare tell.",
    },
    formats: [
      {
        duration: "10 min",
        title: "Lightning talk",
        body: "Short and to the point. Time is the constraint — keep it concise and impactful.",
      },
      {
        duration: "30 min",
        title: "Talk",
        body: "Production stories, open source retrospectives, or a personal contribution. Q&A included.",
      },
      {
        duration: "45 min",
        title: "Deep dive",
        body: "Deep dive into a complex topic, technical details, possibly with live demos. Q&A included.",
      },
    ],
  },
};
