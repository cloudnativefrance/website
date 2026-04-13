---
phase: 08-event-lifecycle
verified: 2026-04-13T00:00:00Z
status: human_needed
score: 16/16 must-haves verified
overrides_applied: 0
requirements_status:
  EVNT-01: satisfied
  EVNT-02: satisfied (regression-verified)
  EVNT-04: satisfied
roadmap_success_criteria:
  - sc: "After the event date, the countdown switches to a 'watch replays' message with YouTube playlist link"
    status: satisfied
    evidence: "CountdownTimer.tsx:72-86 post-event branch renders hero.post_event + CTA href={getReplaysPath(lang)}; visual flip awaits 2027-06-03"
  - sc: "Individual talks in the schedule show a 'watch recording' link when a youtubeUrl is set"
    status: satisfied
    evidence: "dist/programme/index.html contains 51 occurrences of data-recording-url — Phase 7 markup intact after Phase 8 edits"
  - sc: "CFP status indicator on the homepage links to Conference Hall and reflects current state (open/closed/coming soon)"
    status: satisfied
    evidence: "CfpSection.astro renders three-state markup driven by getCfpState(); dist/index.html currently renders coming-soon state (correct given placeholder CFP_OPENS=2026-09-01)"
human_verification:
  - test: "Visual review of CfpSection coming-soon state on FR + EN homepages"
    expected: "Muted pill with Megaphone icon, heading 'Appel à conférences' / 'Call for Proposals', muted description, no CTA (CONFERENCE_HALL_URL still placeholder), layout matches Stitch CFP-coming-soon.png"
    why_human: "Visual fidelity vs. approved Stitch screen cannot be verified by grep"
  - test: "Visual review of /replays + /en/replays empty state"
    expected: "Centered block with heading ('Replays à venir' / 'Recordings coming soon') + body + home link, matches Stitch Replays-empty.png"
    why_human: "Visual fidelity and DM Sans typography rendering are inherently visual"
  - test: "Force post-event state — temporarily set TARGET_DATE to a past epoch in src/lib/cfp.ts, rebuild, confirm Navigation /replays link becomes visible and CountdownTimer switches to the Watch replays CTA pointing at /replays (FR) or /en/replays (EN). Revert."
    expected: "Nav li loses hidden class via inline script; CountdownTimer shows hero.post_event + accent CTA linking to getReplaysPath(lang)"
    why_human: "Requires manual TARGET_DATE override + browser render; script reveal is client-side DOM manipulation not visible in static dist/"
  - test: "Force open CFP state — set CFP_OPENS to past, CFP_CLOSES to future, set CONFERENCE_HALL_URL to a non-placeholder URL, rebuild, visual review"
    expected: "Accent pill ('CFP open'), accent CTA with glow ('Submit a talk') linking to Conference Hall URL, deadline meta line 'Closes {date}' in locale format"
    why_human: "Branch untested at current time (getCfpState returns coming-soon on 2026-04-13) — visual state-switch QA required before staff handoff"
  - test: "Accessibility: keyboard-navigate /replays cards when populated (requires a session with recordingUrl in data/sessions.csv)"
    expected: "Each card focus-visible ring visible, aria-label announces 'Watch replay: {title} — {speakers}'"
    why_human: "Keyboard focus behavior and screen reader announcements are runtime UX"
notes:
  - "Pre-existing test failures in tests/build/speaker-profile.test.ts and tests/build/speaker-talks.test.ts plus 33 pnpm astro check errors in src/pages/speakers/index.astro are documented in deferred-items.md and are OUT OF SCOPE for Phase 8. They are not caused by Phase 8 changes."
  - "ROADMAP status column for EVNT-01/02/04 is still [ ] / Pending — recommend flipping to Complete on the roadmap after human verification closes."
---

# Phase 8: Event Lifecycle — Verification Report

**Phase Goal:** The site adapts to the conference timeline — before, during, and after the event.
**Verified:** 2026-04-13
**Status:** human_needed (automated verification passes 16/16; visual + runtime state-flip checks require human sign-off)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

Truths collected from PLAN frontmatter `must_haves.truths` across 08-01..08-04 plus ROADMAP success criteria.

| # | Truth (source) | Status | Evidence |
|---|----------------|--------|----------|
| 1 | CFP state can be computed at build-time and at runtime from two ISO date constants (08-01) | VERIFIED | `src/lib/cfp.ts` exports `CFP_OPENS`, `CFP_CLOSES`, `getCfpState(now?)`; module is zero-import so it loads in `.astro` and `.tsx` contexts |
| 2 | All 17 new i18n keys resolve in both FR and EN (08-01) | VERIFIED | grep of 17 keys in `src/i18n/ui.ts` returns exactly 34 matches (17 × 2 locales) |
| 3 | Helper returns locale-aware /replays URL for both locales (08-01) | VERIFIED | `getReplaysPath("fr") === "/replays"`, `getReplaysPath("en") === "/en/replays"` (src/lib/cfp.ts:64-66); test file `src/lib/__tests__/cfp.test.ts` covers both |
| 4 | User reviewed Stitch output for CFP + /replays before code written (08-02) | VERIFIED | `08-02-SUMMARY.md` records `status: approved` on 2026-04-13; all 6 PNGs present in `stitch/` |
| 5 | Stitch prompts referenced DS tokens only — no raw hex (08-02) | VERIFIED | 08-02-SUMMARY.md documents token-role-only prompts; `grep -E "#[0-9a-fA-F]{6}" 08-02-SUMMARY.md` returns nothing |
| 6 | Homepage (FR+EN) shows a CFP section between KeyNumbers and Footer whose visual state reflects getCfpState() (08-03) | VERIFIED | Both `src/pages/index.astro:25` and `src/pages/en/index.astro:25` contain `<CfpSection />` after `<KeyNumbers />`; built `dist/index.html` and `dist/en/index.html` render coming-soon markup |
| 7 | CFP 'open' uses accent pill/button; 'coming-soon' uses muted pill/ghost CTA; 'closed' renders muted no-CTA note (08-03) | VERIFIED | CfpSection.astro branches (lines 26-84 open, 86-126 coming-soon, 128-132 closed) — `bg-accent` appears only inside `state === "open"` branch |
| 8 | All copy in CFP section from i18n keys, no hardcoded strings (08-03) | VERIFIED | All visible copy goes through `t("cfp.*")`; no hardcoded FR/EN strings in CfpSection.astro |
| 9 | Accent color only on pill + primary CTA when state === 'open' (08-03) | VERIFIED | coming-soon branch uses `bg-secondary text-muted-foreground`; closed branch uses `text-muted-foreground` only; accent absent from both |
| 10 | /replays (FR) and /en/replays (EN) render grid grouped by track, filtered to recordingUrl !== '' (08-04) | VERIFIED | Both pages (src/pages/replays/index.astro, src/pages/en/replays/index.astro) call `loadSessions()`, filter by recordingUrl, group via Map, render per-track sections with RecordingCard |
| 11 | When no sessions have recordingUrl, pages render empty state instead of empty grid (08-04) | VERIFIED | `isEmpty` branch (lines 74-90 FR, 73-89 EN) renders replays.empty.heading + body; `dist/replays/index.html` + `dist/en/replays/index.html` currently show empty-state copy ("Replays à venir" / "Recordings coming soon") |
| 12 | Navigation shows 'Replays' link only after TARGET_DATE has passed (client-side enhancement) (08-04) | VERIFIED | Navigation.astro navItems includes `{key:"nav.replays", postEventOnly:true}`; `<li>` rendered with `class="hidden" data-post-event="true"`; inline script at lines 167-179 reads `data-target-date` and removes `hidden` when `Date.now() > targetDate` — data-attribute passthrough keeps single source of truth in `src/lib/cfp.ts` |
| 13 | CountdownTimer's post-event CTA points to locale-aware /replays instead of dead #replays (08-04) | VERIFIED | CountdownTimer.tsx:79 uses `href={getReplaysPath(lang)}`; grep confirms no `href="#replays"` remains |
| 14 | /replays routes excluded from sitemap pre-event (08-04) | VERIFIED | astro.config.mjs:17-18 passes `filter: (page) => !/\/replays\/?$/.test(page) && !/\/en\/replays\/?$/.test(page)`; `grep -l "/replays" dist/sitemap*.xml` returns nothing |
| 15 | Each recording card is full-card link with aria-label + track-color left accent matching schedule page (08-04) | VERIFIED | RecordingCard.astro wraps all content in `<a href={session.recordingUrl} target="_blank" rel="noopener noreferrer" aria-label={...}>`; `trackColor()` function mirrors ScheduleGrid.astro:95-103 hash algorithm exactly |
| 16 | EVNT-02 regression: schedule recording links still present in built programme page | VERIFIED | `grep -c "data-recording-url" dist/programme/index.html` returns 51 — Phase 7 markup intact |

**Score:** 16/16 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/cfp.ts` | CFP_OPENS/CFP_CLOSES/CONFERENCE_HALL_URL + getCfpState + getReplaysPath + TARGET_DATE + isPostEvent | VERIFIED | 76 lines; all exports present; TODO(staff) marker line 28; dependency-free |
| `src/i18n/ui.ts` | 17 new keys in FR + EN | VERIFIED | 34 matches for the 17 new keys (17 × 2) |
| `src/components/cfp/CfpSection.astro` | Three-state CFP homepage section | VERIFIED | 134 lines; imports from `@/lib/cfp`; three state branches; no hardcoded strings |
| `src/pages/index.astro` | FR homepage slots CfpSection | VERIFIED | `<CfpSection />` at line 25, after `<KeyNumbers />` |
| `src/pages/en/index.astro` | EN homepage slots CfpSection | VERIFIED | `<CfpSection />` at line 25, after `<KeyNumbers />` |
| `src/pages/replays/index.astro` | FR /replays with grouped-by-track grid + empty state | VERIFIED | 113 lines; loadSessions + filter + groupByTrack + empty branch |
| `src/pages/en/replays/index.astro` | EN /en/replays | VERIFIED | 112 lines; mirror of FR page |
| `src/components/replays/RecordingCard.astro` | Reusable recording card | VERIFIED | 82 lines; trackColor mirror; full-card <a> with aria-label |
| `src/components/Navigation.astro` | Conditional /replays nav link revealed post-event | VERIFIED | navItems line 21 adds nav.replays with postEventOnly; li class="hidden" + data-post-event="true"; reveal script lines 167-179 |
| `src/components/hero/CountdownTimer.tsx` | Post-event CTA locale-aware | VERIFIED | Line 3 imports getReplaysPath; line 79 uses it in href |
| `astro.config.mjs` | Sitemap filter excluding /replays | VERIFIED | Lines 17-18 filter regex on /replays and /en/replays |
| `.planning/phases/08-event-lifecycle/stitch/*.png` | 6 Stitch exports | VERIFIED | All six PNGs present (CFP 3 states + Replays populated/empty/mobile) |

---

## Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| `src/components/cfp/CfpSection.astro` | `src/lib/cfp.ts` | `import { getCfpState, CFP_CLOSES, CONFERENCE_HALL_URL } from "@/lib/cfp"` | WIRED |
| `src/components/cfp/CfpSection.astro` | `src/i18n/ui.ts` | `useTranslations(lang)` with cfp.* keys | WIRED |
| `src/pages/replays/index.astro` | `src/lib/schedule.ts loadSessions()` | `await loadSessions()` at build time | WIRED (awaited, filter applied) |
| `src/components/replays/RecordingCard.astro` | trackColor hashing | mirrored `hsl()` algorithm from ScheduleGrid.astro:95-103 | WIRED (byte-identical algorithm) |
| `src/components/hero/CountdownTimer.tsx` | `src/lib/cfp.ts getReplaysPath()` | `import` + call with `lang` prop | WIRED |
| `src/components/Navigation.astro` | TARGET_DATE runtime check | data-target-date attribute + inline script reading `Date.now()` | WIRED via data-attribute passthrough (single source of truth preserved) |
| `astro.config.mjs sitemap filter` | built sitemap | regex filter evaluated at build | WIRED (dist/sitemap-0.xml contains no /replays URLs) |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CfpSection.astro` | `state` | `getCfpState()` — pure fn reading two constants | Yes (returns "coming-soon" today given 2026-04-13 < CFP_OPENS=2026-09-01) | FLOWING |
| `src/pages/replays/*.astro` | `withRecordings` | `loadSessions()` (CSV-backed) filtered by recordingUrl | Yes — loadSessions returns full roster, filter narrows to 0 today (sessions.csv has no recording URLs yet) | FLOWING (empty-state rendering is the correct pre-event output) |
| `RecordingCard.astro` | `session.recordingUrl` | prop from caller (replays page) | Yes — transparent prop passthrough, provider-agnostic | FLOWING |
| Navigation `/replays` li | `data-target-date` | Frontmatter `TARGET_DATE` import from `@/lib/cfp` | Yes — data attribute carries epoch to DOM script | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| /replays (FR) builds | `test -f dist/replays/index.html` | exists (20451 bytes) | PASS |
| /en/replays (EN) builds | `test -f dist/en/replays/index.html` | exists (21234 bytes) | PASS |
| Replays FR empty-state copy rendered | grep for "Replays à venir" / "Retour au programme" | both present | PASS |
| Replays EN empty-state copy rendered | grep for "Recordings coming soon" / "Back to schedule" | both present | PASS |
| CFP section FR rendered on homepage | grep "Appel à conférences" dist/index.html | present | PASS |
| CFP section EN rendered on homepage | grep "Call for Proposals" dist/en/index.html | present | PASS |
| Sitemap excludes /replays | `grep -l "/replays" dist/sitemap*.xml` | no matches | PASS |
| EVNT-02 regression: schedule has data-recording-url | `grep -c "data-recording-url" dist/programme/index.html` | 51 | PASS |
| Navigation /replays li hidden by default | grep `data-post-event="true" class="hidden"` dist/index.html | 2 matches (desktop + mobile) | PASS |
| `src/lib/__tests__/cfp.test.ts` | documented in 08-01-SUMMARY as 14/14 pass | per summary — not re-run here | PASS (per summary) |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| EVNT-01 | Post-event mode: countdown switches to "watch replays" + YouTube playlist link | SATISFIED | CountdownTimer post-event branch wired to `getReplaysPath(lang)`; /replays page hosts the grouped-by-track grid. YouTube is not hardcoded — cards link to any `recording_url` value (provider-agnostic, allowed by schema). |
| EVNT-02 | Schedule talks link to YouTube recordings when available | SATISFIED (regression-verified) | Phase 7 markup (51 × `data-recording-url` in built `dist/programme/index.html`) confirmed intact after Phase 8 edits. |
| EVNT-04 | CFP status indicator linking to Conference Hall (open/closed/coming soon) | SATISFIED | CfpSection.astro implements all three states; CTA targets `CONFERENCE_HALL_URL` (placeholder today, staff swaps in three-constant edit). Currently renders coming-soon on 2026-04-13. |

No orphaned requirements — all three EVNT-0* requirements mapped to Phase 8 are implemented.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/cfp.ts` | 28 | `TODO(staff)` | Info | Intentional staff-handoff marker per D-02, NOT a stub — the placeholder dates are valid Date instances, not null/empty |
| `src/lib/cfp.ts` | 32-33 | `CONFERENCE_HALL_URL` contains `TODO_EVENT_ID` | Info | Intentional placeholder; CfpSection gates the CTA (`hasRealConferenceHall` check) so no dead link is rendered |
| `data/sessions.csv` | — | No `recording_url` values | Info | Expected pre-event — drives the /replays empty state. Not a Phase 8 gap. |

No blocker anti-patterns detected. No FIXME/XXX/HACK strings in Phase 8 files.

---

## Human Verification Required

Automated checks pass 16/16. The following require human review before marking the phase fully closed:

### 1. Visual review — CfpSection coming-soon state (FR + EN)

**Test:** Visit `http://localhost:4321/` and `http://localhost:4321/en/` after `pnpm dev`.
**Expected:** Muted pill with Megaphone icon and "Bientôt ouvert" / "Coming soon", heading "Appel à conférences" / "Call for Proposals", muted description, no CTA (placeholder URL). Layout matches Stitch `CFP-coming-soon.png`.
**Why human:** Visual fidelity vs. approved Stitch screen.

### 2. Visual review — /replays + /en/replays empty state

**Test:** Visit `/replays` and `/en/replays`.
**Expected:** Centered block with empty-state heading + body + home link; matches Stitch `Replays-empty.png`.
**Why human:** Visual fidelity and typography rendering.

### 3. Force post-event state — runtime state flip

**Test:** Temporarily change `TARGET_DATE` in `src/lib/cfp.ts` to a past epoch, rebuild, load the homepage.
**Expected:** Navigation `/replays` `<li>` becomes visible (hidden class removed by inline script); CountdownTimer renders post-event CTA pointing at `getReplaysPath(lang)`. Revert the change after QA.
**Why human:** Reveal is client-side DOM manipulation invisible in static `dist/`.

### 4. Force CFP 'open' state — visual QA of untested branch

**Test:** Set `CFP_OPENS` to past date, `CFP_CLOSES` to future date, `CONFERENCE_HALL_URL` to a real conference-hall.io URL. Rebuild.
**Expected:** Accent-pink pill ("CFP open"), accent button with glow ("Submit a talk") linking to Conference Hall, deadline meta line in localized format. Revert.
**Why human:** Open-state branch not currently exercised by runtime date; visual state-switch QA required before staff handoff.

### 5. Populated /replays keyboard + a11y review

**Test:** Add a session row in `data/sessions.csv` with a non-empty `recording_url`, rebuild, tab through the /replays page.
**Expected:** Each card gets visible focus ring; screen reader announces `Watch replay: {title} — {speakers}`.
**Why human:** Keyboard focus and screen reader announcements are runtime UX.

---

## Notes — Out of Scope (Not Phase 8 Gaps)

These are documented in `.planning/phases/08-event-lifecycle/deferred-items.md` and are pre-existing, unrelated to Phase 8:

- **33 `pnpm astro check` errors** in `src/pages/speakers/index.astro` (missing `talkTitle` property) — Phase 5 follow-up, not introduced by Phase 8.
- **Pre-existing test failures** in `tests/build/speaker-profile.test.ts` and `tests/build/speaker-talks.test.ts` (SPKR-02/03 suites).

These are surfaced here for visibility only; they do **not** affect Phase 8 verification status.

---

## Gaps Summary

**No gaps blocking the phase goal.** All 16 must-haves verified. All three Phase 8 requirements (EVNT-01, EVNT-02, EVNT-04) satisfied. The phase goal — "the site adapts to the conference timeline before, during, and after the event" — is achieved: the temporal anchor (TARGET_DATE), state machine (getCfpState), content surfaces (CfpSection, /replays), and navigation reveal (conditional nav link) are all wired to a single source of truth in `src/lib/cfp.ts`.

Remaining items are all **human-verification** tasks (visual fidelity vs. Stitch, runtime state-flip QA, a11y review of untested code paths). Status is therefore `human_needed`, not `passed`.

A recommended roadmap hygiene follow-up: flip `EVNT-01 / EVNT-02 / EVNT-04` from `[ ]` / Pending to `[x]` / Complete in `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` once the human-verification items above are signed off.

---

_Verified: 2026-04-13_
_Verifier: Claude (gsd-verifier)_
