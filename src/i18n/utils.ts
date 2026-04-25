import { ui, defaultLang, type Locale } from "@/i18n/ui";

// Slug translations for pages whose FR and EN slugs differ.
const slugMap: Record<string, Partial<Record<Locale, string>>> = {
  decouvrir: { fr: "decouvrir", en: "discover" },
  discover:  { fr: "decouvrir", en: "discover" },
};

/**
 * Extract locale from a URL pathname.
 * Returns the locale if the first path segment matches a known locale,
 * otherwise returns the default locale.
 */
export function getLangFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as Locale;
  return defaultLang;
}

/**
 * Returns a translation function `t(key)` bound to the given locale.
 * Falls back to the default locale if the key is missing.
 */
export function useTranslations(lang: Locale) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return (ui[lang] as Record<string, string>)[key] ?? ui[defaultLang][key];
  };
}

/**
 * Build a locale-aware path.
 * - For the default locale: returns `/{path}`
 * - For other locales: returns `/{lang}/{path}`
 * Strips any existing locale prefix before building.
 */
export function getLocalePath(lang: Locale, path: string): string {
  // Remove leading slash and any existing locale prefix
  const stripped = path.replace(/^\//, "");
  const segments = stripped.split("/");

  if (segments[0] in ui) {
    segments.shift();
  }

  const cleanPath = segments.join("/");

  if (lang === defaultLang) {
    return `/${cleanPath}`;
  }

  return cleanPath ? `/${lang}/${cleanPath}` : `/${lang}`;
}

/**
 * Build the alternate-language URL for the current page, translating slugs
 * that differ between locales (e.g. /decouvrir ↔ /en/discover).
 */
export function getAlternatePath(currentPath: string, targetLang: Locale): string {
  const stripped = currentPath.replace(/^\//, "");
  const segments = stripped.split("/");

  // Strip existing locale prefix
  if (segments[0] in ui) {
    segments.shift();
  }

  // Translate each segment if a mapping exists
  const translated = segments.map((seg) => slugMap[seg]?.[targetLang] ?? seg);

  const cleanPath = translated.join("/");

  if (targetLang === defaultLang) {
    return `/${cleanPath}`;
  }

  return cleanPath ? `/${targetLang}/${cleanPath}` : `/${targetLang}`;
}
