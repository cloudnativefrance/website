# Design spec — Ticketing page 2027, v2: showcase only

**Date:** 2026-09-27
**Status:** Implemented — PR #67. Revised 2026-10-06 to match what shipped: the page
went further than this spec's first version (the switch of `/billetterie`, the end of
`tbd()`), listed under _Changes after implementation_ at the end.
**Branch:** `page-billetterie-2027-v2`
**Delivery:** one PR

---

## Decisions

Taken by the ticketing pôle on 22/09/2026:

1. **Variant A ("achat direct") is abandoned for good.** Bypassing the alf.io listing is
   too risky. The page is a showcase: every purchase goes to the alf.io listing, where the
   quantity is chosen.
2. **No proof section** — "2026, en vrai", the experience reports, the replays strip.
3. **No inclusion sentence at the foot of the page.** The FAQ entry is enough.
4. **Strategy & Leadership is always displayed, and always on sale.**
5. **No "À confirmer" chip.** The page reads as it ships.
6. **Every hand-off to alf.io opens in a new tab.**

Taken while building it, 27/09 – 06/10/2026:

7. **The page replaces `/billetterie` and `/en/tickets` now**, behind a hand-set phase:
   shipping it must not change what visitors see before the opening, the opening is a
   one-line change, and the same workflow serves later years. The `tickets` flag goes.
8. **The phase is set by hand.** No date derivation, no cron, no alf.io API check.
9. **The demo is a build-time toggle that leaves no trace in production.**
10. **Every value is decided (05/10).** No placeholder mechanism and no build-time check
    on the config, now or later.
11. **"Convaincre votre manager" goes**, with its kit.

## Out of scope

- Quotas and stock: the team adjusts them live in alf.io, the site never shows them.
- How group discounts are carried on alf.io: "Venir en équipe" stays a mailto.
- `DESIGN.md` (owned by the repo owner).

---

## 1. Phases and routes

- `TICKETING.currentPhase` in `src/config/tickets.ts`: `pre_opening`,
  `pre_opening_dated`, then one phase per tier — `seb`, `eb`, `regular`, `last_chance`.
  Changing phase is editing that line and shipping. On 13/10/2026 it becomes `"seb"`.
- `/billetterie` and `/en/tickets` mount `TicketsPage` with that phase:
  - `pre_opening` — the "coming soon" page as it was before 2027;
  - `pre_opening_dated` — the opening-date announcement as `main` served it (PR #64);
  - a tier — the ticketing page for that tier. Every tier before it reads "Épuisé",
    whether it sold out or ran to its date.
- Both pre-opening pages sell nothing (no price, no alf.io link); the layout's newsletter
  block is their only action.

## 2. Demo

- `TICKETS_DEMO`, an `astro:env` boolean (`src/lib/tickets/demo.ts`). Unset: on under
  `astro dev`, off in any build. CI sets it to `true` for the `staging` branch. A
  production-origin build with it on fails. `pnpm dev:like-prod` turns it off locally.
- On, it adds:
  - one pre-rendered page per phase and locale — `/billetterie/demo/<slug>/` and
    `/en/tickets/demo/<slug>/`, slugs `avant-ouverture`, `avant-ouverture-avec-date`,
    `super-early-bird`, `early-bird`, `regular`, `last-chance` — forced `noindex` and
    filtered out of the sitemap;
  - the "DÉMO" pill on every ticketing page, the real ones included: a popover of
    links to the phases;
  - stripes on the mobile bar, so no capture of the demo passes for the real page.
- Off, nothing of it ships: its copy lives in `DemoBar.astro` rather than `ui.ts`, its
  style is `is:inline`, its script is its own.

## 3. Hand-off to alf.io

- One URL, `TICKETING.listingUrl` (`billetterie.cloudnativedays.fr/event/cndfr2027`):
  the standard ticket's button, the S&L ticket's (a category of the same listing) and
  the mobile bar's.
- Every link to alf.io carries `target="_blank" rel="noopener"` (no `noreferrer`: alf.io
  keeps the referrer) and a screen-reader-only "(nouvel onglet)". mailto and internal
  links stay in the same tab.
- **"J'ai un code".** Without JavaScript, a GET to the listing with `?code=`. With it,
  `tickets-ui.ts` strips whitespace, refuses an empty code, and opens
  `<listing>/code/<CODE>` in a new tab — in this tab if a popup blocker refuses, so a code
  is never dropped. A repeat within 3 s is ignored: each hit holds an alf.io reservation.
  Nothing on the page links (`href`) to `/code/`.
- Umami attributes on the purchase buttons: `billet`, `palier`, `phase`.

## 4. Page content (tier phases)

Order: header → standard ticket, with "Venir en équipe" beside it when a group rate
applies → S&L ticket → "J'ai un code" → "Ce que comprend votre billet" → FAQ.

- **Header.** H1, then the event's date and venue.
- **Standard ticket.** Tier name with a pill — "Places limitées" when the tier also
  closes on its quota, "Dernières places" on the last tier — the price at large scale
  (TTC), the deadline ("Jusqu'au {date}", "… ou épuisement"; none on the last tier), the
  purchase button, then the four tiers as a ladder: past struck through and "Épuisé",
  current selected, upcoming outlined. Only the current tier shows a date.
- **Venir en équipe.** Rendered only when a group rate is cheaper than the tier _and_
  fits its per-order cap (`cheaperGroupRates`): Regular and Last Chance only, the early
  tiers being capped at 5 seats. A price list with the discount rounded down, nothing
  clickable but the mailto "Demander mon tarif de groupe".
- **Strategy & Leadership.** Drawn like the standard ticket, without its lift shadow.
  One price for the season — no tier, date, pill or ladder — what it adds to the
  standard ticket, and a link to the track's page.
- **"J'ai un code"** — partners, invitations, promo codes (§3).
- **Ce que comprend votre billet.** A checklist, and the evening as the section's one
  card ("Nouveauté 2027", included in the ticket).
- **FAQ.** Payment (wire transfer by mail), when the price changes, who the S&L track
  is open to, VAT (rate from the config), seats per order (caps from the config, more by
  mail), company invoice, codes, student and inclusion rate (by mail), accessibility
  (→ `/informations-utiles#accessibilite`), code of conduct, programme date (from the
  config).
- **Mobile bar.** The standard price and its purchase link, shown while both tickets'
  buttons are off screen. The FAQ wrapper carries the clearance it needs.
- Never shown: a quota, a stock, the abbreviations SEB / EB / R / LC.

## 5. Config

`src/config/tickets.ts` is the only place prices, dates and the phase live, copied from
the Drive sheets "Pilotage billetterie 2027" and "Dates clés CND France 2027": the
listing URL, the phase, the tiers (name, price TTC, end date, `closesWhenSoldOut`,
`maxPerOrder`), the group rates, the S&L ticket (name, price, track URL), the VAT rate
and the programme announcement. No placeholder, no consistency check: a value is set
when it is decided.

## 6. Outside the page

- The `tickets` feature flag is removed; the flags' docs and tests follow.
- JSON-LD `Event`: `offers` is the price of the tier on sale, pointing to the page,
  and absent before the opening (it was a hard-coded `price: 0`).
- `Layout.astro`: a `noindex` prop (the demo pages); Umami never sends under
  `astro dev`.
- `CONTACT_EMAILS.tickets`: `billetterie@cloudnativedays.fr`.
- Terms (FR/EN) link to `billetterie.cloudnativedays.fr`; `/informations-utiles` gets
  the `#accessibilite` anchor the FAQ links to.
- `Dockerfile` and `build-image.yml`: the `TICKETS_DEMO` build-arg.

## 7. Tests

Tests pin the rules, never the wording.

- `src/components/tickets/__tests__/TicketsPage.test.ts` (container API), in each tier
  phase: no tier abbreviation; only the current tier dated; both tickets to the listing,
  never to a code URL; group rates only where they beat the price of the moment; one
  S&L price with no tier, date or pill; every alf.io hand-off in a new tab, said to
  screen readers. The coming-soon pages sell nothing. The demo never reaches production:
  routes, switcher and `noindex` behind the toggle; no trace in `ui.ts`, nor in a shared
  style or script.
- `src/lib/__tests__/tickets.test.ts`: tier states, `cheaperGroupRates`, the JSON-LD
  offer, the discount rounding, `codeUrl`, `openInNewTab`, `handOffOnce`, `buildMailto`,
  the demo toggle (dev, staging, production refusal) and its URLs.
- `tests/build/tickets-demo-plumbing.test.ts`: the build-arg is empty by default and
  `true` on `staging` only.

## 8. Verification

- `pnpm test`, `pnpm astro check`.
- `env -u PUBLIC_SITE_URL pnpm build`: no `billetterie/demo` nor `en/tickets/demo` in
  `dist/`, nor in the sitemap.
- `PUBLIC_SITE_URL=https://staging.cloudnativedays.fr TICKETS_DEMO=true pnpm build`:
  6 demo pages per locale, each `noindex`, none in the sitemap.
- `TICKETS_DEMO=true pnpm build` with no `PUBLIC_SITE_URL`: the build fails.

---

## Changes after implementation

Recorded so the spec and the code do not diverge silently.

| Topic                         | The 27/09 version                                                                       | What shipped, and why                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/billetterie`, `/en/tickets` | Out of scope; the `tickets` flag kept                                                   | Switched behind `currentPhase`, flag removed (decision 7). `pre_opening_dated` was added on 06/10 to keep the announcement `main` gained meanwhile (PR #64).                                     |
| Before the opening            | The page itself, with "Être prévenu(e)" buttons to the newsletter                       | The pre-opening phases render the existing coming-soon pages: one purchase target is left, the listing. `purchase.ts`, `url.ts` and the notify copy went; the client helpers live in `alfio.ts`. |
| `tbd()`                       | Kept as an invisible marker, with `shown()` and a production guard (`drafts.ts`)        | Deleted with the config consistency check and their tests, once every value was decided (decision 10). The `tbd()` table and the blocking list are gone.                                         |
| Demo                          | FR only, under `[...demo].astro`, gated by `ticketDemosEnabled` / `placeholdersAllowed` | `TICKETS_DEMO` (`astro:env`), FR and EN, refused on a production origin, with its copy, style and script kept out of production bundles.                                                         |
| Strategy & Leadership         | A band with fact rows (price, includes, programme, networking, access)                  | A second ticket, drawn like the standard one: one price and what it adds; the track's page says the rest.                                                                                        |
| "Convaincre votre manager"    | A section, with a kit link                                                              | Removed (decision 11).                                                                                                                                                                           |
| Standard ticket               | Price and ladder                                                                        | Adds the tier pill and the deadline beside the price; group rates restyled as a price list (they read as buttons).                                                                               |
| FAQ                           | Waiting answers for VAT, invoice, cancellation, terms of sale                           | Settled answers: VAT rate from the config, the invoice sent automatically; the cancellation and terms-of-sale entries went.                                                                      |
| alf.io                        | `alfio.baseUrl` + `eventSlug: "cnd-2027"`, URLs derived from them                       | One `listingUrl`, `…/event/cndfr2027`; the terms link to the same host.                                                                                                                          |
| Outside the page              | Sitemap filter only                                                                     | JSON-LD offers, `Layout` `noindex`, Umami off under dev, `#accessibilite` anchor, terms link (§6).                                                                                               |
