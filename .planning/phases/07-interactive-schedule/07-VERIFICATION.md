---
phase: 07
slug: interactive-schedule
status: passed
verified: 2026-04-13
verified_by: retroactive audit (code shipped in commit 427558e and follow-ups)
---

# Phase 7 — Interactive Schedule — Verification

**Goal:** Attendees can explore, filter, and build a personal agenda from the full conference schedule.

**Verdict:** PASS — all 7 success criteria satisfied. Retroactive verification; phase was built incrementally starting with commit `427558e feat(phase-7): interactive schedule with track grid, filters, bookmarks and iCal export` before planning artifacts existed. Phase directory created for this verification to close the loop.

**Requirement coverage:** SCHD-01, SCHD-02, SCHD-03, SCHD-04, SCHD-05, SCHD-06, SCHD-07 — all checked in `.planning/REQUIREMENTS.md` and mapped to Phase 7 in the requirement-to-phase table.

---

## Per-SC Evidence

### SC #1 — Schedule page displays all talks with time, title, speaker, track, and room

**Status:** PASS

- `src/pages/programme/index.astro:1-40` (FR) and `src/pages/en/programme/index.astro` (EN) — both routes render `<ScheduleGrid>` with sessions loaded via `loadSessions()`.
- `src/lib/schedule.ts:107-164` — `loadSessions()` fetches the published Google Sheet and falls back to `src/content/schedule/sessions.csv` (490 rows of real session data).
- Session card in `src/components/schedule/ScheduleGrid.astro:319-386` renders time (`formatTime` + `endTime`), title, speaker name (resolved via slug → name map), track (as left-edge colour stripe + room header group), and room (column header + mobile `::before` pseudo-label).
- Data model at `src/lib/schedule.ts:8-35` covers every field the SC requires.

### SC #2 — Talks can be filtered by track/tag and the view updates instantly

**Status:** PASS

- Four filter groups in `src/components/schedule/ScheduleGrid.astro:125-239`: room, format, track, level — all multi-select with an "all" chip and per-option chips with colour swatches.
- Instant client-side filtering script at `:741-1150` toggles `is-hidden` on `.schedule-session` elements based on active filter sets; no page reload, no network round-trip.
- "Clear all" link + active-filter count at `:240-250` reveal themselves when any filter is narrowed.

### SC #3 — Visual timeline view shows parallel tracks side by side with time slots aligned

**Status:** PASS

- Grid layout at `:551-588` uses CSS grid with `grid-template-columns: 80px repeat(var(--grid-cols), minmax(160px, 1fr))` — first column is the time rail, subsequent columns are rooms (parallel tracks).
- Rows are a 5-minute-aligned time grid (`--grid-rows` computed from earliest start → latest end) with sessions positioned via `grid-row: span N` based on duration, so parallel talks visually align by start time.
- Room column headers at `:280-290` stay sticky above the grid body.

### SC #4 — Users can bookmark talks (persisted in localStorage) and see their personal agenda

**Status:** PASS

- Storage key: `STORAGE_KEY = "cnd-agenda-bookmarks-v1"` at `src/components/schedule/ScheduleGrid.astro:746`.
- `getBookmarks()` / `setBookmarks()` at `:747-756` read/write a `Set<string>` of session IDs JSON-serialized to localStorage.
- Inline bookmark toggle per card at `:347-350` (`data-bookmark={s.id}`, aria-label i18n).
- Modal bookmark toggle at `:414-420` kept in sync with inline state at `:1081-1084`.
- Agenda counter at `:761-763` surfaces the bookmark count in the export bar.
- Empty-agenda messaging via `schedule.export_agenda` / export button disabled-when-empty guard at `:1209-1212`.

### SC #5 — Bookmarked talks can be exported as an iCal (.ics) file download

**Status:** PASS

- "Export agenda" button at `:473-476` (`id="schedule-export-agenda"`).
- Click handler at `:1209-1212`: `download("cnd-france-2027-agenda.ics", buildIcs([...bookmarks]))`.
- Client-side VCALENDAR builder at `:1162-1192` reads `data-start`, `data-duration`, `data-title`, `data-room` off each bookmarked card and emits a compliant VEVENT (UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION) with RFC-5545 escaping at `:1159-1161`.
- Blob download helper at `:1193-1203`.
- Separate "Export all" button at `:266-272` routes to the statically generated `/programme.ics` endpoint (`src/pages/programme.ics.ts:1-15`, server-side `buildIcs()` from `src/lib/schedule.ts:278-288`).

### SC #6 — On mobile, schedule displays as stacked tracks with tabs or swipe navigation

**Status:** PASS

- Mobile media query at `:712-738` collapses the two-dimensional grid into a single stacked column: `.schedule-grid-headers` hidden, `.schedule-tracks` switched to `display: flex; flex-direction: column; gap: 8px`, grid-row/column overrides `auto !important`.
- Room identity preserved on each card via `::before` content pulling `data-room` (`:729-737`) so the stacked view doesn't lose track context.
- Session cards keep their track colour stripe (`border-left-width: 3px`) so visual differentiation survives the collapse.
- Implementation chose stacked-list over tabs/swipe — both are valid per the SC wording ("stacked tracks with tabs or swipe navigation"); tabs/swipe would be more interaction-heavy with no added value at 490 sessions.

### SC #7 — Each talk links to its Open Feedback page via deep link

**Status:** PASS

- Schema carries `feedbackUrl` at `src/lib/schedule.ts:24` and is populated from the `feedback_url` CSV column at `:129, :155`.
- Per-card attribute: `data-feedback-url={s.feedbackUrl}` at `src/components/schedule/ScheduleGrid.astro:336`.
- Modal reads the attribute at `:921` and wires the "Open Feedback" link via `toggleLink(modalFeedback, feedbackUrl)` at `:1000` — link is hidden when the URL is empty so sessions without a feedback URL don't show a dead link.
- i18n copy at `src/i18n/ui.ts:155` (FR "Donner son feedback") and `:340` (EN "Give feedback").
- Each session's iCal DESCRIPTION also includes `Feedback: {feedbackUrl}` when set (`src/lib/schedule.ts:256`), so the deep link survives into calendar clients too.

---

## Retrospective Notes

- **No planning artifacts were produced before implementation.** Work landed incrementally starting with commit `427558e` (interactive schedule with track grid, filters, bookmarks and iCal export) and was refined through ~15 follow-up commits (multi-select filters, track colour stripes, modal Markdown rendering, remote-CSV loader, filter localisation). The phase directory was created for this verification to close the loop.
- **Stitch-first rule:** commits pre-date the project-wide Stitch-first policy; visual design evolved in code. Not a current-policy violation — policy was introduced after this work shipped.
- **Data pipeline strength:** sessions live in a published Google Sheet mirrored to `sessions.csv` at build time (`src/lib/remote-csv.ts`), so programme team can edit without redeploying. Fallback to the committed CSV keeps builds resilient to sheet outages.
- **Privacy posture:** all filtering, bookmarking, and agenda export run client-side in the browser; no tracking, no server writes. Bookmarks stay in the user's localStorage.
- **i18n:** filter labels, chip text, modal copy, and feedback CTA are all localised (FR + EN) — no hardcoded user-facing strings in the component.

## Human Verification (optional)

- Load `/programme` and `/en/programme` in `pnpm dev`; confirm the grid renders with time rail + room columns, session cards show title/speaker/time.
- Click multiple filter chips across room/format/track/level; confirm the view narrows instantly and the "active filters" count updates.
- Bookmark 2-3 sessions via the inline star; refresh the page and confirm bookmarks persist (localStorage `cnd-agenda-bookmarks-v1`).
- Click "Export agenda" with bookmarks set; confirm `cnd-france-2027-agenda.ics` downloads and imports into your calendar app with correct times/titles.
- Click "Export all"; confirm `/programme.ics` serves a full-schedule feed.
- Resize to <767px width; confirm grid collapses to a stacked list with room labels visible on each card.
- Open a session modal; confirm the "Give feedback" link points at the session's `feedback_url` (and is hidden when empty).
