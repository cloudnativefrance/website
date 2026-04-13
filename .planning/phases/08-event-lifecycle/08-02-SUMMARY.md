---
phase: 08-event-lifecycle
plan: 02
status: approved
approved_at: 2026-04-13
---

# 08-02 — Stitch-first design validation

## Status: approved

User typed `approved` on 2026-04-13 after reviewing the six Stitch screens. 08-03 and 08-04 are unblocked.

## Stitch project

- Project: "Cloud Native Days France 2027" (ID `14858529831105057917`)
- Design system: asset `3926684191749761173` (unchanged, DS tokens-only rule honored)

## Screens produced

All exported to `.planning/phases/08-event-lifecycle/stitch/`:

| File | Viewport | Screen ID | Token fidelity |
|------|----------|-----------|----------------|
| `CFP-coming-soon.png` | Desktop 1440×900 | `f3bcdbd2cde64e7a80b5e7141b8ba962` | Background, Card surface pill, Muted text, ghost border CTA |
| `CFP-open.png` | Desktop 1440×900 | `29f7cc38412640318fc8f3318050881e` | Accent Pink pill + button with glow, Muted meta |
| `CFP-closed.png` | Desktop 1440×900 | `d254c2ab06004600bb02eb1f409adaaa` | Muted pill + hidden-variant dashed placeholder |
| `Replays-populated-desktop.png` | Desktop 1440×900 | `85a47494a69e47d0989a0e5822bef9cc` | Track borders (Primary Blue / Accent Pink / Light Blue), card surfaces, Primary Blue badges |
| `Replays-empty.png` | Desktop 1440×900 | `6dbf95c3c09d47ab83f1657c7d102273` | Muted copy, ghost link |
| `Replays-mobile.png` | Mobile 390×844 | `89fc06d8509f4ccca75fe405d7917d94` | Single-column cards, stacked track groups |

All Stitch prompts referenced DS token roles only — no raw hex values introduced.

## Stitch deviations — ignore in code

Stitch added a few visual extras not in the UI-SPEC. These are NOT authoritative — Wave 3 executors must follow `08-UI-SPEC.md`, not the Stitch screens, when these diverge:

1. **CFP-open**: a "Palais des Congrès / 300+ participants / 40 speakers" venue card appears below the CFP section. This is Stitch auto-enriching the canvas. The CFP section in code stops at the meta row "Clôture le 30 avril 2027".
2. **Replays-empty**: a small camera-off circle icon above the H1. Not required; leave out unless the user asks later.
3. **Replays-mobile**: a bottom mobile tab-bar (Home / Schedule / Replays / Profile). Not part of this site's navigation — ignore.

## Callouts for 08-03 and 08-04 executors

- Source of truth for all component tokens, spacing, and copy is `08-UI-SPEC.md`. Stitch screens inform visual review only.
- Pill badges in both CFP and recording cards are pill-shaped (rounded-full), uppercase, tracking 0.08em, 11-12px.
- Track-colored 4px left border on group sub-headings in /replays uses the track hue (Primary Blue / Accent Pink / Light Blue). Exact mapping lives in the `trackColor()` helper planned for 08-04.
- Card hover state: 1px Primary Blue border + subtle glow (match shadow recipe from DESIGN.md).
- Mobile /replays: single column, 16px inter-card gap, group sub-headings stack above their cards.

## Acceptance checks

- [x] Six PNGs exist in `.planning/phases/08-event-lifecycle/stitch/` with exact spec'd filenames
- [x] This SUMMARY contains "approved" verbatim documenting user sign-off
- [x] No raw hex values in Stitch prompts (token-role language only)
