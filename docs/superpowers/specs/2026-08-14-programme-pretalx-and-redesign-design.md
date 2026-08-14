# Design spec — Programme: Pretalx pipeline + page redesign

**Date:** 2026-08-14
**Status:** Approved, ready for implementation
**Delivery:** two PRs — **PR 1 = Parts 1 + 2** (data pipeline), **PR 2 = Part 3** (page redesign)

Each PR gets its own implementation plan. PR 1's plan is written first; PR 2's is written
after PR 1 merges, so the redesign is planned against fields that demonstrably exist.

---

## Context

The programme page has two jobs and currently does neither well.

It must serve an attendee planning their day at a live edition (what is on now, in which
room, what did I bookmark) *and* someone browsing a finished edition months later looking
for a replay. Today it is a single time-proportional calendar grid with no text search,
fed by a hand-maintained Google Sheet tab.

Meanwhile the CFP already runs on a self-hosted Pretalx at `cfp.cloudnativedays.fr`, whose
released schedule is public, structured, and strictly richer than the Sheet it is being
copied into by hand.

This spec covers both halves: replacing the sessions pipeline with Pretalx, then
redesigning the page on top of the fields that unlocks.

---

## Current state

### Data

`src/lib/schedule.ts:110` fetches a published Google Sheet CSV tab and parses it with a
hand-rolled RFC-4180 parser (`parseCsv`, 60 lines). Column fill rates as authored today:

| Column | 2026 | 2023 | Verdict |
|---|---|---|---|
| `id` `title` `speakers` `track` `room` `format` `start_time` `duration_min` | 50/50 | 6/6 | all available from Pretalx |
| `recording_url` | 50/50 | 6/6 | **the only field Pretalx has no native slot for** |
| `description` `language` `status` | 50/50 | 6/6 | available from Pretalx |
| `level` | **0/50** | 5/6 | never populated for 2026 |
| `tags` | **0/50** | 5/6 | never populated for 2026 |
| `feedback_url` | **0/50** | 0/6 | **Pretalx has it for 51/51** |
| `slides_url` | **0/50** | 0/6 | Pretalx `attachments`, 1 talk already uploaded |
| `cover_image_url` | **0/50** | 0/6 | never populated anywhere |

Two defects the migration fixes outright:

1. **A talk is missing from the site.** Pretalx has 51 released talks; the Sheet has 50.
   `HFFT3Q` — *"REX Skello — Data Platform Engineering: Comment rendre les équipes métier
   vraiment autonomes grâce à Kubernetes et Airflow"*, Monet, 30 min — is in the released
   schedule and has never rendered. Hand-copying dropped it.
2. **Feedback links are absent.** Pretalx exposes `feedback_url` for every talk; the Sheet
   column is empty, so the modal's feedback button never appears.

The `id` column already contains Pretalx submission codes (`GJ89TV`, `9H9WKR`, `S3SPP8`…),
and every CSV id resolves to a Pretalx talk. The join is exact in both directions bar the
one missing row, which makes the migration mechanical rather than a reconciliation.

### Page

`src/components/schedule/ScheduleGrid.astro` is 1278 lines / 53 KB, including a ~500-line
inline `<script is:inline>` and a ~290-line `<style>` block. Rendering `/programme/2026`
at 1440px produces roughly 3400px of page for 50 talks. Observed problems:

| Problem | Evidence |
|---|---|
| Time-proportional rows waste the page | The 75-min opening keynote renders as a ~450px empty box. The 12:10–13:00 lunch gap is a ~400px unexplained void. |
| Cards clip their own content | *"REX SNCF – Des Rails aux Nuages : Comment Kubernetes à l'Edge Révolutionne les…"* is cut mid-word with no ellipsis; the speaker line overflows the card border. Same at 12:00 in Dumas. |
| No text search | 50 talks, no way to find "Cilium" or "FinOps" by name. |
| Card height encodes duration | A 45-min talk is a tall box with text pinned to the top; a 10-min lightning talk is cramped. Nobody reads height as minutes. |
| Track colour is a 3px left border | Hues come from `trackColor()` (`ScheduleGrid.astro:83`), a name hash. Yellow, pink, purple and orange land adjacent. Pretalx's curated per-track colours are discarded. |
| Filters cost 8 rows on mobile | At 390px, notice + title + PDF button + chip stack ≈ 1100px before the first talk. |

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | One page serves both live attendees and archive browsers, switching behaviour by edition state | Avoids a second page and a second URL to keep in sync across two locales |
| 2 | Build-time fetch with a committed snapshot fallback | Matches the existing `remote-csv.ts` contract: fresh on every build, and a Pretalx outage cannot break CI |
| 3 | Pretalx is the single source of truth for session data, including slides and replays | Removes the hand-copy step that already lost a talk |
| 4 | Grid rows are time **slots**, not minutes; two views (Grid / List) over one dataset | Time-proportional layout is what produces the dead space, and neither view alone serves both audiences |
| 5 | Replay URLs become Pretalx resource links, entered once | Keeps decision 3 whole; the checklist is generated from today's Sheet so it is copy-paste |
| 6 | The speakers tab shrinks to an overlay rather than disappearing | Pretalx cannot hold company, role, or the site's keynote display flag |

---

## Part 1 — Pretalx pipeline

### Source

The **released schedule export**, not the REST API:

```
GET https://cfp.cloudnativedays.fr/{event-slug}/schedule/export/schedule.json
```

One request, one document (~174 KB for 2026), no pagination, no auth. It contains only
talks in the published schedule version — exactly what belongs on a public site. The REST
API would need four paginated calls (`submissions`, `speakers`, `rooms`, `tracks`) plus
client-side joining, and `submissions` includes states the site must not show.

Base URL overridable via `PRETALX_BASE_URL`. Event slug per edition:

```ts
const PRETALX_EVENT: Partial<Record<Edition, string>> = { 2026: "2026", 2027: "2027" };
```

2023 predates the Pretalx instance and has no entry — see *2023* below.

### Module

New `src/lib/pretalx.ts`, split in two so the network and the mapping are testable apart:

- `fetchScheduleExport(year)` — fetch with fallback, returns the raw export document.
- `toSessionRows(doc)` — pure normalizer, returns `SessionRow[]`. No I/O, no `Date.now()`.

`loadSessions(year)` in `src/lib/schedule.ts` keeps its exact signature and return type.
Every consumer — `ScheduleGrid.astro`, `src/pages/replays/index.astro:15`,
`src/pages/programme.ics.ts`, `src/lib/speakers.ts` — is untouched by PR 1. That is what
makes the swap provable: the rendered page must be identical apart from the one recovered
talk and the newly present feedback links.

### Field mapping

| `SessionRow` | Pretalx export | Notes |
|---|---|---|
| `id` | `code` | Already the Sheet's `id`, so bookmarks in `localStorage` survive |
| `title` | `title` | |
| `description` | `description` | Markdown. The existing `mdToHtml` in the inline script already renders and sanitises it |
| `speakers` | `persons[].code` → slug | Mapped through the speaker overlay, see Part 2 |
| `track` | `track` | Track name |
| `trackColor` **(new field)** | `conference.tracks[].color` | Hex, e.g. `#edbb45`. Carried by PR 1 but not yet read — PR 2 consumes it and deletes the `trackColor()` hash at `ScheduleGrid.astro:83`. Adding a field keeps PR 1 render-identical |
| `room` | `room` | |
| `format` | derived, see below | |
| `startTime` | `date` | ISO 8601 with `+01:00`. Parsed by regex, never through `new Date()`, preserving the existing offset-safe behaviour of `formatTime` |
| `durationMin` | `duration` `"HH:MM"` | `"00:45"` → `45` |
| `language` | `language` | |
| `feedbackUrl` | `feedback_url` | Populated for 51/51 |
| `slidesUrl` | `attachments[]` ∪ `links[]` | First entry whose title matches `/slide|deck|présentation/i` |
| `recordingUrl` | `links[]` ∪ `attachments[]` | First entry on a known video host (`youtube.com`, `youtu.be`, `vimeo.com`) or titled `/replay|video|rediff/i` |
| `status` | constant `"confirmed"` | The export contains only released talks |
| `level` `tags` `coverImageUrl` | — | No source. Emitted as `""` / `[]` |

Scanning both `attachments` and `links` for slides and replays is deliberate: Pretalx files
them by resource kind (uploaded file vs URL), and organisers should not have to care which.

**Format derivation.** Type name alone is wrong. Measured against the 2026 export:

| Rule | Result |
|---|---|
| `type` starts with `Keynote` | keynote — 1 |
| `durationMin <= 15` | lightning — 21 |
| otherwise | talk — 29 |

Mapping *only* by submission type would give 19 lightning talks, because two 10-minute
sessions are typed `Conférence` / `Retour d'expérience`. Duration is the honest signal and
matches the Sheet's hand-classified 21. The resulting 29 talks versus the Sheet's 28 is the
recovered `HFFT3Q`.

### Resilience

Identical contract to `src/lib/remote-csv.ts`, which is generalised into a shared
`fetchWithFallback` helper (CSV and JSON callers differ only in how they validate the body):

- 8s timeout, `AbortController`, one attempt.
- On any failure — non-2xx, timeout, malformed JSON, zero talks — log a warning and read
  the committed snapshot `src/content/schedule/pretalx-{year}.json`.
- Memoised per URL for the process lifetime, since Astro invokes loaders once per page.

A **build must never fail** because Pretalx is unreachable, and it must be obvious in the
build log which source was used. `pnpm sync:pretalx` refreshes the snapshots and is run by
a human before release, so schedule changes land as reviewable git diffs.

### 2023

No Pretalx event exists. `sessions-2023.csv` is converted **once** into
`src/content/schedule/sessions-2023.json`, a normalized `SessionRow[]` array. That edition
is frozen archive data and will never change again.

`loadSessions(year)` therefore resolves in two ways: an edition with a Pretalx slug fetches
and normalizes; an edition without one reads the committed JSON. With no CSV session source
left, **`parseCsv` and its 60 lines are deleted from `schedule.ts`**.

---

## Part 2 — Speaker overlay

Pretalx speakers carry only `code`, `name`, `biography`, `avatar_url`. No company, no role,
no socials, and no notion of the site's keynote display treatment. The speakers tab
therefore survives, but only for what Pretalx cannot express:

```
pretalx_code, slug, company, role, keynote, keynote_size
   + optional name, bio, photo_url — fallbacks, used only when there is no Pretalx match
```

Deleted outright: `linkedin`, `github`, `bluesky`, `website` — **0/77 filled, all four**.
`company` (10/77) and `role` (8/77) stay because the schedule cards render "Name (Company)".

Pretalx wins for `name`, `biography`, `avatar_url` whenever a match exists; today that is
67 of the 77 rows, so organisers stop maintaining bios and photos by hand. The remaining
~10 rows are people with no released talk — MCs and panellists — and keep using the
fallback columns.

### Slug stability — the main risk

Speaker URLs are `/intervenants/{slug}` and `/en/speakers/{slug}`. Pretalx keys by `code`.
Deriving slugs from names would silently change URLs and 404 every existing inbound link.

Mitigation: the overlay carries the **authoritative `slug`**, and a test asserts that every
speaker slug present in today's `speakers-2026.csv` still resolves after the swap. If one
does not, the build fails loudly rather than shipping dead URLs.

---

## Part 3 — Page redesign

Per the `stitch-first` skill, PR 2 opens with Stitch screens validated by the user before
any component code is written. This section is the brief for those screens.

### Two views over one dataset

**Grid** — rows are *time slots*, not minutes. Every card in a row shares a height driven by
content, not duration. Gaps of 20 minutes or more between slots render as labelled bands
(`Pause déjeuner · 12:10 – 13:00`) instead of blank space. Keynotes span all room columns.
A left gutter carries the slot start time.

**List** — a time-ordered feed of full-width cards: speaker avatar, title, speakers, track
pill, room and time, and inline replay / slides / feedback actions.

The default resolves from edition state, and is overridable:

| Context | Default | Why |
|---|---|---|
| Past edition | List | The visitor wants a replay; the room is noise |
| Upcoming or live edition | Grid | The visitor is planning a day across parallel rooms |
| Any edition, viewport < 768px | List | Four room columns is not usable at 390px |

`?view=grille\|liste` makes a choice shareable; `localStorage` remembers it between visits.

### Search and filters

- **Search** — debounced client-side match over title, speaker names, track and
  description. Result count announced via `aria-live`. This is the single largest
  browsability gap today.
- Filter chips collapse to one row plus a `Filtres (2)` sheet below 768px, replacing the
  current 8-row stack.
- Search, filters and view are reflected in the URL query so a filtered programme is a
  shareable link.
- The filter/search predicate is extracted as a **pure function** so it can be unit-tested
  without a DOM.

### Cards

- Titles line-clamped with a real ellipsis; speaker line clamped to one. No mid-word cuts.
- Track shown as a coloured pill in the Pretalx hex, with foreground and background run
  through `src/lib/color-contrast.ts` (`contrastRatio`, plus a small hex parser alongside
  the existing `parseOklch`). `#edbb45` must never ship as unreadable text.
- Format badge only when it is not a plain talk.
- On a past edition the replay action is the card's primary CTA.

### Live mode

Only while `now` falls inside the event day: an "En ce moment" band, and auto-scroll to the
current slot on load. Slot-based rows make this cheap; it is the "companion" half of the
brief. Behind the same date logic as the rest of the page, so it costs nothing the other
364 days.

### Component split

`ScheduleGrid.astro` (1278 lines) becomes:

```
ScheduleToolbar.astro    search + filters + view toggle + agenda button
ScheduleGridView.astro   slot rows
ScheduleListView.astro   feed
SessionCard.astro        shared by both views
SessionModal.astro
AgendaDrawer.astro
schedule-ui.ts           typed client entry point, replacing the inline script
```

The agenda/bookmark feature keeps its current `localStorage` behaviour and key, so anyone
who bookmarked talks keeps them — session ids are unchanged (Part 1).

### Accessibility

Existing `aria-pressed` chips are kept. Added: `aria-live` result count, verified modal
focus trap and `Esc`, roving tabindex across grid cells, and `prefers-reduced-motion`
honoured by any transition introduced.

---

## Verification

| Test | Asserts |
|---|---|
| Normalizer golden test | `toSessionRows` on a committed real `schedule.json` fixture yields 51 sessions, formats 1/29/21, durations, and 51 feedback URLs |
| Format derivation | The two 10-minute non-`Éclair` sessions classify as lightning |
| Fallback path | A failing fetch produces the snapshot's rows and logs a warning; the build does not throw |
| Slug stability | Every speaker slug in today's `speakers-2026.csv` still resolves |
| Filter/search reducer | Pure-function unit tests over query + chip combinations |
| Build | `/programme/2023`, `/programme/2026`, `/en/programme/2026` render; ICS output is byte-identical apart from the recovered talk |

Per `superpowers:verification-before-completion`, no completion claim without command
output. PR 1 additionally requires a visual before/after of `/programme/2026` showing the
page is unchanged bar the recovered talk and the new feedback links.

---

## Migration checklist — replay URLs

The 50 YouTube links are entered into Pretalx once, as talk resources of type link titled
`Replay`. Because the Sheet's `id` column is already the Pretalx code, the checklist is
generated mechanically from `sessions-2026.csv` as `code → title → url`, ordered by room and
start time to match the organiser UI's own ordering.

Until every link is entered, `recordingUrl` is empty for the talks still missing one, which
would empty `/replays`. PR 1 therefore does not merge until the checklist is complete and
`sync:pretalx` shows 50 replay links present — verified by a test asserting that the 2026
snapshot carries at least as many recordings as the CSV it replaces.

**This makes PR 1 blocked on manual data entry, which is a real coordination cost.** If
that blocks for longer than is comfortable, the escape hatch is to merge PR 1 with a
temporary `src/data/recordings-2026.ts` map generated from the Sheet, keeping `/replays`
whole while the links are entered, and delete it in a follow-up once Pretalx is complete.
That trades a short-lived second source of truth for an unblocked pipeline. Default is to
stay blocked and keep decision 3 clean; take the hatch only if asked.

---

## Documentation to update

- `CLAUDE.md` — the data pipeline section still describes `SESSIONS_CSV_URL_*` as the
  session source.
- **`.claude/skills/csv-source-of-truth`** — it currently instructs that sessions are
  authored in Google Sheets. Left unchanged it will actively mislead future sessions. It
  must say: sessions and session-attached resources come from Pretalx; the Sheet remains
  authoritative for speaker overlay fields, sponsors and team.
- `DESIGN.md` — a decision entry for the two-view programme.

---

## Out of scope

- Sponsors and team pipelines — they stay on the Sheet.
- The speaker detail page design; only its data source changes.
- 2027 content. The pipeline supports the edition as soon as its Pretalx event is public.
- Writing back to Pretalx. The site is a read-only consumer.
