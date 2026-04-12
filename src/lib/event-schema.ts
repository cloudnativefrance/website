import type { Locale } from "@/i18n/ui";

export interface EventSchemaInput {
  lang: Locale;
  siteUrl: string; // e.g. "https://cloudnativedays.fr/" from Astro.site.toString()
  description: string;
}

export function buildEventSchema({ lang, siteUrl, description }: EventSchemaInput) {
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Cloud Native Days France 2027",
    startDate: "2027-06-03T09:00:00+02:00",
    endDate: "2027-06-03T19:00:00+02:00",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "CENTQUATRE-PARIS",
      address: {
        "@type": "PostalAddress",
        streetAddress: "5 rue Curial",
        addressLocality: "Paris",
        postalCode: "75019",
        addressCountry: "FR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 48.8899,
        longitude: 2.3702,
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Cloud Native France",
      url: base,
    },
    offers: {
      "@type": "Offer",
      url: "https://tickets.cloudnativedays.fr/",
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-01T00:00:00+01:00",
      priceCurrency: "EUR",
      price: "0",
    },
    image: `${base}/og-default.png`,
    description,
    inLanguage: lang === "fr" ? "fr-FR" : "en-US",
  };
}

/**
 * Serialize for inline injection into <script type="application/ld+json">.
 * Only closed-enum constants + localized description reach this. No user input.
 * If future callers pass dynamic input, re-audit for JSON-LD injection (T-09-08).
 */
export function eventSchemaJson(input: EventSchemaInput): string {
  return JSON.stringify(buildEventSchema(input));
}
