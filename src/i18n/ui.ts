export const languages = { fr: "FR", en: "EN" } as const;

export type Locale = keyof typeof languages;

export const defaultLang: Locale = "fr";

export const ui = {
  fr: {
    "nav.home": "À propos",
    "nav.schedule": "Programme",
    "nav.speakers": "Intervenant(e)s",
    "nav.sponsors": "Partenaires",
    "nav.venue": "Informations pratiques",
    "nav.team": "Équipe",
    "nav.tickets": "Billetterie",
    "nav.cfp": "CFP",
    "nav.replays": "Replays",
    "nav.programme.label": "Programme",
    "nav.programme.submenu.programme": "Programme",
    "nav.programme.submenu.cfp": "CFP",
    "nav.programme.submenu.intervenants": "Intervenant(e)s",
    "nav.programme.submenu.archive": "Programme {year}",
    "nav.programme.submenu.archive_intervenants": "Intervenant(e)s {year}",
    "nav.sponsors.label": "Partenaires",
    "nav.speakers.label": "Intervenant(e)s",
    "about.subnav.heading": "À découvrir aussi",
    "about.subnav.discover": "Découvrir CND France",
    "about.subnav.venue": "Infos pratiques",
    "about.subnav.team": "L'équipe",
    "about.page.placeholder":
      "Le contenu de cette page arrive très prochainement.",
    "tickets.coming_soon.title": "La billetterie sera bientôt ouverte",
    "tickets.coming_soon.body":
      "Inscrivez-vous à la newsletter pour être informé(e) dès l'ouverture de la billetterie et bénéficier des tarifs Early Bird.",
    "tickets.opening.badge": "Billetterie 2027",
    "tickets.opening.title": "La billetterie ouvre",
    "tickets.opening.date": "mardi 13 octobre à 10h",
    "tickets.opening.body":
      "Une journée au CENTQUATRE-PARIS avec toute la communauté francophone du Cloud Native — le 3 juin 2027.",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "3 juin 2027 — CENTQUATRE-PARIS",
    "seo.default_description":
      "Cloud Native Days France — 3 juin 2027 au CENTQUATRE-PARIS. Conférence cloud-native, DevOps et IA par et pour les praticiens. #CNDFrance",
    "seo.og_site_name": "Cloud Native Days France",
    "seo.og_image_alt":
      "Cloud Native Days France — 3 juin 2027 au CENTQUATRE-PARIS",
    "toggle.aria": "Selecteur de langue",
    "theme.toggle.aria.to_dark": "Basculer en mode sombre",
    "theme.toggle.aria.to_light": "Basculer en mode clair",
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "3 juin 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Prenez votre place",
    "hero.cta.schedule": "Voir le programme",
    "hero.description":
      "La communaut\u00e9 francophone passionn\u00e9e de devops et de cloud native se retrouve \u00e0 Paris. Une journ\u00e9e de retours d'exp\u00e9rience et de rencontres - ouverte \u00e0 toutes et tous, des juniors curieux \u00e0 l'archi senior jusqu'aux d\u00e9cideurs en qu\u00eate des derni\u00e8res tendances.",
    "hero.logo_alt": "Cloud Native Days France",
    "countdown.days": "jours",
    "countdown.hours": "heures",
    "countdown.minutes": "minutes",
    "countdown.seconds": "secondes",
    "countdown.aria_template":
      "Plus que {days} {daysLabel}, {hours} {hoursLabel} et {minutes} {minutesLabel}",
    "hero.post_event": "L'evenement est termine !",
    "hero.cta.replays": "Voir les replays",
    "keynumbers.heading": "L'évènement en chiffres",
    "keynumbers.attendees": "Participant(e)s attendu(e)s",
    "keynumbers.talks": "Conférences",
    "keynumbers.partners": "Partenaires",
    "cfp.heading": "Appel à conférences",
    "cfp.status.coming_soon": "Bientôt ouvert",
    "cfp.status.open": "CFP ouvert",
    "cfp.status.closed": "CFP clôturé",
    "cfp.description.coming_soon":
      "Le CFP ouvrira prochainement. Inscrivez-vous pour être notifié(e).",
    "cfp.description.open":
      "Proposez votre conférence pour Cloud Native Days France 2027.",
    "cfp.closed.note":
      "CFP clôturé — merci à toutes les personnes ayant soumis une proposition. Rendez-vous le 3 juin 2027.",
    "cfp.cta.notify": "Me notifier",
    "cfp.cta.submit": "Soumettre une conférence",
    "cfp.deadline": "Clôture le {date}",
    // Phase copy for the commit-flipped phase system (src/config/cfp.ts).
    "cfp.meta.title": "Appel à conférences (CFP)",
    "cfp.meta.description":
      "Proposez votre conférence à Cloud Native Days France 2027 : 7 thèmes, 3 formats.",
    "cfp.coming_soon.title": "L'appel à propositions arrive",
    "cfp.coming_soon.body":
      "Inscrivez-vous à la newsletter pour être alerté(e) dès l'ouverture.",
    "cfp.closed.title": "Le CFP est clôturé",
    "cfp.closed.body":
      "Merci pour vos propositions ! Le programme arrive bientôt — on vous concocte un programme aux petits oignons. 🧑‍🍳",
    "speakers.heading": "Nos intervenant(e)s",
    "speakers.subtext":
      "Découvrez les intervenant(e)s de Cloud Native Days France 2026.",
    "speakers.keynote_rail_label": "Keynote d'ouverture",
    "speakers.keynote_badge_mc": "Maître de cérémonie",
    "speakers.regular_rail_label": "Conférences",
    "speakers.keynote_badge": "Keynote",
    "speakers.track_prefix": "Salle",
    "speakers.view_profile": "Voir le profil",
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
    "sponsors.page.title": "Nos partenaires",
    "sponsors.page.intro":
      "Merci aux organisations qui rendent Cloud Native Days France possible.",
    "sponsors.page.empty":
      "La liste des partenaires sera annoncée prochainement.",
    "sponsors.empty_state":
      "Les partenaires de cette édition seront annoncés prochainement.",
    "sponsors.year_pending":
      "À venir — la liste des partenaires sera annoncée prochainement.",
    "sponsors.stands_2026.heading": "Stands de l'édition 2026",
    "sponsors.stands_2026.intro":
      "Un aperçu de quelques stands de l'édition 2026 : retrouvez l'ambiance et les partenaires qui rendent l'événement possible.",
    "sponsors.stands_2026.alt": "Stand {name} à Cloud Native Days France 2026",
    "sponsors.year_pending_2027.lead":
      "À venir — Nos premiers partenaires de l'édition 2027 seront annoncés fin 2026.",
    "sponsors.year_pending_2027.cta":
      "Retrouvez nos partenaires 2026 sans qui CND France n'aurait pas été possible.",
    "sponsors.year_pending_2027.link": "Voir les partenaires 2026",
    "sponsors.tier_pending": "À venir",
    "sponsors.tier.platinum": "Platinum",
    "sponsors.tier.gold": "Gold",
    "sponsors.tier.silver": "Silver",
    "sponsors.tier.end_user": "End-User",
    "sponsors.tier.community": "Communautaires",
    "sponsors.tier.experiences": "Partenaires Expériences",
    "sponsors.tier.media": "Presse & Médias",
    "sponsors.tier.institutional": "Écoles & Institutionnels",
    "sponsors.cta.heading": "Devenez partenaire",
    "sponsors.cta.body":
      "Associez votre entreprise à l'événement cloud-native francophone de référence et profitez d'une visibilité forte auprès d'un écosystème engagé de décideur(se)s, d'expert(e)s, et de leaders technologiques.",
    "sponsors.cta.button": "Nous contacter",
    "sponsors.card.aria": "Visiter le site de {name} (nouvelle fenêtre)",
    "sponsors.homepage.heading": "Nos partenaires Platinum",
    "sponsors.homepage.cta": "Voir tous les sponsors",
    "talks.track.cloud-infra": "Cloud & Infra",
    "talks.track.devops-platform": "DevOps & Platform",
    "talks.track.security": "Security",
    "talks.track.community": "Community",
    "venue.heading": "Lieu",
    "venue.rail_label": "Lieu & informations pratiques",
    "venue.event_date": "3 juin 2027",
    "venue.event_hours": "09h00 \u2014 19h00",
    "venue.description":
      "Ancien service des pompes funèbres de Paris reconverti en établissement culturel public, le CENTQUATRE-PARIS est un lieu atypique au cœur du 19e arrondissement. Ses grandes halles industrielles accueillent chaque année conférences, performances et rencontres artistiques. C'est le décor original que nous avons choisi pour réunir 2500 praticiens du devops et du cloud native.",
    "venue.website_cta": "Voir le site du CENTQUATRE",
    "venue.map_larger": "Voir en plus grand",
    "venue.transport.rail_label": "S'y rendre",
    "venue.transport.heading": "Transports",
    "venue.transport.metro": "Métro",
    "venue.transport.metro_riquet": "Riquet — ligne 7",
    "venue.transport.metro_riquet_time": "~2 min à pied",
    "venue.transport.metro_stalingrad": "Stalingrad — lignes 2, 5 et 7",
    "venue.transport.metro_stalingrad_time": "~8 min à pied",
    "venue.transport.rer": "RER",
    "venue.transport.rer_detail": "~8 min a pied",
    "venue.transport.bus": "Bus",
    "venue.transport.bus_detail": "Arret Curial ou Rosa Parks",
    "venue.transport.car": "Voiture",
    "venue.transport.car_main": "Stationnement très limité",
    "venue.transport.car_detail":
      "Parking Indigo Aubervilliers. Privilégiez les transports.",
    "venue.access.rail_label": "Accessibilité",
    "venue.access.heading": "Le CENTQUATRE est accessible à tous",
    "venue.access.pmr": "Accès PMR",
    "venue.access.elevators": "Ascenseurs",
    "venue.access.toilets": "Toilettes PMR",
    "venue.access.guide_dogs": "Chiens guides admis",
    "venue.access.note":
      "Le site CENTQUATRE-PARIS est certifié accessible aux personnes à mobilité réduite. Contactez l'équipe de l'événement pour des besoins spécifiques.",
    "schedule.heading": "Programme",
    "schedule.parcours.heading": "Les parcours",
    "schedule.parcours.hint":
      "Survolez un parcours pour en lire la description.",
    "schedule.rail_label": "Programme \u2014 3 juin 2027",
    "schedule.rail_label.2026": "Programme \u2014 03 F\u00e9vrier 2026",
    "schedule.subtitle":
      "50+ conf\u00e9rences sur 4 salles en parall\u00e8le. Construisez votre agenda personnel, exportez-le en .ics.",
    // Per-edition, resolved like `schedule.rail_label.<year>`: 2027 gains a
    // fifth room, and that room — not a track — is what carries the strategic
    // orientation. Talks in it sit in the ordinary parcours; the room is the
    // signal. The subtitle is where a visitor learns this before meeting a
    // five-column grid.
    "schedule.subtitle.2027":
      "70+ conf\u00e9rences sur 5 salles en parall\u00e8le, dont une consacr\u00e9e \u00e0 la strat\u00e9gie et aux enjeux d'organisation dans nos entreprises. Construisez votre agenda personnel, exportez-le en .ics.",
    // Shown under the room name in the grid header. Editorial, not derived: in
    // an early programme every room looks single-track, so inferring this from
    // the data would badge all five.
    "schedule.room_note.2027.Eiffel": "Strat\u00e9gie & Leadership",
    "schedule.empty_state":
      "Le programme de cette édition sera publié prochainement.",
    "schedule.notice.2027_coming":
      "Le programme de la prochaine édition sera annoncé en février 2027. En attendant, retrouvez ci-dessous la programmation 2026 ou (re)visionnez les conférences 2026 sur notre chaîne YouTube !",
    "speakers.notice.2027_coming":
      "Les intervenant(e)s 2027 ne sont pas encore connu(e)s, le programme de la prochaine édition sera annoncé en février 2027. En attendant, retrouvez ci-dessous les intervenant(e)s 2026 ou (re)visionnez les conférences 2026 sur notre chaîne YouTube !",
    "schedule.notice.watch_playlist": "Replays 2026",
    "schedule.download_pdf": "Téléchargez le programme {year}",
    "schedule.view_speakers": "Voir les intervenant(e)s",
    "schedule.filter.toolbar": "Filtres du programme",
    "schedule.filter.label_room": "Salle",
    "schedule.filter.label_format": "Format",
    "schedule.filter.label_track": "Theme",
    "schedule.filter.label_level": "Niveau",
    "schedule.filter.row_physical": "Salle & format",
    "schedule.filter.row_content": "Theme & niveau",
    "schedule.filter.clear_all": "Reinitialiser",
    "schedule.filter.active_singular": "filtre actif",
    "schedule.filter.active_plural": "filtres actifs",
    "schedule.filter.all_rooms": "Toutes les salles",
    "schedule.filter.all_formats": "Tous formats",
    "schedule.filter.all_tracks": "Toutes les tracks",
    "schedule.filter.all_levels": "Tous niveaux",
    "schedule.format.keynote": "Keynote",
    "schedule.format.talk": "Talk",
    "schedule.format.lightning": "Lightning",
    "schedule.format.workshop": "Workshop",
    // "Tout public", not "Debutant": the value comes from the Pretalx question
    // "Niveau de la présentation", whose first option speakers actually answer is
    // "Tout public" — accessible to anyone. Rendering that as "Debutant" would tell
    // an experienced attendee the talk is basic, which is not what the speaker said.
    "schedule.level.beginner": "Tout public",
    "schedule.level.intermediate": "Intermediaire",
    "schedule.level.advanced": "Avance",
    "schedule.open_feedback": "Donner son feedback",
    "schedule.open_slides": "Voir les slides",
    "schedule.open_recording": "Voir le replay",
    "schedule.bookmark_toggle": "Ajouter a mon agenda",
    "schedule.agenda.label": "Mon agenda",
    "schedule.agenda.title": "Votre agenda personnel",
    "schedule.agenda.empty":
      "Aucune session bookmarkee. Cliquez sur l'icone marque-page d'une session pour l'ajouter.",
    "schedule.agenda.remove": "Retirer",
    "schedule.agenda.clash": "chevauche {title} ({room})",
    "schedule.export_all": "Exporter le programme (.ics)",
    "schedule.export_agenda": "Exporter mon agenda (.ics)",
    "schedule.close": "Fermer",
    "schedule.view.grid": "Grille",
    "schedule.view.list": "Liste",
    "schedule.view.toggle": "Affichage",
    "schedule.search.placeholder": "Rechercher un talk, un orateur, un sujet…",
    "schedule.search.label": "Rechercher dans le programme",
    "schedule.search.clear": "Effacer la recherche",
    "schedule.results.count": "{n} sessions sur {total}",
    "schedule.results.none": "Aucune session ne correspond à votre recherche.",
    "schedule.filters.button": "Filtres",
    "schedule.break.label": "Pause",
    "schedule.break.lunch": "Pause déjeuner",
    "replays.heading": "Replays",
    "replays.lead": "Revivez les conférences de Cloud Native Days France 2027.",
    "replays.back_to_schedule": "Retour au programme",
    "replays.empty.heading": "Replays à venir",
    "replays.empty.body":
      "Les enregistrements seront publiés après l'événement.",
    "replays.watch": "Regarder le replay",
    "team.page.title": "L'équipe",
    "team.page.intro":
      "Un grand merci à celles et à ceux qui donnent de leur temps et de leur énergie pour organiser Cloud Native Days France et rassembler tout l’écosystème.",
    "team.page.empty": "L'équipe sera annoncée prochainement.",
    "team.group.equipe-principale": "Équipe principale",
    "team.group.comite-selection": "Comité de sélection",
    "team.group.autres-benevoles": "Autres bénévoles",
    "team.intro.equipe-principale":
      "Ensemble, nous œuvrons toute l'année pour vous organiser Cloud Native Days France !",
    "team.intro.comite-selection":
      "Ils évaluent les propositions de conférences et aident à l'établissement de la programmation.",
    "team.intro.autres-benevoles":
      "Ces bénévoles nous aident le jour J, épaulé(e)s par de nombreux(ses) étudiant(e)s de nos écoles partenaires.",
    "legal.coc.title": "Code de conduite",
    "legal.privacy.title": "Politique de confidentialité",
    "legal.terms.title": "Mentions légales",
    "legal.last_updated": "Dernière mise à jour : {date}",
    "footer.tagline":
      "La conférence de référence sur le Cloud Native et le DevOps",
    "footer.association":
      "Organisé sous le statut d'association 1901, par l'association Cloud Native France.",
    "footer.nav.heading": "Navigation",
    "footer.community.heading": "Suivez-nous",
    "newsletter.heading":
      "Annonces importantes ? Programme ? Début du CFP ?",
    "newsletter.body": "Restez informé(e) des annonces importantes.",
    "newsletter.cta": "S'inscrire",
    "newsletter.cta_aria":
      "S'inscrire à la newsletter Cloud Native Days France",
    "newsletter.note":
      "Un email par annonce importante. Désinscription en un clic.",
    "social.hashtag": "#CNDFrance",
    "footer.legal.heading": "Légal",
    "footer.legal.coc": "Code de conduite",
    "footer.legal.privacy": "Confidentialité",
    "footer.legal.terms": "Mentions légales",
    "footer.copyright": "© 2027 Cloud Native France · Association loi 1901",
    "footer.social.linkedin_aria":
      "LinkedIn Cloud Native France (nouvelle fenêtre)",
    "footer.social.youtube_aria":
      "YouTube Cloud Native France (nouvelle fenêtre)",
    "footer.social.bluesky_aria":
      "Bluesky Cloud Native France (nouvelle fenêtre)",
    "footer.social.gallery_aria": "Voir la galerie photo",
    "nav.contact": "Contact",
    "contact.eyebrow": "Contact",
    "contact.heading": "Contactez-nous",
    "contact.lead":
      "Toute l'équipe de bénévoles organisateur(rice)s est mobilisée et à votre disposition pour répondre à vos questions. Envoyez-nous un mail à l'adresse qui correspond à votre demande.",
    "contact.participants.title": "Participant(e)s",
    "contact.participants.body":
      "Une question sur les billets, la logistique ou la programmation ?",
    "contact.speakers.title": "Intervenant(e)s",
    "contact.speakers.body":
      "Pour toute question relative au CFP, à votre intervention ou à la prise en charge.",
    "contact.sponsors.title": "Partenaires",
    "contact.sponsors.body":
      "Vous souhaitez soutenir l'événement ou avez une question sur votre stand ?",
    "contact.community.helper": "Suivez-nous aussi sur nos réseaux",
    "notfound.heading": "Page introuvable",
    "notfound.lead": "Cette page n'existe pas ou a été déplacée.",
    "notfound.home": "Retour à l'accueil",
    "footer.landmark_aria": "Pied de page",
    "editions.2026.heading": "Revivez l'édition 2026",
    "editions.2026.gallery_cta": "Voir le reportage photo",
    "editions.2026.context_body":
      "Le mardi 3 février dernier, 1700+ personnes et 40+ partenaires se sont réunis au CENTQUATRE-PARIS autour de 60 conférences sur des sujets Infrastructure, DevOps, Cloud Native et Open Source. La programmation a été saluée, orientée expertise et sans discours commercial, avec de nombreux retours d'expérience d'organisations Françaises comme Mistral AI, Air France, Winamax, Decathlon, Renault, Ledger, Ubisoft, l'INSEE, la DINUM…",
    "editions.2026.video_caption": "Cloud Native Days France : le FILM",
    "editions.2026.video_play_aria": "Lire la vidéo : {title}",
    "editions.2026.stats.participants": "1\u00a0850+ participant\u00b7e\u00b7s",
    "editions.2026.stats.speakers": "48 intervenant(e)s invité(e)s",
    "editions.2026.stats.sessions": "32 conférences",
    "editions.2026.placeholder_badge": "CONTENU PLACEHOLDER",
    "editions.2026.thumbnail_alt.1":
      "Photo CND France 2026 — ambiance salle principale",
    "editions.2026.thumbnail_alt.2":
      "Photo CND France 2026 — moment de networking",
    "editions.2026.thumbnail_alt.3":
      "Photo CND France 2026 — vue générale de l'événement",
    "editions.2026.view_all_replays": "Voir tous les replays",
    "editions.2026.top_replay.1":
      "Keynote d'ouverture Cloud Native Days France 2026",
    "editions.2026.top_replay.2":
      "REX Mistral AI — Construire un fournisseur cloud de zéro : ClusterAPI dans le datacenter",
    "editions.2026.top_replay.3":
      "REX Renault — Kubernetes as a Service : sécurité, innovation et self-service à grande échelle",
    "editions.2026.top_replay.4":
      "REX SNCF — Smells like Cloud Kubernetes : notre Kube managé on-premise",
    "editions.2026.top_replay.5":
      "REX Sellsy — Migrer 50 000 BDDs sans coupure vers PostgreSQL et K8s : mission impossible ?",
    "editions.2026.top_replay.6":
      "SRE sous pression : santé mentale, charge invisible et fatigue du « héros de la prod »",
    "editions.placeholder_badge_aria":
      "Contenu placeholder — voir le ticket de suivi (nouvelle fenêtre)",
    "editions.2023.compact_title":
      "Édition 2023 (Kubernetes Community Days France)",
    "editions.2023.heading": "Souvenirs de l'édition 2023",
    "editions.2023.gallery_cta": "Voir la galerie complète",
    "editions.2023.video_caption": "Aftermovie de l'édition KCD France 2023",
    "editions.2023.video_cta": "Voir sur YouTube",
    "editions.2023.view_page_cta": "Voir l'édition 2023 →",
    "editions.2023.stats.participants": "1\u00a0700+ participant(e)s",
    "editions.2023.stats.speakers": "42 intervenant(e)s",
    "editions.2023.stats.sessions": "24 sessions",
    "editions.2023.brand_note":
      "KCD 2023 — première édition francophone organisée sous l'égide de la CNCF.",
    "editions.2023.thumbnail_alt.1":
      "Vue plongeante de l'auditorium du Centre Georges Pompidou rempli d'une communauté cloud-native francophone attentive",
    "editions.2023.thumbnail_alt.2":
      "Prise de parole d'ouverture sur la grande scène KCD France 2023, public de face",
    "editions.2023.thumbnail_alt.3":
      "Discussions informelles dans le hall d'accueil de Beaubourg entre deux sessions",
    "editions.2023.thumbnail_alt.4":
      "Keynote inaugurale projetée sur l'écran principal de la salle plénière",
    "editions.2023.thumbnail_alt.5":
      "Groupe de participant(e)s échangeant autour d'un café, badges CNCF au cou",
    "editions.2023.thumbnail_alt.6":
      "Stand d'un partenaire sponsor animé par deux hôtes, signalétique KCD visible",
    "editions.2023.thumbnail_alt.7":
      "Allée centrale bordée de stands communautaires, ambiance animée",
    "editions.2023.thumbnail_alt.8":
      "Atelier technique hands-on autour d'un cluster Kubernetes projeté",
    "editions.2023.thumbnail_alt.9":
      "Micro tendu à un(e) participant(e) lors de la session questions-réponses",
    "editions.2023.thumbnail_alt.10":
      "Vue d'ensemble de la journée capturée en fin de soirée dans le foyer",
    "editions.2023.photo_alt.01":
      "Vue plongeante de l'auditorium du Centre Georges Pompidou rempli d'une communauté cloud-native francophone attentive",
    "editions.2023.photo_alt.02":
      "Prise de parole d'ouverture sur la grande scène KCD France 2023, public de face",
    "editions.2023.photo_alt.03":
      "Discussions informelles dans le hall d'accueil de Beaubourg entre deux sessions",
    "editions.2023.photo_alt.04":
      "Keynote inaugurale projetée sur l'écran principal de la salle plénière",
    "editions.2023.photo_alt.05":
      "Groupe de participant(e)s échangeant autour d'un café, badges CNCF au cou",
    "editions.2023.photo_alt.06":
      "Stand d'un partenaire sponsor animé par deux hôtes, signalétique KCD visible",
    "editions.2023.photo_alt.07":
      "Allée centrale bordée de stands communautaires, ambiance animée",
    "editions.2023.photo_alt.08":
      "Atelier technique hands-on autour d'un cluster Kubernetes projeté",
    "editions.2023.photo_alt.09":
      "Micro tendu à un(e) participant(e) lors de la session questions-réponses",
    "editions.2023.photo_alt.10":
      "Vue d'ensemble de la journée capturée en fin de soirée dans le foyer",
    "editions.2023.photo_open_label": "Ouvrir la photo en grand : {alt}",
    "editions.2023.brand_history.heading":
      "Une édition historique — KCD France",
    "editions.2023.brand_history.body":
      "TODO(19) I18N-03 — placeholder en attente de la relecture organisateur : en 2023, l'événement s'appelait à l'origine Kubernetes Community Days France (KCD France) ; il a été rebaptisé Cloud Native Days France en 2026 pour refléter la diversité de l'écosystème cloud-native francophone.",
    "editions.2023.brand_history.venue":
      "Lieu : Centre Georges Pompidou, Paris — Beaubourg.",
    "editions.2023.brand_history.logo_alt":
      "Logo Kubernetes Community Days France 2023 (KCD France)",
    "editions.2023.lightbox.dialog_label":
      "Galerie photos KCD France 2023 — visionneuse",
    "editions.2023.lightbox.close": "Fermer la visionneuse",
    "editions.2023.lightbox.prev": "Photo précédente",
    "editions.2023.lightbox.next": "Photo suivante",
    "editions.2023.lightbox.counter_template": "{index} sur {total}",
    "editions.2023.page.title":
      "Édition 2023 — KCD France | Cloud Native Days France",
    "editions.2023.page.meta_description":
      "Revivez la première édition francophone (KCD France 2023) au Centre Georges Pompidou : keynotes, photos et moments forts.",
    "editions.2023.page.rail": "Édition 2023",
    "editions.2023.page.heading":
      "KCD France 2023 — notre première édition au Pompidou",
    "editions.2023.page.intro":
      "Retour en images sur la première édition francophone, organisée au Centre Georges Pompidou sous le nom Kubernetes Community Days France.",
    // --- Feature flags (coming-soon layout) ---
    "flags.soon.notify_cta": "Être prévenu(e)",
    "flags.soon.opens_on": "Ouverture le {date}",
    "flags.programme.soon.title": "Le programme arrive",
    "flags.programme.soon.body":
      "Le programme complet sera dévoilé en avril 2027.",
    "nav.discover": "Découvrir",
    "hero.cta.discover": "Découvrir l'événement",
    "discover.page.title": "Découvrir CND France",
    "discover.page.description":
      "Découvrez l'événement cloud-native de référence en France : ambiance, valeurs, talks 2026.",
    "discover.hero.title": "Découvrir CND France",
    "discover.hero.subtitle": "L'événement cloud-native de référence en France",
    "discover.hero.bestof.caption": "CND France : le FILM",
    "discover.hero.coulisses.caption": "CND France : les COULISSES",
    "discover.intro.p1":
      "La communauté francophone passionnée de devops et de cloud native se retrouve à Paris. Une journée de retours d'expérience et de rencontres ouverte à toutes et tous : des profils juniors curieux aux architectes senior jusqu'aux personnes décideuses en quête des dernières tendances.",
    "discover.intro.p2":
      "CND France n'est pas un n-ième \"salon\" tech, c'est une journée de rassemblement de tout l'écosystème prônant le partage d'expertise et d'expérience dans un lieu atypique et plein de charme.",
    "discover.intro.highlights.title": "CND France se distingue par :",
    "discover.intro.highlights.talks":
      "Des conférences de grande qualité sélectionnées parmi des centaines de propositions : orientées expertise et retours d'expériences concrets, sans aucun discours commercial.",
    "discover.intro.highlights.partners":
      "Un village de partenaires sélectionnés uniquement s'ils sont pertinents pour nos participant(e)s : des acteurs de référence avec des solutions et services que vous utilisez au quotidien.",
    "discover.gallery.title": "L'ambiance 2026 en images",
    "discover.gallery.lightbox.close": "Fermer",
    "discover.gallery.lightbox.prev": "Photo précédente",
    "discover.gallery.lightbox.next": "Photo suivante",
    "discover.gallery.album_cta": "Voir l'album photo",
    "discover.values.title": "Notre démarche",
    "discover.values.body":
      "Depuis 2023, nous essayons de pousser tous les curseurs de qualité au maximum : exigence de la programmation, qualité des repas, lieu unique, proposer les stands partenaires les plus intéressants pour vous. Parmi nos valeurs, nous croyons à l'importance de l'autonomie numérique (open source, multi-fournisseur…), à la richesse collective derrière la diversité des profils et à l'apprentissage entre pairs. Nous essayons aussi de proposer un événement avec l'empreinte écologique la plus limitée possible.",
    "discover.stats.participants": "participant(e)s",
    "discover.stats.talks": "conférences",
    "discover.stats.speakers": "intervenant(e)s",
    "discover.stats.tracks": "tracks",
    "discover.audience.title": "À qui s'adresse Cloud Native Days France ?",
    "discover.audience.subtitle":
      "CND France se destine aux professionnel(le)s de l'IT avec une appétence technique sur l'infrastructure et le Cloud, le DevOps, Kubernetes et le Cloud Native, ou encore le Platform Engineering.",
    "discover.audience.dev.title": "Développeur(se)",
    "discover.audience.dev.topics":
      "CI/CD · Dev Experience · IA applicative · Architecture microservices",
    "discover.audience.cloud.title": "Ingénieur(e) Cloud & DevOps",
    "discover.audience.cloud.topics":
      "Kubernetes · GitOps · IaC · Platform Engineering · FinOps",
    "discover.audience.ops.title": "Ops & SRE",
    "discover.audience.ops.topics":
      "Infrastructure · Réseau · Sécurité · Observabilité",
    "discover.audience.lead.title": "Tech Lead & Architecte",
    "discover.audience.lead.topics":
      "Architecture distribuée · Multi-cloud · Gouvernance",
    "discover.audience.cto.title": "CTO, DSI & VP…",
    "discover.audience.cto.topics":
      "Stratégie et ROI cloud · Autonomie numérique · IA en production · Tendances",
    "discover.replays.title": "Les talks 2026",
    "discover.replays.cta": "Voir tous les replays",
    "tickets.meta.title": "Billetterie · CND France 2027",
    "tickets.meta.description":
      "Votre place pour CND France 2027, le jeudi 3 juin au CENTQUATRE-PARIS\u00a0: les tarifs, venir en équipe, utiliser un code.",
    "tickets.h1": "Votre place pour CND France 2027",
    "tickets.when": "{date} · {venue}, Paris 19e",
    "tickets.advice.lead": "Un conseil\u00a0:",
    "tickets.advice":
      "prenez votre place sans tarder, nous attendons plus de 2\u202f500 participants.",
    "tickets.door.code": "J'ai un code",
    // {name} is the config's ticket name, capitalised by the card title.
    "tickets.offer.ticket": "Billet {name}",
    "tickets.offer.ttc": "TTC",
    "tickets.offer.last_seats": "Dernières places",
    "tickets.purchase.buy": "Acheter mon billet",
    "tickets.new_tab": "(nouvel onglet)",
    // "Quatre" is the config's four tiers.
    "tickets.ladder.title": "Quatre tarifs jusqu'au jour J",
    "tickets.ladder.until_or_sold_out":
      "Jusqu'au {date} ou\u00a0épuisement\u00a0des\u00a0stocks",
    "tickets.ladder.limited_stock": "Places limitées",
    "tickets.ladder.sold_out": "Épuisé",
    // Screen readers only.
    "tickets.ladder.current": "Tarif en cours",
    "tickets.team.per_person": "par personne",
    "tickets.team.per_person.short": "/pers.",
    "tickets.team.only": "Tarifs valables uniquement sur le billet {name}.",
    "tickets.team.rate.4_9": "De 4 à 9 personnes",
    "tickets.team.rate.10_plus": "10 personnes et plus",
    "tickets.team.cta.group": "Demander mon tarif de groupe",
    "tickets.team.title": "Venir en équipe",
    "tickets.team.mail.subject": "Billets de groupe CND France 2027",
    "tickets.team.mail.body":
      "Bonjour,\n\nNous souhaitons venir à plusieurs à CND France 2027.\n\nSociété\u00a0:\nNombre de participant(e)s\u00a0:\nBesoin (devis, facture, virement)\u00a0:\nContact\u00a0:\n",
    "tickets.code.intro": "Partenaire, invitation ou code promo.",
    "tickets.code.label": "Votre code",
    "tickets.code.submit": "Utiliser mon code",
    "tickets.code.empty": "Saisissez votre code pour continuer.",
    "tickets.strategic.audience":
      "Le billet {strategic} s'adresse à celles et ceux qui occupent des fonctions de direction et de décision\u00a0: CEO, CTO, DSI, VPs…",
    "tickets.strategic.perks":
      "En plus de toute l'expérience CND France, il donne accès à un parcours de conférences exclusif dédié aux enjeux stratégiques, avec des intervenant(e)s sélectionné(e)s par un comité dédié, ainsi qu'à un lounge pour échanger entre pairs.",
    "tickets.strategic.new": "Nouveauté 2027",
    "tickets.strategic.seats": "{count} places seulement",
    "tickets.strategic.track": "Découvrir le parcours Stratégie & Leadership",
    "tickets.included.title": "Ce que comprend votre billet",
    "tickets.included.talks":
      "Les conférences et retours d'expérience de la journée",
    "tickets.included.village": "L'accès au village partenaires",
    "tickets.included.meals": "Le déjeuner, le café et de quoi grignoter",
    "tickets.included.goodies": "Des goodies exclusifs",
    "tickets.included.evening.title": "Une soirée pour prolonger la journée",
    "tickets.included.evening.new": "Nouveauté 2027",
    "tickets.included.evening.body":
      "La soirée est comprise dans le billet, sans option à ajouter. L'occasion de faire de nouvelles rencontres, d'échanger entre pairs, de revenir sur les conférences de la journée ou, tout simplement, de se détendre.",
    "tickets.faq.title": "Questions fréquentes",
    "tickets.faq.payment.q": "Comment se passe le paiement\u202f?",
    "tickets.faq.payment.a":
      "Par carte bancaire, via Stripe. Besoin de payer par virement\u202f? Écrivez-nous à",
    "tickets.faq.change.q": "Quand le prix change-t-il\u202f?",
    "tickets.faq.change.a":
      "Le tarif en cours s'arrête à la date affichée, ou plus tôt si le stock de places associé est épuisé. Puis le tarif suivant prend le relais aussitôt.",
    "tickets.faq.strategic.q":
      "Le parcours Stratégie & Leadership est-il ouvert à tous\u202f?",
    "tickets.faq.strategic.a":
      "Non, ses conférences et son lounge sont réservés aux titulaires du billet {strategic}. Le billet {standard} donne accès à toutes les autres conférences de la journée.",
    "tickets.faq.ttc.q": "Les prix affichés sont-ils TTC\u202f?",
    "tickets.faq.ttc.a": "Oui, TVA à {rate} comprise.",
    "tickets.faq.per_order.q": "Combien de places par commande\u202f?",
    "tickets.faq.per_order.a":
      "Jusqu'à {early} pendant les Super Early Bird et Early Bird, pour qu'ils profitent au plus grand nombre, puis jusqu'à {later}. Pour plus de places, écrivez-nous à",
    "tickets.faq.invoice.q":
      "Puis-je avoir une facture au nom de ma société\u202f?",
    "tickets.faq.invoice.a":
      "Oui, elle arrive automatiquement par mail, avec votre billet. Pensez bien à renseigner les informations de votre société lors du paiement. En cas de problème, écrivez-nous à",
    "tickets.faq.code.q":
      "J'ai un code partenaire ou une invitation, comment faire\u202f?",
    "tickets.faq.code.a":
      "Saisissez-le dans «\u00a0J'ai un code\u00a0», juste sous les billets. Vous avez reçu un lien\u202f? Cliquez dessus, le code s'applique tout seul.",
    "tickets.faq.inclusion.q":
      "Existe-t-il un tarif étudiant ou solidaire\u202f?",
    "tickets.faq.inclusion.a":
      "Oui, au cas par cas, pour les étudiant(e)s et pour celles et ceux que le prix empêcherait de venir. Écrivez-nous à",
    "tickets.faq.access.q":
      "Le lieu est-il accessible à toutes et à tous\u202f?",
    "tickets.faq.access.a":
      "Oui\u00a0: accès en fauteuil, ascenseurs, toilettes adaptées, chiens guides bienvenus. Pour un besoin particulier, écrivez-nous.",
    "tickets.faq.access.link": "Informations pratiques",
    "tickets.faq.coc.q": "Y a-t-il un code de conduite\u202f?",
    "tickets.faq.coc.a": "Oui. Chaque participant(e) s'engage à le respecter.",
    "tickets.faq.coc.link": "Lire le code de conduite",
    "tickets.faq.programme.q": "Quand le programme sera-t-il publié\u202f?",
    "tickets.faq.programme.a": "Le programme 2027 sera publié {when}.",
    "tickets.inclusion.mail.subject": "Demande de tarif inclusion ou étudiant",
    "tickets.inclusion.mail.body":
      "Bonjour,\n\nJe souhaite venir à CND France 2027 et bénéficier d'un tarif inclusion ou étudiant.\n\nMa situation en quelques mots\u00a0:\n\nNom\u00a0:\nÉcole ou structure (le cas échéant)\u00a0:\n",
    "tickets.wire.mail.subject": "Paiement par virement CND France 2027",
    "tickets.wire.mail.body":
      "Bonjour,\n\nJe souhaite payer par virement mes billets pour CND France 2027.\n\nBillet ({standard} ou {strategic})\u00a0:\nNombre de places\u00a0:\nNom\u00a0:\nSociété (le cas échéant)\u00a0:\n",
    "tickets.per_order.mail.subject":
      "Plus de places par commande CND France 2027",
    "tickets.per_order.mail.body":
      "Bonjour,\n\nJe souhaite commander pour CND France 2027 plus de places que le maximum par commande.\n\nBillet ({standard} ou {strategic})\u00a0:\nNombre de places\u00a0:\nNom\u00a0:\nSociété (le cas échéant)\u00a0:\n",
    "tickets.sticky.buy": "Acheter",
  },
  en: {
    "nav.home": "About",
    "nav.schedule": "Schedule",
    "nav.speakers": "Speakers",
    "nav.sponsors": "Partners",
    "nav.venue": "Practical info",
    "nav.team": "Team",
    "nav.tickets": "Tickets",
    "nav.cfp": "CFP",
    "nav.replays": "Replays",
    "nav.programme.label": "Schedule",
    "nav.programme.submenu.programme": "Schedule",
    "nav.programme.submenu.cfp": "CFP",
    "nav.programme.submenu.intervenants": "Speakers",
    "nav.programme.submenu.archive": "Schedule {year}",
    "nav.programme.submenu.archive_intervenants": "Speakers {year}",
    "nav.sponsors.label": "Partners",
    "nav.speakers.label": "Speakers",
    "about.subnav.heading": "Explore more",
    "about.subnav.discover": "Discover CND France",
    "about.subnav.venue": "Practical info",
    "about.subnav.team": "The team",
    "about.page.placeholder": "Content for this page is coming soon.",
    "tickets.coming_soon.title": "Tickets opening soon",
    "tickets.coming_soon.body":
      "Subscribe to the newsletter to be notified when ticketing opens and benefit from Early Bird rates.",
    "tickets.opening.badge": "Ticketing 2027",
    "tickets.opening.title": "Ticket sales open",
    "tickets.opening.date": "Tuesday 13 October at 10:00",
    "tickets.opening.body":
      "One day at CENTQUATRE-PARIS with the entire French-speaking Cloud Native community — June 3, 2027.",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "June 3, 2027 — CENTQUATRE-PARIS",
    "seo.default_description":
      "Cloud Native Days France — June 3, 2027 at CENTQUATRE-PARIS. Cloud-native, DevOps and AI conference from practitioners, for practitioners. #CNDFrance",
    "seo.og_site_name": "Cloud Native Days France",
    "seo.og_image_alt":
      "Cloud Native Days France — June 3, 2027 at CENTQUATRE-PARIS",
    "toggle.aria": "Language selector",
    "theme.toggle.aria.to_dark": "Switch to dark mode",
    "theme.toggle.aria.to_light": "Switch to light mode",
    "hero.title": "Cloud Native Days France",
    "hero.subtitle": "June 3, 2027",
    "hero.venue": "CENTQUATRE-PARIS",
    "hero.cta.register": "Get your ticket",
    "hero.cta.schedule": "View schedule",
    "hero.description":
      "The French-speaking DevOps and cloud-native community comes together in Paris. A day of real-world experience reports and conversations \u2014 open to everyone, from curious juniors to senior architects all the way to decision-makers tracking the latest trends.",
    "hero.logo_alt": "Cloud Native Days France",
    "countdown.days": "days",
    "countdown.hours": "hours",
    "countdown.minutes": "minutes",
    "countdown.seconds": "seconds",
    "countdown.aria_template":
      "{days} {daysLabel}, {hours} {hoursLabel}, {minutes} {minutesLabel} remaining",
    "hero.post_event": "The event has ended!",
    "hero.cta.replays": "Watch replays",
    "keynumbers.heading": "The event in numbers",
    "keynumbers.attendees": "Expected attendees",
    "keynumbers.talks": "Talks",
    "keynumbers.partners": "Partners",
    "cfp.heading": "Call for Papers",
    "cfp.status.coming_soon": "Coming soon",
    "cfp.status.open": "CFP open",
    "cfp.status.closed": "CFP closed",
    "cfp.description.coming_soon":
      "The CFP will open soon. Sign up to be notified.",
    "cfp.description.open":
      "Submit your talk for Cloud Native Days France 2027.",
    "cfp.closed.note":
      "CFP closed — thanks to everyone who submitted. See you on June 3, 2027.",
    "cfp.cta.notify": "Notify me",
    "cfp.cta.submit": "Submit a proposal",
    "cfp.deadline": "Submissions close {date}",
    // Phase copy for the commit-flipped phase system (src/config/cfp.ts).
    "cfp.meta.title": "Call for Papers (CFP)",
    "cfp.meta.description":
      "Submit your talk to Cloud Native Days France 2027: 7 themes, 3 formats.",
    "cfp.coming_soon.title": "The Call for Papers is coming",
    "cfp.coming_soon.body":
      "Subscribe to the newsletter and we'll let you know as soon as it opens.",
    "cfp.closed.title": "The CFP is closed",
    "cfp.closed.body":
      "Thank you for your submissions! The programme is coming soon — we're cooking up something really special for you. 🧑‍🍳",
    "speakers.heading": "Our speakers",
    "speakers.subtext": "Meet the speakers from Cloud Native Days France 2026.",
    "speakers.keynote_rail_label": "Opening keynote",
    "speakers.keynote_badge_mc": "Master of ceremonies",
    "speakers.regular_rail_label": "Talks",
    "speakers.keynote_badge": "Keynote",
    "speakers.track_prefix": "Room",
    "speakers.view_profile": "View profile",
    "speakers.talks_heading": "Their talks",
    "speakers.cospeaker_prefix": "With",
    "speakers.schedule_link": "View in schedule",
    "speakers.schedule_placeholder": "Schedule coming soon",
    "speakers.empty_heading": "Speakers coming soon",
    "speakers.empty_body":
      "The speaker lineup will be announced soon. Check back later!",
    "speakers.back": "Back to speakers",
    "speakers.no_talks": "No talks announced yet.",
    "speakers.not_found": "Speaker not found. Return to the speakers page.",
    "sponsors.page.title": "Our partners",
    "sponsors.page.intro":
      "Thank you to the organizations making Cloud Native Days France possible.",
    "sponsors.page.empty": "The partner list will be announced soon.",
    "sponsors.empty_state":
      "The partners for this edition will be announced soon.",
    "sponsors.year_pending":
      "Coming soon — the partner lineup will be announced shortly.",
    "sponsors.stands_2026.heading": "Booths from the 2026 edition",
    "sponsors.stands_2026.intro":
      "A glimpse at a few booths from the 2026 edition — the atmosphere and the partners that make the event happen.",
    "sponsors.stands_2026.alt": "{name} booth at Cloud Native Days France 2026",
    "sponsors.year_pending_2027.lead":
      "Coming soon — our first 2027 partners will be announced in late 2026.",
    "sponsors.year_pending_2027.cta":
      "Meet our 2026 partners who made CND France possible.",
    "sponsors.year_pending_2027.link": "View 2026 partners",
    "sponsors.tier_pending": "Coming soon",
    "sponsors.tier.platinum": "Platinum",
    "sponsors.tier.gold": "Gold",
    "sponsors.tier.silver": "Silver",
    "sponsors.tier.end_user": "End-User",
    "sponsors.tier.community": "Community",
    "sponsors.tier.experiences": "Experience Partners",
    "sponsors.tier.media": "Press & Media",
    "sponsors.tier.institutional": "Schools & Institutional",
    "sponsors.cta.heading": "Become a partner",
    "sponsors.cta.body":
      "Partner with the leading French-speaking cloud-native event and gain strong visibility with an engaged ecosystem of decision-makers, experts, and technology leaders.",
    "sponsors.cta.button": "Contact us",
    "sponsors.card.aria": "Visit {name}'s website (opens in a new window)",
    "sponsors.homepage.heading": "Our platinum partners",
    "sponsors.homepage.cta": "View all partners",
    "talks.track.cloud-infra": "Cloud & Infra",
    "talks.track.devops-platform": "DevOps & Platform",
    "talks.track.security": "Security",
    "talks.track.community": "Community",
    "venue.heading": "Venue",
    "venue.rail_label": "Venue & practical info",
    "venue.event_date": "June 3, 2027",
    "venue.event_hours": "09:00 \u2014 19:00",
    "venue.description":
      "A former funeral-services building turned public cultural institution, CENTQUATRE-PARIS is a one-of-a-kind venue in the heart of the 19th arrondissement. Its vast industrial halls host conferences, performances, and artistic encounters year-round. It's the setting we've chosen to gather 2,500 cloud native practitioners.",
    "venue.website_cta": "Visit the CENTQUATRE website",
    "venue.map_larger": "Open larger map",
    "venue.transport.rail_label": "Getting there",
    "venue.transport.heading": "Transport",
    "venue.transport.metro": "Metro",
    "venue.transport.metro_riquet": "Riquet — line 7",
    "venue.transport.metro_riquet_time": "~2 min walk",
    "venue.transport.metro_stalingrad": "Stalingrad — lines 2, 5 and 7",
    "venue.transport.metro_stalingrad_time": "~8 min walk",
    "venue.transport.rer": "RER",
    "venue.transport.rer_detail": "~8 min walk",
    "venue.transport.bus": "Bus",
    "venue.transport.bus_detail": "Curial or Rosa Parks stop",
    "venue.transport.car": "Car",
    "venue.transport.car_main": "Very limited parking",
    "venue.transport.car_detail":
      "Parking Indigo Aubervilliers. Public transport strongly recommended.",
    "venue.access.rail_label": "Accessibility",
    "venue.access.heading": "CENTQUATRE is accessible to all",
    "venue.access.pmr": "Wheelchair access",
    "venue.access.elevators": "Elevators",
    "venue.access.toilets": "Accessible toilets",
    "venue.access.guide_dogs": "Guide dogs welcome",
    "venue.access.note":
      "CENTQUATRE-PARIS is certified accessible to people with reduced mobility. Contact the event team for specific needs.",
    "schedule.heading": "Schedule",
    "schedule.parcours.heading": "Tracks",
    "schedule.parcours.hint": "Hover a track to read what it covers.",
    "schedule.rail_label": "Schedule \u2014 June 3, 2027",
    "schedule.rail_label.2026": "Schedule \u2014 Feb 03, 2026",
    "schedule.subtitle":
      "50+ talks across 4 parallel tracks. Build your personal agenda and export it as .ics.",
    "schedule.subtitle.2027":
      "70+ talks across 5 parallel rooms, one of them devoted to strategy and the organisational challenges facing our companies. Build your personal agenda and export it as .ics.",
    "schedule.room_note.2027.Eiffel": "Strategy & Leadership",
    "schedule.empty_state":
      "The schedule for this edition will be published soon.",
    "schedule.notice.2027_coming":
      "The 2027 schedule will be announced in February 2027. In the meantime, browse the 2026 schedule below or (re)watch the 2026 talks on our YouTube channel!",
    "speakers.notice.2027_coming":
      "The 2027 speakers haven't been announced yet — the next edition's lineup will be unveiled in February 2027. In the meantime, browse the 2026 speakers below or (re)watch the 2026 talks on our YouTube channel!",
    "schedule.notice.watch_playlist": "2026 replays",
    "schedule.download_pdf": "Download the {year} schedule",
    "schedule.view_speakers": "View speakers",
    "schedule.filter.toolbar": "Schedule filters",
    "schedule.filter.label_room": "Room",
    "schedule.filter.label_format": "Format",
    "schedule.filter.label_track": "Theme",
    "schedule.filter.label_level": "Level",
    "schedule.filter.row_physical": "Room & format",
    "schedule.filter.row_content": "Theme & level",
    "schedule.filter.clear_all": "Clear all",
    "schedule.filter.active_singular": "active filter",
    "schedule.filter.active_plural": "active filters",
    "schedule.filter.all_rooms": "All rooms",
    "schedule.filter.all_formats": "All formats",
    "schedule.filter.all_tracks": "All tracks",
    "schedule.filter.all_levels": "All levels",
    "schedule.format.keynote": "Keynote",
    "schedule.format.talk": "Talk",
    "schedule.format.lightning": "Lightning",
    "schedule.format.workshop": "Workshop",
    "schedule.level.beginner": "All levels",
    "schedule.level.intermediate": "Intermediate",
    "schedule.level.advanced": "Advanced",
    "schedule.open_feedback": "Give feedback",
    "schedule.open_slides": "View slides",
    "schedule.open_recording": "Watch recording",
    "schedule.bookmark_toggle": "Add to my agenda",
    "schedule.agenda.label": "My agenda",
    "schedule.agenda.title": "Your personal agenda",
    "schedule.agenda.empty":
      "No sessions bookmarked yet. Click the bookmark icon on a session to add it.",
    "schedule.agenda.remove": "Remove",
    "schedule.agenda.clash": "overlaps with {title} ({room})",
    "schedule.export_all": "Export full schedule (.ics)",
    "schedule.export_agenda": "Export my agenda (.ics)",
    "schedule.close": "Close",
    "schedule.view.grid": "Grid",
    "schedule.view.list": "List",
    "schedule.view.toggle": "View",
    "schedule.search.placeholder": "Search a talk, a speaker, a topic…",
    "schedule.search.label": "Search the schedule",
    "schedule.search.clear": "Clear search",
    "schedule.results.count": "{n} of {total} sessions",
    "schedule.results.none": "No session matches your search.",
    "schedule.filters.button": "Filters",
    "schedule.break.label": "Break",
    "schedule.break.lunch": "Lunch break",
    "replays.heading": "Replays",
    "replays.lead": "Revisit the talks from Cloud Native Days France 2027.",
    "replays.back_to_schedule": "Back to schedule",
    "replays.empty.heading": "Recordings coming soon",
    "replays.empty.body": "Recordings will be published after the event.",
    "replays.watch": "Watch replay",
    "team.page.title": "The team",
    "team.page.intro":
      "A huge thank-you to everyone giving their time and energy to organize Cloud Native Days France and bring the whole ecosystem together.",
    "team.page.empty": "The team will be announced soon.",
    "team.group.equipe-principale": "Core team",
    "team.group.comite-selection": "Selection committee",
    "team.group.autres-benevoles": "Other volunteers",
    "team.intro.equipe-principale":
      "They organize Cloud Native Days France for you all year long.",
    "team.intro.comite-selection":
      "They review talk submissions and help shape the schedule.",
    "team.intro.autres-benevoles":
      "These volunteers help us on the day, backed by many students from our partner schools.",
    "legal.coc.title": "Code of Conduct",
    "legal.privacy.title": "Privacy Policy",
    "legal.terms.title": "Terms of Service",
    "legal.last_updated": "Last updated: {date}",
    "footer.tagline": "The reference conference on Cloud Native and DevOps",
    "footer.association":
      "Organized by the Cloud Native France association, a French non-profit (loi 1901).",
    "footer.nav.heading": "Navigation",
    "footer.community.heading": "Follow us",
    "newsletter.heading": "Important announcements? Schedule? CFP opening?",
    "newsletter.body": "Stay posted on every important announcement.",
    "newsletter.cta": "Subscribe",
    "newsletter.cta_aria":
      "Subscribe to the Cloud Native Days France newsletter",
    "newsletter.note":
      "One email per important announcement. Unsubscribe in one click.",
    "social.hashtag": "#CNDFrance",
    "footer.legal.heading": "Legal",
    "footer.legal.coc": "Code of Conduct",
    "footer.legal.privacy": "Privacy",
    "footer.legal.terms": "Terms",
    "footer.copyright":
      "© 2027 Cloud Native France · non-profit association (loi 1901)",
    "footer.social.linkedin_aria":
      "Cloud Native France on LinkedIn (new window)",
    "footer.social.youtube_aria": "Cloud Native France on YouTube (new window)",
    "footer.social.bluesky_aria": "Cloud Native France on Bluesky (new window)",
    "footer.social.gallery_aria": "View the photo gallery",
    "nav.contact": "Contact",
    "contact.eyebrow": "Contact",
    "contact.heading": "Get in touch",
    "contact.lead":
      "Our organizing team is here to answer your questions. Pick the contact that matches your request.",
    "contact.participants.title": "Attendees",
    "contact.participants.body":
      "Questions about tickets, logistics, or the schedule? We've got you.",
    "contact.speakers.title": "Speakers",
    "contact.speakers.body":
      "Anything about the CFP, your talk, or speaker logistics.",
    "contact.sponsors.title": "Partners & Sponsors",
    "contact.sponsors.body":
      "Want to support the event or have a question about your booth?",
    "contact.community.helper": "Follow us on social media",
    "notfound.heading": "Page not found",
    "notfound.lead": "This page doesn't exist or has moved.",
    "notfound.home": "Back to the homepage",
    "footer.landmark_aria": "Site footer",
    "editions.2026.heading": "Relive the 2026 edition",
    "editions.2026.gallery_cta": "View the photo gallery",
    "editions.2026.context_body":
      "On Tuesday, February 3, 1,700+ attendees and 40+ partners gathered at CENTQUATRE-PARIS for 60 talks on Infrastructure, DevOps, Cloud Native and Open Source. The line-up was praised — expertise-led, zero sales pitch, packed with experience reports from French organizations like Mistral AI, Air France, Winamax, Decathlon, Renault, Ledger, Ubisoft, INSEE and DINUM.",
    "editions.2026.video_caption": "Cloud Native Days France: the FILM",
    "editions.2026.video_play_aria": "Play video: {title}",
    "editions.2026.stats.participants": "1,850+ attendees",
    "editions.2026.stats.speakers": "48 invited speakers",
    "editions.2026.stats.sessions": "32 talks",
    "editions.2026.placeholder_badge": "PLACEHOLDER CONTENT",
    "editions.2026.thumbnail_alt.1":
      "CND France 2026 photo — main room atmosphere",
    "editions.2026.thumbnail_alt.2":
      "CND France 2026 photo — networking moment",
    "editions.2026.thumbnail_alt.3":
      "CND France 2026 photo — overall venue view",
    "editions.2026.view_all_replays": "Watch all replays",
    "editions.2026.top_replay.1":
      "Keynote d'ouverture Cloud Native Days France 2026",
    "editions.2026.top_replay.2":
      "REX Mistral AI — Construire un fournisseur cloud de zéro : ClusterAPI dans le datacenter",
    "editions.2026.top_replay.3":
      "REX Renault — Kubernetes as a Service : sécurité, innovation et self-service à grande échelle",
    "editions.2026.top_replay.4":
      "REX SNCF — Smells like Cloud Kubernetes : notre Kube managé on-premise",
    "editions.2026.top_replay.5":
      "REX Sellsy — Migrer 50 000 BDDs sans coupure vers PostgreSQL et K8s : mission impossible ?",
    "editions.2026.top_replay.6":
      "SRE sous pression : santé mentale, charge invisible et fatigue du « héros de la prod »",
    "editions.placeholder_badge_aria":
      "Placeholder content — open tracker issue (new window)",
    "editions.2023.compact_title":
      "2023 Edition (Kubernetes Community Days France)",
    "editions.2023.heading": "Highlights from the 2023 edition",
    "editions.2023.gallery_cta": "View the full gallery",
    "editions.2023.video_caption": "Aftermovie from KCD France 2023",
    "editions.2023.video_cta": "Watch on YouTube",
    "editions.2023.view_page_cta": "View the 2023 edition →",
    "editions.2023.stats.participants": "1,700+ attendees",
    "editions.2023.stats.speakers": "42 speakers on stage",
    "editions.2023.stats.sessions": "24 talks delivered",
    "editions.2023.brand_note":
      "KCD 2023 — first French-language edition organized under the CNCF umbrella.",
    "editions.2023.thumbnail_alt.1":
      "Wide overhead view of the Centre Georges Pompidou auditorium filled with the French-speaking cloud-native community",
    "editions.2023.thumbnail_alt.2":
      "Opening talk on the KCD France 2023 main stage, audience facing forward",
    "editions.2023.thumbnail_alt.3":
      "Informal hallway-track conversations in the Beaubourg lobby between sessions",
    "editions.2023.thumbnail_alt.4":
      "Opening keynote projected on the main screen of the plenary room",
    "editions.2023.thumbnail_alt.5":
      "Group of attendees chatting over coffee, CNCF lanyards around their necks",
    "editions.2023.thumbnail_alt.6":
      "Partner sponsor booth staffed by two hosts, KCD signage visible",
    "editions.2023.thumbnail_alt.7":
      "Central aisle lined with community booths in a lively atmosphere",
    "editions.2023.thumbnail_alt.8":
      "Hands-on technical workshop around a projected Kubernetes cluster",
    "editions.2023.thumbnail_alt.9":
      "Microphone handed to an attendee during the Q&A session",
    "editions.2023.thumbnail_alt.10":
      "Wide view of the venue captured at the end of the day in the lobby",
    "editions.2023.photo_alt.01":
      "Wide overhead view of the Centre Georges Pompidou auditorium filled with the French-speaking cloud-native community",
    "editions.2023.photo_alt.02":
      "Opening talk on the KCD France 2023 main stage, audience facing forward",
    "editions.2023.photo_alt.03":
      "Informal hallway-track conversations in the Beaubourg lobby between sessions",
    "editions.2023.photo_alt.04":
      "Opening keynote projected on the main screen of the plenary room",
    "editions.2023.photo_alt.05":
      "Group of attendees chatting over coffee, CNCF lanyards around their necks",
    "editions.2023.photo_alt.06":
      "Partner sponsor booth staffed by two hosts, KCD signage visible",
    "editions.2023.photo_alt.07":
      "Central aisle lined with community booths in a lively atmosphere",
    "editions.2023.photo_alt.08":
      "Hands-on technical workshop around a projected Kubernetes cluster",
    "editions.2023.photo_alt.09":
      "Microphone handed to an attendee during the Q&A session",
    "editions.2023.photo_alt.10":
      "Wide view of the venue captured at the end of the day in the lobby",
    "editions.2023.photo_open_label": "Open photo fullsize: {alt}",
    "editions.2023.brand_history.heading": "A landmark edition — KCD France",
    "editions.2023.brand_history.body":
      "TODO(19) I18N-03 — placeholder awaiting organizer review: in 2023 the event was originally named Kubernetes Community Days France (KCD France); it was rebranded as Cloud Native Days France in 2026 to reflect the breadth of the French-speaking cloud-native ecosystem.",
    "editions.2023.brand_history.venue":
      "Venue: Centre Georges Pompidou, Paris — Beaubourg.",
    "editions.2023.brand_history.logo_alt":
      "Kubernetes Community Days France 2023 (KCD France) logo",
    "editions.2023.lightbox.dialog_label":
      "KCD France 2023 photo gallery — viewer",
    "editions.2023.lightbox.close": "Close the viewer",
    "editions.2023.lightbox.prev": "Previous photo",
    "editions.2023.lightbox.next": "Next photo",
    "editions.2023.lightbox.counter_template": "{index} of {total}",
    "editions.2023.page.title":
      "2023 Edition — KCD France | Cloud Native Days France",
    "editions.2023.page.meta_description":
      "Revisit our first French-language edition (KCD France 2023) at Centre Georges Pompidou: keynotes, photos and highlights.",
    "editions.2023.page.rail": "2023 edition",
    "editions.2023.page.heading":
      "KCD France 2023 — our first edition at Pompidou",
    "editions.2023.page.intro":
      "A visual recap of the first French-language edition, hosted at Centre Georges Pompidou under the name Kubernetes Community Days France.",
    // --- Feature flags (coming-soon layout) ---
    "flags.soon.notify_cta": "Notify me",
    "flags.soon.opens_on": "Opens on {date}",
    "flags.programme.soon.title": "The schedule is coming",
    "flags.programme.soon.body":
      "The full schedule will be unveiled in April 2027.",
    "nav.discover": "Discover",
    "hero.cta.discover": "Discover the event",
    "discover.page.title": "Discover CND France",
    "discover.page.description":
      "Discover the reference cloud-native event in France: atmosphere, values, and 2026 talks.",
    "discover.hero.title": "Discover CND France",
    "discover.hero.subtitle": "The reference cloud-native event in France",
    "discover.hero.bestof.caption": "Discover CND France",
    "discover.hero.coulisses.caption":
      "Behind the scenes, told by our volunteers",
    "discover.intro.p1":
      "The French-speaking DevOps and cloud-native community comes together in Paris. A day of experience reports and conversations open to everyone: from curious junior profiles to senior architects, all the way to the decision-makers seeking the latest trends.",
    "discover.intro.p2":
      "CND France is not just another tech expo — it's a day of gathering for the entire ecosystem, promoting the sharing of expertise and experience in an atypical and charming venue.",
    "discover.intro.highlights.title": "CND France stands out for:",
    "discover.intro.highlights.talks":
      "High-quality talks selected from hundreds of proposals: focused on expertise and concrete real-world feedback, with no commercial pitch.",
    "discover.intro.highlights.partners":
      "A partner village selected only when relevant to our attendees: key players with solutions and services you use daily.",
    "discover.gallery.title": "2026 in pictures",
    "discover.gallery.lightbox.close": "Close",
    "discover.gallery.lightbox.prev": "Previous photo",
    "discover.gallery.lightbox.next": "Next photo",
    "discover.gallery.album_cta": "View photo album",
    "discover.values.title": "Our approach",
    "discover.values.body":
      "Since 2023, we push every quality dial to the max: rigorous programming, quality catering, a unique venue, and the most relevant partner stands for you. Our values include a belief in digital autonomy (open source, multi-vendor…), the collective strength that comes from diverse backgrounds, and peer-to-peer learning. We also strive to run an event with the smallest ecological footprint possible.",
    "discover.stats.participants": "participants",
    "discover.stats.talks": "talks",
    "discover.stats.speakers": "speakers",
    "discover.stats.tracks": "tracks",
    "discover.audience.title": "Who is Cloud Native Days France for?",
    "discover.audience.subtitle":
      "CND France is aimed at all IT professionals with a technical interest in infrastructure and Cloud, DevOps, Kubernetes and Cloud Native, or Platform Engineering.",
    "discover.audience.dev.title": "Developer",
    "discover.audience.dev.topics":
      "CI/CD · Developer Experience · Applied AI · Microservices architecture",
    "discover.audience.cloud.title": "Cloud & DevOps Engineer",
    "discover.audience.cloud.topics":
      "Kubernetes · GitOps · IaC · Platform Engineering · FinOps",
    "discover.audience.ops.title": "Ops & SRE",
    "discover.audience.ops.topics":
      "Infrastructure · Networking · Security · Observability",
    "discover.audience.lead.title": "Tech Lead & Architect",
    "discover.audience.lead.topics":
      "Distributed architecture · Multi-cloud · Governance",
    "discover.audience.cto.title": "CTO, CIO & VP…",
    "discover.audience.cto.topics":
      "Cloud strategy & ROI · Digital sovereignty · AI in production · Trends",
    "discover.replays.title": "The 2026 talks",
    "discover.replays.cta": "Watch all replays",
    "tickets.meta.title": "Tickets · CND France 2027",
    "tickets.meta.description":
      "Your seat at CND France 2027, Thursday 3 June at CENTQUATRE-PARIS: prices, coming as a team, using a code.",
    "tickets.h1": "Your seat at CND France 2027",
    "tickets.when": "{date} · {venue}, Paris",
    "tickets.advice.lead": "Our advice:",
    "tickets.advice":
      "get your ticket early, we're expecting more than 2,500 attendees.",
    "tickets.door.code": "I have a code",
    "tickets.offer.ticket": "{name} ticket",
    "tickets.offer.ttc": "VAT incl.",
    "tickets.offer.last_seats": "Last seats",
    "tickets.purchase.buy": "Buy my ticket",
    "tickets.new_tab": "(new tab)",
    // "Four" is the config's four tiers.
    "tickets.ladder.title": "Four prices, up to the day itself",
    "tickets.ladder.until_or_sold_out": "Until {date} or sold out",
    "tickets.ladder.limited_stock": "Limited seats",
    "tickets.ladder.sold_out": "Sold out",
    // Screen readers only.
    "tickets.ladder.current": "Current price",
    "tickets.team.per_person": "per person",
    "tickets.team.per_person.short": "/person",
    "tickets.team.only": "Rates apply to the {name} ticket only.",
    "tickets.team.rate.4_9": "4 to 9 people",
    "tickets.team.rate.10_plus": "10 people or more",
    "tickets.team.cta.group": "Ask for my group rate",
    "tickets.team.title": "Coming as a team",
    "tickets.team.mail.subject": "Group tickets CND France 2027",
    "tickets.team.mail.body":
      "Hello,\n\nWe would like to come to CND France 2027 as a group.\n\nCompany:\nNumber of attendees:\nNeeds (quote, invoice, bank transfer):\nContact:\n",
    "tickets.code.intro": "Partner, invitation or promo code.",
    "tickets.code.label": "Your code",
    "tickets.code.submit": "Use my code",
    "tickets.code.empty": "Enter your code to continue.",
    "tickets.strategic.audience":
      "The {strategic} ticket is for those in leadership and decision-making roles: CEOs, CTOs, CIOs, VPs…",
    "tickets.strategic.perks":
      "On top of the full CND France experience, it gives access to an exclusive track of talks on strategic issues, with speakers chosen by a dedicated committee, and to a lounge to meet your peers.",
    "tickets.strategic.new": "New in 2027",
    "tickets.strategic.seats": "Only {count} seats",
    "tickets.strategic.track": "About the Strategy & Leadership track",
    "tickets.included.title": "What your ticket includes",
    "tickets.included.talks": "The day's talks and experience reports",
    "tickets.included.village": "Access to the partner village",
    "tickets.included.meals": "Lunch, coffee and snacks",
    "tickets.included.goodies": "Exclusive goodies",
    "tickets.included.evening.title": "An evening to round off the day",
    "tickets.included.evening.new": "New in 2027",
    "tickets.included.evening.body":
      "The evening is part of the ticket, with no add-on to buy. A chance to meet new people, talk with your peers, look back on the day's talks or simply unwind.",
    "tickets.faq.title": "Frequently asked questions",
    "tickets.faq.payment.q": "How does payment work?",
    "tickets.faq.payment.a":
      "By card, through Stripe. Need to pay by bank transfer? Write to us at",
    "tickets.faq.change.q": "When does the price change?",
    "tickets.faq.change.a":
      "The current price ends on the date shown, or sooner if its allocation of seats sells out. Then the next price takes over at once.",
    "tickets.faq.strategic.q":
      "Is the Strategy & Leadership track open to everyone?",
    "tickets.faq.strategic.a":
      "No, its talks and its lounge are reserved for {strategic} ticket holders. The {standard} ticket gives access to every other talk of the day.",
    "tickets.faq.ttc.q": "Do the prices shown include VAT?",
    "tickets.faq.ttc.a": "Yes, they include VAT at {rate}.",
    "tickets.faq.per_order.q": "How many seats per order?",
    "tickets.faq.per_order.a":
      "Up to {early} during Super Early Bird and Early Bird, so they reach as many people as possible, then up to {later}. Need more? Write to us at",
    "tickets.faq.invoice.q": "Can I get an invoice in my company's name?",
    "tickets.faq.invoice.a":
      "Yes, it is emailed to you automatically, along with your ticket. Just make sure to enter your company details at checkout. If anything goes wrong, write to us at",
    "tickets.faq.code.q":
      "I have a partner code or an invitation. What do I do?",
    "tickets.faq.code.a":
      "Enter it under “I have a code”, just below the tickets. Got a link? Click it and the code applies by itself.",
    "tickets.faq.inclusion.q": "Is there a student or solidarity rate?",
    "tickets.faq.inclusion.a":
      "Yes, case by case, for students and for anyone the price would keep away. Write to us at",
    "tickets.faq.access.q": "Is the venue accessible to everyone?",
    "tickets.faq.access.a":
      "Yes: wheelchair access, lifts, accessible toilets, guide dogs welcome. For any specific need, write to us.",
    "tickets.faq.access.link": "Practical information",
    "tickets.faq.coc.q": "Is there a code of conduct?",
    "tickets.faq.coc.a": "Yes. Every attendee agrees to follow it.",
    "tickets.faq.coc.link": "Read the code of conduct",
    "tickets.faq.programme.q": "When will the programme be published?",
    "tickets.faq.programme.a": "The 2027 programme will be published {when}.",
    "tickets.inclusion.mail.subject": "Inclusion or student rate request",
    "tickets.inclusion.mail.body":
      "Hello,\n\nI'd like to come to CND France 2027 at an inclusion or student rate.\n\nMy situation in a few words:\n\nName:\nSchool or organisation (if any):\n",
    "tickets.wire.mail.subject": "Bank transfer payment CND France 2027",
    "tickets.wire.mail.body":
      "Hello,\n\nI'd like to pay for my CND France 2027 tickets by bank transfer.\n\nTicket ({standard} or {strategic}):\nNumber of seats:\nName:\nCompany (if any):\n",
    "tickets.per_order.mail.subject": "More seats per order CND France 2027",
    "tickets.per_order.mail.body":
      "Hello,\n\nI'd like to order more seats for CND France 2027 than the per-order limit.\n\nTicket ({standard} or {strategic}):\nNumber of seats:\nName:\nCompany (if any):\n",
    "tickets.sticky.buy": "Buy",
  },
} as const;
