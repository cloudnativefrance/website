---
phase: 02-bilingual-architecture-content-collections
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - astro.config.mjs
  - src/components/LanguageToggle.astro
  - src/components/TranslationNotice.astro
  - src/content.config.ts
  - src/content/speakers/en/speaker-1.md
  - src/content/speakers/fr/speaker-1.md
  - src/content/sponsors/sponsors.yaml
  - src/content/talks/en/talk-1.md
  - src/content/talks/fr/talk-1.md
  - src/content/team/team.yaml
  - src/i18n/ui.ts
  - src/i18n/utils.ts
  - src/layouts/Layout.astro
  - src/pages/en/index.astro
  - src/pages/index.astro
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-11
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

The bilingual architecture is structurally sound: Astro's i18n routing is correctly configured with `prefixDefaultLocale: false`, the `ui.ts` translation map covers all used keys for both locales, and `getLocalePath` / `getLangFromUrl` are clean and well-documented. Content schemas in `content.config.ts` are well-typed with Zod.

There is one critical bug: the `speaker` reference field in talk content files uses a bare slug (`"speaker-1"`) that cannot resolve against the actual content collection IDs (`"en/speaker-1"`, `"fr/speaker-1"`) produced by the glob loader. This will silently return no match at query time. There are also four warnings covering: unused i18n infrastructure in both page files, a dead `TranslationNotice` component with no invocation path, a hardcoded locale magic string in `Layout.astro`, and a fragile two-locale assumption in `TranslationNotice.astro`.

---

## Critical Issues

### CR-01: Talk `speaker` reference cannot resolve against collection IDs

**File:** `src/content/talks/en/talk-1.md:3`, `src/content/talks/fr/talk-1.md:3`

**Issue:** Both talk files set `speaker: "speaker-1"`. The `speakers` collection is loaded with `glob({ base: "./src/content/speakers", pattern: "**/*.md" })`, which produces entry IDs that include the locale subdirectory path — i.e., `"en/speaker-1"` and `"fr/speaker-1"`. A query such as `getEntry('speakers', talk.data.speaker)` or a filter like `entry.id === talk.data.speaker` will never match because the bare slug `"speaker-1"` does not equal either derived ID. This is a silent data-integrity bug: no error is thrown, but speaker lookups will always return `undefined`.

**Fix (option A — locale-qualified IDs in talk content):**
```yaml
# src/content/talks/en/talk-1.md
speaker: "en/speaker-1"

# src/content/talks/fr/talk-1.md
speaker: "fr/speaker-1"
```

**Fix (option B — strip locale prefix at query time, preferred for DX):**
Define a helper that normalises IDs when resolving cross-locale references:
```ts
// src/i18n/content.ts
import { getCollection } from "astro:content";
import type { Locale } from "@/i18n/ui";

export async function getSpeakerForTalk(speakerId: string, lang: Locale) {
  const speakers = await getCollection("speakers");
  // IDs from glob include locale prefix, e.g. "en/speaker-1"
  return speakers.find((s) => s.id === `${lang}/${speakerId}`);
}
```

Then update the `speaker` schema in `content.config.ts` to clarify it holds a bare slug:
```ts
speaker: z.string(), // bare slug; resolve with getSpeakerForTalk(slug, lang)
```

---

## Warnings

### WR-01: `t()` function instantiated but never called — pages use hardcoded strings

**File:** `src/pages/index.astro:10-11`, `src/pages/en/index.astro:10-11`

**Issue:** Both page files import `getLangFromUrl` and `useTranslations`, call them, and assign the result to `t` — but `t` is never invoked anywhere in the template. All visible text (headings, button labels, card content) is hardcoded inline in the respective language. This means the i18n system provides no value for these pages and its presence is misleading. More importantly, text that should be localised through the translation map (e.g., CTA labels) is instead duplicated in markup.

**Fix:** Either remove the unused imports/variables, or wire up `t()` calls for all user-facing strings and move the strings into `ui.ts`. For a design-system preview page that is transitional, removing the dead imports is the minimal fix:
```ts
// Remove these two lines from both pages:
// import { getLangFromUrl, useTranslations } from "@/i18n/utils";
// const lang = getLangFromUrl(Astro.url);
// const t = useTranslations(lang);
```

---

### WR-02: `TranslationNotice` is defined but never rendered — fallback detection is absent

**File:** `src/components/TranslationNotice.astro:1-45`, `src/layouts/Layout.astro:1-27`

**Issue:** `astro.config.mjs` configures `fallback: { en: "fr" }`, which means Astro will serve the French page when an English one is missing. `TranslationNotice` is built to alert visitors that they are reading a fallback, but it is imported nowhere and never rendered. Users hitting a fallback page receive no indication that the content is not in their language.

**Fix:** Use `Astro.currentLocale` and `Astro.routePattern` (or a prop) in `Layout.astro` to detect when a fallback is active, then conditionally render `TranslationNotice`. A minimal approach:
```astro
---
// Layout.astro
import TranslationNotice from "@/components/TranslationNotice.astro";

interface Props {
  title?: string;
  lang?: string;
  isFallback?: boolean;
}
const { title = "Cloud Native Days France 2027", lang, isFallback = false } = Astro.props;
---
<!-- inside <body>, before <slot />: -->
{isFallback && <TranslationNotice />}
<slot />
```

Pages that know they are rendering fallback content pass `isFallback={true}` to `Layout`.

---

### WR-03: Hardcoded `"fr"` magic string duplicates `defaultLang` in `Layout.astro`

**File:** `src/layouts/Layout.astro:12`

**Issue:** The expression `lang ?? Astro.currentLocale ?? "fr"` hardcodes the default locale as a string literal. If the default locale is ever changed in `ui.ts` (or `astro.config.mjs`), `Layout.astro` will silently serve the wrong `lang` attribute on `<html>`, breaking screen-reader locale detection and SEO.

**Fix:**
```astro
---
import { defaultLang } from "@/i18n/ui";
// ...
const resolvedLang = lang ?? Astro.currentLocale ?? defaultLang;
---
```

---

### WR-04: `originalLocale` default in `TranslationNotice` hardcodes a two-locale assumption

**File:** `src/components/TranslationNotice.astro:11`

**Issue:** The default for `originalLocale` is computed as `currentLang === "fr" ? "en" : "fr"`. If a third locale is added (e.g., `"de"`), any page with `currentLang === "de"` will produce `originalLocale = "fr"`, which may be incorrect. It also means the logic is not driven by `defaultLang`.

**Fix:**
```ts
import { defaultLang } from "@/i18n/ui";
// ...
const { originalLocale = defaultLang } = Astro.props;
```

The fallback banner should point to the canonical (default) language rather than an inferred opposite.

---

## Info

### IN-01: `Layout.astro` is missing `<meta name="description">` tag

**File:** `src/layouts/Layout.astro:15-20`

**Issue:** The `<head>` block renders `<title>` but has no `<meta name="description">` tag. The `ui.ts` already defines `"site.description"` for both locales, but it is not used. This is a missed opportunity for SEO and social sharing.

**Fix:**
```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
const pageLang = (lang ?? Astro.currentLocale ?? defaultLang) as Locale;
const t = useTranslations(pageLang);
---
<meta name="description" content={description ?? t("site.description")} />
```

Add an optional `description` prop to `Layout`'s `Props` interface for page-specific overrides.

---

### IN-02: `ui.ts` translation strings omit accents — potential display issues

**File:** `src/i18n/ui.ts:17-20`

**Issue:** French strings such as `"Selecteur de langue"`, `"Cette page n'a pas encore ete traduite"`, and `"Consulter la version originale"` are missing their accents (`Sélecteur`, `été`, `originale` is fine but `traduite` needs no accent). While these are rendered as text content rather than interpreted code, displaying accentless French text to users is a content quality issue and may look unprofessional in production.

**Fix:** Restore proper diacritics:
```ts
"toggle.aria": "Sélecteur de langue",
"fallback.heading": "Contenu non disponible en français",
"fallback.body": "Cette page n'a pas encore été traduite. Consulter la version originale.",
"fallback.cta": "Voir en anglais",
```

---

### IN-03: `fontProviders` imported but the import could be removed if unused elsewhere

**File:** `astro.config.mjs:2`

**Issue:** `fontProviders` is imported from `"astro/config"` and used on line 25 (`fontProviders.google()`). This is fine and correct. Noted here only for completeness — no action required.

---

_Reviewed: 2026-04-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
