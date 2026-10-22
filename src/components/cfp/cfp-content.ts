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
      "Choisissez celui qui correspond le mieux à votre sujet. En cas de doute, choisissez le thème le plus proche, le comité s'occupera de réaffecter votre proposition.",
    formatsTitle: "Les formats",
    closedSectionTitle: "Les thèmes et les formats de l'édition 2027",
    parcours: [
      {
        emoji: "🧭",
        title: "Autonomie numérique et open source",
        body: "Maîtriser ses dépendances technologiques : protection des données, alternatives et contribution open source, portabilité des applications et des infrastructures, interopérabilité et réversibilité pour préserver sa liberté de choix technologique.",
      },
      {
        emoji: "🧰",
        title: "DevEx et Platform Engineering",
        body: "Concevoir des plateformes que les équipes choisissent d'utiliser : golden paths, self-service, CI/CD, GitOps, réduction de la charge cognitive et autonomie des équipes.",
      },
      {
        emoji: "🤖",
        title: "L'IA à l'épreuve du réel",
        body: "Déployer et exploiter l'IA en production (GPU, inférence, performances, coûts), concevoir des applications intégrant l'IA (LLM, RAG, agents et garde-fous) et mettre l'IA au service des métiers Cloud Native (développement, CI/CD, observabilité, opérations).",
      },
      {
        emoji: "🔭",
        title: "Observabilité et fiabilité",
        body: "Comprendre, surveiller et fiabiliser les systèmes en production : métriques, logs et traces plutôt que des dashboards, SLO tenables et pratiques SRE, disponibilité, gestion des incidents et reprise après défaillance.",
      },
      {
        emoji: "🛡️",
        title: "Sécurité et confiance",
        body: "Sécuriser les applications et les infrastructures cloud native, de la conception à la production, sans bloquer le travail des équipes : dépendances logicielles, CI/CD, identités, accès et secrets, gestion des vulnérabilités, détection et réponse aux menaces, conformité.",
      },
      {
        emoji: "🧱",
        title: "Fondations\u00a0: infrastructure, stockage, réseau",
        body: "Les couches sur lesquelles tout repose : calcul, stockage, réseau, bases de données, architectures résilientes, performance et passage à l'échelle, maîtrise des coûts (FinOps) et impact environnemental (GreenOps).",
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
        body: "Mastering your technology dependencies: data protection, open source alternatives and contribution, application and infrastructure portability, interoperability and reversibility to preserve your freedom of technological choice.",
      },
      {
        emoji: "🧰",
        title: "DevEx & Platform Engineering",
        body: "Designing platforms teams choose to use: golden paths, self-service, CI/CD, GitOps, reduced cognitive load and team autonomy.",
      },
      {
        emoji: "🤖",
        title: "AI put to the test",
        body: "Deploying and operating AI in production (GPUs, inference, performance, cost), building AI-integrated applications (LLMs, RAG, agents and guardrails), and putting AI to work for Cloud Native practices (development, CI/CD, observability, operations).",
      },
      {
        emoji: "🔭",
        title: "Observability & reliability",
        body: "Understanding, monitoring and making production systems reliable: metrics, logs and traces rather than dashboards, sustainable SLOs and SRE practices, availability, incident management and disaster recovery.",
      },
      {
        emoji: "🛡️",
        title: "Security & trust",
        body: "Securing cloud native applications and infrastructure from design to production, without blocking teams' work: software dependencies, CI/CD, identities, access and secrets, vulnerability management, threat detection and response, compliance.",
      },
      {
        emoji: "🧱",
        title: "Foundations: infrastructure, storage, networking",
        body: "The layers everything rests on: compute, storage, networking, databases, resilient architectures, performance and scaling, cost control (FinOps) and environmental impact (GreenOps).",
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
