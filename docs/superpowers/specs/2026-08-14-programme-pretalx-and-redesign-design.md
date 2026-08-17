# Design spec — Programme: Pretalx pipeline + page redesign

**Date:** 2026-08-14
**Status:** Approved, ready for implementation
**Delivery:** two PRs — **PR 1 = Part 1** (sessions pipeline), **PR 2 = Part 3** (page redesign)

Each PR gets its own implementation plan. PR 1's plan is written first; PR 2's is written
after PR 1 merges, so the redesign is planned against fields that demonstrably exist.

> **Revision, 2026-08-14 (post-approval).** The first version of this spec measured column
> fill rates against the **committed fallback CSVs** rather than the live published Sheet
> that builds actually fetch. Three claims were wrong and are corrected below: the Sheet is
> not missing a talk, `linkedin` is not dead, and `company`/`role` are fully populated. The
> consequence is that **Part 2 (speaker overlay) is dropped** — with the real numbers it
> saves almost nothing while touching six page files. Speakers stay exactly as they are.

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
hand-rolled RFC-4180 parser (`parseCsv`, 60 lines). Fill rates measured against the **live
published Sheet** (51 session rows for 2026):

| Column | 2026 live | Verdict |
|---|---|---|
| `id` `title` `speakers` `track` `room` `format` `start_time` `duration_min` | 51/51 | all available from Pretalx |
| `description` `language` `status` | 51/51 | available from Pretalx |
| `recording_url` | 51/51 | **the only field Pretalx has no native slot for** |
| `feedback_url` | **0/51** | **Pretalx has it for 51/51** |
| `slides_url` | **0/51** | Pretalx `attachments`, 1 talk already uploaded |
| `level` `tags` `cover_image_url` | **0/51** | never populated for 2026 |

The live Sheet is **not** drifting from Pretalx: all 51 ids resolve to a Pretalx talk and
all 51 Pretalx codes appear in the Sheet, in both directions. The migration is therefore a
mechanical swap, not a reconciliation. What it buys is the elimination of the hand-copy
step itself, plus three fields the Sheet has never carried:

1. **Feedback links.** Pretalx exposes `feedback_url` for all 51 talks; the Sheet column is
   empty, so the modal's feedback button never renders.
2. **Slides.** Pretalx `attachments` already holds one uploaded deck, invisible to the site.
3. **Track colours.** Curated per-track hex values, discarded in favour of a name hash.

**The committed fallback is stale.** `src/content/schedule/sessions-2026.csv` has 50 rows;
the live Sheet has 51. It is missing `HFFT3Q` — *"REX Skello — Data Platform Engineering"*,
Monet, 30 min. Nobody notices because the fallback only serves during an outage, at which
point the site would silently render a talk-short programme. A committed snapshot refreshed
by an explicit command (below) replaces a fallback nobody remembers to update.

The `id` column already contains Pretalx submission codes (`GJ89TV`, `9H9WKR`, `S3SPP8`…),
so session ids — and therefore existing `localStorage` bookmarks — are unchanged by the swap.

### Page

`src/components/schedule/ScheduleGrid.astro` is 1278 lines / 53 KB, including a ~500-line
inline `<script is:inline>` and a ~290-line `<style>` block. Rendering `/programme/2026`
at 1440px produces roughly 3400px of page for 51 talks. Observed problems:

| Problem | Evidence |
|---|---|
| Time-proportional rows waste the page | The 75-min opening keynote renders as a ~450px empty box. The 12:10–13:00 lunch gap is a ~400px unexplained void. |
| Cards clip their own content | *"REX SNCF – Des Rails aux Nuages : Comment Kubernetes à l'Edge Révolutionne les…"* is cut mid-word with no ellipsis; the speaker line overflows the card border. Same at 12:00 in Dumas. |
| No text search | 51 talks, no way to find "Cilium" or "FinOps" by name. |
| Card height encodes duration | A 45-min talk is a tall box with text pinned to the top; a 10-min lightning talk is cramped. Nobody reads height as minutes. |
| Track colour is a 3px left border | Hues come from `trackColor()` (`ScheduleGrid.astro:83`), a name hash. Yellow, pink, purple and orange land adjacent. Pretalx's curated per-track colours are discarded. |
| Filters cost 8 rows on mobile | At 390px, notice + title + PDF button + chip stack ≈ 1100px before the first talk. |

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | One page serves both live attendees and archive browsers, switching behaviour by edition state | Avoids a second page and a second URL to keep in sync across two locales |
| 2 | Build-time fetch with a committed snapshot fallback | Matches the existing `remote-csv.ts` contract: fresh on every build, and a Pretalx outage cannot break CI |
| 3 | Pretalx is the single source of truth for session data, including slides and replays | Removes a hand-copy step of 51 rows × 17 columns, and unlocks feedback URLs, slides and track colours the Sheet never carried |
| 4 | Grid rows are time **slots**, not minutes; two views (Grid / List) over one dataset | Time-proportional layout is what produces the dead space, and neither view alone serves both audiences |
| 5 | Replay URLs become Pretalx resource links, entered once | Keeps decision 3 whole; the checklist is generated from today's Sheet so it is copy-paste |
| 6 | **The speakers tab is left untouched** | Pretalx holds only name, bio and avatar. `company` (77/77), `role` (77/77), `linkedin` (76/77), `photo_url` (77/77) and the keynote display flags have no Pretalx equivalent, and 10 keynote participants have no Pretalx person record at all. An overlay would churn six page files and the Zod schema to move roughly one column of real work |

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
makes the swap provable: the rendered page must be identical apart from the newly present
feedback links, and slides on the one talk that has a deck uploaded.

### Field mapping

| `SessionRow` | Pretalx export | Notes |
|---|---|---|
| `id` | `code` | Already the Sheet's `id`, so bookmarks in `localStorage` survive |
| `title` | `title` | |
| `description` | `description` | Markdown. The existing `mdToHtml` in the inline script already renders and sanitises it |
| `speakers` | `persons[].name` → Sheet slug | Exact-name index, 67/67. Unresolved names throw. See Part 2 |
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
sessions are typed `Conférence` / `Retour d'expérience`. Duration is the honest signal.

**This rule is validated, not assumed:** run against all 51 talks it reproduces the Sheet's
hand-classification exactly — 1 keynote, 29 talks, 21 lightning, **zero disagreements**.

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

## Part 2 — Speakers stay on the Sheet *(dropped from scope)*

The speakers tab and its `csvLoader` collections are **not touched**. Pretalx carries only
`code`, `name`, `biography`, `avatar_url`; everything the site actually renders about a
speaker — `company`, `role`, `linkedin`, `photo_url`, `keynote`, `keynote_size` — is
near-fully populated in the Sheet and has no Pretalx equivalent. Ten keynote participants
(Ricardo Rocha, Jean-Baptiste Kempf, Laurent Bernaille, Denis Germain and six others) have
no Pretalx person record at all, so the Sheet remains authoritative regardless.

### Resolving session → speaker references

This is the one genuinely tricky part of PR 1, and it stays in `pretalx.ts`.

Today `SessionRow.speakers` holds **Sheet slugs** (`petazzoni`, `vermande`,
`arthur-outhenin-chalandre`) — verified 67/67 across the live sessions tab. Speaker URLs are
`/intervenants/{slug}` and `/en/speakers/{slug}`, and `getTalksForSpeaker`
(`src/lib/speakers.ts:50`) filters on `s.speakers.includes(speakerSlug)`. The normalizer
must therefore keep emitting slugs, or every speaker cross-link breaks.

Pretalx gives `persons[].code` and `persons[].name`. Two mapping strategies were measured
against the live data:

| Strategy | Result |
|---|---|
| Slugify the Pretalx name | **59/67** — fails on hand-shortened slugs: `Jérôme Petazzoni` → `jerome-petazzoni`, but the Sheet says `petazzoni`. Also `vermande`, `aurelie-vache`, and 5 more |
| **Exact match on speaker `name`** | **67/67** |

So the normalizer builds a `name → slug` index from the speakers CSV — reached through the
existing `fetchCsvOrFallback` + `getCsvUrl("speakers", year)`, not through `astro:content`,
which `src/lib/schedule.ts` cannot import without a cycle.

**An unresolved name is a hard error, not a fallback.** Silently emitting the raw name
would produce `/intervenants/Jérôme Petazzoni` — a 404 that renders as a normal-looking
link. The normalizer throws with the offending name and talk code so the build fails at the
point the Sheet and Pretalx disagree about how someone is spelled.

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
- **The coloured left border goes; the pill replaces it, not supplements it.** Today's
  card carries a 4px accent edge (`ScheduleGrid.astro:314`, and 3px on mobile at `:764`).
  A thick colour bar down one side of a card is a well-known generic-UI tell, and the
  project's `impeccable` design hook flags it as such. It is defensible *only* as a data
  encoding — the calendar convention of colour-coding a slot by category — and once the
  pill carries that encoding legibly and with checked contrast, the edge is decoration
  doing a job something else already does. Carry one signal, not two.
  (Left untouched in PR 1 deliberately: that PR's whole verifiable claim is that the page
  renders identically, proven by a 0.06% pixel diff, and a visual change would void it.)
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
| Normalizer golden test | `toSessionRows` on a committed real `schedule.json` fixture yields 51 sessions, formats 1/29/21, correct durations, and 51 feedback URLs |
| Format derivation | The two 10-minute non-`Éclair` sessions classify as lightning |
| Speaker resolution | All 67 Pretalx person names resolve to a Sheet slug; an unknown name throws with the name and talk code in the message |
| Fallback path | A failing fetch produces the snapshot's rows and logs a warning; the build does not throw |
| Parity with the Sheet | Normalized 2026 output matches the live sessions tab field-by-field on id, title, room, start, duration, format, language and speakers, for all 51 rows |
| Filter/search reducer *(PR 2)* | Pure-function unit tests over query + chip combinations |
| Build | `/programme/2023`, `/programme/2026`, `/en/programme/2026` render; ICS output is unchanged except for the `DTSTAMP` line, which `buildIcs` regenerates from `new Date()` on every run, and the `Feedback:` lines that now appear because Pretalx supplies the URLs the Sheet lacked |

Per `superpowers:verification-before-completion`, no completion claim without command
output. PR 1 additionally requires a visual before/after of `/programme/2026` showing the
page is unchanged apart from the new feedback links.

---

## Migration checklist — replay URLs

The 51 YouTube links are entered into Pretalx once, as talk resources of type link titled
`Replay`. Because the Sheet's `id` column is already the Pretalx code, the checklist is
generated mechanically from the **live** sessions tab as `code → title → url`, ordered by
room and start time to match the organiser UI's own ordering.

Until every link is entered, `recordingUrl` is empty for the talks still missing one, which
would empty `/replays`. PR 1 therefore does not merge until the checklist is complete and
`sync:pretalx` shows 51 replay links present — verified by a test asserting that the 2026
snapshot carries at least as many recordings as the Sheet it replaces.

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
  authoritative for speakers, sponsors and team.
- `DESIGN.md` — a decision entry for the two-view programme.

---

## Out of scope

- Sponsors and team pipelines — they stay on the Sheet.
- **Speakers** — the tab, its schema, its `csvLoader` collections and the `intervenants`
  pages are all unchanged. See Part 2.
- 2027 content. The pipeline supports the edition as soon as its Pretalx event is public.
- Writing back to Pretalx. The site is a read-only consumer.
