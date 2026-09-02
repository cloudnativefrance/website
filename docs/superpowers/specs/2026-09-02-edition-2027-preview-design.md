# Design spec — Edition 2027: private Pretalx preview

**Date:** 2026-09-02
**Status:** Approved, ready for implementation
**Delivery:** three PRs — **PR 1** (gating + build-arg plumbing), **PR 2** (preview loader + 2027 wiring), **PR 3** (speaker-slug generator)

PR 1 ships immediately and depends on nothing external. PR 2 is blocked on the 2027
Pretalx event existing. PR 3 is only needed once the 2027 CFP has accepted speakers.

---

## The invariant

> **No fact about the 2027 programme — a talk title, a room, a time, a speaker name, a
> speaker slug in a URL — may appear in a production build.**

Everything below is subordinate to that sentence. Where a choice traded convenience
against this invariant, the invariant won.

The design does not enforce it by hiding rendered output. It enforces it by **never
fetching the data in a production build**: a production build of this site holds no 2027
session or speaker record in memory at any point. A template bug, a stray `getStaticPaths`
entry, a sitemap filter mistake or a future refactor cannot leak what was never loaded.

Staging is the mirror image: it fetches, renders and publishes the full 2027 programme, on
an origin that already serves `Disallow: /` and a `noindex` meta tag
(`src/lib/site-env.ts`).

---

## Context

The 2026 edition ran on 2026-02-03 and its content is settled. The site is already
2027-oriented in most respects — `TARGET_DATE` is 2027-06-03, the countdown points at it,
and `EDITIONS` already contains 2027 with dynamic routes generating `/programme/2027`,
`/intervenants/2027` and `/partenaires/2027`. **There is no page duplication to do.**

What is missing is the 2027 *data pipeline*, and a way to build the programme in the open
with the organising team while the public site shows nothing.

### What already exists for 2027

| | Where |
|---|---|
| `EDITIONS` includes 2027; all `[year]` routes generate it | `src/lib/editions.ts:1` |
| `programme` flag, `kind: "page"`, opens 2027-04-01 | `src/config/flags.ts:40` |
| `/programme/2027` renders `ComingSoonLayout` while the flag is pending | `src/pages/programme/[year].astro:47` |
| `sponsors_2027` flag + placeholder sponsor CSV | `src/config/flags.ts:52` |
| Frozen empty archives `sessions-2027.json`, `speakers-2027.json` (both `[]`) | `src/content/schedule/` |
| Flag env overrides (`FLAG_<NAME>=on|off`) resolved at build time | `src/lib/flags.ts:56` |

### What is missing

| Gap | Where |
|---|---|
| No 2027 Pretalx event at all (`/2027/` → 404, verified) | pretalx instance |
| `PRETALX_EVENT[2027]` unset — 2027 reads the empty frozen archive | `src/lib/pretalx.ts:21` |
| `SPEAKER_QUESTIONS[2027]` / `LEVEL_QUESTION_ID[2027]` unset | `src/lib/pretalx-private.ts:52,64` |
| `FLAG_*` is not plumbed as a build-arg — no way to make staging differ from prod | `Dockerfile`, `.github/workflows/build-image.yml:72` |
| Speakers routes are **not** flag-gated | `src/pages/intervenants/[year]/*`, EN mirrors |
| `/intervenants/[slug]` shim enumerates every speaker across **all** editions | `src/pages/intervenants/[slug].astro:15` |

The `FLAG_*` gap is not an oversight — `docs/feature-flags.md:193` names it as a
deliberately deferred decision:

> `FLAG_*` does not use that pattern yet — wiring it up is a separate, not-yet-made decision.

This spec makes that decision.

---

## Verified facts

Everything in this section was measured against the live instance on 2026-09-02, not
assumed. The instance hosts a non-public event (`democon`, `is_public: false`) which
served as the test case for hidden-event access.

| Probe | Result | Consequence |
|---|---|---|
| `GET /2027/` | 404 | The 2027 event does not exist yet |
| `GET /democon/schedule/export/schedule.json` **with organiser token** | **404** | **An API token does not unlock the agenda export.** It is session-authenticated. Adding a header to the existing fetch cannot work |
| same, anonymous | 404 | — |
| `GET /api/events/democon/{schedules,slots,rooms}/` with token | 200 | The REST API *does* serve a non-public event |
| same, anonymous | 401 | Nothing leaks to the public from the REST API |
| `GET /api/events/2026/schedules/` | `wip` (published: null) + 8 released versions | A wip schedule is readable before any release |
| `?expand=slots.room,track,submission_type,speakers,answers.question` | inlines all of them | One paginated call yields everything both consumers need |
| `gh repo view cloudnativefrance/website` | `PUBLIC` | A committed `pretalx-2027.json` snapshot would publish the programme |

Two of those killed a candidate approach outright: the token-on-the-export approach (404)
and the committed-snapshot approach (public repo).

### Field coverage

`/api/events/{slug}/submissions/?state=confirmed&expand=…` returns, per submission:
`code`, `title`, `description`, `duration`, `content_locale`, `tags`, `state`,
`submission_type{name,default_duration}`, `track{name,color}`,
`slots[{start,end,is_visible,room{name}}]`, `speakers[{code,name,biography}]`,
`answers[{question{id,identifier,question}}]`.

That is a superset of what the released export provides — it additionally carries the
question answers inline, so the preview path needs no second authenticated round trip for
levels or speaker enrichment.

`SpeakerRecord.photo_url` is the one field not in that payload; it comes from
`/api/events/{slug}/speakers/?expand=answers` (`avatar_url`).

> **PII note.** `/api/events/{slug}/speakers/` returns `email` and `internal_notes`. The
> mapper reads `code`, `name`, `biography`, `avatar_url` and `answers` and nothing else.
> Like `pretalx-private.ts`, nothing from this path is ever written to disk.

---

## Design

### D-1 — `PRETALX_EVENT` carries per-edition access

```ts
export type EditionAccess = "public" | "preview";

export const PRETALX_EVENT: Partial<Record<Edition, { slug: string; access: EditionAccess }>> = {
  2026: { slug: "2026", access: "public" },
  2027: { slug: "2027", access: "preview" },   // added in PR 2
};
```

One word is the single source of truth for three otherwise-scattered decisions:

- which fetch path is used (anonymous agenda export vs authenticated REST);
- whether the edition's data may be loaded in a production build at all;
- which event `/cfp` links submitters to.

Flipping `preview` → `public` on the day the Pretalx event goes public moves all three
together, in a one-word PR. That is deliberately *not* the same switch as the `programme`
flag: the CFP must target the 2027 event from the moment it opens (2026-09-01), months
before the programme is announced (2027-04-01). Two facts, two switches.

### D-2 — `src/lib/pretalx-preview.ts`, the authenticated reader

New module. Sits alongside `pretalx-private.ts` and inherits both of its standing rules —
requires a token, and **never writes to disk**.

```ts
export interface PreviewEdition {
  sessions: SessionRow[];
  speakers: SpeakerRecord[];
}

export async function loadPreviewEdition(year: Edition, slug: string): Promise<PreviewEdition>;
```

One memoised call per `(year, slug)` for the process lifetime, matching
`remote-fetch.ts`'s memo: Astro invokes loaders many times per build and every page must
see the same data.

**Which schedule.** The wip schedule — what the organisers are editing right now, with no
release step. A slot belongs to a schedule version; the reader takes the version whose
`published` is `null`. Rebuilding staging shows the current state of the grid.

**Mapping.** Reuses `toFormat`, `durationToMinutes`, `toLevel` and `buildSpeakerResolver`
exported from `pretalx.ts` rather than restating them, so the two ingestion paths cannot
drift on format classification, level vocabulary or slug resolution.

| `SessionRow` | Source |
|---|---|
| `id` | `submission.code` |
| `title`, `description`, `tags` | `submission.*` |
| `speakers` | `submission.speakers[].name` → `buildSpeakerResolver()` |
| `track`, `trackColor` | `track.name` (localised), `track.color` |
| `level` | `answers[].question.id === LEVEL_QUESTION_ID[year]` → `toLevel()` |
| `room` | `slot.room.name` (localised) |
| `format` | `toFormat(submission_type.name, durationMin)` |
| `startTime`, `durationMin` | `slot.start`, `submission.duration` |
| `language` | `content_locale` |
| `status` | `"confirmed"`; `slot.is_visible === false` → `"hidden"` |
| `feedbackUrl`, `slidesUrl`, `recordingUrl`, `coverImageUrl` | `""` — none exist pre-event |

REST returns localised objects (`{"fr": "Monet"}`) where the export returns plain strings.
A `localised()` helper picks `fr`, then the first present value.

**Question-id hardening.** With `expand=answers.question` the mapper sees each question's
text alongside its id. It asserts that `LEVEL_QUESTION_ID[year]` resolves to a question
whose text contains "niveau" **and** targets submissions, and throws naming both questions
if not. This closes the exact trap `pretalx-private.ts:57` documents — question 1 is
*"Quel est votre niveau en tant qu'intervenant(e)"* (about the speaker) and question 4 is
*"Niveau de la présentation"* (about the talk); they read almost identically and mean
different things.

### D-3 — Preview data is never loaded in a production build

The load rule, applied in `loadSessions` (`schedule.ts`) and `loadSpeakers`
(`speaker-source.ts`):

```
entry = PRETALX_EVENT[year]

no entry                                   → frozen archive          (2023)
entry.access === "public"                  → anonymous agenda export (2026)
entry.access === "preview" && flag active  → authenticated REST      (2027 on staging)
entry.access === "preview" && flag off     → frozen archive          (2027 on production)
```

The fourth line is the invariant. In a production build `loadSessions(2027)` and
`loadSpeakers(2027)` return the existing `sessions-2027.json` / `speakers-2027.json`, both
`[]`. No request is made to Pretalx for 2027, no token is needed for it, and no record
exists to be rendered, listed, enumerated or indexed.

This also means the existing empty archives keep earning their place — and the warning
already on `loadArchivedSessions` (`schedule.ts:96`, *"do not regenerate from the Sheet"*)
gains a second reason to stay.

One shared helper states the rule once, and is used by the data layer *and* by the route
gates in D-4 — so "may this data be fetched" and "may this page be shown" can never
disagree:

It goes in a new `src/lib/edition-visibility.ts`, not in `editions.ts`. `editions.ts` is
dependency-free today, like `flags.ts`, and the rule needs both `PRETALX_EVENT` (which
transitively pulls in `node:fs` via `remote-fetch.ts`) and `isFlagActive`. Putting it there
would make any React island that imports `editions.ts` fail to bundle — no island does
today, which is exactly why the trap would be set silently.

```ts
// src/lib/edition-visibility.ts
export function isEditionLoadable(year: Edition, now?: Date): boolean {
  const entry = PRETALX_EVENT[year];
  if (entry?.access === "preview") return isFlagActive("programme", now);
  if (year > CURRENT_EDITION) return isFlagActive("programme", now);  // unmapped future edition
  return true;                                                        // 2023, 2026
}
```

The second line preserves today's behaviour for an edition added to `EDITIONS` before it
has a Pretalx event; the first is what makes 2027 safe, and it does not depend on
`CURRENT_EDITION` — see D-5.

### D-4 — Route gating, at path-generation time

Gating inside a page body is not enough. A gated `[slug].astro` still *emits one HTML file
per speaker*, publishing every 2027 speaker's name in the URL, in `dist/`, and in the
sitemap — a "Coming Soon" body over a URL that names the person is a leak. So the gate goes
in `getStaticPaths`.

Every gate calls the same `isEditionLoadable(year)` from D-3 — `getStaticPaths` filters on
it, and the page body branches on it for the routes that render `ComingSoonLayout`.

With D-3 in place the path filter is belt-and-braces: `getAllSpeakers(2027)` already
returns `[]` in production, so no path is generated anyway. The explicit filter is kept
because it is the line a future reader will look for, and because it keeps the routes
correct even if the loader rule is ever changed.

| Route | Production | Staging |
|---|---|---|
| `/programme/2027`, `/en/programme/2027` | `ComingSoonLayout` (already) | full grid |
| `/intervenants/2027`, `/en/speakers/2027` | `ComingSoonLayout` (**new**) | full list |
| `/intervenants/2027/<slug>` + EN | **not emitted** | emitted |
| `/intervenants/<slug>` shim | 2027-only slugs **not emitted** | emitted |
| `/programme.ics` | 2026 sessions, unchanged | unchanged |

`ComingSoonLayout` requires `flags.<name>.soon.{title,body}` in both locales; `programme`
is already a `kind: "page"` flag with that copy present, so the speakers routes reuse it —
no new flag, no new i18n keys, and `flags-registry.test.ts` keeps enforcing parity.

**The ICS feed** calls `loadSessions()` with no argument, which defaults to
`CURRENT_EDITION` — 2026 today. It cannot leak 2027 as written. A guard test pins that: the
route must not pass a preview-access edition to `loadSessions`. Its
`filename="cnd-france-2027.ics"` is cosmetically wrong for 2026 content and is corrected to
derive from the edition it actually serves.

### D-5 — `CURRENT_EDITION` stays 2026

Recorded here because it is a live trap. Today's programme gate is `year > CURRENT_EDITION`
(`programme/[year].astro:45`). Flipping `CURRENT_EDITION` to 2027 as part of "preparing
2027" makes that condition false for 2027 and **un-hides the entire programme in
production** — the exact outcome this spec exists to prevent, caused by an edit that looks
like routine housekeeping.

Two defences, because the consequence is severe:

1. `CURRENT_EDITION` stays 2026. It moves to 2027 as part of the launch, after the reveal.
2. `isEditionLoadable` (D-3) checks `access === "preview"` **before** it consults
   `CURRENT_EDITION`, so a 2027 marked `preview` stays hidden regardless of what
   `CURRENT_EDITION` says. The arithmetic branch survives only for editions with no Pretalx
   entry, where it is still the right rule.

Defence 2 is what makes defence 1 a preference rather than a landmine.

### D-6 — `FLAG_*` as a build-arg

The mechanism that makes staging differ from production. Currently impossible: flags
resolve from `process.env` at build time, the artifact is a static nginx image, and a
Kubernetes-level env var on the running pod changes nothing.

- **`Dockerfile`** — `ARG FLAG_OVERRIDES=` / `ENV FLAG_OVERRIDES=$FLAG_OVERRIDES`, placed
  after `pnpm install` so a differing value invalidates only the build layer, mirroring the
  existing `PUBLIC_SITE_URL` treatment.
- **Format** — a comma-separated list, `FLAG_OVERRIDES=programme=on,tickets=off`, expanded
  into individual `FLAG_<NAME>` variables before `pnpm run build`. One build-arg rather
  than one per flag, so adding a flag needs no Dockerfile or workflow edit.
- **`build-image.yml`** — the staging branch passes `programme=on`; every other branch
  passes empty, so production keeps pure date logic and an argument-less `docker build`
  still produces the production site.
- **Validation** — an unknown flag name in `FLAG_OVERRIDES` fails the build. A typo that
  silently did nothing would be indistinguishable from the feature not working, and on this
  particular flag the failure mode is "staging looks correctly empty".

Rejected alternative: deriving overrides from the origin (`isPreviewOrigin()`), which needs
no CI plumbing but forces *every* pending flag active on staging — including `tickets`,
which redirects to an external ticketing URL. Silent blast radius on every future flag.

### D-7 — `/cfp` links via `PRETALX_EVENT`

`CFP_URL` is currently the hardcoded literal `https://cfp.cloudnativedays.fr/2026/` in both
`src/pages/cfp.astro:11` and `src/pages/en/cfp.astro:11`. It becomes derived: the newest
edition whose access is `public`. While 2027 is `preview` that is 2026 — production
behaviour is unchanged today, as required.

Staging shows the same 2026 link rather than a 2027 one. A CFP link's job is to send a
submitter somewhere that resolves, and a non-public 2027 event 404s for them; inventing a
staging/production divergence here would only make staging misleading.

> **Operational note, not a code change.** The CFP flag opened on 2026-09-01 and the page
> currently points submitters at the 2026 event, so 2027 proposals are landing there now.
> The link corrects itself the moment `2027` is marked `public`. Submissions filed in the
> meantime need moving in Pretalx — an organiser action, outside this spec.

### D-8 — `pnpm sync:speaker-slugs`

`loadSpeakers` throws when a Pretalx speaker has no entry in `src/data/speaker-slugs.ts`
(81 names today), deliberately — a derived slug would produce
`/intervenants/Jérôme%20Petazzoni`, a 404 that renders as a working link. During programme
building that means every newly-confirmed speaker reds the staging build until someone
hand-writes a line.

New script, in the shape of the existing `sync:pretalx`: reads the edition, computes
`kebab(name)` for every unmapped speaker, appends the entries to `speaker-slugs.ts`, and
prints what it added for review and commit.

The hard failure stays. Slugs remain reviewed, committed and hand-overridable (eight are
deliberately shortened — `petazzoni`, not `jerome-petazzoni`); what changes is that adding
twenty speakers is one command plus one review, not twenty edits.

---

## Data flow

```
                      ┌──────────────────────── production build ───────────────────────┐
                      │  FLAG_OVERRIDES=""     →  programme flag pending                │
  PRETALX_EVENT       │                                                                 │
  2026 public ────────┼─→ anonymous agenda export ──→ SessionRow[] ──→ /programme/2026  │
                      │      ↳ snapshot fallback: pretalx-2026.json                     │
  2027 preview ───────┼─→ ✗ no fetch ──→ frozen [] ──→ ComingSoonLayout                 │
                      └─────────────────────────────────────────────────────────────────┘

                      ┌──────────────────────── staging build ──────────────────────────┐
                      │  FLAG_OVERRIDES=programme=on  →  programme flag active          │
  2027 preview ───────┼─→ token → /api/events/2027/submissions/?expand=… (wip schedule) │
                      │      → SessionRow[] + SpeakerRecord[] → full 2027 pages         │
                      │      → noindex + robots Disallow (staging origin)               │
                      └─────────────────────────────────────────────────────────────────┘
```

---

## Failure modes

| Failure | Behaviour | Why |
|---|---|---|
| No token, staging, 2027 loadable | **Build fails** | Existing `PRETALX_TOKEN_REQUIRED=1` policy. A staging build silently rendering an empty programme is the regression that flag exists to prevent |
| Token rejected (401/403) | **Build fails**, not degradable | `isConfigurationFailure` — ours to fix, never an outage |
| `SPEAKER_QUESTIONS[2027]` missing | **Build fails** naming the edition | `MissingQuestionIdError`, existing behaviour |
| `LEVEL_QUESTION_ID[2027]` points at the wrong question | **Build fails** naming both questions | New assertion, D-2 |
| Pretalx unreachable, staging | Retry, then fail under `PRETALX_TOKEN_REQUIRED` unless `PRETALX_ALLOW_DEGRADED=1` | Matches the existing deliberate override |
| Pretalx unreachable, production | **Unaffected** — 2027 is never fetched | D-3 |
| 2027 event exists but wip schedule has no slots yet | Empty session list on staging, build succeeds | Genuinely empty ≠ broken. Distinguished from a failed fetch, which throws |
| `PRETALX_EVENT[2027]` set before the event exists | **Build fails** with a named 404 | Non-retryable HTTP is a configuration failure. Note: with the *anonymous* path this crashes on an unguarded `readFileSync` of a non-existent `pretalx-2027.json` (`remote-fetch.ts:66`) — the preview path must not inherit that, and reports the 404 instead |
| Unknown flag name in `FLAG_OVERRIDES` | **Build fails** | D-6 |

---

## Testing

Unit (`src/lib/__tests__/`):

- `pretalx-preview.test.ts` — mapper against a captured fixture of the `expand=` payload:
  localised name extraction, wip-version selection, `is_visible: false` → `hidden`, level
  resolution, and the wrong-question assertion.
- `editions.test.ts` — the D-3 truth table, all four rows, both flag states.
- `flags.test.ts` — `FLAG_OVERRIDES` parsing, including the unknown-name failure.

Build guards (`tests/build/`), following the source-shape pattern established by
`noindex-guard.test.ts` and `analytics-tracker-guard.test.ts` — a full `pnpm build` per
case is too slow for CI:

- **`edition-2027-prod-isolation.test.ts`** — the invariant's guard, and the most important
  test in this spec. With the flag inactive it asserts `loadSessions(2027)` and
  `loadSpeakers(2027)` return `[]`, that no `fetch` is issued (stubbed and asserted
  un-called), and that every 2027-capable route gates in `getStaticPaths` rather than only
  in its body.
- `programme.ics.ts` must not pass a preview-access edition to `loadSessions`.

Manual, once staging is deployed: confirm `/programme/2027` renders the grid on staging and
Coming Soon on production, and that `curl -s https://cloudnativedays.fr/sitemap-index.xml`
plus a `grep` of the production image's `dist/` contain no 2027 speaker slug.

---

## Sequencing

**PR 1 — gating + plumbing.** D-4, D-5, D-6, plus the guard tests. No 2027 data, no
external dependency. Shippable now, and it makes the production build provably safe
*before* any 2027 wiring exists.

**Blocked step — the Pretalx event.** An organiser creates the 2027 event, using Pretalx's
"copy settings from an existing event" at creation to carry over tracks, rooms, submission
types and questions from 2026, **without** sessions or speakers. The event stays
non-public. Then read the new question ids:

```bash
curl -H "Authorization: Token $PRETALX_API_TOKEN" \
  https://cfp.cloudnativedays.fr/api/events/2027/questions/
```

Question ids belong to the question object, not to a per-event slot — 2027's "Entreprise"
will not be id 15. They cannot be guessed and must be read off the live event.

**PR 2 — preview loader + wiring.** D-1, D-2, D-3, D-7, `SPEAKER_QUESTIONS[2027]`,
`LEVEL_QUESTION_ID[2027]`.

**PR 3 — `sync:speaker-slugs`.** D-8. Needed once the 2027 CFP has accepted speakers, so
after 2027-02-28. No urgency.

**Reveal (out of scope, recorded for continuity).** Make the Pretalx event public → flip
`2027` to `access: "public"` → `/cfp` retargets and the anonymous export path takes over →
on 2027-04-01 the `programme` flag opens on its own via the daily cron → move
`CURRENT_EDITION` to 2027 → drop `FLAG_OVERRIDES=programme=on` from the staging job.

---

## Out of scope

- **Sponsors 2027.** `sponsors-2027.csv` holds placeholder rows (Horizon Stack, Ignite
  Cloud, …) behind the `sponsors_2027` flag until 2027-03-01. Untouched here.
- **`KEYNOTE_CAST[2027]`.** Editorial running order; added when the keynote is cast.
- **Moving misfiled 2027 submissions** out of the 2026 Pretalx event (organiser action).
- **2026 content.** Nothing in this spec changes what `/programme/2026`,
  `/intervenants/2026` or the homepage render.
