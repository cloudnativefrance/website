# Phase 19 — Manual UAT

Static dist-HTML assertions cover structural a11y; keyboard interaction requires a real browser. Run these manually in FR and EN before merge.

## Setup
1. `pnpm build && pnpm preview`
2. Visit `http://localhost:4321/2023` (FR) and `http://localhost:4321/en/2023` (EN)

## Lightbox Keyboard Contract (A11Y-03 / EDIT-05)

- [ ] **FR/EN** — Tab to the first photo tile; press Enter/Space → lightbox opens, focus lands on the close button.
- [ ] **FR/EN** — Press `Escape` → lightbox closes, focus returns to the photo tile that opened it.
- [ ] **FR/EN** — Open lightbox on photo 1; press `ArrowRight` → photo 2 shown, counter updates. Continue through 10 → press `ArrowRight` on photo 10 → wraps to photo 1.
- [ ] **FR/EN** — Press `ArrowLeft` on photo 1 → wraps to photo 10.
- [ ] **FR/EN** — With lightbox open, repeatedly press `Tab` → focus cycles within { close, prev, next } and never leaves the dialog (focus trap).
- [ ] **FR/EN** — With lightbox open, press `Shift+Tab` at the first focusable → wraps to the last.
- [ ] **FR/EN** — Click on the dark backdrop → lightbox closes.
- [ ] **FR/EN** — Screen-reader announcement: VoiceOver / NVDA announces "dialog" and the aria-label ("Galerie photos KCD France 2023 — visionneuse" / "KCD France 2023 photo gallery — viewer") on open.

## Photo Grid + CLS (EDIT-02)

- [ ] **FR/EN** — Throttle network to 3G in DevTools; reload `/2023`. Photo tiles do not reflow as images load (each tile holds aspect-[4/3] slot).
- [ ] **FR/EN** — Lighthouse CLS score <= 0.02 on `/2023` and `/en/2023`.

## Brand-History Callout (EDIT-03 / I18N-03)

- [ ] **FR** — Callout body reads "…s'appelait à l'origine Kubernetes Community Days France…" and mentions "Centre Georges Pompidou, Paris — Beaubourg."
- [ ] **EN** — Callout body reads "…originally named Kubernetes Community Days France…" and mentions "Centre Georges Pompidou, Paris — Beaubourg."
- [ ] Both variants show the KCD 2023 logo with descriptive alt (not "KCD logo").

## Placeholder Signalling (EDIT-07)

- [ ] **FR/EN** — PLACEHOLDER badge renders next to the gallery CTA and is clickable, opening `https://github.com/cloudnativefrance/website/issues/19` in a new tab.

## Stitch Approval (D-03)

- [ ] User has reviewed the live `/2023` page and approves the visual rhythm before merge (Stitch approval was not gathered pre-code — see CONTEXT D-03).
