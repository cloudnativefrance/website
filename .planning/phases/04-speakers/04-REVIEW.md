---
phase: 04-speakers
reviewed: 2026-04-11T12:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/speakers/SocialLinks.astro
  - src/components/speakers/SpeakerAvatar.astro
  - src/components/speakers/SpeakerCard.astro
  - src/components/speakers/SpeakerProfile.astro
  - src/components/speakers/TalkCard.astro
  - src/i18n/ui.ts
  - src/lib/speakers.ts
  - src/pages/en/speakers/index.astro
  - src/pages/en/speakers/[slug].astro
  - src/pages/speakers/index.astro
  - src/pages/speakers/[slug].astro
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-11T12:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

The speakers feature is well-structured with clean separation between data utilities (`src/lib/speakers.ts`), reusable components, and locale-specific page routes. The i18n approach is consistent, the component props are well-typed, and accessibility attributes are present on interactive elements. The code is generally high quality.

Key concerns: one potential runtime crash in `SpeakerAvatar` when given an empty name, missing URL validation on user-supplied social links (XSS vector), and significant code duplication between the `fr` and `en` page files that will create maintenance burden.

## Critical Issues

### CR-01: Social link URLs rendered without validation -- potential XSS via `javascript:` URIs

**File:** `src/components/speakers/SocialLinks.astro:19-106`
**Issue:** Social link `href` values come from content collection frontmatter and are rendered directly into `<a>` tags without any URL validation. If a malicious or malformed entry contains a `javascript:` URI (e.g., `github: "javascript:alert(1)"`), it will be rendered as a clickable link. While Astro content collections reduce this risk compared to user-generated content, this is a defense-in-depth concern -- content files may be contributed by external speakers or imported from external sources.
**Fix:** Validate that URLs start with `https://` or `http://` before rendering:
```astro
{social.github && social.github.startsWith("http") && (
  <a href={social.github} ...>
```
Or create a small helper:
```ts
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
```

## Warnings

### WR-01: Runtime crash when `name` is an empty string in SpeakerAvatar

**File:** `src/components/speakers/SpeakerAvatar.astro:13-18`
**Issue:** The initials computation calls `w[0]` on each word after splitting by space. If `name` is an empty string, `split(" ")` returns `[""]`, and `w[0]` on `""` returns `undefined`. The subsequent `.join("").slice(0,2).toUpperCase()` will produce `"UNDEFINED"` being joined then sliced. While this won't crash, it will display "UN" as initials for an empty name, which is incorrect. More critically, if `name` is `undefined` (despite the type), `.split()` will throw.
**Fix:** Add a guard at the top of the initials computation:
```ts
const initials = name
  ? name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  : "?";
```

### WR-02: `twitter` field defined in Props but never rendered in SocialLinks

**File:** `src/components/speakers/SocialLinks.astro:8`
**Issue:** The `social` interface includes a `twitter?: string` field, and this same field appears in `SpeakerProfile.astro:17`. However, the `SocialLinks` template has no rendering block for `social.twitter`. If a speaker entry provides a Twitter/X link, it will be silently ignored with no visual output.
**Fix:** Either add a rendering block for Twitter/X (with an appropriate SVG icon) after the website block, or remove the `twitter` field from the interface to avoid confusion:
```astro
{social.twitter && (
  <a
    href={social.twitter}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="X (Twitter) profile"
    class="text-muted-foreground hover:text-primary transition-colors duration-150 p-2"
  >
    <!-- X/Twitter SVG icon -->
  </a>
)}
```

### WR-03: Duplicated page logic between `fr` and `en` speaker routes

**File:** `src/pages/speakers/index.astro` and `src/pages/en/speakers/index.astro`; `src/pages/speakers/[slug].astro` and `src/pages/en/speakers/[slug].astro`
**Issue:** The index pages are nearly identical (only `"fr"` vs `"en"` locale string differs), and the `[slug].astro` detail pages are also near-copies. This duplication means any bug fix or feature addition must be applied to both files. As more locales are added, this scales linearly.
**Fix:** Consider extracting the shared template logic into a component that accepts `locale` as a prop, or use Astro's dynamic routing with a `[lang]` parameter to serve both locales from a single file:
```
src/pages/[lang]/speakers/index.astro
src/pages/[lang]/speakers/[slug].astro
```
with `getStaticPaths` generating entries for each locale. This eliminates the duplication entirely.

## Info

### IN-01: `getLangFromUrl` called but result unused in favor of hardcoded locale

**File:** `src/pages/en/speakers/index.astro:7`
**Issue:** Line 7 calls `getLangFromUrl(Astro.url)` and stores it in `lang`, but lines 9-10 pass the hardcoded string `"en"` to `getSortedSpeakers` and `getTalksByLocale` instead of using `lang`. The same pattern occurs in the `fr` variant. The `lang` variable is only used for `useTranslations`, creating an inconsistency -- if the URL detection ever disagrees with the hardcoded locale, data and translations could mismatch.
**Fix:** Either use `lang` consistently for all calls, or remove the `getLangFromUrl` call and hardcode `lang` directly:
```ts
const lang = "en" as const;
const t = useTranslations(lang);
const speakers = await getSortedSpeakers(lang);
const talks = await getTalksByLocale(lang);
```

### IN-02: `trackNames` in TalkCard are not localized

**File:** `src/components/speakers/TalkCard.astro:25-30`
**Issue:** The `trackNames` record uses hardcoded English strings ("Cloud & Infra", "DevOps & Platform", etc.) regardless of the current locale. On the French pages, track labels will still display in English.
**Fix:** Either add track name translations to `src/i18n/ui.ts` and use the `t()` function, or accept this as intentional if track names are considered proper nouns/brand names.

---

_Reviewed: 2026-04-11T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
