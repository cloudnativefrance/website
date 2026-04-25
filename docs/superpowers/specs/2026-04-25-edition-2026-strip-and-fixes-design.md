# Edition-2026 Replays Strip + Site-wide Fixes — Design

**Date:** 2026-04-25
**Status:** Approved (Stitch + scope), pending implementation plan
**Stitch screens:**
- Desktop replays strip: `f71aae952acc4b91905fddb09e5665a3`
- Mobile replays strip: `c2810e1cf2e946999ff2727c4293a9fe`
- Desktop Contact page: `c43c136e7b9f48378fe6789c0ee5d4c0`

## Goal

Shift the Edition-2026 homepage section away from generic "view all" CTAs toward a visually-prominent showcase of the four most-watched 2026 talks. Bundle in seven small fixes that together polish navigation, footer, the upcoming-2027 messaging on archive pages, the CFP page, and add a new Contact page.

## Why now

The 2026 edition is the latest delivered conference; the homepage should put its best content forward. The current two CTA buttons are generic — visitors learn nothing about what's *in* the replays before clicking through. Pairing this with the smaller fixes prevents stale or noisy details (extra CFP button, weak 2027-coming notice, wrong submenu label) from undercutting the new visual.

## Scope — eight changes

| # | Change | User-facing effect |
|---|---|---|
| 1 | 4-thumbnail replays strip on homepage | Replaces "Voir tous les replays" + "Voir la galerie" CTAs |
| 2 | Submenu rename: "Programme 2026" → "Programme" | Cleaner Programme dropdown |
| 3 | Footer "Suivez-nous": add gallery icon | Photo album reachable from every page |
| 4 | /programme/2026 — louder 2027-coming notice + button | Visitors notice the next-edition signal |
| 5 | Same notice on /speakers/2026 | Parity between the two archive pages |
| 6 | /cfp — remove "Voir les formats" button | Fewer redundant CTAs |
| 7 | Reduce gap before footer "Restez informé" | Less awkward whitespace |
| 8 | New /contact page + nav tab | Direct mailto contact, no forms / no backend |

## Architecture

### 1. Replays strip — `TopReplaysStrip.astro`

New component: `src/components/past-editions/TopReplaysStrip.astro`. Pure Astro, zero client JS.

**Props (typed):**
```ts
type Replay = { youtubeId: string; titleKey: keyof typeof ui.fr };
type Props = {
  replays: readonly Replay[]; // exactly 4
  playlistUrl: string;        // EDITION_2026.replaysUrl
  eyebrowKey: keyof typeof ui.fr;
  viewAllKey: keyof typeof ui.fr;
};
```

**Layout (verbatim breakpoints):**
- Outer wrapper: `max-w-6xl mx-auto px-4 md:px-6 lg:px-8` (matches the rest of the section). Component accepts an optional `class` prop merged onto this wrapper so the parent can pass `mt-12`.
- Eyebrow: `mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground` above the strip.
- Desktop (≥md): `grid grid-cols-4 gap-4` — four equal columns.
- Mobile (<md): `flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4` — each card has `flex-none w-[80%] snap-start`. Native CSS only. **No dot indicators in v1** — this is an intentional deviation from the Stitch mobile mockup (`c2810e1cf2e946999ff2727c4293a9fe`), which shows dots. The half-visible second card already signals horizontal swipe; dots would need client JS to track scroll position, which contradicts the "zero JS" goal of this component. Revisit if user feedback wants them.
- Card (`<a target="_blank" rel="noopener noreferrer">`): block-level link wrapping the entire thumbnail.
  - `relative aspect-video overflow-hidden rounded-md border border-border bg-card transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
  - Thumbnail `<img>`: `https://i.ytimg.com/vi/{youtubeId}/hqdefault.jpg`, `width=480 height=360`, `loading="lazy"`, `decoding="async"`, `class="absolute inset-0 w-full h-full object-cover"`.
  - Gradient overlay: `absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent`.
  - Play badge (top-right, decorative `aria-hidden`): `absolute top-2 right-2 inline-flex w-9 h-9 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm` with a primary-color play SVG.
  - Title: `absolute left-3 right-3 bottom-3 text-sm font-semibold text-white line-clamp-2`.
- Below the row: centered `<a>` link `inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline` showing `t(viewAllKey) + " →"`, pointing to `playlistUrl`.

**Why no Astro `<Picture>` for thumbnails:** YouTube's `i.ytimg.com` only serves JPEG. Astro's `<Picture>` is for assets the build can transform. We use a direct `<img>` matching the existing `YouTubeFacade.astro` pattern.

**Why no Embla / no JS carousel library:** native CSS scroll-snap is enough for 4 cards. Adding `embla-carousel` would push extra JS into the homepage critical path — the recent YouTube facade work explicitly aimed to *reduce* that. v1 stays pure-CSS; we revisit only if mobile UX feedback demands it.

### 2. Data — `editions-data.ts`

Append to `EDITION_2026`:

```ts
topReplays: [
  { youtubeId: "lJXUhqHWCDo", titleKey: "editions.2026.top_replay.1" },
  { youtubeId: "LaOq7x-nGM4", titleKey: "editions.2026.top_replay.2" },
  { youtubeId: "F8x6DBeNeqg", titleKey: "editions.2026.top_replay.3" },
  { youtubeId: "Wb3cNKyJtCY", titleKey: "editions.2026.top_replay.4" },
] as const satisfies ReadonlyArray<{ youtubeId: string; titleKey: keyof typeof ui.fr }>,
```

i18n title strings (real YouTube titles, identical FR/EN since talks are presented in their original language):

| Key | Value |
|---|---|
| `editions.2026.top_replays_eyebrow` | FR: `Talks les plus vus` · EN: `Most-watched talks` |
| `editions.2026.view_all_replays` | FR: `Voir tous les replays` · EN: `Watch all replays` |
| `editions.2026.top_replay.1` | `Keynote d'ouverture Cloud Native Days France 2026` |
| `editions.2026.top_replay.2` | `REX Mistral AI — Construire un fournisseur cloud de zéro : ClusterAPI dans le datacenter` |
| `editions.2026.top_replay.3` | `REX Renault — Kubernetes as a Service : sécurité, innovation et self-service à grande échelle` |
| `editions.2026.top_replay.4` | `REX SNCF — Smells like Cloud Kubernetes : notre Kube managé on-premise` |

### 3. Wiring into `Edition2026Combined.astro`

Replace the entire CTA `<div>` block (`<div class="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 max-w-3xl mx-auto">…</div>`) with:

```astro
<TopReplaysStrip
  replays={EDITION_2026.topReplays}
  playlistUrl={EDITION_2026.replaysUrl}
  eyebrowKey="editions.2026.top_replays_eyebrow"
  viewAllKey="editions.2026.view_all_replays"
  class="mt-12"
/>
```

The `replaysCta` and `galleryCta` props on the component become unused. Drop them from the prop interface and the `editions-data.ts` exports that only fed those CTAs (`replaysCta`, `galleryCta` derivations). `EDITION_2026.galleryUrl` stays — it's reused by the footer (#3) and the Suivez-nous strip on Contact (#8).

### 4. Submenu rename

`src/i18n/ui.ts` — change two strings:
- FR `nav.programme.submenu.programme`: `"Programme 2026"` → `"Programme"`
- EN `nav.programme.submenu.programme`: `"Programme 2026"` → `"Programme"`

No structural change.

### 5. Footer "Suivez-nous": gallery icon

`src/lib/event.ts` — add a `gallery` key to `SOCIAL_LINKS`:
```ts
import { EDITION_2026 } from "@/lib/editions-data";

export const SOCIAL_LINKS = {
  linkedin: "...",   // unchanged
  youtube:  "...",   // unchanged
  bluesky:  "...",   // unchanged
  twitter:  "...",   // unchanged
  gallery:  EDITION_2026.galleryUrl,  // new — single source of truth
} as const;
```
The gallery URL lives once, in `editions-data.ts`. `event.ts` imports it. No string duplication.

`src/components/Footer.astro`:
- Add `{ key: "gallery", url: safeUrl(SOCIAL_LINKS.gallery), ariaKey: "footer.social.gallery_aria" as const }` to the `socials` array.
- Add `{key === "gallery" && <camera SVG/>}` block. Lucide-style camera: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`.

i18n (`ui.ts`):
- FR `footer.social.gallery_aria`: `"Voir la galerie photo"`
- EN `footer.social.gallery_aria`: `"View the photo gallery"`

### 6. /programme/2026 — louder notice + button

`src/pages/programme/[year].astro` (lines 61-74). Replace the whole notice block with:

```astro
{year === CURRENT_EDITION && (
  <div class="mb-8 flex flex-col gap-4 rounded-lg border-2 border-primary/40 bg-primary/10 px-5 py-5 md:flex-row md:items-center md:px-6">
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-primary">
      <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
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

i18n strings stay as-is. Mirror change to `src/pages/en/programme/[year].astro` (identical block).

### 7. /speakers/2026 — same notice

Insert the *same* notice block into `src/pages/speakers/[year]/index.astro` and `src/pages/en/speakers/[year]/index.astro`. Placement: as the **first child of `<main>`**, wrapped in its own container `<div class="mx-auto max-w-6xl pt-8">…</div>` so it sits above the `<section class="pt-16 md:pt-24 …">` heading section but is still horizontally centered to match the page width. Wrap-condition uses `year === CURRENT_EDITION` (the `year` variable is in scope from line 18).

Notice copy stays in the existing `schedule.notice.*` keys — the message is generic enough (mentions "talks 2026 sur YouTube") to apply to either page. We do NOT introduce parallel `speakers.notice.*` keys; one set of strings, two consumers. If the user later wants speaker-specific wording, we'll fork them.

### 8. /cfp — remove "Voir les formats"

`src/pages/cfp.astro` lines 108-113. Delete the entire `<a href="#formats">…</a>` block. Update the wrapping div from `flex flex-col sm:flex-row items-center justify-center gap-3` to `flex justify-center` since only one button remains.

### 9. Footer top gap

`src/components/Footer.astro` line 65: change `mt-24` → `mt-12` on the `<footer>` element. One-token change.

### 10. /contact page + nav tab

**Page files:**
- `src/pages/contact.astro` (FR, route `/contact`)
- `src/pages/en/contact.astro` (EN, route `/en/contact`)

**Layout** (matches Stitch screen `c43c136e7b9f48378fe6789c0ee5d4c0`):

```astro
---
import Layout from "../layouts/Layout.astro";
import { useTranslations, getLangFromUrl } from "@/i18n/utils";
import { SOCIAL_LINKS, safeUrl } from "@/lib/event";
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const audiences = [
  { key: "participants", email: "contact@cloudnativedays.fr", icon: "ticket" },
  { key: "speakers",     email: "speakers@cloudnativedays.fr", icon: "mic" },
  { key: "sponsors",     email: "sponsors@cloudnativedays.fr", icon: "handshake" },
] as const;
---

<Layout title={`${t("contact.heading")} | ${t("site.title")}`} description={t("contact.lead")}>
  <main class="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
    <section class="text-center max-w-2xl mx-auto">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {t("contact.eyebrow")}
      </p>
      <h1 class="mt-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight" style="letter-spacing:-0.02em">
        {t("contact.heading")}
      </h1>
      <p class="mt-5 text-base md:text-lg text-muted-foreground">
        {t("contact.lead")}
      </p>
    </section>

    <section class="mt-12 grid gap-6 md:grid-cols-3">
      {audiences.map(({ key, email, icon }) => (
        <article class="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <span class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ContactIcon name={icon} />
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
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            {email}
          </a>
        </article>
      ))}
    </section>

    <section class="mt-16 text-center">
      <p class="text-sm text-muted-foreground">{t("contact.community.helper")}</p>
      <ul class="mt-4 flex justify-center gap-3" role="list">
        <!-- Reuses same socials map as Footer.astro: linkedin, youtube, bluesky, twitter, gallery -->
      </ul>
    </section>
  </main>
</Layout>
```

**Audience icons** — render the three Lucide-style SVGs (ticket, mic, handshake) inline in `contact.astro` via a small switch on the `icon` field of each `audiences` entry. No separate component. Three icons total, used once each.

**Shared `SocialLinks.astro`** — to avoid duplicating the social-icon row between Footer and Contact, extract the existing socials block from `Footer.astro` into a new `src/components/SocialLinks.astro`. Props: `class?: string` (lets Footer keep its layout, lets Contact center it). Both `Footer.astro` and `pages/contact.astro` import it. This is the only structural refactor in this PR; it pays for itself immediately in the very next change.

**Nav wiring (`src/components/Navigation.astro`):**
Add `nav.contact` to `navItems` (top-level link, no postEventOnly):
```ts
{ key: "nav.contact" as const, path: "/contact", dead: false },
```
Update the type union on lines 16-19 from `"nav.replays" | "nav.tickets"` to `"nav.replays" | "nav.tickets" | "nav.contact"`. Render the new `contactLink` in the desktop `<ul>` **after the sponsors `<NavDropdown>` and after the (post-event-only, currently hidden) replays link** — so visible order is: À propos · Programme · Billetterie · Partenaires · Contact. Match `ticketsLink`'s `<li>` styling. Apply the same insertion to the mobile menu's `order` array.

**i18n keys (FR + EN):**

| Key | FR | EN |
|---|---|---|
| `nav.contact` | `Contact` | `Contact` |
| `contact.eyebrow` | `Contact` | `Contact` |
| `contact.heading` | `Contactez-nous` | `Get in touch` |
| `contact.lead` | `Toute l'équipe d'organisation est à votre disposition pour répondre à vos questions. Choisissez l'interlocuteur qui correspond à votre demande.` | `Our organising team is here to answer your questions. Pick the contact that matches your request.` |
| `contact.participants.title` | `Participant·e·s` | `Attendees` |
| `contact.participants.body` | `Une question sur les billets, la logistique ou la programmation ? On vous répond.` | `Questions about tickets, logistics, or the programme? We've got you.` |
| `contact.speakers.title` | `Intervenant·e·s` | `Speakers` |
| `contact.speakers.body` | `Pour toute question relative au CFP, à votre intervention ou à la prise en charge.` | `Anything about the CFP, your talk, or speaker logistics.` |
| `contact.sponsors.title` | `Partenaires & Sponsors` | `Partners & Sponsors` |
| `contact.sponsors.body` | `Vous souhaitez soutenir l'événement ou avez une question sur votre stand ?` | `Want to support the event or have a question about your booth?` |
| `contact.community.helper` | `Suivez-nous aussi sur les réseaux` | `Follow us on social media` |

**Footer link sync:** `src/components/Footer.astro` line 14 has the `navItems` array used for the footer's nav column. Add `{ key: "nav.contact" as const, path: "/contact" }` so Contact also appears in the footer quick-nav.

## Component boundaries — explicit list

- **TopReplaysStrip.astro** — pure layout, knows nothing about edition data. Receives `replays[]` + URL + i18n keys. Reusable for future editions.
- **SocialLinks.astro** (new, extracted) — renders the social-icon row from `SOCIAL_LINKS` + i18n. Used by `Footer.astro` and `pages/contact.astro`.
- **ContactIcon** (inline in `contact.astro`, ~30 lines) — three SVGs keyed by name. If we add more later, extract to its own file.
- **Edition2026Combined.astro** changes shrink (loses two CTAs, gains one strip mount). Net negative line count.

## Data flow

```
EDITION_2026.topReplays + replaysUrl
     ↓ (props)
TopReplaysStrip.astro → 4 × <a href="https://youtu.be/{id}">
                          ↳ <img src="https://i.ytimg.com/vi/{id}/hqdefault.jpg">

SOCIAL_LINKS (event.ts) ⇐ EDITION_2026.galleryUrl (editions-data.ts)
     ↓
SocialLinks.astro → Footer.astro + pages/contact.astro

navItems (Navigation.astro) → adds "nav.contact" → top-level desktop link + mobile menu
                            → Footer.astro reads same key, renders in quick-nav column
```

## Error handling / fallbacks

- **Missing YouTube thumbnail**: `i.ytimg.com/vi/{id}/hqdefault.jpg` is reliable for any public video. No JS fallback needed; if a video is removed YouTube serves a generic "no thumbnail" image, and the title text remains visible. Acceptable degradation.
- **Empty topReplays array**: not a runtime concern — the array is `as const` with exactly 4 entries; TypeScript enforces shape. If a maintainer empties it, the strip renders empty (no "loading…", no error state — the section above it is the primary CTA so the page is still useful).
- **mailto on a device without a mail client**: standard browser behaviour (opens prompt or does nothing). We are not adding a JS fallback or a "copy to clipboard" feature in v1 — that's scope creep.

## Testing

**Unit / build:**
- `pnpm build` must succeed with no Astro warnings.
- Existing Vitest suite must stay green (`pnpm test`).
- Type check: new keys in `ui.ts` get used by call sites with literal-typed `t()` lookups; this catches typos at build time.

**Manual smoke (per UI change):**
1. Homepage FR + EN — strip renders 4 thumbnails, hover scales, click opens correct YouTube watch URL in new tab. Mobile (DevTools 375px) — horizontal scroll snaps card-to-card.
2. Programme dropdown shows just "Programme" (no year).
3. Footer social row shows 5 icons in this order: LinkedIn, YouTube, Bluesky, X, Camera. Camera link opens ente.io album.
4. /programme/2026 — notice is visibly more prominent (border, larger text, calendar icon, filled primary button). Click opens 2026 playlist.
5. /speakers/2026 — same notice present and behaves identically.
6. /cfp — only one CTA "Soumettre une proposition" remains, centered.
7. Footer — gap above "Restez informé" is visibly tighter than before.
8. /contact (FR) and /en/contact — 3 audience cards render, each `mailto:` link opens the user's mail client with the right address. Nav tab "Contact" highlights as active. Mobile menu lists "Contact".

**Lighthouse smoke:**
The strip uses `loading="lazy"` on all 4 thumbnails, so they don't compete with the existing LCP candidate (the hero image). Confirm the homepage Performance score does not regress vs. the production-build Lighthouse baseline tracked in CLO-53.

## Out of scope (deferred)

- Duration badges on cards. Cleaner without them; revisit if the user wants metadata.
- "View count" badges (would need YouTube Data API + auth; not worth the operational cost for a 4-card showcase).
- Carousel dot indicators on mobile. Native scroll-snap with a peeking second card is sufficient affordance for v1.
- Contact forms with backend submission. Email-driven contact is simpler and matches the user's stated intent.
- Refactoring the existing CTA-button utility classes. Out of scope; we just delete two button instances.

## Rollout

Single PR — `feat(homepage,nav,contact): edition-2026 replays strip + 7 fixes`. All eight changes ship together; they're tightly coupled (the gallery icon migration only makes sense once the homepage CTAs are gone, the nav tab needs the page to exist, etc.). One Conventional Commit, one merge.

Post-merge: bump tag to `v1.3.0` (minor — new feature + new page) following the existing v1.x versioning pattern.
