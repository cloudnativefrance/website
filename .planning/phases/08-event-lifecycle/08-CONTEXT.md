# Phase 8: Event Lifecycle - Context

**Gathered:** 2026-04-13
**Status:** Ready for UI design (Stitch) + planning

<domain>
## Phase Boundary

Make the site time-aware for the conference lifecycle. Three deliverables:

1. **Post-event mode** (EVNT-01) — When the event date has passed, the hero's countdown becomes a "Watch Replays" CTA linking to a dedicated `/replays` page.
2. **Session recordings** (EVNT-02) — Schedule talks link to YouTube recordings when a `recording_url` is set. **Already shipped** in Phase 7 code (`data-recording-url` on cards, "Watch recording" link in session modal). Will be confirmed in verification, not re-implemented.
3. **CFP status indicator** (EVNT-04) — Homepage section showing coming-soon / open / closed state with a CTA to the Conference Hall event page.

Out of scope: a full event-day "live mode" banner, attendee check-in widgets, realtime session status — these would be new capabilities. See Deferred Ideas.

</domain>

<decisions>
## Implementation Decisions

### CFP Status
- **D-01:** CFP state is derived from two ISO date constants (`CFP_OPENS`, `CFP_CLOSES`) in a small config module. Build and client both compute state the same way: `now < opens` → coming-soon, `opens ≤ now ≤ closes` → open, `now > closes` → closed. No external API dependency.
- **D-02:** Real CFP dates and the Conference Hall event URL are **placeholders for now** with a clear `TODO` — staff will edit the constants when the dates are confirmed. Planner should locate these in one obvious config file, not scattered.
- **D-03:** CFP indicator lives in a dedicated homepage section placed **below the Key Numbers block**, matching the existing vertical rhythm. Not a top banner (clutters first paint), not inside hero (already dense).
- **D-04:** When state is `closed`, the section degrades gracefully (either hidden entirely or shown as a muted "CFP closed — see you in 2027" note). Planner decides the exact copy during implementation; both FR and EN keys required.

### Post-Event Mode
- **D-05:** Mode trigger stays a **client-side runtime date check** — reuse the existing `TARGET_DATE` / `Date.now()` pattern from `src/components/hero/CountdownTimer.tsx`. No build-time bake, no manual override flag. Site flips to post-event state automatically without a redeploy.
- **D-06:** The "Watch Replays" CTA currently in `CountdownTimer.tsx` at `href="#replays"` is wired to route to **`/replays`** (FR) or **`/en/replays`** (EN) depending on locale — the dead fragment is replaced.
- **D-07:** Pre-event, the `/replays` route must be **unreachable**: no navigation link, no hero CTA, not in sitemap. Avoids confusing empty states. This mirrors how Phase 6 hides "Previous edition replay" sections when not applicable.

### /replays Page
- **D-08:** `/replays` and `/en/replays` are static Astro pages that load sessions via the existing `loadSessions()` pipeline and render every session with a non-empty `recording_url`, **grouped by track**, reusing the track color accent from `ScheduleGrid.astro` (`trackColor()`). Visually consistent with the schedule page.
- **D-09:** Empty tracks (no recordings yet) are omitted; if zero sessions have recordings, the page shows a localised "Recordings coming soon" message but remains unlinked from nav/hero until the event has passed.
- **D-10:** Each recording card shows: session title, speakers, track (with color), and a click-through to the YouTube video. Use `youtube-nocookie.com` for any embedded previews per the project-wide privacy stance. Linking out to `youtube.com/watch?v=…` is acceptable since the user has already opted in by clicking.
- **D-11:** A secondary "Open full YouTube playlist" link at the top of the page is **out of scope** for now (user chose `/replays` only, not "both"). Can be added later as a small enhancement.

### Schedule Recordings (EVNT-02)
- **D-12:** Already implemented in Phase 7. Verification covers: `src/components/schedule/ScheduleGrid.astro:338, 1002` (modal "Watch recording" link), `src/lib/schedule.ts:24-28` (`recordingUrl` schema), `src/i18n/ui.ts:157, 342` ("Voir le replay" / "Watch recording"). No new work.

### Claude's Discretion
- Exact copy and tone for CFP section headline + CTA text (within the established bilingual voice).
- Whether the CFP section is fully hidden vs. muted-note when `closed` (pick based on what reads best with the surrounding page).
- `/replays` page layout specifics within the "grid grouped by track" decision (card size, how many columns at each breakpoint, what thumbnail to show — pick from DESIGN.md tokens).
- Where the CFP date constants live (suggest `src/lib/cfp.ts` or `src/config/event.ts` — planner picks, keep it one file so staff edits are obvious).

### Stitch-First Gate
- **D-13:** Per `CLAUDE.md` Stitch-first rule: the **CFP homepage section** (new significant UI) and the **`/replays` page** (new page) must both be designed in Stitch and validated by the user **before coding**. Run `/gsd-ui-phase 8` after this context commit to produce the design contract. Do not skip — Phase 7's retroactive verification was an exception for pre-existing code, not a precedent for new work.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 8 — goal, SCs, requirement mapping
- `.planning/REQUIREMENTS.md` §Event Lifecycle — EVNT-01, EVNT-02, EVNT-04 checkboxes and status table

### Project Policies
- `CLAUDE.md` §Design Rules — Stitch-first rule (applies to CFP section + `/replays` page)
- `.planning/PROJECT.md` — privacy-first stance, core value, bilingual mandate

### Existing Code to Extend
- `src/components/hero/CountdownTimer.tsx:71-85` — existing post-event branch; the `href="#replays"` CTA is the one to rewire to `/replays` (locale-aware)
- `src/lib/schedule.ts:24-28, 131, 157` — `recordingUrl` field in the session schema; `/replays` reads this
- `src/components/schedule/ScheduleGrid.astro:91-123, 319-386` — `trackColor()` hashing function and session card pattern to mirror on `/replays`
- `src/i18n/ui.ts:42, 155-157, 227, 340-342` — existing `hero.cta.replays`, `schedule.open_recording` i18n keys (FR + EN); add new `cfp.*` and `replays.*` keys in the same file
- `src/components/Navigation.astro` — add conditional `/replays` link, visible only when post-event mode is active (mirrors client-side date check)
- `src/layouts/Layout.astro` — SEO head handling; `/replays` pages need proper canonical + hreflang like existing pages
- `src/pages/index.astro` + `src/pages/en/index.astro` — homepage; CFP section slots in between Key Numbers and Footer

### Design System
- `DESIGN.md` — tokens, spacing, typography (homepage section + card grid should reuse existing utilities)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CountdownTimer post-event branch** (`src/components/hero/CountdownTimer.tsx:71-85`) — already detects end-of-event and swaps in the replays CTA. Only the link target changes.
- **`trackColor(name)` hash function** (`ScheduleGrid.astro:91-123`) — deterministic hue per track. Import or duplicate on `/replays` for visual parity.
- **`loadSessions()` pipeline** (`src/lib/schedule.ts:107-164`) — build-time CSV → Zod-typed rows with `recordingUrl` included. `/replays` can filter on `recordingUrl !== ""`.
- **Layout.astro + i18n utils** (`src/layouts/Layout.astro`, `src/i18n/utils.ts`) — standard bilingual page boilerplate; `/replays` and `/en/replays` mirror pages like `/venue` and `/en/venue`.
- **i18n pattern** (`src/i18n/ui.ts`) — single flat key file, FR block + EN block. Add `cfp.status.coming_soon`, `cfp.status.open`, `cfp.status.closed`, `cfp.heading`, `cfp.cta`, plus `replays.heading`, `replays.empty`, etc.

### Established Patterns
- **Build-time data, client-side time checks** — TARGET_DATE already lives as a runtime constant in the browser. CFP constants should follow the same shape.
- **No hardcoded user-facing strings** — everything routes through `ui.ts`; Phase 11 hardened this.
- **Privacy-first embeds** — `youtube-nocookie.com` for any embedded content; linking out is fine.
- **Per-locale pages mirror each other** — `src/pages/venue/index.astro` + `src/pages/en/venue/index.astro` share a single component tree with locale-derived translations.

### Integration Points
- **Homepage** (`src/pages/index.astro`, `src/pages/en/index.astro`) — CFP section inserted below Key Numbers, above Footer.
- **CountdownTimer** — replace dead `#replays` fragment with locale-aware `/replays` route.
- **Navigation** (`src/components/Navigation.astro`) — add a conditional `/replays` entry that only renders when `Date.now() > TARGET_DATE`. The nav is server-rendered Astro, so this needs either a tiny client-side enhancement or a build-time gate; planner decides.
- **Sitemap** (`@astrojs/sitemap` from Phase 9) — the `/replays` route should be excluded pre-event to avoid indexing a hidden page. Use the existing sitemap filter mechanism.

</code_context>

<specifics>
## Specific Ideas

- **CFP source of truth is two ISO dates** — not an enum, not an API. Staff controls state by editing dates. Mirror of `TARGET_DATE` pattern.
- **Replays page is on-brand, not a YouTube redirect** — the conference owns the recordings catalog; linking straight out loses branding and filtering.
- **Hidden pre-event, alive post-event** — both `/replays` link and CFP "closed" state should degrade cleanly. No orphan empty pages, no stale CTAs.
- **Reuse Phase 7 track colors for `/replays`** — visual consistency is more valuable than a novel layout.

</specifics>

<deferred>
## Deferred Ideas

- **Live-event mode banner / during-conference UI** — Phase 8 only covers pre→post transition. A "happening now — join track X" banner is a separate capability.
- **Realtime session status** (e.g., "this talk is happening now") — would need a server or scheduled build; out of scope.
- **Attendee check-in, QR codes, badge printing** — event-ops features, not website scope.
- **Full YouTube playlist CTA on `/replays`** — user picked "/replays only"; can be added as a small enhancement post-launch.
- **Auto-fetching recording URLs from Conference Hall or YouTube API** — CSV-edit workflow is fine for now; automation is a later optimisation.
- **Conference Hall live API for CFP state** — rejected for EVNT-04; revisit only if date-gating proves insufficient.

</deferred>

---

*Phase: 08-event-lifecycle*
*Context gathered: 2026-04-13*
