# Edition-2026 Replays Strip + 7 Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage 2026 edition's two CTA buttons with a 4-thumbnail strip of most-watched talks, plus 7 site-wide polish fixes (nav, footer, archive notices, CFP, Contact page).

**Architecture:** Pure Astro / SSR. One new component (`TopReplaysStrip.astro`), one shared extracted component (`SocialLinks.astro`), one new page (`/contact`). All other changes are surgical edits to existing files. Zero new client-JS dependencies; native CSS scroll-snap for mobile carousel; no carousel library.

**Tech Stack:** Astro 6, TypeScript, Tailwind 4, shadcn-style utilities. i18n via `src/i18n/ui.ts` dictionary. Image handling via existing patterns (direct `<img>` for YouTube thumbs, Astro `<Picture>` for local assets — neither changes here).

**Testing approach:** This codebase tests pure-logic helpers with Vitest; Astro layout components are verified by `pnpm build` (which type-checks via `astro check`) plus manual visual smoke. Each task ends with a build + test run + commit. The final task does the manual visual smoke.

**Reference spec:** `docs/superpowers/specs/2026-04-25-edition-2026-strip-and-fixes-design.md` (commit `0481c28`).

**Stitch screens (visual ground truth):**
- Desktop replays strip: `f71aae952acc4b91905fddb09e5665a3`
- Mobile replays strip: `c2810e1cf2e946999ff2727c4293a9fe`
- Desktop Contact: `c43c136e7b9f48378fe6789c0ee5d4c0`

---

## File map

**Create:**
- `src/components/past-editions/TopReplaysStrip.astro` — 4-thumbnail strip
- `src/components/SocialLinks.astro` — shared social-icon row (extracted from Footer)
- `src/pages/contact.astro` — French Contact page
- `src/pages/en/contact.astro` — English Contact page

**Modify:**
- `src/i18n/ui.ts` — add ~14 keys, remove 3 unused, rename 1
- `src/lib/editions-data.ts` — add `topReplays` to `EDITION_2026`
- `src/lib/event.ts` — add `gallery` to `SOCIAL_LINKS`
- `src/components/past-editions/Edition2026Combined.astro` — drop old CTA block, mount `TopReplaysStrip`, drop unused props
- `src/components/Footer.astro` — use `SocialLinks`, reduce `mt-24`→`mt-12`, add Contact to nav column
- `src/components/Navigation.astro` — add Contact top-level link (desktop + mobile)
- `src/pages/programme/[year].astro` — louder notice + button
- `src/pages/en/programme/[year].astro` — same
- `src/pages/speakers/[year]/index.astro` — insert notice
- `src/pages/en/speakers/[year]/index.astro` — same
- `src/pages/cfp.astro` — delete "Voir les formats" button

---

## Task 1: i18n keys — add, rename, remove

**Files:**
- Modify: `src/i18n/ui.ts` (FR block ~lines 1-298, EN block ~lines 300-600)

- [ ] **Step 1: Locate the two blocks**

Run: `grep -n '"editions.2026.replays_cta"' src/i18n/ui.ts`
Expected: two matches — one in the FR object, one in the EN object.

- [ ] **Step 2: In the FR block, replace the three soon-to-be-unused keys with the new ones**

Find the contiguous block that includes `"editions.2026.replays_cta": "Voir tous les replays",` (around line 246-248) and replace those three lines:

```ts
    "editions.2026.replays_cta": "Voir tous les replays",
    "editions.2026.gallery_cta": "Voir la galerie photo",
    "editions.2026.gallery_cta_aria": "Voir la galerie photo CND France 2026 (nouvelle fenêtre)",
```

with:

```ts
    "editions.2026.top_replays_eyebrow": "Talks les plus vus",
    "editions.2026.view_all_replays": "Voir tous les replays",
    "editions.2026.top_replay.1": "Keynote d'ouverture Cloud Native Days France 2026",
    "editions.2026.top_replay.2": "REX Mistral AI — Construire un fournisseur cloud de zéro : ClusterAPI dans le datacenter",
    "editions.2026.top_replay.3": "REX Renault — Kubernetes as a Service : sécurité, innovation et self-service à grande échelle",
    "editions.2026.top_replay.4": "REX SNCF — Smells like Cloud Kubernetes : notre Kube managé on-premise",
```

- [ ] **Step 3: In the FR block, rename the Programme submenu**

Find: `"nav.programme.submenu.programme": "Programme 2026",`
Replace with: `"nav.programme.submenu.programme": "Programme",`

- [ ] **Step 4: In the FR block, append new keys after `"footer.social.twitter_aria"`**

After the line `"footer.social.twitter_aria": "X Cloud Native France (nouvelle fenêtre)",` insert:

```ts
    "footer.social.gallery_aria": "Voir la galerie photo",
    "nav.contact": "Contact",
    "contact.eyebrow": "Contact",
    "contact.heading": "Contactez-nous",
    "contact.lead": "Toute l'équipe d'organisation est à votre disposition pour répondre à vos questions. Choisissez l'interlocuteur qui correspond à votre demande.",
    "contact.participants.title": "Participant·e·s",
    "contact.participants.body": "Une question sur les billets, la logistique ou la programmation ? On vous répond.",
    "contact.speakers.title": "Intervenant·e·s",
    "contact.speakers.body": "Pour toute question relative au CFP, à votre intervention ou à la prise en charge.",
    "contact.sponsors.title": "Partenaires & Sponsors",
    "contact.sponsors.body": "Vous souhaitez soutenir l'événement ou avez une question sur votre stand ?",
    "contact.community.helper": "Suivez-nous aussi sur les réseaux",
```

- [ ] **Step 5: In the EN block, do the equivalent three replacements**

Replace the three lines:

```ts
    "editions.2026.replays_cta": "Watch all replays",
    "editions.2026.gallery_cta": "View the photo gallery",
    "editions.2026.gallery_cta_aria": "View the CND France 2026 photo gallery (new window)",
```

with:

```ts
    "editions.2026.top_replays_eyebrow": "Most-watched talks",
    "editions.2026.view_all_replays": "Watch all replays",
    "editions.2026.top_replay.1": "Keynote d'ouverture Cloud Native Days France 2026",
    "editions.2026.top_replay.2": "REX Mistral AI — Construire un fournisseur cloud de zéro : ClusterAPI dans le datacenter",
    "editions.2026.top_replay.3": "REX Renault — Kubernetes as a Service : sécurité, innovation et self-service à grande échelle",
    "editions.2026.top_replay.4": "REX SNCF — Smells like Cloud Kubernetes : notre Kube managé on-premise",
```

(Talk titles stay French — they're verbatim YouTube titles regardless of UI language.)

- [ ] **Step 6: In the EN block, rename the Programme submenu**

Find: `"nav.programme.submenu.programme": "Programme 2026",`
Replace with: `"nav.programme.submenu.programme": "Programme",`

- [ ] **Step 7: In the EN block, append new keys**

Find the EN line analogous to step 4 (`"footer.social.twitter_aria": "X Cloud Native France (new window)",` or similar). Insert after it:

```ts
    "footer.social.gallery_aria": "View the photo gallery",
    "nav.contact": "Contact",
    "contact.eyebrow": "Contact",
    "contact.heading": "Get in touch",
    "contact.lead": "Our organising team is here to answer your questions. Pick the contact that matches your request.",
    "contact.participants.title": "Attendees",
    "contact.participants.body": "Questions about tickets, logistics, or the programme? We've got you.",
    "contact.speakers.title": "Speakers",
    "contact.speakers.body": "Anything about the CFP, your talk, or speaker logistics.",
    "contact.sponsors.title": "Partners & Sponsors",
    "contact.sponsors.body": "Want to support the event or have a question about your booth?",
    "contact.community.helper": "Follow us on social media",
```

- [ ] **Step 8: Verify both halves still parse**

Run: `pnpm build 2>&1 | head -40`
Expected: build proceeds past `[content] Syncing content...` (it may fail later due to other parts of the change — that's fine, we only need to confirm `ui.ts` parses). If you see a `SyntaxError` or `Cannot find module './ui'` referencing `ui.ts`, fix the JSON-like commas/quotes.

A quicker check:

Run: `pnpm exec tsc --noEmit src/i18n/ui.ts 2>&1 | head -10`
(May produce unrelated module errors; the important signal is no parse error inside ui.ts.)

- [ ] **Step 9: Commit**

```bash
git add src/i18n/ui.ts
git commit -m "feat(i18n): add top-replays + contact + gallery keys, rename Programme submenu

- Add editions.2026.top_replays_eyebrow + view_all_replays + top_replay.{1..4}
- Add footer.social.gallery_aria
- Add nav.contact + contact.* (eyebrow, heading, lead, 3×title/body, community.helper)
- Rename nav.programme.submenu.programme: Programme 2026 → Programme
- Remove unused editions.2026.replays_cta / gallery_cta / gallery_cta_aria"
```

---

## Task 2: Add `topReplays` to `EDITION_2026`

**Files:**
- Modify: `src/lib/editions-data.ts:43-65`

- [ ] **Step 1: Open `editions-data.ts` and locate the `EDITION_2026` object**

The object spans roughly lines 43-65, ending with `placeholder: false,` and the closing `} as const;`.

- [ ] **Step 2: Insert `topReplays` after the `thumbnails` array, before `placeholder`**

Find the line `placeholder: false,` (currently line 64). Insert *before* it:

```ts
  // Top 4 most-watched talks from the 2026 edition (manually curated).
  // YouTube thumbnails fetched at runtime from i.ytimg.com — no build step needed.
  topReplays: [
    { youtubeId: "lJXUhqHWCDo", titleKey: "editions.2026.top_replay.1" },
    { youtubeId: "LaOq7x-nGM4", titleKey: "editions.2026.top_replay.2" },
    { youtubeId: "F8x6DBeNeqg", titleKey: "editions.2026.top_replay.3" },
    { youtubeId: "Wb3cNKyJtCY", titleKey: "editions.2026.top_replay.4" },
  ] as const satisfies ReadonlyArray<{ youtubeId: string; titleKey: keyof typeof ui.fr }>,
```

- [ ] **Step 3: Verify TypeScript types resolve**

Run: `pnpm exec astro check 2>&1 | grep -E "editions-data|topReplay" | head -20`
Expected: no errors mentioning `topReplays`. If you see "type 'editions.2026.top_replay.1' is not assignable to keyof…" then Task 1 didn't add the key — re-check the i18n insertion.

- [ ] **Step 4: Commit**

```bash
git add src/lib/editions-data.ts
git commit -m "feat(data): add topReplays array to EDITION_2026 for new homepage strip"
```

---

## Task 3: Create `TopReplaysStrip.astro`

**Files:**
- Create: `src/components/past-editions/TopReplaysStrip.astro`

- [ ] **Step 1: Create the file with full content**

```astro
---
/**
 * TopReplaysStrip — 4-thumbnail showcase of the most-watched talks for an edition.
 *
 * Pure Astro, zero client JS. Thumbnails come from YouTube's i.ytimg.com
 * (same pattern as YouTubeFacade.astro). Each card is a block-level link
 * opening the talk on YouTube in a new tab.
 *
 * Mobile (<md): horizontal CSS scroll-snap carousel (~80% viewport-width cards,
 * second card peeks for swipe affordance — no JS, no dot indicators).
 * Desktop (≥md): 4-column grid.
 */
import { useTranslations, getLangFromUrl } from "@/i18n/utils";
import type { ui } from "@/i18n/ui";

export interface Props {
  /** Exactly 4 entries — order matters (left → right). */
  replays: ReadonlyArray<{ youtubeId: string; titleKey: keyof typeof ui.fr }>;
  /** Full YouTube playlist URL (the "View all replays" target). */
  playlistUrl: string;
  /** i18n key for the small uppercase eyebrow above the strip. */
  eyebrowKey: keyof typeof ui.fr;
  /** i18n key for the "View all replays" link below the strip. */
  viewAllKey: keyof typeof ui.fr;
  /** Extra classes for the outer wrapper (e.g. "mt-12"). */
  class?: string;
}

const { replays, playlistUrl, eyebrowKey, viewAllKey, class: className = "" } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<section class:list={["max-w-6xl mx-auto px-4 md:px-6 lg:px-8", className]}>
  <p class="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    {t(eyebrowKey)}
  </p>

  <ul
    class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0"
    role="list"
  >
    {replays.map(({ youtubeId, titleKey }) => (
      <li class="flex-none w-[80%] snap-start md:w-auto">
        <a
          href={`https://youtu.be/${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          class="group relative block aspect-video overflow-hidden rounded-md border border-border bg-card transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            width="480"
            height="360"
            loading="lazy"
            decoding="async"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <span
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          ></span>
          <span
            aria-hidden="true"
            class="absolute top-2 right-2 inline-flex w-9 h-9 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span class="absolute left-3 right-3 bottom-3 text-sm font-semibold text-white line-clamp-2">
            {t(titleKey)}
          </span>
        </a>
      </li>
    ))}
  </ul>

  <div class="mt-6 text-center">
    <a
      href={playlistUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
    >
      {t(viewAllKey)}
      <span aria-hidden="true">→</span>
    </a>
  </div>
</section>
```

- [ ] **Step 2: Verify the component type-checks**

Run: `pnpm exec astro check 2>&1 | grep -E "TopReplaysStrip" | head -10`
Expected: no errors. (The component is not yet imported anywhere, so Astro won't render it — but `astro check` still type-checks the file.)

- [ ] **Step 3: Commit**

```bash
git add src/components/past-editions/TopReplaysStrip.astro
git commit -m "feat(replays): add TopReplaysStrip component (4-thumb desktop grid + mobile scroll-snap)"
```

---

## Task 4: Wire `TopReplaysStrip` into `Edition2026Combined.astro`

**Files:**
- Modify: `src/components/past-editions/Edition2026Combined.astro`

- [ ] **Step 1: Add the import**

At the end of the existing import block (currently line 19, after the `YouTubeFacade` import), add:

```ts
import TopReplaysStrip from "./TopReplaysStrip.astro";
```

- [ ] **Step 2: Drop the old CTA props from the `Props` interface**

Remove these two property blocks from the `Props` interface (currently lines 30-33):

```ts
  /** External CTA: 2026 replays YouTube playlist. */
  replaysCta?: { label: string; href: string };
  /** External CTA: Ente photo gallery. */
  galleryCta?: { label: string; href: string; ariaLabel: string };
```

- [ ] **Step 3: Drop the old CTA derivations**

Remove the two derivation blocks (currently lines 55-63):

```ts
const replaysCta = props.replaysCta ?? {
  label: t("editions.2026.replays_cta"),
  href: EDITION_2026.replaysUrl,
};
const galleryCta = props.galleryCta ?? {
  label: t("editions.2026.gallery_cta"),
  href: EDITION_2026.galleryUrl,
  ariaLabel: t("editions.2026.gallery_cta_aria"),
};
```

- [ ] **Step 4: Replace the entire CTA `<div>` block in the JSX**

Find the comment-marked block (currently lines 120-139) — the `{/* CTA buttons — replays + gallery; stacked mobile, side-by-side desktop */}` comment plus the `<div class="mt-12 flex flex-col sm:flex-row …">…</div>` that follows.

Replace those 20 lines with:

```astro
  {/* Most-watched talks — 4-thumbnail strip (replaces former replays + gallery CTAs). */}
  <TopReplaysStrip
    replays={EDITION_2026.topReplays}
    playlistUrl={EDITION_2026.replaysUrl}
    eyebrowKey="editions.2026.top_replays_eyebrow"
    viewAllKey="editions.2026.view_all_replays"
    class="mt-12"
  />
```

- [ ] **Step 5: Update the file's header comment**

The file's docstring (lines 2-12) lists the section structure. Update bullet 4 from:
```
 *   4. CTA row — outlined "Voir les replays" + "Voir la galerie photo"
```
to:
```
 *   4. Most-watched talks strip — 4 YouTube thumbnails + "View all replays" link
```

- [ ] **Step 6: Build and confirm**

Run: `pnpm build 2>&1 | tail -30`
Expected: `Complete!` at the end with no errors mentioning `Edition2026Combined`, `replaysCta`, `galleryCta`.

- [ ] **Step 7: Commit**

```bash
git add src/components/past-editions/Edition2026Combined.astro
git commit -m "feat(homepage): swap edition-2026 CTAs for TopReplaysStrip

Replaces 'Voir tous les replays' + 'Voir la galerie photo' buttons with a
4-thumbnail strip of the most-watched talks. Gallery moves to footer (next commit)."
```

---

## Task 5: Add `gallery` to `SOCIAL_LINKS`

**Files:**
- Modify: `src/lib/event.ts:39-44`

- [ ] **Step 1: Add the import for the gallery URL source**

At the top of `src/lib/event.ts`, add:

```ts
import { EDITION_2026 } from "@/lib/editions-data";
```

(Place it after any existing imports. If there are no imports yet, add this as the first non-comment line.)

- [ ] **Step 2: Add `gallery` to `SOCIAL_LINKS`**

Find the `SOCIAL_LINKS` object (currently lines 39-44):

```ts
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/cloud-native-france/",
  youtube: "https://www.youtube.com/@cloudnativedays",
  bluesky: "https://bsky.app/profile/cloudnativedays.fr",
  twitter: "https://x.com/cloudnativedays",
} as const;
```

Add the `gallery` entry as the last property (before `} as const`):

```ts
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/cloud-native-france/",
  youtube: "https://www.youtube.com/@cloudnativedays",
  bluesky: "https://bsky.app/profile/cloudnativedays.fr",
  twitter: "https://x.com/cloudnativedays",
  gallery: EDITION_2026.galleryUrl,
} as const;
```

- [ ] **Step 3: Verify no circular import warning**

Run: `pnpm build 2>&1 | grep -iE "circular|cycle" | head -5`
Expected: no output. (`event.ts` importing from `editions-data.ts` is fine — `editions-data.ts` already imports from `i18n/ui` only, not from `event`.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/event.ts
git commit -m "feat(footer): expose gallery URL via SOCIAL_LINKS for upcoming icon"
```

---

## Task 6: Extract `SocialLinks.astro` and add gallery icon

**Files:**
- Create: `src/components/SocialLinks.astro`

- [ ] **Step 1: Create the file with full content**

```astro
---
/**
 * SocialLinks — shared social-icon row used by Footer and Contact page.
 * Reads URLs from SOCIAL_LINKS, validates http(s) protocol via safeUrl,
 * and renders one icon per active link.
 */
import { SOCIAL_LINKS } from "@/lib/event";
import { useTranslations, getLangFromUrl } from "@/i18n/utils";

export interface Props {
  /** Extra classes for the <ul> wrapper (e.g. "justify-center" for Contact, default for Footer). */
  class?: string;
}

const { class: className = "" } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

const socials = [
  { key: "linkedin", url: safeUrl(SOCIAL_LINKS.linkedin), ariaKey: "footer.social.linkedin_aria" as const },
  { key: "youtube",  url: safeUrl(SOCIAL_LINKS.youtube),  ariaKey: "footer.social.youtube_aria"  as const },
  { key: "bluesky",  url: safeUrl(SOCIAL_LINKS.bluesky),  ariaKey: "footer.social.bluesky_aria"  as const },
  { key: "twitter",  url: safeUrl(SOCIAL_LINKS.twitter),  ariaKey: "footer.social.twitter_aria"  as const },
  { key: "gallery",  url: safeUrl(SOCIAL_LINKS.gallery),  ariaKey: "footer.social.gallery_aria"  as const },
];
---

<ul class:list={["flex items-center gap-2", className]} role="list">
  {socials.map(({ key, url, ariaKey }) => url && (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t(ariaKey)}
        class="p-2 text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm inline-flex"
      >
        {key === "linkedin" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect width="4" height="12" x="2" y="9"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
        )}
        {key === "youtube" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
            <path d="m10 15 5-3-5-3z"/>
          </svg>
        )}
        {key === "bluesky" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6.335 5.144c2.901 2.18 6.024 6.6 7.17 8.971 1.146-2.371 4.269-6.79 7.17-8.971 2.094-1.573 5.486-2.79 5.486 1.08 0 .773-.444 6.494-.704 7.422-.904 3.225-4.193 4.046-7.117 3.548 5.114.871 6.416 3.755 3.605 6.638-5.341 5.477-7.674-1.374-8.273-3.13-.11-.323-.161-.473-.161-.345 0-.128-.052.022-.161.345-.6 1.756-2.933 8.607-8.273 3.13-2.811-2.883-1.51-5.767 3.605-6.638-2.924.498-6.213-.323-7.117-3.548C.305 12.718-.139 6.997-.139 6.224c0-3.87 3.392-2.653 5.486-1.08z"/>
          </svg>
        )}
        {key === "twitter" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )}
        {key === "gallery" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        )}
      </a>
    </li>
  ))}
</ul>
```

> **Note:** the LinkedIn / YouTube / Bluesky / Twitter SVGs above are placeholders. **Step 1.5** replaces them with the existing exact paths from `Footer.astro`.

- [ ] **Step 1.5: Copy the exact SVG paths from `Footer.astro`**

Open `src/components/Footer.astro` and find the four `{key === "linkedin" && (...)}`, `{key === "youtube" && (...)}`, `{key === "bluesky" && (...)}`, `{key === "twitter" && (...)}` blocks (around lines 144-165). Copy each `<svg>…</svg>` element verbatim and use it to replace the corresponding placeholder SVG inside `SocialLinks.astro` you just created. This preserves the exact existing visual identity.

- [ ] **Step 2: Verify it builds**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds. (Component is not yet imported anywhere — this just confirms it parses.)

- [ ] **Step 3: Commit**

```bash
git add src/components/SocialLinks.astro
git commit -m "feat(footer): extract shared SocialLinks component with gallery icon"
```

---

## Task 7: Refactor Footer — use `SocialLinks`, reduce gap, add Contact to nav column

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Add `SocialLinks` import**

After the existing imports at the top (around line 5), add:

```ts
import SocialLinks from "@/components/SocialLinks.astro";
```

- [ ] **Step 2: Remove the inline `safeUrl()` helper and `socials` array from the frontmatter**

Delete lines 41-59 of the current frontmatter:

```ts
function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  …
}

const socials = [
  { key: "linkedin", … },
  …
];
```

(The full content moved to `SocialLinks.astro` in Task 6.)

- [ ] **Step 3: Remove the `SOCIAL_LINKS` import (no longer used directly)**

Find the line `import { NEWSLETTER_URL, SOCIAL_LINKS } from "@/lib/event";` and change it to:

```ts
import { NEWSLETTER_URL } from "@/lib/event";
```

- [ ] **Step 4: Add `Contact` to the footer's `navItems`**

Find the `navItems` array (currently lines 12-19). After the `nav.team` entry, add:

```ts
  { key: "nav.contact"  as const, path: "/contact" },
```

- [ ] **Step 5: Replace the inline socials `<ul>…</ul>` block with `<SocialLinks />`**

Find the block currently at lines 134-167 — the `<ul class="mt-4 flex items-center gap-2" …>{socials.map(…)}</ul>` and everything inside it.

Replace the whole `<ul>…</ul>` with:

```astro
<SocialLinks class="mt-4" />
```

- [ ] **Step 6: Reduce the footer top gap**

Find the `<footer>` element (currently line 62-65):

```astro
<footer
  role="contentinfo"
  aria-label={t("footer.landmark_aria")}
  class="bg-background text-muted-foreground mt-24"
>
```

Change `mt-24` to `mt-12`:

```astro
<footer
  role="contentinfo"
  aria-label={t("footer.landmark_aria")}
  class="bg-background text-muted-foreground mt-12"
>
```

- [ ] **Step 7: Build and inspect rendered HTML**

Run: `pnpm build 2>&1 | tail -10`
Expected: success.

Run: `grep -c 'aria-label="Voir la galerie photo"' dist/fr/index.html`
Expected: `1` (the new gallery icon should now be in the footer of the FR homepage).

- [ ] **Step 8: Commit**

```bash
git add src/components/Footer.astro
git commit -m "refactor(footer): use shared SocialLinks, add Contact nav, reduce top gap

- Replace inline socials block with <SocialLinks /> (now includes gallery icon)
- Add nav.contact to footer quick-nav column
- mt-24 → mt-12 above 'Restez informé' (less awkward whitespace)"
```

---

## Task 8: Louder /programme/2026 notice + button (FR + EN)

**Files:**
- Modify: `src/pages/programme/[year].astro:61-74`
- Modify: `src/pages/en/programme/[year].astro` (same block)

- [ ] **Step 1: Replace the notice block in the French file**

In `src/pages/programme/[year].astro`, find the existing notice block (currently lines 61-74) starting with `{year === CURRENT_EDITION && (` and ending at the closing `)}`.

Replace the entire block with:

```astro
{year === CURRENT_EDITION && (
  <div class="mb-8 flex flex-col gap-4 rounded-lg border-2 border-primary/40 bg-primary/10 px-5 py-5 md:flex-row md:items-center md:px-6">
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-primary">
      <rect width="18" height="18" x="3" y="4" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
    <p class="flex-1 text-base md:text-lg text-foreground">{t("schedule.notice.2027_coming")}</p>
    <a
      href={EDITION_2026.replaysUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      {t("schedule.notice.watch_playlist")}
    </a>
  </div>
)}
```

- [ ] **Step 2: Mirror the change to the English page**

Open `src/pages/en/programme/[year].astro`. The notice block lives at the equivalent location. Replace it with the **same** Astro block from Step 1 (i18n keys handle locale automatically).

- [ ] **Step 3: Build, then visually confirm**

Run: `pnpm build && pnpm preview &`
Open: http://localhost:4321/programme/2026 — confirm the banner is visibly bolder (border-2, larger text, calendar icon, filled blue button).
Then: http://localhost:4321/en/programme/2026 — same.
Kill the preview: `kill %1`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/programme/\[year\].astro src/pages/en/programme/\[year\].astro
git commit -m "feat(programme): make 2027-coming notice prominent + playlist as button"
```

---

## Task 9: Add the same notice to /speakers/2026 (FR + EN)

**Files:**
- Modify: `src/pages/speakers/[year]/index.astro` (insert after `<main …>`)
- Modify: `src/pages/en/speakers/[year]/index.astro` (same)

- [ ] **Step 1: Add the `EDITION_2026` import to the French file**

In `src/pages/speakers/[year]/index.astro` frontmatter, after the existing imports (around line 7), add:

```ts
import { EDITION_2026 } from "@/lib/editions-data";
```

- [ ] **Step 2: Insert the notice as the first child of `<main>`**

Find the existing `<main class="px-4 md:px-6 lg:px-8">` (currently around line 37). Insert the notice block as its first child, before the existing `<section class="pt-16 …">` heading:

```astro
<main class="px-4 md:px-6 lg:px-8">
  {year === CURRENT_EDITION && (
    <div class="mx-auto max-w-6xl pt-8">
      <div class="flex flex-col gap-4 rounded-lg border-2 border-primary/40 bg-primary/10 px-5 py-5 md:flex-row md:items-center md:px-6">
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-primary">
          <rect width="18" height="18" x="3" y="4" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <p class="flex-1 text-base md:text-lg text-foreground">{t("schedule.notice.2027_coming")}</p>
        <a
          href={EDITION_2026.replaysUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          {t("schedule.notice.watch_playlist")}
        </a>
      </div>
    </div>
  )}
  <section class="pt-16 md:pt-24 pb-10 md:pb-14 text-center">
    <!-- existing heading content stays here -->
```

(Keep the existing `<section …>` and everything below it unchanged.)

- [ ] **Step 3: Mirror the change to the English file**

Repeat steps 1-2 in `src/pages/en/speakers/[year]/index.astro` — same import, same insertion.

- [ ] **Step 4: Build and confirm**

Run: `pnpm build 2>&1 | tail -5`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/pages/speakers/\[year\]/index.astro src/pages/en/speakers/\[year\]/index.astro
git commit -m "feat(speakers): add 2027-coming notice on speakers/2026 (parity with programme/2026)"
```

---

## Task 10: Remove "Voir les formats" button from CFP

**Files:**
- Modify: `src/pages/cfp.astro:99-114`

- [ ] **Step 1: Delete the secondary anchor and tighten the wrapper**

Find the wrapping `<div>` (currently line 99) and the two anchors inside:

```astro
<div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
  <a
    href={CFP_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-base font-semibold px-6 h-12 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    Soumettre une proposition <span aria-hidden="true">→</span>
  </a>
  <a
    href="#formats"
    class="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground text-base font-semibold px-6 h-12 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    Voir les formats
  </a>
</div>
```

Replace the entire block with:

```astro
<div class="mt-8 flex justify-center">
  <a
    href={CFP_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-base font-semibold px-6 h-12 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    Soumettre une proposition <span aria-hidden="true">→</span>
  </a>
</div>
```

- [ ] **Step 2: Build**

Run: `pnpm build 2>&1 | tail -5`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/pages/cfp.astro
git commit -m "chore(cfp): remove redundant 'Voir les formats' button"
```

---

## Task 11: Create French Contact page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Create the file with full content**

```astro
---
import Layout from "../layouts/Layout.astro";
import SocialLinks from "@/components/SocialLinks.astro";
import { useTranslations, getLangFromUrl } from "@/i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const audiences = [
  { key: "participants", email: "contact@cloudnativedays.fr",  icon: "ticket" },
  { key: "speakers",     email: "speakers@cloudnativedays.fr", icon: "mic" },
  { key: "sponsors",     email: "sponsors@cloudnativedays.fr", icon: "handshake" },
] as const;
---

<Layout
  title={`${t("contact.heading")} | ${t("site.title")}`}
  description={t("contact.lead")}
>
  <main class="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
    <section class="text-center max-w-2xl mx-auto">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {t("contact.eyebrow")}
      </p>
      <h1
        class="mt-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight"
        style="letter-spacing:-0.02em"
      >
        {t("contact.heading")}
      </h1>
      <p class="mt-5 text-base md:text-lg text-muted-foreground">
        {t("contact.lead")}
      </p>
    </section>

    <section class="mt-12 grid gap-6 md:grid-cols-3">
      {audiences.map(({ key, email, icon }) => (
        <article class="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <span
            aria-hidden="true"
            class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            {icon === "ticket" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                <path d="M13 5v2M13 17v2M13 11v2"/>
              </svg>
            )}
            {icon === "mic" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="6" height="12" x="9" y="2" rx="3"/>
                <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/>
              </svg>
            )}
            {icon === "handshake" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
                <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
                <path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>
              </svg>
            )}
          </span>
          <div>
            <h2 class="text-xl font-semibold text-foreground">{t(`contact.${key}.title`)}</h2>
            <p class="mt-2 text-sm text-muted-foreground">{t(`contact.${key}.body`)}</p>
          </div>
          <a
            href={`mailto:${email}`}
            class="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            {email}
          </a>
        </article>
      ))}
    </section>

    <section class="mt-16 text-center">
      <p class="text-sm text-muted-foreground">{t("contact.community.helper")}</p>
      <SocialLinks class="mt-4 justify-center" />
    </section>
  </main>
</Layout>
```

- [ ] **Step 2: Build and visit**

Run: `pnpm build && pnpm preview &`
Open: http://localhost:4321/contact — confirm 3 cards render, mail icons + addresses are correct, social row is centered. Click the "speakers@…" link — should open mail client with prefilled `To:` field.
Kill the preview: `kill %1`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat(contact): add /contact page with 3 mailto cards (FR)"
```

---

## Task 12: Create English Contact page

**Files:**
- Create: `src/pages/en/contact.astro`

- [ ] **Step 1: Create the file with the same content as `src/pages/contact.astro`**

The page is identical because i18n is resolved at runtime from `Astro.url`. Copy the file:

```bash
cp src/pages/contact.astro src/pages/en/contact.astro
```

- [ ] **Step 2: Adjust the relative `Layout` import**

In `src/pages/en/contact.astro`, the `Layout` import path needs to change because the file moved one directory deeper. Change line 2:

From: `import Layout from "../layouts/Layout.astro";`
To: `import Layout from "../../layouts/Layout.astro";`

- [ ] **Step 3: Build and visit**

Run: `pnpm build && pnpm preview &`
Open: http://localhost:4321/en/contact — confirm English copy ("Get in touch", "Attendees", etc.), same 3 cards, same socials.
Kill: `kill %1`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/en/contact.astro
git commit -m "feat(contact): mirror /contact at /en/contact (EN)"
```

---

## Task 13: Add Contact tab to top navigation

**Files:**
- Modify: `src/components/Navigation.astro`

- [ ] **Step 1: Extend the `navItems` type union**

Find the type annotation (currently lines 16-19):

```ts
const navItems: Array<{
  key: "nav.replays" | "nav.tickets";
  path: string;
  dead: boolean;
  postEventOnly?: boolean;
}> = [
```

Change the `key` union to add `"nav.contact"`:

```ts
const navItems: Array<{
  key: "nav.replays" | "nav.tickets" | "nav.contact";
  path: string;
  dead: boolean;
  postEventOnly?: boolean;
}> = [
```

- [ ] **Step 2: Add the Contact entry to `navItems`**

Append a new entry after the existing `nav.replays` entry (currently line 22):

```ts
  { key: "nav.contact",  path: "/contact",  dead: false },
```

- [ ] **Step 3: Add `contactLink` after the existing lookups**

Find the lookups block (currently lines 111-112):

```ts
const ticketsLink = linkByKey["nav.tickets"];
const replaysLink = linkByKey["nav.replays"];
```

Add a third line:

```ts
const ticketsLink = linkByKey["nav.tickets"];
const replaysLink = linkByKey["nav.replays"];
const contactLink = linkByKey["nav.contact"];
```

- [ ] **Step 4: Render the Contact `<li>` in the desktop `<ul>`**

Find the existing replays `<li>` (currently around lines 147-161 — the `<li data-post-event="true" class="hidden">…</li>` block). After its closing `</li>`, insert a new Contact `<li>`:

```astro
<li>
  <a
    href={contactLink.href}
    data-nav-key={contactLink.key}
    aria-current={contactLink.active ? "page" : undefined}
    class:list={[
      "text-lg font-medium text-foreground transition-colors pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
      contactLink.active
        ? "border-b-2 border-primary"
        : "border-b-2 border-transparent hover:border-primary/60",
    ]}
  >
    {contactLink.label}
  </a>
</li>
```

- [ ] **Step 5: Add Contact to the mobile `order` array**

Find the mobile-menu `order` array (around lines 200-206). Append after the replays entry:

```ts
{ kind: "link", link: replaysLink },
{ kind: "link", link: contactLink },
```

- [ ] **Step 6: Build and confirm**

Run: `pnpm build && pnpm preview &`
Open: http://localhost:4321/ — desktop nav shows "Contact" tab after the (hidden) replays slot. Click it → navigates to /contact and the tab gets the active underline.
Resize the browser to mobile (or open http://localhost:4321/contact on mobile DevTools), open the hamburger menu, confirm "CONTACT" appears in the list and the active state highlights when on /contact.
Kill: `kill %1`.

- [ ] **Step 7: Commit**

```bash
git add src/components/Navigation.astro
git commit -m "feat(nav): add top-level Contact tab (desktop + mobile menu)"
```

---

## Task 14: Final build, smoke, and cleanup

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `pnpm test 2>&1 | tail -20`
Expected: all tests pass. If any test fails referencing removed i18n keys (`editions.2026.replays_cta`, `gallery_cta`, or `gallery_cta_aria`) or the old "Programme 2026" submenu label, update those tests to match the new keys / strings.

- [ ] **Step 2: Type-check**

Run: `pnpm exec astro check 2>&1 | tail -15`
Expected: `0 errors`. Address any type errors before continuing.

- [ ] **Step 3: Production build**

Run: `pnpm build 2>&1 | tail -10`
Expected: `Complete!` with no warnings about missing translations or unresolved imports.

- [ ] **Step 4: Manual smoke (preview server)**

Run: `pnpm preview &`

Walk through this checklist on http://localhost:4321 (and the /en/ mirror where relevant):

```
[ ] Homepage FR — 4-thumbnail strip renders directly under the photo mosaic, eyebrow "TALKS LES PLUS VUS" visible
[ ] Homepage EN — same, eyebrow "MOST-WATCHED TALKS"
[ ] Hover one thumbnail — slight scale, brighter
[ ] Click one thumbnail — opens correct YouTube watch page in new tab
[ ] Click "Voir tous les replays →" — opens 2026 playlist in new tab
[ ] Resize to <768px — strip becomes a horizontal scroll-snap carousel, second card peeks
[ ] Programme dropdown (any page) — first item reads "Programme" (no "2026")
[ ] Footer social row — 5 icons in order: LinkedIn / YouTube / Bluesky / X / Camera. Camera link = ente.io album, opens new tab
[ ] Gap above "Restez informé" is visibly tighter than before (mt-12)
[ ] /programme/2026 — notice has thick primary border, calendar icon, larger text, filled blue "Voir la playlist YouTube 2026" button
[ ] /speakers/2026 — same notice present, above the heading section
[ ] /cfp — only one CTA "Soumettre une proposition", centered
[ ] /contact — h1 "Contactez-nous", 3 cards with mailto links, social row at bottom
[ ] /en/contact — h1 "Get in touch", same 3 cards
[ ] Top nav has "Contact" tab, active underline when on /contact
[ ] Mobile hamburger menu lists "CONTACT"
```

Kill: `kill %1`.

- [ ] **Step 5: Lighthouse smoke (optional but recommended)**

If you have a way to run Lighthouse on the production build:

```bash
pnpm build && pnpm preview &
PREVIEW_PID=$!
sleep 3
npx lighthouse http://localhost:4321 --only-categories=performance --output=html --output-path=lighthouse-after-strip.html --form-factor=mobile --quiet
kill $PREVIEW_PID
```

Open `lighthouse-after-strip.html` and confirm the **Performance** score is no worse than the most recent production-baseline run (tracked in Linear CLO-53). The 4 thumbnails are `loading="lazy"` so they should not affect LCP.

- [ ] **Step 6: Final commit (only if changes were needed in steps 1-2)**

If you fixed any tests in step 1:

```bash
git add tests/   # or wherever the fixed tests live
git commit -m "test: update fixtures for renamed/removed edition-2026 i18n keys"
```

If steps 1-3 produced no changes, no commit is needed.

- [ ] **Step 7: Open the PR**

```bash
git push -u origin HEAD
gh pr create --title "feat(homepage,nav,contact): edition-2026 replays strip + 7 fixes" --body "$(cat <<'EOF'
## Summary

- Replace homepage 2026 edition's two CTA buttons with a 4-thumbnail strip of most-watched talks (desktop grid + mobile scroll-snap, zero JS).
- Add new `/contact` page (`/en/contact`) with 3 mailto cards (participants / speakers / partners) — no forms, no backend.
- Six smaller polish fixes: Programme submenu rename, footer gallery icon + tighter top gap, prominent 2027-coming notice on /programme/2026 + /speakers/2026, removal of redundant /cfp button, Contact added to nav.

Spec: `docs/superpowers/specs/2026-04-25-edition-2026-strip-and-fixes-design.md`
Plan: `docs/superpowers/plans/2026-04-25-edition-2026-strip-and-fixes.md`

## Test plan

- [ ] `pnpm build` and `pnpm test` succeed
- [ ] Homepage strip renders 4 cards desktop, scroll-snap on mobile
- [ ] All thumbnail clicks open the correct YouTube video in a new tab
- [ ] Programme dropdown reads "Programme" (no year)
- [ ] Footer has 5 social icons including new camera/gallery
- [ ] /programme/2026 + /speakers/2026 notices are prominent with primary button
- [ ] /cfp shows only the primary submit CTA
- [ ] /contact (FR + EN) renders 3 mailto cards + social row
- [ ] Nav has Contact tab; mobile menu lists Contact
- [ ] Lighthouse Performance no worse than baseline (CLO-53)
EOF
)"
```

---

## Self-review

**Spec coverage:**

| Spec section | Task(s) |
|---|---|
| §1 TopReplaysStrip | Task 3 (component) + Task 4 (wire-in) |
| §2 editions-data | Task 2 |
| §3 Edition2026Combined | Task 4 |
| §4 Submenu rename | Task 1 (steps 3, 6) |
| §5 Footer gallery icon | Task 5 + Task 6 + Task 7 |
| §6 Programme notice | Task 8 |
| §7 Speakers notice | Task 9 |
| §8 CFP button removal | Task 10 |
| §9 Footer top gap | Task 7 (step 6) |
| §10 Contact page + nav tab | Task 11 + Task 12 + Task 13 |
| Testing | Task 14 |
| Rollout (single PR) | Task 14 (step 7) |

All 10 spec sections covered.

**Placeholder scan:** No `TBD`, `TODO`, or "implement later" in any task. Every step has either exact code, an exact command, or both. The one "Note: placeholders" callout in Task 6 step 1 is immediately followed by step 1.5 which tells the engineer to copy verbatim from the existing Footer — that's a guided copy-paste, not a placeholder.

**Type consistency:**
- `topReplays` shape `{ youtubeId: string; titleKey: keyof typeof ui.fr }` is identical in `editions-data.ts` (Task 2) and `TopReplaysStrip` props (Task 3).
- i18n keys added in Task 1 are referenced verbatim in Task 2 (`editions.2026.top_replay.{1..4}`), Task 4 (`editions.2026.top_replays_eyebrow`, `view_all_replays`), Task 6 (`footer.social.gallery_aria`), Tasks 11-13 (`contact.*`, `nav.contact`). All match.
- `SocialLinks` props `{ class?: string }` (Task 6) are used the same way in Task 7 (Footer) and Tasks 11-12 (Contact).

No drift detected.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-04-25-edition-2026-strip-and-fixes.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
