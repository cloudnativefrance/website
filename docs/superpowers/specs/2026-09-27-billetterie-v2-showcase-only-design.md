# Design spec — Ticketing page 2027, v2: showcase only

**Date:** 2026-09-27
**Status:** Approved in brainstorming, awaiting spec review
**Branch:** `page-billetterie-2027-v2` (from `d5d7c3e`, the demo page of 22/09/2026)
**Delivery:** one PR

Part of the changes the ticketing pôle decided on 22/09/2026. The rest comes in a second
session; the switch of `/billetterie` to this page is a separate task still.

---

## Decisions this spec implements

1. **Variant A ("achat direct") is abandoned for good.** Bypassing the alf.io listing is
   too risky. Variant B ("vitrine") is the page: every purchase action goes to the alf.io
   listing, where the quantity is chosen. The demo keeps its phase switch.
2. **The proof section goes** — "2026, en vrai", the experience reports, the replays strip.
3. **The inclusion sentence at the foot of the page goes.** The FAQ entry is enough.
4. **Strategy & Leadership is always displayed, and always on sale** — every S&L fact will
   be known when ticketing opens.
5. **No "À confirmer" chip is rendered any more**, and the demo's show/hide switch goes.
   `tbd()` stays in the config as an invisible marker; a production build refuses to
   ship while a draft value is still in it.
6. **Every hand-off to alf.io opens in a new tab.**

## Out of scope

- The switch of `/billetterie`, `/en/tickets` and the `tickets` flag.
- How the automatic group discount is carried on alf.io, and whether door 2's CTA should
  stop being a mailto — door 2 keeps variant B's current behaviour here (see "Door 2").
- Deciding any `tbd()` value.
- `DESIGN.md` (owned by the repo owner).

---

## 1. Demo routes and menu

- Routes: `/billetterie/demo/` (the config's own phase) and
  `/billetterie/demo/<phase>/` with the existing slugs `avant-ouverture`,
  `super-early-bird`, `early-bird`, `regular`, `last-chance`. **6 pages** instead of 32.
  French only, as before. The old `demo-a/…` and `demo-b/…` URLs stop existing.
- `src/pages/billetterie/[...demo].astro` no longer loads the 2026 sessions:
  `loadSessions`, `assertEditionPublishable` and `rexSummary` leave it. Props become
  `{ phase?: Phase }`.
- `src/lib/tickets/demo.ts`: `ticketDemosEnabled` and `placeholdersAllowed` unchanged.
  `DEMO_VARIANTS`, `DEMO_STRATEGIC_STATES`, `STRATEGIC_SLUGS`, `demoBasePath` go;
  `demoPath(phase?)` and `demoStaticPaths()` enumerate the 6 URLs.
- `astro.config.mjs`: the sitemap filter `/\/billetterie\/demo-/` becomes
  `/\/billetterie\/demo(\/|$)/`, or the new URLs would leak into the staging sitemap.
  The forced `noindex` is unchanged.
- `DemoBar.astro`: the pill reads "DÉMO" (no variant letter). The popover holds the
  **Phase** chips and the footer note only. The variant block, the S&L block, the
  "Points à confirmer" switch, its inline script, its global CSS and its `localStorage`
  key go. The scroll/panel restore in `tickets-ui.ts` stays. The demo stripe on the
  mobile bar stays.

## 2. Purchase action and new tab

- `src/lib/tickets/purchase.ts`: `purchaseTarget(config, phase)` returns
  `{ kind: "notify", href: NEWSLETTER_URL }` before the opening and
  `{ kind: "listing", href: listingUrl(config) }` after. The same target serves door 1,
  the S&L band (a category of the same listing) and the mobile bar. `listingUrl`,
  `alfioHost`, `codeUrl`, `codeFallbackAction` stay. `Variant`, `Product`, the `reserve`
  target, `reserveUrl`, `maxPerOrder`, `ALFIO_MAX_PER_ORDER`, `resolve`, `codePath` go.
- `src/lib/tickets/url.ts` keeps `codeUrlFrom` and `CodeResult` only. `clampQuantity` goes.
- `src/lib/tickets/pricing.ts` is deleted (`orderSegments` only fed the stepper).
- `PurchaseControl.astro` renders a link: "Acheter mon billet →" (listing) or
  "Être prévenu(e)" + its note (notify). Same 52px button. The stepper, live total, cap
  note, "Tarif groupe appliqué" line, `PriceSegment` and their styles go. Props:
  `target`, `lang`, `phase`, `analytics`, `notifyLabel?`.
- **New tab.** Every link to alf.io — door 1, S&L, the mobile bar, and any config URL on
  the alf.io host (e.g. the terms of sale if they live there) — carries
  `target="_blank" rel="noopener"` (no `noreferrer`: alf.io keeps the referrer). The
  newsletter link already opens a new tab and keeps its `rel`. Every `target="_blank"`
  link carries a screen-reader-only "(nouvel onglet)" / "(new tab)"; nothing changes
  visually.
- **Door 3 (code).** The form gets `target="_blank"`, which covers the no-JS fallback
  (`GET` listing `?code=`). In `tickets-ui.ts`, `window.location.assign(url)` becomes
  `window.open(url, "_blank", "noopener")`, called in the submit handler (user
  activation, so popup blockers let it through). The submit button carries the same
  screen-reader "(nouvel onglet)". Validation, whitespace stripping and the hand-off
  sentence are unchanged.
- **Mobile bar.** The `scroll` action kind goes: the action is always a link, and both
  of its targets (newsletter, listing) open a new tab. The price no longer changes in JS.
- **Door 2.** Variant B's current behaviour: the rates shown, not clickable, then
  "Demander mon tarif de groupe" (mailto). The "ou" fork, "Contacter la billetterie" and
  "Choisir ce tarif" go. `GroupRates` loses its clickable branch and its `variant` prop.
- **Umami.** `variante`, `quantite` and `tarif` go, and so does the
  `tickets-group-apply` event. `billet`, `palier`, `phase` stay.
- mailto links and internal links stay in the same tab.

## 3. Page content

Order: header and doors → S&L band → "Ce que comprend votre billet" →
"Convaincre votre manager" → FAQ.

- **Proof.** `EditionProof.astro`, its bordered band in `TicketsContent`, `rex.ts` and its
  test, and every `tickets.proof.*` key go. `TopReplaysStrip` and the photos stay — other
  pages use them. The "les replays 2026 sont en ligne" sentence in "Convaincre votre
  manager" stays: it is the manager's argument, not the proof section.
- **Inclusion.** `InclusionNote.astro` and `tickets.inclusion.text` / `.cta` go. The FAQ
  entry and its pre-filled mailto stay. The mobile-bar clearance at the foot of the page
  (`pb-28`) moves to the FAQ wrapper.
- **Strategy & Leadership.** Always rendered; `data-strategic-state` goes. Its action is
  the same `PurchaseControl` as door 1. The "announced" branch (the "me prévenir" mailto,
  the newsletter link, the "Mise en vente" row) and its keys go. Each fact row — price,
  includes, programme, networking, access — renders only when it has a value; with none,
  the `<dl>` is not rendered. The price handles `per_tier` too: the amount of the tier on
  offer (the first tier before opening). The purple-band CSS that repainted the stepper
  goes with it; only the notify note's ink remains to repaint.
- **What each `tbd()` becomes.** No chip anywhere. 🔒 = blocks a production build (§4).

| Where | After |
|---|---|
| Under the H1: "soirée comprise" | text 🔒 (`eveningIncluded` becomes a draft `true`) |
| Door 1 before opening: "… à 10 h" | draft 🔒 |
| Ladder title: "Noms des tarifs à confirmer" chip | nothing; the names are drafts 🔒 (`tierNames` draft `true`) |
| "Ce que comprend votre billet" | title 🔒 (`contents` draft `true`) |
| "Le détail de la soirée" | the config's text once decided, nothing before |
| Manager: "publié en mars 2027" | draft 🔒 |
| Manager: "Un kit pour convaincre votre manager" | box always shown, link to the draft URL `#convaincre` 🔒 |
| FAQ: VAT rate | "Taux de TVA : {rate}" once decided, nothing before |
| FAQ: company invoice / cancellation and name change | the waiting answer; the config's answer replaces it once decided |
| FAQ: terms of sale | a link once the URL is decided, nothing before |
| S&L: name, networking area | drafts 🔒 |
| S&L: price | row absent while undecided 🔒 (required, §4) |
| S&L: includes, programme, access | row absent while undecided |

## 4. Config and the production guard

- `src/config/tickets.ts` keeps `tbd()`, `isTbd`, `Maybe`, `Tbd`. Removed because nothing
  reads them any more: `alfioCategoryCode` (tiers and S&L), `GroupRate.alfioCode`, S&L
  `state`, `maxPerOrder`, `groupRatesApply`, `onSaleFrom`, and the `StrategicState` type.
  The group-rate codes move to the open items of `reference/sources.md` for session 2.
  `tierNames`, `contents`, `eveningIncluded` become `tbd(note, true)`; `managerKitUrl`
  becomes `tbd(note, "#convaincre")`.
- New `src/lib/tickets/drafts.ts`, pure, no environment read:
  - `shown(value: Maybe<T>): T | undefined` — the decided value, else the draft, else
    `undefined` (the line is not rendered). The only way a component reads a `Maybe`.
  - `shippingProblems(config): string[]` — walks the whole config and lists every `tbd()`
    **with a draft**, by path and note (`opening.time — Heure d'ouverture des ventes`),
    plus `strategic.price` while undecided — the one explicit requirement.
  - `assertShippable(config)` — throws with the whole list at once.
- `TicketsContent` calls `assertShippable(config)` next to `assertTicketingConfig`
  whenever `placeholdersAllowed()` is false (a production-origin build). It checks the
  whole config, not the phase on screen.
- Known limit: no production build renders this page today (the demos do not exist
  there), so the guard wakes up with the switch, when the real route mounts
  `TicketsPage` — as `Tbd.astro` does today.
- `grep -n "tbd(" src/config/tickets.ts` still lists every open item.

Blocking list at the time of writing (pinned by a unit test): `opening.time`, `tierNames`,
`strategic.name`, `strategic.price`, `strategic.networking`, `contents`,
`eveningIncluded`, `managerKitUrl`, `programmeAnnouncement`.

## 5. Files

| File | Change |
|---|---|
| `src/config/tickets.ts` | fields removed, flags as drafts, kit draft URL |
| `src/lib/tickets/drafts.ts` | **new**: `shown`, `shippingProblems`, `assertShippable` |
| `src/lib/tickets/purchase.ts` | notify / listing only |
| `src/lib/tickets/url.ts` | `codeUrlFrom` only |
| `src/lib/tickets/demo.ts` | phases only |
| `src/lib/tickets/pricing.ts`, `rex.ts` | **deleted** |
| `src/lib/tickets/mailto.ts`, `src/lib/event.ts` | doc comments: no S&L waiting list any more |
| `src/pages/billetterie/[...demo].astro` | phase only, no session loading |
| `src/components/tickets/TicketsPage.astro`, `TicketsContent.astro` | props `lang`, `phase`, `demo?`; sections removed; guard |
| `PurchaseControl`, `StickyTicketBar`, `CodeDoor`, `TeamDoor`, `GroupRates`, `StrategicOffer`, `OfferDoor`, `TierLadder`, `IncludedInTicket`, `TeamOffer`, `TicketsFaq`, `DemoBar` | as above |
| `EditionProof.astro`, `InclusionNote.astro`, `Tbd.astro` | **deleted** |
| `Icon.astro` | icons no longer used (`pencil`, `minus`, …) pruned |
| `tickets-ui.ts` | stepper and group-apply blocks go; code form opens a new tab |
| `src/i18n/ui.ts` | keys below, FR and EN |
| `astro.config.mjs` | sitemap filter |

i18n keys removed: `tickets.tbd`, `tickets.ladder.names_note`, `tickets.ladder.names_tbd`,
`tickets.purchase.{qty_label,decrease,increase,total,reserve,cap,cap_link,group_applied,was,saving}`,
`tickets.team.{apply,or,custom.lead,cta.contact}`,
`tickets.strategic.{notify,notify_alt,fact.on_sale,mail.subject,mail.body}`,
`tickets.included.evening.details`, `tickets.proof.*`, `tickets.inclusion.{text,cta}`,
`tickets.sticky.reserve`, `tickets.demo.{placeholders,placeholders.show}`,
`tickets.demo.variant*`, `tickets.demo.strategic*`.
Added: `tickets.new_tab`. Changed: `tickets.faq.ttc.rate` takes `{rate}`.

## 6. Tests

- **Matrix** (`src/components/tickets/__tests__/TicketsPage.test.ts`): 5 phases. Kept: no
  internal abbreviation; only the current tier's date; "Épuisé" on past tiers; the deadline
  inside the ladder box; the pink labels; no price step; group rates on Regular and Last
  Chance only with the floored discount; door layout; the kit in every phase; `#equipe`
  only when a rate applies. New or restated: before opening, two notify actions (door 1,
  S&L) and no alf.io link; after, two listing links; every link to the alf.io host and the
  code form carry `target="_blank"`, and every `target="_blank"` link its screen-reader
  "nouvel onglet"; no `href` to `/code/`; no stepper markup (`name="qty"`,
  `data-tickets-reserve`); S&L always present; no `data-tbd`, no "À confirmer"; no
  "2026, en vrai", no "Le prix ne doit empêcher personne"; the FAQ inclusion question
  still there. Removed: variant-A cases, the placeholder-hiding test and its helpers.
- **Units** (`src/lib/__tests__/tickets.test.ts`): `orderSegments`, `clampQuantity`,
  reserve targets, the S&L cap, the production category-code check and `rexSummary` go.
  `purchaseTarget`: notify before opening, listing after. Demo gate: 6 URLs, all under
  `/billetterie/demo/`. New: `shown()` (value, draft, nothing); `shippingProblems` pins
  the blocking list above; `assertShippable` throws listing every problem.
- The existing i18n parity test guards the removed and added keys.

## 7. Verification before calling it done

- `pnpm test`, `pnpm astro check` (0 errors).
- `env -u PUBLIC_SITE_URL pnpm build`: `dist/billetterie/` holds `index.html` only, no
  `billetterie/demo` in the sitemap.
- `PUBLIC_SITE_URL=https://staging.cloudnativedays.fr pnpm astro build --outDir dist-staging`:
  6 demo pages, each `noindex`, none in the sitemap.
- `shot.mjs` captures, desktop and mobile, for pre-opening, Early Bird and Regular, plus a
  DOM probe on the `target` attributes and the code form → `.impeccable/review/`.

## 8. Documentation

- Skill `billetterie-2027` (`SKILL.md`): overview (B only), URLs, demo menu, hard rules
  6, 7, 8, 9, 10, 13, 14, architecture table, test counts. The folder is git-ignored for
  now, so these edits are not committed.
- `reference/sources.md`: the 22/09 decisions above; the group-rate codes as an open item
  for session 2.
- `reference/design.md`: remove the stepper, the "ou" fork, the placeholder chip and the
  proof band; update the S&L band and the debts list.
