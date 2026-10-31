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
  /** 2–4 short fragments — theme cards render them as a compact bullet list. */
  bullets: string[];
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
      "Choisissez celui qui correspond le mieux à votre sujet. En cas de doute, choisissez le thème le plus proche, le comité s'occupera de réaffecter votre proposition.",
    formatsTitle: "Les formats",
    closedSectionTitle: "Les thèmes et les formats de l'édition 2027",
    parcours: [
      {
        emoji: "🧭",
        title: "Autonomie numérique et open source",
        bullets: [
          "Protection des données, alternatives et contribution open source.",
          "Portabilité des applications et des infrastructures, interopérabilité.",
          "Réversibilité : préserver sa liberté de choix technologique.",
        ],
      },
      {
        emoji: "🧰",
        title: "DevEx et Platform Engineering",
        bullets: [
          "Des plateformes que les équipes choisissent d'utiliser.",
          "Golden paths, self-service, CI/CD, GitOps.",
          "Réduction de la charge cognitive, autonomie des équipes.",
        ],
      },
      {
        emoji: "🤖",
        title: "L'IA à l'épreuve du réel",
        bullets: [
          "Déployer et exploiter l'IA en production : GPU, inférence, performances, coûts.",
          "Concevoir des applications intégrant l'IA : LLM, RAG, agents, garde-fous.",
          "L'IA au service des pratiques Cloud Native : développement, CI/CD, observabilité, opérations.",
        ],
      },
      {
        emoji: "🔭",
        title: "Observabilité et fiabilité",
        bullets: [
          "Métriques, logs et traces plutôt que des dashboards.",
          "SLO tenables et pratiques SRE.",
          "Disponibilité, gestion des incidents, reprise après défaillance.",
        ],
      },
      {
        emoji: "🛡️",
        title: "Sécurité et confiance",
        bullets: [
          "Sécuriser de la conception à la production, sans bloquer le travail des équipes.",
          "Dépendances logicielles, CI/CD, identités, accès et secrets.",
          "Gestion des vulnérabilités, détection et réponse aux menaces, conformité.",
        ],
      },
      {
        emoji: "🧱",
        title: "Fondations\u00a0: infrastructure, stockage, réseau",
        bullets: [
          "Calcul, stockage, réseau, bases de données.",
          "Architectures résilientes, performance et passage à l'échelle.",
          "Maîtrise des coûts (FinOps) et impact environnemental (GreenOps).",
        ],
      },
    ],
    horsPiste: {
      emoji: "⛷️",
      title: "Hors-piste, sujets divers",
      bullets: [
        "Expérimentations et angles inattendus.",
        "Le retour d'expérience qu'on n'ose pas raconter.",
      ],
    },
    formats: [
      {
        duration: "10 min",
        title: "Présentation éclair",
        body: "Un sujet, une idée forte, un message à retenir. Un format court et percutant pour partager une découverte, une expérience ou une réflexion.",
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
      "Pick the one that fits your topic best. If in doubt, pick the closest theme — the committee will take care of reassigning your proposal.",
    formatsTitle: "The formats",
    closedSectionTitle: "The themes and formats of the 2027 edition",
    parcours: [
      {
        emoji: "🧭",
        title: "Digital autonomy & open source",
        bullets: [
          "Data protection, open source alternatives and contribution.",
          "Application and infrastructure portability, interoperability.",
          "Reversibility: preserving your freedom of technological choice.",
        ],
      },
      {
        emoji: "🧰",
        title: "DevEx & Platform Engineering",
        bullets: [
          "Platforms teams choose to use.",
          "Golden paths, self-service, CI/CD, GitOps.",
          "Reduced cognitive load, team autonomy.",
        ],
      },
      {
        emoji: "🤖",
        title: "AI put to the test",
        bullets: [
          "Deploying and operating AI in production: GPUs, inference, performance, cost.",
          "Building AI-integrated applications: LLMs, RAG, agents, guardrails.",
          "AI at work for Cloud Native practices: development, CI/CD, observability, operations.",
        ],
      },
      {
        emoji: "🔭",
        title: "Observability & reliability",
        bullets: [
          "Metrics, logs and traces rather than dashboards.",
          "Sustainable SLOs and SRE practices.",
          "Availability, incident management, disaster recovery.",
        ],
      },
      {
        emoji: "🛡️",
        title: "Security & trust",
        bullets: [
          "Securing from design to production, without blocking teams' work.",
          "Software dependencies, CI/CD, identities, access and secrets.",
          "Vulnerability management, threat detection and response, compliance.",
        ],
      },
      {
        emoji: "🧱",
        title: "Foundations: infrastructure, storage, networking",
        bullets: [
          "Compute, storage, networking, databases.",
          "Resilient architectures, performance and scaling.",
          "Cost control (FinOps) and environmental impact (GreenOps).",
        ],
      },
    ],
    horsPiste: {
      emoji: "⛷️",
      title: "Off-piste & misc",
      bullets: [
        "Experiments and unexpected angles.",
        "The experience report you don't dare tell.",
      ],
    },
    formats: [
      {
        duration: "10 min",
        title: "Lightning talk",
        body: "One topic, one strong idea, one message to remember. A short, punchy format to share a discovery, an experience, or a thought.",
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
