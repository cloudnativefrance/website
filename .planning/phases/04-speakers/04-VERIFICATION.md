---
phase: 04-speakers
verified: 2026-04-11T22:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Confirm Stitch design was validated before implementation (CLAUDE.md Stitch-first rule)"
    expected: "Speaker grid and profile pages were designed in Google Stitch and validated by the user before any code was executed, per the mandatory project rule in CLAUDE.md"
    why_human: "No Stitch frame ID, prototype link, or explicit Stitch validation step is recorded in 04-UI-SPEC.md, 04-CONTEXT.md, or 04-DISCUSSION-LOG.md. The UI-SPEC header shows the design was created using the gsd-ui-researcher agent (shadcn preset base-nova) but the word 'Stitch' never appears in any phase artifact. Cannot determine programmatically whether Stitch was used."
  - test: "Visually confirm speaker grid at /speakers/ and /en/speakers/"
    expected: "6 speaker cards displayed. Marie Laurent and Thomas Nguyen appear first with a Keynote badge. Remaining 4 speakers (Amina Diallo, Lucas Martin, David Moreau, Sarah Chen) follow in alphabetical order. Grid uses 4 columns on xl, 3 on lg, 2 on md, 1 on mobile. All cards show initials avatars (no photos)."
    why_human: "Keynote-first ordering and responsive column breakpoints require a real browser to verify. Astro SSG renders at build time; cannot verify output HTML without running pnpm build and inspecting the output."
  - test: "Verify speaker profile page at /speakers/speaker-1 (Marie Laurent)"
    expected: "Page shows: ML initials avatar (128px rounded square), name 'Marie Laurent', role 'Lead SRE', company 'CloudScale', GitHub and LinkedIn icon links, bio text, talk card titled 'Construire des plateformes internes avec Crossplane' with devops-platform badge and keynote format, and a muted 'Programme a venir' placeholder (not a clickable link)."
    why_human: "Cannot verify visual layout, avatar size, badge colors, or placeholder text rendering without a browser."
  - test: "Verify co-speaker cross-links between speaker-5 and speaker-6"
    expected: "On /speakers/speaker-5 (Amina Diallo), talk-5 shows 'Avec David Moreau' as a clickable link. Clicking navigates to /speakers/speaker-6 (David Moreau). On speaker-6's profile, talk-5 shows 'Avec Amina Diallo' as a clickable link back to speaker-5."
    why_human: "Bidirectional co-speaker navigation requires a live browser and cannot be verified by static analysis alone. The data wiring is verified programmatically but the actual link resolution depends on getLocalePath correctness at runtime."
  - test: "Verify EN speaker pages at /en/speakers/ and /en/speakers/speaker-1"
    expected: "Grid heading reads 'Our Speakers'. Speaker-1 profile bio is in English. Talk card reads 'Their Talks'. Schedule placeholder reads 'Schedule coming soon'. Back link reads 'Back to speakers'."
    why_human: "Language switching behavior and correct EN content rendering requires a browser to verify against live content."
---

# Phase 4: Speakers — Verification Report

**Phase Goal:** Visitors can browse all speakers and read detailed profiles with links to their talks
**Verified:** 2026-04-11T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Speaker grid page shows all speakers with photo, name, and company in a responsive layout | VERIFIED | `src/pages/speakers/index.astro` calls `getSortedSpeakers("fr")`, maps to `SpeakerCard` with `name`, `company`, `slug`, `photo`, `isKeynote`. Grid class `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` present. EN mirror at `src/pages/en/speakers/index.astro` identical pattern with `getSortedSpeakers("en")` and `lang="en"`. |
| 2 | Clicking a speaker opens their individual page with bio, company, photo, social links, and talk abstract | VERIFIED | `SpeakerCard` wraps in `<a href={getLocalePath(lang, '/speakers/${slug}')}>`. `src/pages/speakers/[slug].astro` exports `getStaticPaths` filtering fr/ speakers. `SpeakerProfile` renders avatar, name, role+company, SocialLinks, bio slot, and named talks slot. TalkCard renders title, track badge, format, duration. Both FR and EN dynamic pages exist and use Astro 6 `render(entry)` API. |
| 3 | Speaker pages link to their talk(s) in the schedule (link targets may be placeholder until Phase 7) | VERIFIED | `TalkCard.astro` line 71-73: `<span class="text-sm text-muted-foreground cursor-default mt-2 block">{t("speakers.schedule_placeholder")}</span>`. Rendered as non-interactive muted span, not a link. i18n key `speakers.schedule_placeholder` = "Programme a venir" (FR) / "Schedule coming soon" (EN). Roadmap SC3 explicitly states "link targets may be placeholder until Phase 7". |
| 4 | Speaker content exists in both fr/ and en/ subfolders as Markdown files, rendered per locale | VERIFIED | `src/content/speakers/fr/` has 6 files (speaker-1 to speaker-6). `src/content/speakers/en/` has 6 files. `src/content/talks/fr/` has 8 files. `src/content/talks/en/` has 8 files. All files have complete frontmatter with `name`, `bio`, `company`, `role`, `social` fields. No `photo` field (intentional for D-06 placeholder testing). FR and EN versions differ in bio text and talk descriptions. |

**Score:** 4/4 truths verified

### Deferred Items

None identified. Schedule link placeholder is explicitly accepted by the roadmap ("link targets may be placeholder until Phase 7").

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/speakers.ts` | 7 speaker/talk query utilities | VERIFIED | 71 lines. All 7 functions exported: `getSlug`, `getLocale`, `getSpeakersByLocale`, `getTalksByLocale`, `getTalksForSpeaker`, `getSortedSpeakers`, `getCoSpeakersForTalk`. Imports `getCollection` from `astro:content` and `type Locale` from `@/i18n/ui`. |
| `src/content/speakers/fr/speaker-2.md` | Sample FR speaker with keynote talk | VERIFIED | File exists. `name: "Thomas Nguyen"`, `company: "KubeForge"`, valid frontmatter. No photo field. Social includes github, linkedin, bluesky. |
| `src/content/talks/fr/talk-2.md` | Sample FR keynote talk | VERIFIED | File exists. Contains `format: "keynote"`, `speaker: "speaker-2"`, `track: "devops-platform"`, `duration: 40`. |
| `src/components/speakers/SpeakerAvatar.astro` | Avatar with photo/initials fallback | VERIFIED | 51 lines. Props: `{ name, photo?, size?: "sm"|"lg", class? }`. Renders `<img>` with photo, `<div>` with computed initials when no photo. sm: `w-16 h-16 rounded-full`, lg: `w-32 h-32 rounded-xl`. `aria-label={name}` on initials div. |
| `src/components/speakers/SpeakerCard.astro` | Grid card with avatar, keynote badge | VERIFIED | 39 lines. Wraps in `<a href={getLocalePath(lang, '/speakers/${slug}')}>`. Uses `SpeakerAvatar size="sm"`. Keynote badge with `text-accent bg-accent/15`. Hover: `hover:border-primary/50 motion-safe:hover:-translate-y-0.5`. Focus: `focus-visible:ring-2 focus-visible:ring-ring`. |
| `src/components/speakers/SocialLinks.astro` | Icon row with accessible SVG icons | VERIFIED | 109 lines. Props: `{ social? }`. Inline SVG icons for GitHub, LinkedIn, Bluesky, website. Each link has `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`. `p-2` padding for 44px touch target. Note: twitter field in Props is not rendered (WR-02). |
| `src/pages/speakers/index.astro` | FR speaker grid page | VERIFIED | 62 lines. Imports `getSortedSpeakers` from `@/lib/speakers`. Calls `getSortedSpeakers("fr")` and `getTalksByLocale("fr")`. Builds `keynoteSlugs` set. Maps to SpeakerCard with all props. Empty state handled. |
| `src/pages/en/speakers/index.astro` | EN speaker grid page | VERIFIED | Same structure as FR. `getSortedSpeakers("en")`, `getTalksByLocale("en")`, `lang="en"`. |
| `src/components/speakers/TalkCard.astro` | Talk card with track badges and co-speaker links | VERIFIED | 74 lines. Track color map covers all 4 tracks. Co-speaker `<a>` links via `getLocalePath`. Schedule rendered as `<span>` with `cursor-default` (not a link). |
| `src/components/speakers/SpeakerProfile.astro` | Full speaker profile layout | VERIFIED | 71 lines. Back link via `getLocalePath(lang, "/speakers")`. `SpeakerAvatar size="lg"`. Named slot `"talks"`. `SocialLinks` integrated. Bio via default `<slot />`. |
| `src/pages/speakers/[slug].astro` | FR dynamic speaker pages | VERIFIED | 83 lines. `getStaticPaths` filters `fr/` speakers. Uses Astro 6 `render(entry)` API (not `entry.render()`). Builds `speakerMap` for co-speaker name lookup. Passes all speaker data to `SpeakerProfile`. |
| `src/pages/en/speakers/[slug].astro` | EN dynamic speaker pages | VERIFIED | 83 lines. Mirrors FR pattern. Filters `en/` speakers. `lang: "en"`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/speakers/index.astro` | `src/lib/speakers.ts` | import getSortedSpeakers | WIRED | Line 4: `import { getSortedSpeakers, getSlug, getTalksByLocale } from "@/lib/speakers"`. Called on line 9. |
| `src/components/speakers/SpeakerCard.astro` | `src/components/speakers/SpeakerAvatar.astro` | component composition | WIRED | Line 2: `import SpeakerAvatar from "./SpeakerAvatar.astro"`. Used at line 28. |
| `src/pages/speakers/[slug].astro` | `src/lib/speakers.ts` | getTalksForSpeaker and getCoSpeakersForTalk | WIRED | Lines 6-11: both functions imported. `getTalksForSpeaker("fr", slug)` called line 27. `getCoSpeakersForTalk(talk, slug)` called line 57. |
| `src/components/speakers/TalkCard.astro` | `src/components/speakers/SpeakerCard.astro` | shared design language (border-border bg-card) | WIRED | Line 36-39: `rounded-lg border border-border bg-card p-4 transition-colors duration-200 hover:border-primary/50` matches SpeakerCard card pattern. |
| `src/components/speakers/SpeakerProfile.astro` | `src/components/speakers/SpeakerAvatar.astro` | avatar rendering at size lg | WIRED | Line 47: `<SpeakerAvatar name={name} photo={photo} size="lg" class="mx-auto" />`. |
| `src/content/talks/fr/talk-1.md` | `src/content/speakers/fr/speaker-1.md` | speaker field matching filename slug | WIRED | talk-1.md: `speaker: "speaker-1"`. Utility `getTalksForSpeaker` matches `t.data.speaker === speakerSlug`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `src/pages/speakers/index.astro` | `speakers` array | `getSortedSpeakers("fr")` → `getCollection("speakers")` filtered by `fr/` | Yes — Astro content collection reads 6 fr/ speaker files | FLOWING |
| `src/pages/speakers/index.astro` | `keynoteSlugs` Set | `getTalksByLocale("fr")` → `getCollection("talks")` filtered by `fr/`, then format === "keynote" check | Yes — 2 keynote talks in fr/ produce 2 slugs in set | FLOWING |
| `src/pages/speakers/[slug].astro` | `talks` array | `getTalksForSpeaker("fr", slug)` → filters talks by speaker or cospeakers match | Yes — speaker-5's profile gets talk-5 via cospeakers match | FLOWING |
| `src/pages/speakers/[slug].astro` | `speakerMap` Map | `getSpeakersByLocale("fr")` → maps slug → name | Yes — builds lookup from 6 fr/ speaker entries | FLOWING |
| `src/components/speakers/SpeakerProfile.astro` | Bio content | `render(speaker)` Astro 6 API returning `Content` component | Yes — renders markdown body from speaker .md file | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — All pages are Astro SSG components requiring a build/dev server to execute. No standalone runnable entry points available. Build success was verified by the executor at each plan step (commits 5fda7ea, 846d052, c1dbc23, 17fe93c, 04ae405).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SPKR-01 | 04-02-PLAN.md | Speaker grid overview with photo, name, company | SATISFIED | `src/pages/speakers/index.astro` and `src/pages/en/speakers/index.astro` render 6 speakers via SpeakerCard with avatar, name, company. Responsive grid 4/3/2/1 columns. |
| SPKR-02 | 04-03-PLAN.md | Individual speaker page with bio, company, photo, social links, talk abstract | SATISFIED | Dynamic `[slug].astro` pages for FR and EN. SpeakerProfile renders all fields. TalkCard renders talk abstract with title, track, format, duration. |
| SPKR-03 | 04-03-PLAN.md | Link from speaker page to their talk(s) in the schedule | SATISFIED (placeholder) | TalkCard renders schedule placeholder span per roadmap SC3 which explicitly allows placeholder until Phase 7. `speakers.schedule_placeholder` i18n key used. |
| SPKR-04 | 04-01-PLAN.md | Speaker data managed via Markdown files (bilingual: fr/ and en/ subfolders) | SATISFIED | 6 speakers + 8 talks in `src/content/speakers/{fr,en}/` and `src/content/talks/{fr,en}/`. Content collection uses glob loader. Zod schemas validate at build time. |

**Note:** REQUIREMENTS.md traceability table shows SPKR-01 and SPKR-04 as `Pending` (unchecked). SPKR-02 and SPKR-03 are marked `Complete`. This is a housekeeping inconsistency — the executor marked SPKR-02 and SPKR-03 complete but did not update SPKR-01 and SPKR-04 checkboxes. Not a blocker.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/speakers/SocialLinks.astro` | 19-106 | Social link `href` values rendered without URL validation — `javascript:` URIs would be clickable (CR-01 from code review) | Warning | Potential XSS vector if speaker content is ever imported from external sources. Current sample data uses only https:// URLs so no active risk. Fix: add `social.github.startsWith("http")` guards or `isSafeUrl()` helper. Not applied despite being flagged in 04-REVIEW.md. |
| `src/components/speakers/SocialLinks.astro` | 8 | `twitter?: string` field defined in Props interface but no rendering block exists for it — silently ignored (WR-02 from code review) | Warning | If any speaker entry has a twitter URL, it will not display. No current sample data has twitter so no visible regression. |
| `src/components/speakers/TalkCard.astro` | 25-30 | `trackNames` are hardcoded English strings ("Cloud & Infra", "DevOps & Platform", etc.) regardless of locale (IN-02 from code review) | Info | Track badge labels display in English on French pages. May be intentional if track names are considered brand proper nouns. |
| `src/pages/speakers/index.astro` | 7 | `getLangFromUrl(Astro.url)` result stored in `lang` but hardcoded locale strings `"fr"` / `"en"` are passed to data functions instead of `lang` variable (IN-01 from code review) | Info | Inconsistency between URL-derived lang (for translations) and hardcoded locale (for data). No user-visible bug with current two-locale setup but could cause mismatch if routing changes. |

No TODO/FIXME/placeholder markers in source files. No empty return implementations. No hardcoded empty arrays passed as props.

### Human Verification Required

#### 1. Stitch-First Rule Compliance

**Test:** Confirm that the speaker grid and profile page designs were reviewed and approved in Google Stitch before code execution began.

**Expected:** A Stitch prototype or frame showing the speaker grid (card layout, keynote badge, avatar, grid columns) and speaker profile (large avatar, social icon row, talk cards with track badges) was presented to and validated by the user before `04-02-PLAN.md` and `04-03-PLAN.md` were executed.

**Why human:** CLAUDE.md mandates: "Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code. Never skip straight to code for visual work." The `04-UI-SPEC.md` was created by `gsd-ui-researcher` using the shadcn base-nova preset but contains no reference to Stitch, no frame IDs, and no evidence of Stitch validation. The word "Stitch" does not appear anywhere in the phase artifacts (CONTEXT.md, DISCUSSION-LOG.md, UI-SPEC.md, all three SUMMARYs). This is the same concern raised for Phase 3. Cannot determine programmatically whether Stitch validation occurred outside the documented artifacts.

#### 2. Speaker Grid Visual Confirmation

**Test:** Run `pnpm dev` and visit `http://localhost:4321/speakers/`.

**Expected:** 6 speaker cards displayed in a responsive grid. Marie Laurent (ML initials) and Thomas Nguyen (TN initials) appear first with a "Keynote" badge. Remaining 4 speakers (Amina Diallo, Lucas Martin, David Moreau, Sarah Chen) follow in alphabetical order. Cards show initials avatars with a secondary background color. Card hover shows border color shift and subtle upward lift (unless prefers-reduced-motion). Grid is 4 columns at 1280px+, 3 at 1024px+, 2 at 768px+, 1 on mobile.

**Why human:** Keynote-first ordering is computed at Astro build time via `getSortedSpeakers`. The logic is correct in code but the rendered order on-screen requires a browser view to confirm. Responsive columns and hover animations cannot be verified statically.

#### 3. Speaker Profile Visual Confirmation

**Test:** Click on Marie Laurent's card — verify profile loads at `/speakers/speaker-1`.

**Expected:** Large 128px rounded-square avatar showing "ML" initials. Name "Marie Laurent" at 36px bold. "Lead SRE · CloudScale" below in muted text. Two social icon links (GitHub, LinkedIn) in a horizontal row. Bio text in FR. Talk card titled "Construire des plateformes internes avec Crossplane" with a `devops-platform` track badge (accent color), "Keynote - 45min" format text, and a muted "Programme a venir" span (not a link). "Retour aux speakers" back link in top-left.

**Why human:** Avatar rendering, badge color (`bg-accent/15 text-accent`), and schedule placeholder styling (muted, non-interactive) require browser rendering to confirm.

#### 4. Co-Speaker Cross-Link Verification

**Test:** Navigate to `/speakers/speaker-5` (Amina Diallo). Verify talk-5 shows co-speaker link. Click the David Moreau link. Verify speaker-6's profile also shows talk-5 with an Amina Diallo link.

**Expected:** On Amina Diallo's profile: talk card for "Pipelines CI/CD cloud-native" shows "Avec David Moreau" with a clickable link to `/speakers/speaker-6`. On David Moreau's profile: same talk shows "Avec Amina Diallo" with a clickable link to `/speakers/speaker-5`. The `getCoSpeakersForTalk` logic excludes the current speaker, so each profile only sees the other's name.

**Why human:** Bidirectional link navigation requires a running browser. The data logic and wiring are verified programmatically, but the actual rendered links and successful navigation require live testing.

#### 5. English Locale Pages

**Test:** Visit `http://localhost:4321/en/speakers/` and click a speaker card.

**Expected:** Grid heading is "Our Speakers". Speaker profile bio is in English. Talk section heading reads "Their Talks". Schedule placeholder reads "Schedule coming soon". Back link reads "Back to speakers".

**Why human:** Locale switching and correct EN content rendering with translated UI strings requires a browser to confirm against live content.

### Gaps Summary

No hard blockers found. All 4 roadmap success criteria are satisfied at the code level. All required artifacts exist, are substantive, and are wired correctly. Data flows from Astro content collections through utility functions to rendered pages in both locales.

The phase is held at `human_needed` for two reasons:

1. **Stitch-first rule compliance** (CLAUDE.md mandatory project rule): No evidence that speaker page designs were reviewed in Google Stitch before implementation. This is the same pattern flagged in Phase 3 verification. The user must confirm whether Stitch was used (and the evidence is simply undocumented) or whether this rule was skipped.

2. **Visual and behavioral confirmation**: Speaker grid ordering, avatar rendering, track badge colors, co-speaker link navigation, and locale-specific content all require a live browser to confirm they work as intended.

Additionally, three code quality issues from `04-REVIEW.md` were NOT addressed:
- **CR-01** (Warning): Social link URL validation missing — `javascript:` URIs would render as clickable links
- **WR-02** (Warning): `twitter` field in SocialLinks Props is declared but never rendered
- **IN-02** (Info): Track badge names are English-only, not localized

These do not block the phase goal but should be addressed before the site is production-ready.

---

_Verified: 2026-04-11T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
