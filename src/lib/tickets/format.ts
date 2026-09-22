/**
 * Locale formatting for the ticketing page. Dates are always rendered in
 * Europe/Paris: the build machine's timezone must not move a tier's last day.
 */
import type { Locale } from "@/i18n/ui";

const LOCALE_TAG: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** Whole euros: "129 €" in French, "€129" in English. */
export function formatPrice(amount: number, lang: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[lang], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * A price split around its digits so the amount can be set large and the
 * currency small, in the locale's own order: {"", "129", "€"} in French,
 * {"€", "129", ""} in English.
 */
export function priceParts(amount: number, lang: Locale): { before: string; amount: string; after: string } {
  const parts = new Intl.NumberFormat(LOCALE_TAG[lang], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).formatToParts(amount);
  const firstDigit = parts.findIndex((p) => p.type === "integer");
  const lastDigit = parts.findLastIndex((p) => p.type === "integer" || p.type === "group");
  const text = (slice: Intl.NumberFormatPart[]) => slice.map((p) => p.value).join("").trim();
  return {
    before: text(parts.slice(0, firstDigit)),
    amount: text(parts.slice(firstDigit, lastDigit + 1)),
    after: text(parts.slice(lastDigit + 1)),
  };
}

/**
 * "10:00" → "10 h" in French, "10:00" in English; "10:30" → "10 h 30". The
 * spaces are non-breaking: "10" and "h" must never land on different lines.
 */
export function formatTime(hhmm: string, lang: Locale): string {
  if (lang === "en") return hhmm;
  const [h, m] = hhmm.split(":");
  return m && m !== "00" ? `${Number(h)}\u00a0h\u00a0${m}` : `${Number(h)}\u00a0h`;
}

/** "dimanche 29 novembre" / "Sunday 29 November". */
export function formatDayMonth(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/**
 * "29 nov." / "29 Nov". For the tier ladder, where the box is narrow: the
 * weekday buys nothing and a full month name costs a second line.
 */
export function formatDayMonthShort(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/** "jeudi 3 juin 2027" / "Thursday 3 June 2027". */
export function formatFullDate(iso: string | number, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/**
 * How much cheaper `to` is than `from`, as a badge: "−25 %" / "−25%".
 *
 * Rounded **down**, always: a discount may read smaller than it is, never
 * bigger. French sets a narrow no-break space before the percent sign.
 */
export function formatDiscount(from: number, to: number, lang: Locale): string {
  const percent = Math.floor(((from - to) / from) * 100);
  return lang === "en" ? `−${percent}%` : `−${percent} %`;
}

/** Replace `{name}` tokens in an i18n string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
