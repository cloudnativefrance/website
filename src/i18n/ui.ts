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
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "3 juin 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Reservez votre place",
    "hero.cta.schedule": "Voir le programme",
    "hero.description":
      "Cloud Native, DevOps et IA \u2014 entre praticiens. Une journee de talks techniques et de rencontres a Paris, par et pour les pros de la plateforme : zero pitch commercial, que du partage d'expertise.",
    "hero.logo_alt": "Cloud Native Days France",
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
    "speakers.heading": "Nos Speakers",
    "speakers.subtext":
      "Decouvrez les intervenants de Cloud Native Days France 2027",
    "speakers.keynote_badge": "Keynote",
    "speakers.talks_heading": "Ses talks",
    "speakers.cospeaker_prefix": "Avec",
    "speakers.schedule_link": "Voir dans le programme",
    "speakers.schedule_placeholder": "Programme a venir",
    "speakers.empty_heading": "Speakers a venir",
    "speakers.empty_body":
      "La liste des speakers sera annoncee prochainement. Revenez bientot !",
    "speakers.back": "Retour aux speakers",
    "speakers.no_talks": "Aucun talk annonce pour le moment.",
    "speakers.not_found":
      "Speaker introuvable. Retournez a la liste des speakers.",
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
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "June 3, 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Get Your Ticket",
    "hero.cta.schedule": "View Schedule",
    "hero.description":
      "Cloud Native, DevOps and AI \u2014 from practitioners, for practitioners. A day of technical talks and hallway track in Paris, built for platform engineers: zero sales pitch, just shared expertise.",
    "hero.logo_alt": "Cloud Native Days France",
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
    "speakers.heading": "Our Speakers",
    "speakers.subtext":
      "Meet the speakers of Cloud Native Days France 2027",
    "speakers.keynote_badge": "Keynote",
    "speakers.talks_heading": "Their Talks",
    "speakers.cospeaker_prefix": "With",
    "speakers.schedule_link": "View in schedule",
    "speakers.schedule_placeholder": "Schedule coming soon",
    "speakers.empty_heading": "Speakers Coming Soon",
    "speakers.empty_body":
      "The speaker lineup will be announced shortly. Check back soon!",
    "speakers.back": "Back to speakers",
    "speakers.no_talks": "No talks announced yet.",
    "speakers.not_found":
      "Speaker not found. Return to the speakers page.",
  },
} as const;
