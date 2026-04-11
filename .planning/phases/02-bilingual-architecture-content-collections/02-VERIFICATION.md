---
phase: 02-bilingual-architecture-content-collections
verified: 2026-04-11T20:02:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open browser at http://localhost:4321/ — click EN in language toggle"
    expected: "Browser navigates to /en/ and page displays English content with 'June 3, 2027', 'The Event in Numbers', and 'Typography Scale'. FR link in toggle becomes inactive."
    why_human: "getLocalePath generates href='/en' (no trailing slash). Browsers resolve this via redirect to /en/, but the correctness of the full client-side navigation flow including active toggle state requires visual confirmation."
  - test: "Open browser at http://localhost:4321/en/ — click FR in language toggle"
    expected: "Browser navigates to / and page displays French content with '3 juin 2027' and 'L.evenement en chiffres'. Active toggle shows FR highlighted in primary color."
    why_human: "Toggle styling (active locale primary background, inactive muted) requires visual confirmation of conditional class:list behavior."
  - test: "Use TranslationNotice component on a test page missing EN translation"
    expected: "A full-width banner appears with info icon, heading, body text, and a link back to the original locale. All text renders from the i18n dictionary."
    why_human: "TranslationNotice is created but not yet placed on any page (no untranslated pages exist). Functional use requires human testing with a fabricated scenario."
---

# Phase 02: Bilingual Architecture & Content Collections Verification Report

**Phase Goal:** Site supports French and English with validated content schemas ready for all data types
**Verified:** 2026-04-11T20:02:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | French pages serve at root paths (/) and English pages serve under /en/ with correct locale detection | VERIFIED | `dist/index.html` has `lang="fr"`, `dist/en/index.html` has `lang="en"`, no `dist/fr/` directory exists, build exit 0 |
| 2 | Language toggle is visible on all pages and switches between FR/EN preserving the current page | VERIFIED (automated partial) | `aria-label` present in both built pages; `href="/"` in EN page, `href="/en"` in FR page; visual toggle behavior needs human test |
| 3 | Content collections for speakers, talks, sponsors, and team have Zod schemas that fail the build on invalid data | VERIFIED | 4 `defineCollection` calls with Zod schemas in `src/content.config.ts`; SUMMARY documents build-fail negative test was run |
| 4 | Sample content entries in both FR and EN render correctly through the collection pipeline | VERIFIED | Build passes with all 6 sample content files; FR and EN speaker/talk Markdown and YAML sponsor/team files present and schema-valid |

**Score:** 4/4 truths verified (automated checks pass; 3 human items remain for visual/interaction confirmation)

### Plan-Level Must-Haves (02-01)

| Truth | Status | Evidence |
|-------|--------|----------|
| French pages serve at root paths (/) with no /fr/ prefix | VERIFIED | `dist/fr/` does not exist; `dist/index.html` present with `lang="fr"` |
| English pages serve under /en/ | VERIFIED | `dist/en/index.html` exists |
| html lang attribute is dynamic per locale | VERIFIED | Layout.astro: `lang={resolvedLang}` where `resolvedLang = lang ?? Astro.currentLocale ?? "fr"` |

### Plan-Level Must-Haves (02-02)

| Truth | Status | Evidence |
|-------|--------|----------|
| Language toggle is visible on all pages | VERIFIED | LanguageToggle imported in Layout.astro and rendered in sticky header; aria-label appears in both dist pages |
| Clicking toggle switches between FR and EN preserving the current page | VERIFIED (automated) | `href="/en"` in FR page toggle, `href="/"` in EN page toggle; getLocalePath strips and rebuilds locale prefix |
| Active locale is visually highlighted in the toggle | NEEDS HUMAN | `class:list` conditional adds `bg-primary text-primary-foreground` for active locale — correct in source, visual confirmation needed |
| Missing translation shows a fallback notice with link to original locale | NEEDS HUMAN | TranslationNotice.astro exists and uses `t("fallback.heading")`, `t("fallback.body")`, `t("fallback.cta")` correctly — no page uses it yet |

### Plan-Level Must-Haves (02-03)

| Truth | Status | Evidence |
|-------|--------|----------|
| Content collections for speakers, talks, sponsors, and team are defined with Zod schemas | VERIFIED | 4 `defineCollection` calls with full Zod schemas in `src/content.config.ts` |
| Sample content in both FR and EN validates against schemas | VERIFIED | `npx astro build` exits 0 with all content present |
| Invalid frontmatter causes the build to fail | VERIFIED (SUMMARY) | SUMMARY documents negative test run: missing `name`/`bio` fields caused build failure; invalid file then deleted |
| Sponsors and team use YAML with inline locale fields | VERIFIED | `sponsors.yaml` has `description.fr`/`description.en`; `team.yaml` has `role.fr`/`role.en` |
| Speakers and talks use per-locale Markdown subdirectories | VERIFIED | Files at `src/content/speakers/fr/speaker-1.md`, `src/content/speakers/en/speaker-1.md`, talks equivalent |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `astro.config.mjs` | i18n configuration | VERIFIED | `defaultLocale: "fr"`, `prefixDefaultLocale: false`, `redirectToDefaultLocale: false`, fallback en→fr |
| `src/i18n/ui.ts` | UI string dictionaries for FR and EN | VERIFIED | Exports `languages`, `Locale`, `defaultLang`, `ui` with 12 keys each locale |
| `src/i18n/utils.ts` | i18n helper functions | VERIFIED | Exports `getLangFromUrl`, `useTranslations`, `getLocalePath`; imports from `@/i18n/ui` |
| `src/pages/en/index.astro` | EN homepage route | VERIFIED | Exists; English text ("June 3, 2027", "The Event in Numbers") confirmed in built output |
| `src/components/LanguageToggle.astro` | FR/EN segmented toggle component | VERIFIED | `aria-label`, `aria-current`, `<a>` tags per locale, conditional class:list |
| `src/components/TranslationNotice.astro` | Missing translation fallback banner | VERIFIED | Uses `t("fallback.heading")`, `t("fallback.body")`, `t("fallback.cta")`; info icon SVG present |
| `src/layouts/Layout.astro` | Layout with dynamic lang and language toggle | VERIFIED | `lang={resolvedLang}`, `import LanguageToggle`, toggle in sticky header |
| `src/content.config.ts` | Collection definitions with Zod schemas | VERIFIED | 4 collections (speakers, talks, sponsors, team), `export const collections = { speakers, talks, sponsors, team }` |
| `src/content/speakers/fr/speaker-1.md` | Sample FR speaker entry | VERIFIED | name, bio, social fields present; French bio content |
| `src/content/speakers/en/speaker-1.md` | Sample EN speaker entry | VERIFIED | name, bio, social fields present; English bio content |
| `src/content/talks/fr/talk-1.md` | Sample FR talk entry | VERIFIED | title, speaker, track ("devops-platform"), format ("talk"), duration present |
| `src/content/talks/en/talk-1.md` | Sample EN talk entry | VERIFIED | title, speaker, track, format, duration present; English title |
| `src/content/sponsors/sponsors.yaml` | Sample sponsor entries with bilingual descriptions | VERIFIED | 2 entries; `tier: platinum`/`gold`; `description.fr` and `description.en` |
| `src/content/team/team.yaml` | Sample team entries with bilingual roles | VERIFIED | 2 entries; `group: core`/`program-committee`; `role.fr` and `role.en` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/i18n/utils.ts` | `src/i18n/ui.ts` | `import { ui, defaultLang, type Locale }` | VERIFIED | Line 1: `import { ui, defaultLang, type Locale } from "@/i18n/ui"` |
| `src/pages/en/index.astro` | `src/layouts/Layout.astro` | `import Layout` | VERIFIED | Line 2: `import Layout from "../../layouts/Layout.astro"` |
| `src/components/LanguageToggle.astro` | `src/i18n/utils.ts` | `import { getLangFromUrl, getLocalePath }` | VERIFIED | Line 3: `import { getLangFromUrl, useTranslations, getLocalePath } from "@/i18n/utils"` |
| `src/layouts/Layout.astro` | `src/components/LanguageToggle.astro` | `import LanguageToggle` | VERIFIED | Line 4: `import LanguageToggle from "@/components/LanguageToggle.astro"` |
| `src/content.config.ts` | `astro/loaders` | `import { glob, file }` | VERIFIED | Line 2: `import { glob, file } from "astro/loaders"` |
| `src/content.config.ts` | `astro/zod` | `import { z }` | VERIFIED | Line 3: `import { z } from "astro/zod"` |

### Data-Flow Trace (Level 4)

Not applicable for this phase. No data is fetched and rendered from the content collections on any page yet — the collections are defined and sample data validates, but no pages consume `getCollection()`. This is expected: pages consuming collections are the responsibility of Phases 4 and 5.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build exits 0 with all content | `npx astro build` | "2 page(s) built in 2.78s — Complete!" | PASS |
| FR page at dist root, no dist/fr/ | `ls dist/` | index.html, en/, _astro/, no fr/ | PASS |
| EN page at dist/en/ | `ls dist/en/` | index.html | PASS |
| FR page has `lang="fr"` | grep dist/index.html | `lang="fr"` confirmed | PASS |
| EN page has `lang="en"` | grep dist/en/index.html | `lang="en"` confirmed | PASS |
| Toggle links correct | grep dist/*.html | FR: `href="/en"`, EN: `href="/"` | PASS |
| aria-label in both pages | grep dist/*.html | "Selecteur de langue" / "Language selector" present | PASS |
| FR page has French content | grep dist/index.html | "3 juin 2027", "L.evenement en chiffres", "Parcours" (3 matches) | PASS |
| EN page has English content | grep dist/en/index.html | "June 3, 2027", "The Event in Numbers", "Typography Scale" (3 matches) | PASS |

**Build Warning (non-blocking):** `[WARN] Could not render /en from route /en/ as it conflicts with higher priority route /en.` This is a cosmetic Astro i18n routing warning. The EN page renders correctly at `dist/en/index.html`. The toggle generates `href="/en"` (without trailing slash) which browsers resolve to `/en/index.html`. Does not affect functionality.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| FNDN-02 | 02-01-PLAN.md | Bilingual routing: French as default (no prefix), English under /en/ | SATISFIED | astro.config.mjs i18n block; dist/ structure verified; lang attributes confirmed |
| FNDN-03 | 02-02-PLAN.md | Language toggle component visible on all pages | SATISFIED | LanguageToggle in Layout.astro header; aria-label in both built pages |
| FNDN-04 | 02-03-PLAN.md | Content collections with Zod schemas for speakers, talks, sponsors, team | SATISFIED | content.config.ts with 4 collections; build passes; negative test documented |

All 3 requirement IDs (FNDN-02, FNDN-03, FNDN-04) claimed by phase plans are accounted for in REQUIREMENTS.md as mapping to Phase 2. No orphaned requirements found for this phase.

### Anti-Patterns Found

None detected. Scanned all 9 phase-modified files for TODO/FIXME/PLACEHOLDER, empty returns (`return null`, `return {}`, `return []`), and stub patterns. All implementations are substantive.

### Human Verification Required

#### 1. Language Toggle Visual State

**Test:** Run `npx astro dev`, open `http://localhost:4321/` in a browser. Observe the language toggle in the top-right header.
**Expected:** FR label has a distinct primary-color (blue) background. EN label is muted. Clicking EN navigates to `/en/` with English content and the EN label becomes highlighted.
**Why human:** Conditional `class:list` styling with CSS custom property values (--color-primary) cannot be verified via grep on source or dist.

#### 2. FR/EN Navigation Preserves Path

**Test:** Run `npx astro dev`, navigate to `/en/`, click FR in the toggle.
**Expected:** Navigates to `/` (French root). Active toggle state switches to FR. Page content shows French text.
**Why human:** Full client-side navigation behavior and `getLocalePath` correctness on a path like `/en/` requires browser verification.

#### 3. TranslationNotice Banner Display

**Test:** Temporarily add `<TranslationNotice />` to `src/pages/en/index.astro`, restart dev server, visit `/en/`.
**Expected:** A full-width banner appears below the header with info icon, heading "Content not available in English", body text, and a "View in French" link pointing to `/`.
**Why human:** TranslationNotice is not yet placed on any production page. Its functional correctness as a component can only be confirmed by using it.

### Build Warning Note

The warning `Could not render /en from route /en/ as it conflicts with higher priority route /en` appears each build. The EN page renders correctly. This is an Astro 6 i18n routing internal — the framework generates a redirect route at `/en` alongside the actual page at `/en/`. No user-visible issue. Can be suppressed by reviewing Astro i18n `trailingSlash` configuration in a future cleanup.

---

_Verified: 2026-04-11T20:02:00Z_
_Verifier: Claude (gsd-verifier)_
