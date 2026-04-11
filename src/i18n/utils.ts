import { ui, defaultLang, type Locale } from "@/i18n/ui";

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
