/**
 * Locale formatting for the ticketing page. Dates are rendered in
 * Europe/Paris: the build machine's timezone must not move a tier's last day.
 */
import type { Locale } from "@/i18n/ui";

const LOCALE_TAG: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

const euros = (lang: Locale) =>
  new Intl.NumberFormat(LOCALE_TAG[lang], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

/** "129 €" in French, "€129" in English. */
export function formatPrice(amount: number, lang: Locale): string {
  return euros(lang).format(amount);
}

/**
 * A price split around its digits, so the amount can be set large and the
 * currency small: {"", "129", "€"} in French, {"€", "129", ""} in English.
 */
export function priceParts(
  amount: number,
  lang: Locale,
): { before: string; amount: string; after: string } {
  const parts = euros(lang).formatToParts(amount);
  const firstDigit = parts.findIndex((p) => p.type === "integer");
  const lastDigit = parts.findLastIndex(
    (p) => p.type === "integer" || p.type === "group",
  );
  const text = (slice: Intl.NumberFormatPart[]) =>
    slice
      .map((p) => p.value)
      .join("")
      .trim();
  return {
    before: text(parts.slice(0, firstDigit)),
    amount: text(parts.slice(firstDigit, lastDigit + 1)),
    after: text(parts.slice(lastDigit + 1)),
  };
}

/** "29 novembre" / "29 November". */
export function formatDayMonth(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/** "jeudi 3 juin 2027" / "Thursday 3 June 2027". */
export function formatFullDate(timestamp: number, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(timestamp);
}

/** "−15 %" / "−15%". Rounded down: a discount may read smaller than it is, never bigger. */
export function formatDiscount(from: number, to: number, lang: Locale): string {
  return `−${formatPercent(Math.floor(((from - to) / from) * 100), lang)}`;
}

/** French sets a narrow no-break space before the sign. */
export function formatPercent(percent: number, lang: Locale): string {
  return lang === "en" ? `${percent}%` : `${percent} %`;
}

export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Replaces the `{name}` tokens of an i18n string; unknown tokens stay. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
