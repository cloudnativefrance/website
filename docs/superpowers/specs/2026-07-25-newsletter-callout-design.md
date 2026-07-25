# Design spec — Newsletter callout band

**Date:** 2026-07-25
**Status:** Approved, ready for implementation
**Validation:** staging.cloudnativedays.fr (see `cnd-platform` spec `2026-07-25-website-staging-design.md`)

---

## Context

The newsletter is the only channel the event owns before ticketing opens, but it is
currently surfaced as five scattered links with three different wordings and two different
button styles. None of them explains *why* someone should subscribe.

This spec replaces those five entry points with a single, self-explanatory callout band
rendered site-wide above the footer.

---

## Current state

| Location | Form | Wording |
|---|---|---|
| `src/components/hero/HeroSection.astro:111-143` | Outline button, `--destructive`, mail icon | "Restez informé(e)" |
| `src/components/Footer.astro:62-86` | Text link, `--destructive`, mail icon | "Restez informé(e)" |
| `src/pages/billetterie.astro:18-25` + `src/pages/en/tickets.astro:18-25` | Solid button, `--primary` | "Inscrivez-vous à la Newsletter" |
| `src/pages/cfp.astro:104-127` | Outline button, `--destructive`, mail icon | "Inscrivez-vous à la Newsletter" |
| `src/pages/en/cfp.astro:104-111` | Solid button, `--primary`, **no icon** | "Sign up for the Newsletter" |
| `src/components/flags/ComingSoonLayout.astro:84` | Outline button, `--destructive` | `flags.soon.notify_cta` |

All of them link to `NEWSLETTER_URL` (`src/lib/event.ts:27`), a hosted Brevo form.

Note the last two rows: the French and English CFP pages already diverge — different colour
token, different presence of the icon. The consolidation fixes that drift as a side effect.

---

## Decision: link out, do not embed

The callout keeps the current behaviour — a CTA opening the hosted Brevo form — rather than
embedding an email input.

The build is fully static (`astro.config.mjs` declares no adapter), so an inline field would
mean a React island posting cross-origin to `sibforms.com`, plus GDPR consent handling,
loading/success/error states and anti-bot protection, with Brevo's double opt-in duplicated
on our side. That is a separate project, not a styling change.

A decorative input that redirects to Brevo was rejected outright: the visitor types an
address, then has to type it again on Brevo.

---

## Component

`src/components/newsletter/NewsletterCallout.astro`

```
┌─────────────────────────────────────────────────────────────────┐
│  $ subscribe --to newsletter        ← font-mono, --primary-strong│
│                                                                 │
│  Ne ratez aucune annonce            ← --foreground, 2xl/3xl bold │
│                                       ┌──────────────────────┐  │
│  Soyez informé(e) de l'ouverture      │  ✉  S'inscrire       │  │
│  de la billetterie et des annonces    └──────────────────────┘  │
│  importantes.        ← --muted-fg     Un email par annonce       │
│                                       importante. Désinscription │
│                                       en un clic.  ← xs, muted   │
└─────────────────────────────────────────────────────────────────┘
   bg: --card   ·   border: --border   ·   radius: --radius
```

**Props**

```ts
interface Props {
  lang?: Locale;   // falls back to getLangFromUrl(Astro.url)
  class?: string;  // contextual spacing overrides
}
```

**Layout** — `grid` with `md:grid-cols-[1fr_auto] md:items-center`, stacked on mobile.
Outer wrapper `mx-auto max-w-7xl px-4 md:px-6`, matching the footer's container so the band
aligns with the rest of the page.

**Tokens** — no new colours. `bg-card` / `border-border` work in light and dark without an
override. The eyebrow uses `--primary-strong`, the token that already exists specifically as
the AA-compliant primary for text on light surfaces. The CTA stays on `--destructive`, which
is the established newsletter colour across the site; changing it would break a learned
association for no gain.

**Deviations from the source mockup**, all validated:

| Mockup element | Decision | Rationale |
|---|---|---|
| "nouveau" pill | Dropped | A permanent band makes a "new" badge false within weeks, and no token exists for it |
| 🚀 in the body copy | Dropped | Screen readers announce "rocket" mid-sentence; the mono eyebrow already carries the attention-grabbing job |
| Dark surface, teal + purple gradient | Mapped to DS tokens | The Stitch design system is the source of truth for colour; the site is light by default |
| Inline email field | Replaced by a CTA | See "Decision: link out" above |

The mail icon is kept — it is the newsletter signal already used in the hero, footer and CFP
page.

---

## New design token

One addition to `src/styles/global.css`:

```css
--font-mono: ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", "Roboto Mono", monospace;
```

A system stack, not a webfont: zero network cost for a three-word eyebrow, and the site is
currently under Lighthouse review. There is no `font-mono` usage anywhere in `src/` today, so
this introduces the role rather than changing an existing one.

---

## i18n

Six new keys in `src/i18n/ui.ts`, both locales — the five below plus `newsletter.cta_aria`:

| Key | FR | EN |
|---|---|---|
| `newsletter.eyebrow` | `$ subscribe --to newsletter` | identical — it is a command, not prose |
| `newsletter.heading` | Ne ratez aucune annonce | Don't miss an announcement |
| `newsletter.body` | Soyez informé(e) de l'ouverture de la billetterie et des annonces importantes. | Be the first to know when ticketing opens, plus every important announcement. |
| `newsletter.cta` | S'inscrire | Subscribe |
| `newsletter.note` | Un email par annonce importante. Désinscription en un clic. | One email per important announcement. Unsubscribe in one click. |

Plus `newsletter.cta_aria` for the link's `aria-label`, since "S'inscrire" alone is
ambiguous out of context.

Six keys become orphaned and are removed. Each was verified by grep to be used only in the
blocks deleted below:

`hero.cta.newsletter` · `hero.cta.newsletter_aria` · `footer.newsletter.heading` ·
`tickets.coming_soon.cta` · `cfp.closed_for_now.cta` · `cfp.closed_for_now.notify_text`

`flags.soon.notify_cta` is **not** orphaned — it belongs to `ComingSoonLayout`, which keeps
its own CTA (see below).

---

## Distribution

`src/layouts/Layout.astro` gains one prop and one insertion point:

```diff
 interface Props {
   …
+  newsletter?: boolean;   // default true
 }
```

```diff
     <Navigation />
     <slot />
+    {newsletter && <NewsletterCallout lang={resolvedLang} />}
     <Footer />
```

**Opt-out (`newsletter={false}`):**

- `src/layouts/LegalPageLayout.astro` — privacy, terms, code-of-conduct. A subscription
  pitch under a legal notice is noise.
- `src/components/flags/ComingSoonLayout.astro` — that page *is* already a newsletter
  appeal (title, body and CTA all point at it). The band would be a straight duplicate, so
  the layout keeps its existing CTA and suppresses the band.

Every other route gets the band, including `/contact` — someone on the contact page is
already trying to reach the event.

---

## Consolidation

| File | Action |
|---|---|
| `HeroSection.astro:111-143` | Delete the third CTA. The hero drops to two buttons (Découvrir, Programme), which is the real win: three competing CTAs above the fold diluted all three. |
| `Footer.astro:62-86` | Delete the column-1 link. The band sits directly above the footer; repeating it centimetres below is redundant. |
| `billetterie.astro:18-25`, `en/tickets.astro:18-25` | Delete the CTA, keep title and body. |
| `cfp.astro:104-127`, `en/cfp.astro:104-111` | Delete the CTA and the `notify_text` paragraph. |
| `ComingSoonLayout.astro` | Unchanged, except passing `newsletter={false}` to `Layout`. |

Net effect: five entry points in three wordings and two colour treatments become one block
with one wording per locale.

---

## Accessibility

- `<section aria-labelledby>` pointing at the `<h2>`, so the band is a named landmark.
- The CTA carries an explicit `aria-label` (`newsletter.cta_aria`) — "S'inscrire" alone does
  not say what one subscribes to.
- `target="_blank"` keeps `rel="noopener noreferrer"`, matching every existing outbound link.
- The eyebrow is decorative text, not a heading — it must not be an `<h*>` element, or it
  breaks the heading outline on every page of the site.
- Contrast is inherited from tokens already validated for AA; no per-block override.
- No animation beyond the existing button transitions, so the global
  `prefers-reduced-motion` baseline (`global.css:146-148`) needs no extension.

---

## Testing

- Unit: the six new keys resolve in both locales, and the six removed keys are gone —
  following the pattern in `src/lib/__tests__/`.
- `pnpm test` and `pnpm build` green.
- Playwright pass: light and dark, mobile and desktop, on one page per layout family
  (`/`, `/cfp`, `/privacy` for the opt-out, `/programme/2027` for `ComingSoonLayout`).
- `/make-interfaces-feel-better full` on the finished component.
- Final validation on staging.

---

## Implementation order

Per the project's `stitch-first` skill, **the first step is the Stitch brief, not code.**
The block is designed in Stitch from the structure and tokens above, validated, and only then
implemented.

---

## Non-goals

- **Embedding the signup form.** See "Decision: link out".
- **Changing `NEWSLETTER_URL` or the Brevo setup.** Out of scope.
- **A "new" badge or any dated element.** The band is permanent; anything dated rots.
- **Touching `ComingSoonLayout`'s own copy.** It works, and it is governed by the feature
  flag system.
