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
    "seo.default_description":
      "Cloud Native Days France — 3 juin 2027 au CENTQUATRE-PARIS. Conférence cloud-native, DevOps et IA par et pour les praticiens.",
    "seo.og_site_name": "Cloud Native Days France",
    "seo.og_image_alt":
      "Cloud Native Days France — 3 juin 2027 au CENTQUATRE-PARIS",
    "toggle.aria": "Selecteur de langue",
    "fallback.heading": "Contenu non disponible en francais",
    "fallback.body":
      "Cette page n'a pas encore ete traduite. Consulter la version originale.",
    "fallback.cta": "Voir en anglais",
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "3 juin 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Reservez votre place",
    "hero.cta.schedule": "Voir le programme",
    "countdown.days": "jours",
    "countdown.hours": "heures",
    "countdown.minutes": "minutes",
    "countdown.seconds": "secondes",
    "hero.post_event": "L'evenement est termine !",
    "hero.cta.replays": "Voir les replays",
    "keynumbers.heading": "L'evenement en chiffres",
    "keynumbers.attendees": "Participants",
    "keynumbers.talks": "Talks",
    "keynumbers.partners": "Partenaires",
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
    "seo.default_description":
      "Cloud Native Days France — June 3, 2027 at CENTQUATRE-PARIS. Cloud-native, DevOps and AI conference from practitioners, for practitioners.",
    "seo.og_site_name": "Cloud Native Days France",
    "seo.og_image_alt":
      "Cloud Native Days France — June 3, 2027 at CENTQUATRE-PARIS",
    "toggle.aria": "Language selector",
    "fallback.heading": "Content not available in English",
    "fallback.body":
      "This page has not been translated yet. View the original version.",
    "fallback.cta": "View in French",
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "June 3, 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Get Your Ticket",
    "hero.cta.schedule": "View Schedule",
    "countdown.days": "days",
    "countdown.hours": "hours",
    "countdown.minutes": "minutes",
    "countdown.seconds": "seconds",
    "hero.post_event": "The event has ended!",
    "hero.cta.replays": "Watch Replays",
    "keynumbers.heading": "The Event in Numbers",
    "keynumbers.attendees": "Attendees",
    "keynumbers.talks": "Talks",
    "keynumbers.partners": "Partners",
  },
} as const;
