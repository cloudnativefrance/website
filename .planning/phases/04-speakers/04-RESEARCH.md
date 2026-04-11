# Phase 4: Speakers - Research

**Researched:** 2026-04-11
**Domain:** Astro 6 content collections, bilingual speaker pages, cross-referencing collections
**Confidence:** HIGH

## Summary

Phase 4 builds speaker grid and profile pages using the existing Astro 6 content collection infrastructure (speakers + talks collections already defined with Zod schemas). The bilingual pattern is established: content lives in `fr/` and `en/` subfolders, the glob loader produces IDs like `fr/speaker-1`, and locale filtering is done by checking the ID prefix. The shadcn/ui Card, Badge, and Button components are already available and customized to the design system.

The primary technical challenge is cross-referencing speakers with talks. Talk entries reference speakers by slug (`speaker: "speaker-1"`), but collection entry IDs include locale prefixes (`fr/speaker-1`). A utility function that strips the locale prefix to extract the slug is needed to join the two collections. Co-speakers use the same slug reference pattern via the `cospeakers` array.

**Primary recommendation:** Build pure Astro pages (no React islands needed) using `getCollection()` with locale filtering, reusable `.astro` components for speaker cards and talk cards, and a shared utility for slug extraction and speaker-talk joining.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Compact card grid -- photo (circle or rounded square), name, company. 3-4 columns on desktop, 2 on tablet, 1 on mobile. Clicking opens individual speaker page.
- **D-02:** Keynotes first, then alphabetical -- keynote speakers featured at the top of the grid, remaining speakers sorted A-Z by name. Requires filtering talks by `format: "keynote"` to identify keynote speakers.
- **D-03:** Focused card layout -- large photo + name/role/company at top, bio section below, then talk card(s). Single-column centered, mobile-first.
- **D-04:** Social links as icon row -- small icons (GitHub, LinkedIn, Bluesky, website) in a horizontal row below the speaker name. Uses existing `socialSchema` fields from content.config.ts.
- **D-05:** 5-8 sample speakers for development -- mix of keynote and regular speakers, both FR and EN versions.
- **D-06:** Placeholder avatars -- use generated initials-based or generic silhouette avatars during development. Component should gracefully handle missing `photo` field.
- **D-07:** Inline talk cards on speaker profiles -- each talk shown as a card with title, track badge, format, duration. Links to schedule page (Phase 7) when it exists; placeholder/disabled link for now.
- **D-08:** Co-speakers shown on all profiles -- a co-presented talk appears on both the primary speaker and all co-speakers' pages. Each profile shows co-speakers' names as clickable links to their profiles.

### Claude's Discretion
- Photo aspect ratio and crop treatment (circle vs rounded square)
- Track badge color mapping (cloud-infra, devops-platform, security, community)
- Speaker page URL structure (e.g., `/speakers/jane-doe` or `/speakers/speaker-1`)
- Grid card hover effects

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPKR-01 | Speaker grid overview with photo, name, company | Card component + getCollection with locale filter + keynote-first sorting |
| SPKR-02 | Individual speaker page with bio, company, photo, social links, talk abstract | Dynamic route with getStaticPaths + speaker-talk cross-reference utility |
| SPKR-03 | Link from speaker page to their talk(s) in the schedule | Talk card component with href to `/schedule#talk-slug` (placeholder until Phase 7) |
| SPKR-04 | Speaker data managed via Markdown files (bilingual: fr/ and en/ subfolders) | Already scaffolded in content.config.ts with glob loader pattern |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stitch-first**: Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code.
- After executing a phase that produces pages or UI components, present each page in Stitch for review before considering the work done.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.5 | Static site framework, content collections, dynamic routes | Project foundation [VERIFIED: package.json] |
| react | 19.2.5 | Interactive islands (not heavily needed for this phase) | [VERIFIED: package.json] |
| tailwindcss | 4.2.2 | Utility-first CSS with design tokens | [VERIFIED: package.json] |
| shadcn/ui | 4.2.0 | Card, Badge, Button components | [VERIFIED: package.json] |
| lucide-react | 1.8.0 | Icon library for social link icons | [VERIFIED: package.json] |

### Supporting (no new installs needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Variant-based component styling | Track badge variants |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Class merging utility | All component className props |

**No new packages required.** lucide-react already includes GitHub, LinkedIn, Globe (website), and ExternalLink icons. For Bluesky, a simple inline SVG is needed since lucide-react does not include a Bluesky icon. [ASSUMED]

## Architecture Patterns

### Recommended Project Structure

```
src/
  pages/
    speakers/
      index.astro            # FR speaker grid (default locale, no prefix)
      [slug].astro           # FR individual speaker page
    en/
      speakers/
        index.astro          # EN speaker grid
        [slug].astro         # EN individual speaker page
  components/
    speakers/
      SpeakerCard.astro      # Grid card (photo, name, company)
      SpeakerProfile.astro   # Full profile layout (bio, social, talks)
      SocialLinks.astro      # Icon row for social links
      TalkCard.astro         # Talk summary card (title, track, format, duration)
      SpeakerAvatar.astro    # Handles photo or placeholder fallback
  lib/
    speakers.ts              # Utility: getSpeakersByLocale, getTalksForSpeaker, etc.
  content/
    speakers/
      fr/
        speaker-1.md ... speaker-8.md
      en/
        speaker-1.md ... speaker-8.md
    talks/
      fr/
        talk-1.md ... talk-N.md
      en/
        talk-1.md ... talk-N.md
```

### Pattern 1: Locale-Filtered Content Collection Queries

**What:** The glob loader produces entry IDs with locale prefixes (e.g., `fr/speaker-1`). Filter by locale prefix to get the right language.

**When to use:** Every page that queries speakers or talks.

**Example:**
```typescript
// src/lib/speakers.ts
import { getCollection } from "astro:content";
import type { Locale } from "@/i18n/ui";

/** Extract the slug (without locale prefix) from a collection entry ID */
export function getSlug(entryId: string): string {
  // ID format: "fr/speaker-1" or "en/speaker-1"
  return entryId.replace(/^(fr|en)\//, "");
}

/** Extract locale from a collection entry ID */
export function getLocale(entryId: string): Locale {
  return entryId.startsWith("en/") ? "en" : "fr";
}

/** Get all speakers for a given locale */
export async function getSpeakersByLocale(locale: Locale) {
  const allSpeakers = await getCollection("speakers");
  return allSpeakers.filter((s) => s.id.startsWith(`${locale}/`));
}

/** Get all talks for a given locale */
export async function getTalksByLocale(locale: Locale) {
  const allTalks = await getCollection("talks");
  return allTalks.filter((t) => t.id.startsWith(`${locale}/`));
}

/** Get talks for a specific speaker slug (matches speaker + cospeakers) */
export async function getTalksForSpeaker(locale: Locale, speakerSlug: string) {
  const talks = await getTalksByLocale(locale);
  return talks.filter(
    (t) =>
      t.data.speaker === speakerSlug ||
      t.data.cospeakers?.includes(speakerSlug)
  );
}
```
[VERIFIED: content.config.ts uses glob loader with `**/*.md` pattern producing `{locale}/{slug}` IDs]

### Pattern 2: Keynote-First Sorting

**What:** Identify keynote speakers by checking if any of their talks has `format: "keynote"`, then sort keynotes first, remaining A-Z.

**When to use:** Speaker grid page.

**Example:**
```typescript
// In speakers grid page
export async function getSortedSpeakers(locale: Locale) {
  const speakers = await getSpeakersByLocale(locale);
  const talks = await getTalksByLocale(locale);

  // Build a Set of speaker slugs who have keynote talks
  const keynoteSpeakerSlugs = new Set<string>();
  for (const talk of talks) {
    if (talk.data.format === "keynote") {
      keynoteSpeakerSlugs.add(talk.data.speaker);
      talk.data.cospeakers?.forEach((cs) => keynoteSpeakerSlugs.add(cs));
    }
  }

  // Sort: keynotes first, then alphabetical by name
  return speakers.sort((a, b) => {
    const aKey = keynoteSpeakerSlugs.has(getSlug(a.id));
    const bKey = keynoteSpeakerSlugs.has(getSlug(b.id));
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.data.name.localeCompare(b.data.name);
  });
}
```
[VERIFIED: talk schema has `format: z.enum(["talk", "lightning", "workshop", "keynote"])`]

### Pattern 3: Dynamic Speaker Pages with getStaticPaths

**What:** Astro dynamic routes using `[slug].astro` with `getStaticPaths()` generating one page per speaker.

**When to use:** Individual speaker profile pages.

**Example:**
```astro
---
// src/pages/speakers/[slug].astro (FR locale)
import { getCollection } from "astro:content";
import { getSlug, getTalksForSpeaker } from "@/lib/speakers";

export async function getStaticPaths() {
  const speakers = await getCollection("speakers");
  const frSpeakers = speakers.filter((s) => s.id.startsWith("fr/"));

  return frSpeakers.map((speaker) => ({
    params: { slug: getSlug(speaker.id) },
    props: { speaker },
  }));
}

const { speaker } = Astro.props;
const slug = getSlug(speaker.id);
const talks = await getTalksForSpeaker("fr", slug);
const { Content } = await speaker.render();
---
```
[VERIFIED: Astro 6 getStaticPaths pattern consistent with existing pages structure]

### Pattern 4: Placeholder Avatar Component

**What:** Display speaker photo if available, fall back to initials-based avatar.

**When to use:** Both grid cards and profile pages.

**Example:**
```astro
---
// src/components/speakers/SpeakerAvatar.astro
interface Props {
  name: string;
  photo?: string;
  size?: "sm" | "lg";
  class?: string;
}
const { name, photo, size = "sm", class: className } = Astro.props;
const initials = name
  .split(" ")
  .map((w) => w[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();
const sizeClass = size === "lg" ? "w-32 h-32 text-3xl" : "w-16 h-16 text-base";
---

{photo ? (
  <img
    src={photo}
    alt={name}
    class:list={["rounded-full object-cover", sizeClass, className]}
  />
) : (
  <div
    class:list={[
      "rounded-full bg-secondary flex items-center justify-center font-semibold text-muted-foreground",
      sizeClass,
      className,
    ]}
  >
    {initials}
  </div>
)}
```

### Pattern 5: Track Badge Color Mapping (Claude's Discretion)

**Recommendation:** Map track names to existing design system colors for consistency with DESIGN.md Track Badges specification.

```typescript
// In a component or utility
const trackColors: Record<string, string> = {
  "cloud-infra": "bg-primary/15 text-primary",         // blue
  "devops-platform": "bg-accent/15 text-accent",       // pink
  "security": "bg-destructive/15 text-destructive",    // red
  "community": "bg-chart-4/15 text-chart-4",           // light blue
};
```
[VERIFIED: DESIGN.md Track Badges section defines these exact color mappings]

### Anti-Patterns to Avoid

- **React islands for static content:** Speaker grid and profiles are fully static. Do NOT use `client:load` or React components. Pure `.astro` components render faster and produce zero client JS.
- **Querying all collections on every page:** Cache/memoize collection queries in utility functions. In Astro SSG, each page call is isolated, but within a single page build, avoid redundant `getCollection()` calls.
- **Hardcoding locale in paths:** Always use the `getLocalePath()` utility from `src/i18n/utils.ts` for building internal links.
- **Using `photo` field without fallback:** The schema marks `photo` as optional (`z.string().optional()`). Every component rendering photos MUST handle the undefined case.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card layout | Custom card HTML | shadcn/ui `Card` family | Already styled to design system |
| Track badges | Custom badge styling | shadcn/ui `Badge` with variant | Consistent with existing badge patterns |
| Social icons | Custom SVG set | `lucide-react` icons (Github, Linkedin, Globe, ExternalLink) | Already installed, tree-shakeable |
| Locale routing | Manual path construction | `getLocalePath()` from `src/i18n/utils.ts` | Handles prefix/no-prefix logic correctly |
| UI translations | Inline strings | `useTranslations()` from `src/i18n/utils.ts` | Established pattern in codebase |
| Class merging | String concatenation | `cn()` from `src/lib/utils.ts` | Handles Tailwind merge conflicts |

## Common Pitfalls

### Pitfall 1: Collection Entry ID vs Speaker Slug Mismatch
**What goes wrong:** Talk references speaker as `"speaker-1"` but the collection entry ID is `"fr/speaker-1"`. Direct ID comparison fails silently.
**Why it happens:** The glob loader prepends the directory path to the entry ID.
**How to avoid:** Always strip locale prefix with `getSlug()` before comparing speaker slugs across collections.
**Warning signs:** Empty talk lists on speaker profile pages despite talks existing in content.

### Pitfall 2: Missing EN Mirror Pages
**What goes wrong:** FR pages work but EN pages 404 because the `src/pages/en/speakers/` directory was not created or pages do not mirror the FR structure.
**Why it happens:** Astro's routing with `prefixDefaultLocale: false` means FR pages live at `/speakers/` and EN at `/en/speakers/`. These are separate page files.
**How to avoid:** Create both `src/pages/speakers/[slug].astro` and `src/pages/en/speakers/[slug].astro`. They can share components but need separate page files.
**Warning signs:** No EN speaker pages generated during build.

### Pitfall 3: Co-speaker Links Creating Circular References
**What goes wrong:** Speaker A's profile shows Speaker B as co-speaker with a link. Speaker B's profile shows Speaker A. Not inherently wrong, but the talk card must correctly list ALL co-speakers excluding the current speaker.
**Why it happens:** The `cospeakers` array only lists co-speakers, not the primary speaker. Need to combine `speaker` + `cospeakers` minus current speaker for the display.
**How to avoid:** Build a utility: `getCoSpeakersForTalk(talk, currentSpeakerSlug)` that returns all other speakers (primary + co) excluding the current one.
**Warning signs:** Speaker seeing themselves listed as a co-speaker on their own profile.

### Pitfall 4: Keynote Sort Depends on Talk Data
**What goes wrong:** A speaker exists but has no associated talk yet (content not created). They never appear as a keynote even if intended.
**Why it happens:** Keynote status is derived from talk format, not a speaker field.
**How to avoid:** Ensure sample data includes keynote talks for the intended keynote speakers. Document this dependency clearly.
**Warning signs:** All speakers appearing in alphabetical order with no keynote section.

### Pitfall 5: Stitch-First Rule Skipped
**What goes wrong:** Pages built directly in code, then user requests visual changes requiring rework.
**Why it happens:** Eagerness to code. CLAUDE.md explicitly requires Stitch design review first.
**How to avoid:** Plan must include a Stitch design step BEFORE any page implementation.
**Warning signs:** PR with pages but no Stitch design link in the discussion.

## Code Examples

### Querying Content Collections in Astro 6

```astro
---
// Astro 6 content collection query pattern
import { getCollection } from "astro:content";

// Get all speakers, filter by locale
const allSpeakers = await getCollection("speakers");
const frSpeakers = allSpeakers.filter((s) => s.id.startsWith("fr/"));

// Each entry has: id, data (frontmatter), body (markdown), render()
// entry.id = "fr/speaker-1"
// entry.data = { name, company, role, photo, bio, social }
// entry.render() returns { Content } component for the markdown body
---
```
[VERIFIED: content.config.ts schema and glob loader pattern in codebase]

### Rendering Markdown Body Content

```astro
---
const { Content } = await speaker.render();
---
<article class="prose prose-invert max-w-none">
  <Content />
</article>
```
[ASSUMED: Astro 6 render() API -- standard pattern but not verified against Astro 6 docs in this session]

### Social Links with Lucide Icons

```astro
---
import { Github, Linkedin, Globe, ExternalLink } from "lucide-react";
// Note: Bluesky not in lucide -- use inline SVG

interface Props {
  social?: {
    github?: string;
    linkedin?: string;
    bluesky?: string;
    website?: string;
    twitter?: string;
  };
}
const { social } = Astro.props;
if (!social) return;

const links = [
  { url: social.github, icon: "github", label: "GitHub" },
  { url: social.linkedin, icon: "linkedin", label: "LinkedIn" },
  { url: social.bluesky, icon: "bluesky", label: "Bluesky" },
  { url: social.website, icon: "globe", label: "Website" },
];
---
<div class="flex items-center gap-3">
  {links.filter(l => l.url).map(({ url, icon, label }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      class="text-muted-foreground hover:text-primary transition-colors"
      aria-label={label}
    >
      <!-- Render icon based on type -->
    </a>
  ))}
</div>
```

**Note on icon approach:** Since these are in `.astro` components (not React), use inline SVGs or a simple Astro icon component rather than importing lucide-react (which requires React context). Alternatively, use lucide icon SVG paths directly. [ASSUMED]

### Recommended: Pure SVG Icons in Astro Components

Since speaker pages should be pure Astro (no React islands), social link icons should use inline SVGs rather than lucide-react. Copy the SVG paths from lucide and create a simple Astro icon helper. This avoids shipping any client-side JavaScript for the speaker pages.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro content collections v1 (`src/content/config.ts`) | Astro content collections v2 with loaders (`src/content.config.ts`) | Astro 5+ | glob/file loaders, Zod schema at config level |
| `getEntryBySlug()` | `getEntry()` with full ID | Astro 5+ | IDs include loader path prefix |
| JS-based Tailwind config | CSS-native `@theme` directive | Tailwind 4 | Tokens in global.css, no tailwind.config.js |

[VERIFIED: codebase already uses Astro 6 / Tailwind 4 patterns]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | lucide-react does not include a Bluesky icon | Standard Stack | LOW -- easy to check, just need an inline SVG fallback |
| A2 | Astro 6 `render()` returns `{ Content }` for Markdown body | Code Examples | LOW -- well-established Astro pattern, very unlikely to have changed |
| A3 | Social icons should use inline SVG in .astro files rather than lucide-react | Code Examples | LOW -- architectural choice, React imports work in .astro frontmatter but SVGs are simpler for static content |

## Open Questions

1. **Speaker URL slug format**
   - What we know: Content files use `speaker-1`, `speaker-2` pattern. Talks reference by this slug.
   - What's unclear: Should URLs use the filename slug (`/speakers/speaker-1`) or a name-derived slug (`/speakers/jane-doe`)?
   - Recommendation: Use the filename slug (`speaker-1`) for simplicity and consistency with talk references. When real speaker data arrives, filenames can use name-based slugs directly (e.g., `jane-doe.md`).

2. **Circle vs rounded-square photos** (Claude's Discretion)
   - Recommendation: Use `rounded-full` (circle) for grid cards (matches DESIGN.md Speaker Card spec: "64px circle with --radius-full") and `rounded-xl` (rounded square) for the large profile photo to add variety.

3. **Number of sample talks needed**
   - What we know: D-05 says 5-8 sample speakers. D-08 requires co-speaker testing.
   - Recommendation: Create 6-8 speakers with 8-10 talks. At least 1 keynote talk, 1 talk with cospeakers, and a mix of tracks/formats.

## Discretion Recommendations

These address the areas marked as "Claude's Discretion" in CONTEXT.md:

| Area | Recommendation | Rationale |
|------|---------------|-----------|
| Photo crop | Circle (`rounded-full`) on grid, rounded-xl on profile | Matches DESIGN.md Speaker Card spec; profile variant adds visual interest |
| Track badge colors | cloud-infra=blue, devops-platform=pink, security=red, community=light-blue | Directly from DESIGN.md Track Badges section |
| URL structure | `/speakers/{filename-slug}` (e.g., `/speakers/speaker-1`) | Matches content file naming; consistent with talk `speaker` field references |
| Grid hover effects | Border color transition to `primary/50` + subtle `translateY(-2px)` | Follows DESIGN.md Card hover pattern (border-color transition to primary at 50% opacity) |

## Sources

### Primary (HIGH confidence)
- `src/content.config.ts` -- Zod schemas for speakers and talks collections
- `src/i18n/ui.ts` + `src/i18n/utils.ts` -- Translation and routing utilities
- `src/pages/index.astro` + `src/pages/en/index.astro` -- Established page structure pattern
- `DESIGN.md` -- Design tokens, Speaker Card spec, Track Badge colors
- `astro.config.mjs` -- i18n config with `prefixDefaultLocale: false`
- `package.json` -- All dependency versions verified

### Secondary (MEDIUM confidence)
- Astro 6 content collection API (getCollection, render) -- based on codebase usage patterns

### Tertiary (LOW confidence)
- lucide-react Bluesky icon availability -- assumed missing, needs verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already in package.json, no new installs
- Architecture: HIGH -- patterns directly derived from existing codebase structure
- Pitfalls: HIGH -- identified from analyzing actual schema and data relationships
- Design system: HIGH -- all tokens and component specs from DESIGN.md

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable -- no external dependencies or fast-moving APIs)
