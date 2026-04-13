---
phase: 08-event-lifecycle
plan: 03
status: complete
---

# 08-03 — CFP homepage section (EVNT-04)

## Files

- **new** `src/components/cfp/CfpSection.astro` — three-state component
- **edit** `src/pages/index.astro` — FR homepage wiring (+2 lines)
- **edit** `src/pages/en/index.astro` — EN homepage wiring (+2 lines)

## State → CSS mapping

| State | Pill | Description | CTA | Extra |
|-------|------|-------------|-----|-------|
| `open` | `bg-accent text-accent-foreground` + Send icon | `cfp.description.open` | accent button w/ glow shadow → `CONFERENCE_HALL_URL` | Deadline line `cfp.deadline` formatted by `Intl.DateTimeFormat(localeTag, {year, month: "long", day: "numeric"})` |
| `coming-soon` | `bg-secondary text-muted-foreground` + Megaphone icon | `cfp.description.coming_soon` | ghost-border CTA `cfp.cta.notify` — hidden when CONFERENCE_HALL_URL is the `TODO_EVENT_ID` placeholder | — |
| `closed` | *(no pill)* | *(single muted line `cfp.closed.note`, no headline, no CTA — D-04 muted-note variant)* | *(none)* | — |

Accent Reserved For rule respected: `bg-accent` appears only inside the `state === "open"` branch; coming-soon/closed branches reference secondary/border/muted tokens only.

## What renders today

With the 08-01 placeholder dates (`CFP_OPENS=2026-09-01`, `CFP_CLOSES=2027-02-28`) and today's date of 2026-04-13, `getCfpState()` returns `"coming-soon"`. The site currently shows the muted pill + description + hidden CTA (CONFERENCE_HALL_URL still contains `TODO_EVENT_ID`).

## How staff flip states

Edit `src/lib/cfp.ts` and redeploy:

- Set `CFP_OPENS` earlier than "now" and `CFP_CLOSES` later than "now" → `open` state.
- Set both dates earlier than "now" → `closed` state.
- Replace `CONFERENCE_HALL_URL` with the real conference-hall.io URL to activate both CTAs (submit + notify).

No client-side JS is involved — state is computed at build time. This is intentionally simpler than the hero countdown; staff rebuild cadence is fine for CFP state per D-01.

## Notes for next waves

- No impact on 08-04. The section is additive; homepages still have HeroSection + KeyNumbers + new CfpSection + JSON-LD script.
- Astro check errors in `src/pages/speakers/index.astro` are pre-existing (already logged to `deferred-items.md` by 08-01). My two initial TS errors in CfpSection (untyped `t(string)`) were fixed by inlining the aria-label strings.

## Commits

1. `cc04577` — feat(08-03): CfpSection.astro — three-state CFP homepage section
2. `a6cdb57` — feat(08-03): wire CfpSection into FR + EN homepages
3. (next) — fix(08-03): type the aria-label i18n calls with literal keys
