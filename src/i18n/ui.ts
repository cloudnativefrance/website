export const languages = { fr: "FR", en: "EN" } as const;

export type Locale = keyof typeof languages;

export const defaultLang: Locale = "fr";

export const ui = {
  fr: {
    "nav.home": "Accueil",
    "nav.schedule": "Programme",
    "nav.speakers": "Speakers",
    "nav.sponsors": "Partenaires",
    "nav.venue": "Lieu",
    "nav.team": "Equipe",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "3 juin 2027 — CENTQUATRE-PARIS",
    "toggle.aria": "Selecteur de langue",
    "fallback.heading": "Contenu non disponible en francais",
    "fallback.body":
      "Cette page n'a pas encore ete traduite. Consulter la version originale.",
    "fallback.cta": "Voir en anglais",
  },
  en: {
    "nav.home": "Home",
    "nav.schedule": "Schedule",
    "nav.speakers": "Speakers",
    "nav.sponsors": "Partners",
    "nav.venue": "Venue",
    "nav.team": "Team",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "June 3, 2027 — CENTQUATRE-PARIS",
    "toggle.aria": "Language selector",
    "fallback.heading": "Content not available in English",
    "fallback.body":
      "This page has not been translated yet. View the original version.",
    "fallback.cta": "View in French",
  },
} as const;
