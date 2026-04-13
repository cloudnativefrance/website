---
status: complete
phase: 08-event-lifecycle
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md]
started: 2026-04-13T10:52:00+02:00
updated: 2026-04-13T10:58:00+02:00
---

## Current Test

none — all 5 tests passed

## Tests

### 1. CFP section visible on homepage (coming-soon state)
expected: Between Key Numbers and Footer: muted "BIENTÔT OUVERT" pill + "Appel à conférences" heading + muted description + no CTA (placeholder URL hides the notify button).
result: pass

### 2. EN homepage CFP section
expected: http://localhost:4321/en/ shows the same CFP section with English copy — "Coming soon" pill, "Call for Proposals" heading, English description.
result: pass

### 3. /replays empty state (FR + EN)
expected: http://localhost:4321/replays and http://localhost:4321/en/replays each render the empty state — centered H1 "Replays", a muted body line ("Les enregistrements seront publiés…" / "Recordings will be published…"), and a link back home. NO grid of cards, NO track headers (because sessions.csv has no recording URLs yet).
result: pass

### 4. /replays route hidden from sitemap
expected: http://localhost:4321/sitemap-0.xml does NOT contain any `<loc>` entries for /replays or /en/replays. Other routes (/, /programme, /speakers, /venue, /en/...) should still be listed.
result: pass
verified_by: "grep on dist/sitemap-0.xml: 152 <loc> entries total, 0 contain 'replays'"

### 5. Nav "Replays" link hidden pre-event
expected: On http://localhost:4321/ the desktop nav shows Home / Speakers / Schedule / Sponsors / Venue / Team — but NOT "Replays". Open DevTools → Elements → find the `<li>` with `data-post-event="true"`; it should have the `hidden` class. (The reveal script runs but Date.now() is well before 2027-06-03, so it doesn't strip the class.)
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- Populated only if tests fail -->
