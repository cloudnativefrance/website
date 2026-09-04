# SDD ledger — plan: docs/superpowers/plans/2026-09-04-programme-audience-lens.md

Spec: docs/superpowers/specs/2026-09-04-programme-audience-lens-design.md (read; binding authority)
Branch: feat/programme-audience-lens
Plan base after pre-flight fixes: bb54a6a

## Pre-flight scan

### Cross-task rows (shared file or interface)

| Tasks | Produces -> consumes | Found |
|---|---|---|
| 1 -> 2 | `audienceOf`, `hasBothAudiences` from `src/lib/audience.ts` | OK — signatures in T1 match T2's use |
| 1 -> 3 | `Audience` type | OK |
| 1 -> 5 | `LEADERSHIP_TRACKS` for the track-filter pruning | OK |
| 2 -> 3 | `data-audience` on cards, `data-room` on `.grid-view-room`, `data-has-audiences` on root | **P2 — see rulings.** T3 hides room columns by class alone, but the grid BODY is placed explicitly (`grid-column:${i+2}`, ScheduleGridView.astro:95). Cells keep their track when their cards hide, and survivors keep column numbers that vanish when `--room-count` shrinks. |
| 2 -> 6 | `data-has-audiences="false"` on 2023/2026 builds | OK |
| 3 -> 4 | `src/lib/lens.ts` exists; wrapper collects card data | OK after the DOM-free restructure |
| 3 -> 5 | `is-audience-hidden` as the lens axis; `apply()` ordering | **P3 — see rulings.** No task taught `apply()` about the second class, so the result count would include lens-hidden cards (violating spec D-4) and rows whose only survivor is lens-hidden would render as empty labelled bands. |
| 4 -> 4 | `normalise` folding shared with the main search | Fixed pre-scan: `lens.ts` imports `normalise` from `schedule-filter.ts` rather than a third private copy |
| 5 -> 2 | `ScheduleToolbar.astro` touched by both | OK — T2 adds the control, T5 filters `listTracks`; no overlap in the same expression |
| 6 -> 3 | `schedule-ui.ts` lens state | OK once P3's ruling fixes where the lens is held |
| all -> Global Constraints | lens must not touch `activeFilterCount`, `Clear filters`, break bands | OK by construction once the lens lives outside `FilterState` (P3 ruling) |

### Per-task self-consistency rows

| Task | Its tests vs its code, its files vs its steps | Found |
|---|---|---|
| 1 | `audience.test.ts` asserts exactly what `audience.ts` exports; `ROOM_ORDER` edit is one line | Clean |
| 2 | Step 3 edits `SessionCard.astro`; Step 1's test asserts on it | **P1** — `SessionCard.astro` absent from the Files block |
| 3 | Tests built `document.body.innerHTML` | **P0** — no DOM test environment exists (both vitest projects `environment: "node"`; jsdom/happy-dom not installed; no existing test touches `document`). Same for tasks 4 and 5. |
| 4 | `countMatchesOutsideLens` signature vs its test | Was DOM-based; also invented a `fold` helper that does not exist |
| 5 | `findClashes` pure already; Step 5 counts "cards not hidden by the lens" | Depends on P3's plumbing; clean once ruled |
| 6 | `activeFilterCount` guard slices `schedule-ui.ts` | **P5** — that function is defined in `schedule-filter.ts` and only imported. `indexOf` returns -1, `slice(-1)` yields one character, assertion passes vacuously. |
| 6 | `Clear filters` guard slices for `schedule-filter-clear` | Clean — the id is present in `schedule-ui.ts:202` |
| 7 | verification only, no code | Clean |

### Rulings

- Ruling (P0): the lens policy moves to `src/lib/lens.ts` as pure functions over plain data — `resolveLens`, `countMatchesOutsideLens`, `findClashes` — with a thin DOM wrapper in `schedule-ui-audience.ts`. Rather than install jsdom to test a class toggle. Matches this repo's own `resolveEditionLoadable`/`isEditionLoadable` split. Cost if wrong: the wrapper's attribute plumbing is guarded only by source shape, so a renamed selector would pass the suite and fail in the browser — Task 7's real-build check is the net. Commit fabf759.
- Ruling (P1): `SessionCard.astro` added to Task 2's Files block. Cost if wrong: none, it is bookkeeping.
- Ruling (P2): `resolveLens` also returns `columnOf: Map<room, 1-based visible position>`; `.grid-view-cell` gains `data-room` in Task 2; the wrapper hides out-of-lens cells and rewrites `style.gridColumn` on the survivors. Rejected the alternatives — server-rendering both lenses duplicates keynote cards (spec D-7 forbids it), and converting the body to auto-placement would break the row spanning that makes card height equal duration. Cost if wrong: the leadership lens renders in a broken column, visible immediately in Task 7's build check.
- Ruling (P3): the lens is held in a module-level `let audience`, never in `FilterState`; `apply()` adds cards to `visible` only when in-lens, and its emptiness selector excludes `.is-audience-hidden`. Cost if wrong: an over-scoped count, or empty labelled rows — both visible on screen.
- Ruling (P5): the guard asserts on `src/lib/schedule-filter.ts` (which defines `activeFilterCount`) plus a negative on `schedule-ui.ts` for `state.audience`. Cost if wrong: a weaker guard than intended; the property itself is enforced by the lens living outside `FilterState`.

Commits: fabf759 (P0), bb54a6a (P1/P2/P3/P5), 81b39ca (P6/P7).

## Progress

### Post-scan rulings (found while Task 1 was running)

- Ruling (P6): Task 2's control-presence guard becomes a **container test** in
  `src/components/schedule/__tests__/ScheduleToolbar.test.ts`, not a regex for
  `hasBothAudiences` in the source. Spec D-9 says *absent, not disabled* — a property
  of the rendered output, which a source grep cannot distinguish from the call being
  present but not gating anything. This repo already has an `astro-components` vitest
  project that renders `.astro` through Astro's container API. Cost if wrong: none —
  strictly stronger coverage; the build-time file stays for Task 6's `dist/` assertions.
- Ruling (P7): `src/components/schedule/__tests__/ScheduleGridView.test.ts` parses cells
  with a regex requiring `class="grid-view-cell"` and `style=` to be ADJACENT. Adding
  `data-room` between them makes it match nothing and `cellsByColumn` returns an empty
  map. Relax the regex to tolerate attribute order rather than depend on emitting
  `data-room` last. Declared in Task 2's Files block, fixed in the same commit.
  Cost if wrong: a red suite in Task 2, caught immediately.

Commit: 81b39ca.

- Ruling (P8): Task 5's clash marker goes in `refreshAgenda()` in `schedule-ui.ts`, not
  in `AgendaDrawer.astro` — that component renders only the drawer shell; entries are
  built in JS with `innerHTML` from the bookmarked cards. Plan step rewritten to name
  the real function, reuse its `picked` array, and escape with the existing `escHtml`.
  Cost if wrong: none — this is a correction of a factual error in the plan.

- Ruling (P9): Task 3's one-room list fallback sets a `lensForcesList` flag read by
  `renderView()`, alongside the existing `narrow.matches`. It must NOT call `setView()`,
  which persists the visitor's view choice to `localStorage` and the URL — opening the
  leadership lens once would have permanently overwritten a grid preference, and
  `setView(v, false)` still mutates `preferredView`. Uses the file's own
  preferredView/renderedView distinction (`schedule-ui.ts:110-121`).
  Cost if wrong: the lens renders a one-column grid instead of a list — ugly, not broken.

### Task 1

Task 1: implemented, commit e4539a4 (src/lib/audience.ts, its test, ROOM_ORDER += Eiffel). 702 tests green, astro check clean.
Task 1: review (bb54a6a..e4539a4) — spec COMPLIANT, quality APPROVED.
Task 1: minor (deferred): JSDoc on `Audience` carries the track-vs-room and why-a-set rationale, which belongs on `audienceOf`/`LEADERSHIP_TRACKS` and partly duplicates the comment already there. Organisational only.
Task 1: reviewer's named-risk check — ROOM_ORDER/listRooms/grid-column: existing container tests use only Monet/Piaf/Debussy, whose indices are unchanged by appending Eiffel. No regression.
Task 1: fix round 1/5 dispatched (resumed original implementer) — (a) Important: accent-insensitivity documented but untested; assertions written against LEADERSHIP_TRACKS[0] pass for any value of the constant; `tech` helper builds leadership sessions. (b) Important, controller-raised: `fold()` in audience.ts duplicates `normalise()` in schedule-filter.ts:34, and lens.ts is already committed to importing `normalise` — two folders in one feature will drift.
- Ruling (P10): Task 5's steps 5 and 6 were prose with no code and no test — a placeholder
  defect. Rewritten as a pure `facetValuesInLens(cards, audience)` in `lens.ts` with tests,
  plus the DOM wiring and an ordering guard. Two decisions the prose left unstated are now
  explicit: a keynote contributes its format/track/level to both lenses but never its room
  (mirroring `matchesSession`'s keynote exemption), and pruning runs BEFORE `apply()`.
  Cost if wrong: the leadership lens offers a room option that changes nothing, or the
  result count flickers on switch. Commit ff82df4.

- Ruling (P11): Task 4's "render it as a button" is now concrete. `#schedule-result-count`
  is written with `textContent`, which wipes children, so the control is appended after the
  count on every `apply()` and built with `createElement` rather than an HTML string. Labels
  arrive as `data-` attributes on `[data-schedule-root]` like every other client-side string
  in the island — importing `useTranslations` would ship the whole i18n table to the browser.
  Cost if wrong: a remainder that renders as dead text or disappears on the next filter
  keystroke. Commit f5aa3f6.

Task 1: fix round 1/5 (2 addressed, 0 open; commits e4539a4..2d1087f)
Task 1: complete (commits e4539a4..2d1087f, review clean). Controller re-ran the suite independently at HEAD: 57 files passed / 1 skipped, 698 passed / 5 skipped, output pristine.

### Task 2
- Ruling (P12): Tasks 4 and 5 called `searchCards()`, `facetCards()`, `setAudience()`,
  `otherAudience()` and `lensLabel()` — none defined in any task. Since each implementer
  sees only its own task, three of them would have invented incompatible versions.
  Defined in Task 3's new Step 5c as one `lensCards()` returning a superset of the three
  shapes the pure functions need, plus `setAudience` as the single switch entry point that
  Tasks 5 and 6 extend at marked points. Cost if wrong: a needless second DOM traversal
  per switch on a page with ~50 cards — negligible.

- Ruling (P13): Task 6's URL handling given real code, following the `?view=` resolution
  shape already in `schedule-ui.ts:232-244`. Two things the prose hid: `setAudience` calls
  `apply()` itself, so the boot call must precede the existing `apply()` or the page renders
  twice, the first time against the wrong lens; and the technical lens deletes the parameter
  rather than writing `?audience=tech`, keeping the canonical bare path spec D-8 requires.
  Cost if wrong: a double render on load, or a canonical URL carrying a redundant parameter.
  Commit 8b30193.

Task 2: implemented, commit c78205d (SessionCard/ScheduleGrid/ScheduleGridView/ScheduleToolbar/i18n + 3 test files). Reported 59 files / 709 tests, astro check clean, build 374 pages.
Task 2: review dispatched (f5aa3f6..c78205d, diff scoped to c78205d only — intervening commits are controller plan edits).
Task 2: review (c78205d) — spec COMPLIANT, quality APPROVED.
Task 2: reviewer's named-risk checks both cleared — the relaxed cell regex still anchors on `class="grid-view-cell"` and cannot match `.grid-view-span` or `.grid-view-break`, capture groups unchanged; `grid-column:${i+2}` and `--room-count` byte-identical to base.
Task 2: minor (deferred): two guards in tests/build/audience-lens.test.ts are bare source-text regexes (`/data-audience=/`, `/data-room=/`) that would pass against a hardcoded or empty attribute value. Plan-mandated. Real behaviour is covered by the container tests in the same diff, so these are redundant rather than sole coverage. Ruling: keep — they are cheap and they fail loudly if the attribute is removed entirely, which is the regression they exist for.
Task 2: Ruling — reviewer's Important finding (report did not reconcile 698 passed/5 skipped -> 709 passed/0 skipped) resolved by the controller, NOT sent to the implementer. Verified directly: with dist/ moved aside the suite skips 76 and fails 24; with dist/ present it is exactly 59 files / 709 tests / 0 skipped. The five baseline skips were gated on dist/ content that Task 2's `pnpm build` regenerated. The report's numbers were accurate; no code defect. Cost if wrong: none — the finding was about report hygiene, and the numbers are now independently confirmed.
Task 2: fix round 1/5 dispatched (resumed original implementer) — Important, controller-raised and missed by the review: the new "labels each room cell" test asserts `html.toContain('data-room="Monet"')`, but the same commit put `data-room` on the HEADER cells too, so it passes with the body-cell attribute deleted. That attribute is the only mechanism Task 3's column renumbering can use. Fix asserts through `cellsByColumn`.
Task 2: fix round 1/5 (1 addressed, 0 open; commits c78205d..bc2d803)
Task 2: complete (commits c78205d..bc2d803, review clean, 1 minor deferred)

### Task 3
Task 3: dispatched (BASE bc2d803). Creates src/lib/lens.ts (pure) + schedule-ui-audience.ts (wrapper), modifies schedule-ui.ts (lens helpers, apply() scoping, renderView fallback) and ScheduleGridView.astro (the .is-audience-hidden rule).
### Pretalx prerequisites, checked against the live 2027 event (read-only API)

- Room **Eiffel already exists** in the 2027 event (rooms: Monet, Piaf, Dumas, Debussy, Eiffel). No action needed; `ROOM_ORDER` now matches.
- The leadership **track does NOT exist yet**. 2027 has five tracks: Infrastructure et opérations,
  Developer Experience, IA et Data, Réseau et sécurité, Autres sujets et crazy stuff.
- **The name must match in FRENCH.** 2027 is an `access: "preview"` edition, so its sessions come
  through `pretalx-preview.ts`, which resolves `track: localised(submission.track?.name)`, and
  `localised` (`pretalx-preview-api.ts:118`) picks `v.fr` first. So `SessionRow.track` carries the
  track's French name. `LEADERSHIP_TRACKS = ["Strategy & Leadership"]` therefore requires the
  track's **French** name to be exactly `Strategy & Leadership`. `audienceOf` folds case and
  accents, so capitalisation is forgiving; the wording and the `&` are not.
- Until that track exists and has sessions, `hasBothAudiences` is false everywhere and no control
  renders anywhere — which is what Task 7 Step 1 asserts and why the code can ship before the
  content does.

Task 3: implemented, commit 16aeb1c (lens.ts + lens.test.ts + schedule-ui-audience.ts + schedule-ui.ts + ScheduleGridView.astro + build guard). Reported DONE_WITH_CONCERNS: 60 files / 717 tests, 0 skipped; astro check clean; build 374 pages. Took ~80 minutes.
Task 3: Ruling — both reported divergences from the brief are CORRECT and are defects in my plan, not in the implementation.
  (a) `LensResult` needs `columnOf`, but the brief's last test asserted a stale `Object.keys` literal omitting it. I introduced that staleness in the P2 ruling when I added the field and did not update the earlier test literal. The implementer updated the literal and said why in a comment. Cost of my error if it had gone unnoticed: a test that fails against every implementation the DOM wrapper can actually consume.
  (b) `setAudience` must be a `const` arrow, not a `function` declaration: TypeScript does not carry the enclosing `if (root)` null-narrowing into a hoisted declaration, so the brief's shape produces a real "root is possibly null" error. The file already had this exact problem and solved it once (`rootStyle` captured out of `root.style` for `syncStickyOffsets`). Cost if wrong: none, it type-checks.
Task 3: concern accepted (no fix) — no real-browser click-through is possible here (no Playwright Chrome channel in the sandbox, and no edition currently has both audiences). Task 7's real-build check against a throwaway LEADERSHIP_TRACKS entry is the designed net for exactly this.
Task 3: review dispatched (bc2d803..16aeb1c).
Task 3: review (bc2d803..16aeb1c) — spec COMPLIANT, quality APPROVED. Both reported divergences independently verified correct by the reviewer, including an isolated `tsc --strict` repro of the null-narrowing claim. All three named risks cleared: grid-row survives the column rewrite, switch-back does not drift, the two hidden-classes never clobber each other, and the list fallback never touches setView.
Task 3: minor (deferred): if a card's `data-room` ever failed to match any header room, the card would be hidden via its containing cell while still counting into the result total — not reachable today (both come from the same `rooms` variable in one render), worth a comment.
Task 3: minor (deferred): the report attributed unused-local diagnostics to noUnusedLocals, which this repo does not enable (extends astro/tsconfigs/strict, not strictest). Conclusion unaffected; the stated mechanism was wrong.
Task 3: complete (commits bc2d803..16aeb1c, review clean, 2 minors deferred)
- Ruling (P14): the result-count DENOMINATOR was not lens-scoped — `{total}` is the server's whole-edition `data-total`. In the leadership lens with no filter active the line would read "6 of 51 sessions", asserting that 45 sessions are filtered out when none are; spec D-4 requires the count to match what is on screen. Assigned to Task 4 as a pure `lensTotal`, counting session IDS into a Set because every session renders twice (grid + list). Cost if wrong: a visibly misleading count on the lens the feature exists for. Commit dc642c3.
- Ruling (P15): Task 6's boot call was `setAudience(hasLens ? … : "tech")`. A ternary still calls `setAudience`, which still hides every card of the other audience — so an all-leadership edition (no control, since `hasBothAudiences` is false) would boot into "tech", blank the entire programme, and offer no way out. Now gated: `if (hasLens) setAudience(...)`. Not reachable from today's data; reachable the year someone runs a leadership-only track day. Cost if wrong: none — an edition with one audience has no lens to apply. Commit dc642c3.

### Task 4
- Ruling (P16): Task 5's track-filter guard was a source regex looking for LEADERSHIP_TRACKS
  near listTracks — it passes whether or not the value is actually removed from the rendered
  list. Replaced with two container tests: the leadership chip is absent while a technical one
  is present, and an edition with no leadership track keeps its track facet (the server drops
  facets whose value list is empty, so the removal must not take the whole facet with it on
  2023/2026). Cost if wrong: none — strictly stronger coverage. Commit bd85d29.

- Ruling (P17): Task 7's throwaway track is now a verified choice, not a suggestion.
  Checked live: the three confirmed 2027 demo talks are 3ZAQS9 (Réseau et sécurité),
  7XVPFE (Infrastructure et opérations), BUD7GH (IA et Data). Only "Réseau et sécurité"
  splits the edition 1/2 and makes `hasBothAudiences` true; the other four track names
  leave it false and the verification would prove nothing while appearing to pass. It also
  reduces the leadership lens to one room, exercising the `lensForcesList` fallback for
  free. Checklist extended to assert the two properties P9 and P14 exist to protect.
  Cost if wrong: a Task 7 run that reports success having rendered no control. Commit ff1a024.

### Spec coverage check (controller, mid-run)

Every decision in `docs/superpowers/specs/2026-09-04-programme-audience-lens-design.md`
mapped to the task that implements it:

| Spec | Where | State |
|---|---|---|
| D-1 lens derived from track, never room; a SET of names | Task 1 `audience.ts` | done |
| D-2 lens is a view, not a filter (no filter count, no Clear-filters reset, no break-band hiding) | Task 3 `schedule-ui.ts`; guards in Task 6 | done / guarded |
| D-3 search must not lie — cross-lens remainder as a control | Task 4 | in flight |
| D-4 filters adapt; count is lens-scoped | Task 5 + ruling P14 (denominator) | planned |
| D-5 agenda reunites the lenses; clash detection lives there only | Task 5 + ruling P8 (it lives in refreshAgenda, not the component) | planned |
| **D-6 the calendar is the programme, not the view** | **verified, no code needed** | see below |
| D-7 one grid, filtered; leadership lens opens in list | Task 3 + ruling P9 | done |
| D-8 entry and URL, canonical stays bare | Task 6 + ruling P13 | planned |
| D-9 control absent (not disabled) for one-audience editions; no feature flag | Task 2 + Task 6 + ruling P15 | done / planned |
| D-10 Eiffel in ROOM_ORDER | Task 1 | done |

**D-6 verified rather than implemented.** The toolbar's export-all handler is
`window.location.href = "/programme.ics"` — a link to a statically built endpoint
that never reads the DOM, so no lens can scope it. The agenda export works from the
bookmark id set, which is lens-agnostic by construction (one id per session, even
though each session renders two cards). Nothing to build, and no way for the lens to
violate it. Recorded so the final review does not read the absence of a task as a gap.

Task 4: implemented, commit a8406d7 (lens.ts +countMatchesOutsideLens/+lensTotal, lens.test.ts, schedule-ui.ts result line, ScheduleGrid.astro labels). DONE_WITH_CONCERNS: no CSS for the new button; no live Pretalx token in that sandbox so 2027 built as placeholder.
Task 4: review dispatched (ff1a024..a8406d7) with four named risks, two of which are bugs the controller found first.
- Ruling (P18): `countMatchesOutsideLens` as I specified it was WRONG in two ways, and Task 4
  implemented my spec faithfully. (a) It counts cards, but every session renders twice (grid +
  list), so a query matching one session in the other lens advertises "2 more" and delivers one.
  `apply()` and `lensTotal` both count ids into a Set for exactly this reason; I gave this
  function a card shape with no `id`. (b) It counts keynotes, which `resolveLens` deliberately
  shows in BOTH lenses — so a matching keynote is on screen AND advertised as elsewhere, and the
  control sends the visitor away from what they are looking at. My fixture (three rows, no
  duplicates, no keynote) is why neither surfaced. Plan corrected with both cases pinned.
  Cost if it had shipped: the one affordance that justifies the lens promises results that do
  not exist. Commit ac5e1a6.
- Ruling (P19): Task 4's file list named no stylesheet, so the remainder control shipped unstyled
  — a bare word mid-sentence in the count line, neither clearly clickable nor clearly part of the
  text. Added a `.toolbar-cross-lens` rule to Task 4's steps (underlined link-style, focus ring),
  since it reads as a continuation of "12 of 40 sessions · 3 more in …" rather than a separate
  widget. Cost if wrong: cosmetic only. Commit ac5e1a6.

Task 4: P18 CONFIRMED EMPIRICALLY against the shipped `src/lib/lens.ts` (tsx probe, not reasoning):
  - one session in the other lens matching "gouvernance" -> countMatchesOutsideLens returns **2**, not 1
  - a keynote-only match viewed from the leadership lens -> returns **2**, not 0 (the keynote is on screen in that lens)
  - lensTotal on the same fixture returns 1, correctly — the sibling function in the same file gets it right
  So the control would read "2 more in Strategy & Leadership", and clicking it would show one session, or none.

Task 4: review (ff1a024..a8406d7) — spec COMPLIANT, quality NOT APPROVED. Two Critical bugs, both confirming the controller's own findings independently and quantifying them. Risks 3 (denominator fallback for single-audience editions) and 4 (button cannot accumulate, no listener leak) both cleared.
Task 4: minor (deferred): none outstanding — the fixture weakness and the unstyled button are both being fixed in round 1 rather than deferred, the first because it is the reason the Criticals shipped and the second because the omission was the plan's.
Task 4: fix round 1/5 dispatched (resumed original implementer) — (a) Critical: countMatchesOutsideLens counts cards not session ids, inflating every non-zero remainder ~2x; (b) Critical: no keynote exclusion, so a keynote on screen in this lens is advertised as being in the other one; (c) the fixture cannot express either bug (no ids, no duplicates, no keynote) and is rebuilt to carry both; (d) Minor: .toolbar-cross-lens CSS. Signature changed to {id, audience, format, search} — lensCards() already supplies all four, so no call site changes.
- Ruling (P20): the `.toolbar-cross-lens` CSS I supplied in P19 was scoped and would have
  matched nothing. Astro stamps a `data-astro-cid-*` attribute on elements IT renders; this
  button is created at runtime by `document.createElement` and never receives one, so the
  compiled selector `.toolbar-cross-lens[data-astro-cid-…]` matches no element — silently.
  The Task 4 implementer caught this and verified it against the compiled `dist/_astro` CSS
  rather than by reasoning; `ScheduleGridView.astro` globals `.is-audience-hidden` for the
  same reason. Divergence ACCEPTED and the plan corrected. Cost if wrong: none — the
  alternative was a stylesheet rule that does nothing. Commit follows.
Task 4: fix round 1/5 (4 addressed, 0 open; commits a8406d7..4a971fb). Re-review traced both Criticals to the controller's measured numbers (4-vs-2, 1-vs-0) and confirmed the new cases fail against the old implementation. The `:global` divergence judged the correct call.
Task 4: complete (commits a8406d7..4a971fb, review clean)

### Task 5
Task 5: implemented, commit 5deecbf (lens.ts +facetValuesInLens/+findClashes, lens.test.ts, ScheduleToolbar.astro + its container tests, schedule-ui.ts prune + clash markers, ScheduleGrid.astro label, i18n). 736 passed; astro check clean; build 374 pages.
- Ruling (P21): my P16 "stronger" guard could not fail either. Astro HTML-escapes attribute
  values, so `LEADERSHIP_TRACKS[0]` ("Strategy & Leadership") never appears literally in a
  rendered `data-value` — the `&` returns as `&#38;` — and `.not.toContain(raw)` therefore
  passed whether or not the track was filtered out. This is the SECOND unfalsifiable guard I
  wrote, in the ruling made to replace the first. Caught by the Task 5 implementer, who
  rewrote it to extract attribute values and decode entities. Divergence ACCEPTED, plan
  corrected. Cost if it had shipped: no coverage at all on spec D-4's track removal, while
  appearing to have some. Commit c7a149f.
- Ruling (P22): Task 5 wired the facet prune into `setAudience` per the brief, but at this
  point in the run nothing resolves a lens at boot, so a first-time visitor saw un-pruned
  filters until their first manual switch. The implementer extracted `pruneFacetsForLens()`
  and called it at load, guarded by `hasAudiences`. ACCEPTED. Consequence carried into Task 6:
  once Task 6 adds `if (hasLens) setAudience(...)` at boot, `setAudience` prunes and the
  standalone call becomes a second run of the same work — Task 6 must delete it. Recorded in
  the plan so the Task 6 implementer sees it. Cost if missed: harmless duplicate work plus a
  reader unsure which call is authoritative.
Task 5: review dispatched (8ce02a7..5deecbf) with five named risks.
Task 5: review (8ce02a7..5deecbf) — spec COMPLIANT, quality NOT APPROVED. Both divergences confirmed correct and independently verified. All five named risks cleared: findClashes is fed one entry per session (bookmarks is a Set, findCard is a singular querySelector), facetValuesInLens matches resolveLens and matchesSession exactly on keynotes, escHtml wraps the whole substituted label, pruning only deletes from state and Clear filters is untouched, and both call sites order prune-before-apply correctly.
- Ruling (P23): the ordering guard I wrote in P10 CANNOT FAIL. `src.indexOf("facetValuesInLens")`
  lands on the import statement and `src.indexOf("apply()", prune)` lands on the `function
  apply() {` declaration — both unconditional, neither related to call order. Swapping the two
  calls inside `setAudience` reproduces exactly the silent bug the brief warns about and the
  test still passes. This is the THIRD unfalsifiable guard I have written in this run (P16's
  track filter was the second, the first was Task 2's body-cell attribute). Fix round requires
  a guard scoped to each call site's own body AND a demonstrated red. Cost if it had shipped:
  no protection at all on an ordering the plan itself calls silent when wrong.
Task 5: fix round 1/5 dispatched (resumed original implementer) — (a) Important: make the
  ordering guard real and prove it fails; (b) harden findClashes to dedupe by id like its
  siblings, document the double-render hazard, and pin the unparseable-date degrade;
  (c) Minor: clashLabel.replace treats `$&` etc. as special patterns in the REPLACEMENT
  argument, so a Pretalx title containing `$&` renders as the `{title}` token — use a function
  replacement. (b) and (c) ruled into the round rather than deferred: both are in the lines
  being edited anyway, and (b) is consistency with lensTotal/countMatchesOutsideLens, which
  both dedupe internally rather than trusting a caller two layers away.
Task 5: minor (deferred): none — all three above folded into round 1.
Task 5: fix round 1/5 (3 addressed, 0 open; commits 5deecbf..4793bce). Re-reviewer independently traced BOTH ordering call sites and confirmed each would go red for the right reason; verified the dedup runs before the pairwise loop and cannot collide two distinct sessions.
Task 5: minor (deferred): the `$&`-substitution fix ships untested. The implementer declined to fabricate a DOM test (correct — no DOM environment), but the re-reviewer notes a small pure `substituteClashLabel(template, title, room)` extraction would have made it testable without touching the DOM. Not required by the finding, which asked only for the function-replacement form. FOR THE FINAL REVIEW TO TRIAGE.
Task 5: minor (deferred): the ordering guard's demonstrated red covers only the `setAudience` call site. The boot site's protection rests on the re-reviewer's independent trace, not on an observed failure. FOR THE FINAL REVIEW TO TRIAGE.
Task 5: complete (commits 5deecbf..4793bce, review clean, 2 minors deferred)

### Task 6
Task 6: implemented, commit 7d8e25e (schedule-ui.ts URL handling + boot gate + standalone prune removed; audience-lens.test.ts). 743/743 passed; astro check clean; build 374 pages.
- Ruling (P24): the "prove the guard fails" requirement added in P23 immediately paid for itself —
  Task 6's implementer found TWO MORE guards of mine that could not fail: the "lens is read from
  the URL" assertion was already satisfied by unrelated code, and the "NOT counted as an active
  filter" assertion false-positived on unrelated prose in `schedule-filter.ts`. They narrowed the
  second and added a precise third assertion to the first. That brings the total of unfalsifiable
  guards I wrote in this plan to FIVE. The requirement stays in the plan permanently.
  Cost if wrong: the narrowed guards could still be weak — flagged to the reviewer to verify
  independently rather than accept.
- Note: Task 6's sandbox could not build a dual-audience 2027 page (no Pretalx token there, so
  2027 degrades to the placeholder). Task 7 MUST run in an environment with PRETALX_API_TOKEN.
  The controller's own environment has it (.env.local) and has already queried the live event.
Task 6: review (479845a..7d8e25e) — spec COMPLIANT, quality NOT APPROVED. All four implementer deviations independently verified correct. Risks 1-4 all pass: real `if` gate (three setAudience call sites, no unconditional boot caller), standalone prune and applyAudience each down to one call site inside setAudience, no render against the wrong lens, and the full URL contract holds (replaceState, ?audience=tech never written, unknown value falls to tech, parameter ignored for single-audience editions).
- Ruling (P25): a SIXTH decorative guard, and the first one whose red/green evidence was
  demonstrably false. `Clear filters does not reset the lens` asserts `.not.toContain("audience")`
  — lowercase — over a 400-char window. The reviewer reproduced the implementer's own claimed
  break (`setAudience("tech");` in the clear handler) and showed `"setAudience(\"tech\");"
  .includes("audience")` is FALSE: `toContain` is case-sensitive and `setAudience` carries a
  capital A. So the guard catches only a raw `audience = "tech"` assignment that bypasses the
  file's documented single entry point — the one route a careful maintainer would not take.
  Fix round requires the case-insensitive form AND two demonstrated reds, one per route.
  Cost if it had shipped: no protection on the spec's headline claim that the lens is a view,
  while the report asserted it was tested.
Task 6: minor (deferred, folded into round 1 as a comment only): when `hasLens` is true, `apply()`
  and `renderView()` each run twice at boot — inherited from my brief's own instruction, harmless
  and idempotent, but the trailing `apply()` is now required ONLY for the `!hasLens` path and
  nothing says so. A future editor removing the apparent duplication would silently break
  single-audience editions. Comment requested; no code change.
Task 6: fix round 1/5 dispatched (resumed original implementer).
Task 6: fix round 1/5 (1 addressed + 2 sibling guards hardened; commits 7d8e25e..afa7059). Both break routes demonstrated red.
- Ruling (P26): **Task 7 will be executed by the controller, not a subagent.** Task 7 is
  verification only — no code, no commits to review — and it requires a live Pretalx fetch to
  build a dual-audience 2027 page. Every implementer subagent in this run has reported the same
  blocker ("no Pretalx token / no live access in this sandbox", tasks 4, 5 and 6), so 2027
  degrades to the placeholder there and the one thing Task 7 exists to prove cannot be proven.
  The controller's environment HAS the token (`.env.local`) and has already queried the live
  event successfully. Dispatching Task 7 to a subagent would produce a report saying "could not
  verify", which is the exact gap Task 7 was written to close.
  This is not the controller doing implementation work: no file is changed, the throwaway
  LEADERSHIP_TRACKS edit is reverted, and the output is a recorded observation. Cost if wrong:
  none — the alternative is no verification at all.
Task 6: fix round 1 re-review — finding ADDRESSED, both break routes independently reproduced. Other two windowed guards judged sound (structural bounds, no false positive on schedule-filter.ts's unrelated "entire audience" prose). Comment verified accurate and comment-only.
- Ruling (P27): the re-review surfaced a NEW demonstrated hole in the same guard, so it goes to
  round 2 rather than the deferred pile. `clear.slice(0, 400)` covers 400 characters of a 457-
  character handler; the uncovered tail is `if (searchEl) searchEl.value = ""; apply(); });`, and
  the re-reviewer confirmed `setAudience("tech");` placed immediately before that trailing
  `apply()` — arguably the most natural spot for the regression — escapes the window entirely.
  Fixing case-sensitivity while leaving the same class of hole a few characters further down is
  not a fix. Round 2 replaces the magic number with a structural bound and requires THREE reds,
  including one at the previously-uncovered position. Deferring a demonstrated hole in the guard
  for the spec's headline claim would be inconsistent with everything else this run has ruled.
  Cost if wrong: one extra small round on a test-only change.
Task 6: fix round 2/5 (1 addressed, 0 open; commits afa7059..88f3927). `sliceBalancedBlock` replaces the magic count AND both siblings' naive `indexOf("}")`. Re-reviewer independently reproduced the previously-escaping case against a copy of the real file and confirmed it is now covered; verified all three anchors are unique, none of the three bodies contains a brace inside a string/comment/regex today, and the unrelated "entire audience" prose stays outside both windows. Scanner throws on a missing anchor — so a rename fails loudly instead of silently ceasing to guard, which is the property this whole run kept missing.
Task 6: minor (deferred): the untouched prune-ordering test still bounds the `setAudience` body with `indexOf("};", ...)` — same class of fragility the round-2 helper was built to remove, and `sliceBalancedBlock` now sits in the same file ready to use. Parked rather than taken to round 3: the guard works today, both its call sites are covered, and the fix is a one-line swap a future editor can make. FOR THE FINAL REVIEW TO TRIAGE.
Task 6: minor (deferred): `sliceBalancedBlock` does not tokenize, so a brace inside a string, template literal, regex or comment in any anchored body would mis-slice. None exists today; the implementer's own comment records the assumption. FOR THE FINAL REVIEW TO TRIAGE.
Task 6: complete (commits 7d8e25e..88f3927, review clean, 2 minors deferred)

### Task 7 — controller-executed (see ruling P26)
Task 7: EXECUTED BY THE CONTROLLER. Live Pretalx build (PUBLIC_SITE_URL=staging, FLAG_OVERRIDES=programme=on), 390 pages.

**Step 1 — inert against real data, as designed.** 2027 built from the live event with its 3 real
demo sessions (3ZAQS9, 7XVPFE, BUD7GH; rooms Monet/Piaf/Dumas). `data-has-audiences="false"`, no
control, on 2023, 2026 and 2027 alike. The code shipped before the content, exactly as spec'd.

**Step 2 — proven with the throwaway** ("Réseau et sécurité" added to LEADERSHIP_TRACKS, which
verification P17 established is the only track that splits 2027 1-vs-2). Rebuilt, then driven in a
REAL BROWSER. No Playwright is installed and the MCP server wants a Chrome channel that does not
exist here, so this was done over the Chrome DevTools Protocol against /usr/bin/chromium using
Node 22's native WebSocket — no dependency added to the repo. Every earlier task reported this
verification as impossible in its sandbox; it is the gap Task 7 existed to close.

| Property | Technical lens | Leadership lens | Back to technical |
|---|---|---|---|
| visible sessions | 7XVPFE, BUD7GH | 3ZAQS9 | 7XVPFE, BUD7GH |
| `--room-count` | 2 | 1 | 2 |
| visible room headers | Piaf, Dumas | — (grid hidden) | Piaf, Dumas |
| body cell columns | Piaf:2, Dumas:3 | — | Piaf:2, Dumas:3 |
| break bands visible | 2 | — (list view) | 2 |
| grid / list | grid | **list** | grid |
| result count | "2 sessions sur 2" | "1 sessions sur 1" | "2 sessions sur 2" |
| active-filter badge | empty | empty | empty |
| URL | (none) | `?audience=leadership` | (none) |
| aria-pressed | tech=true | leadership=true | tech=true |

Every ruling this run made is visible in that table:
- **P2 renumbering works.** listRooms gives [Monet, Piaf, Dumas] = columns 2,3,4. The leadership
  talk is in Monet; with Monet gone the survivors MOVED LEFT to 2 and 3 rather than being stranded
  on 3 and 4. This is the defect that would have shipped had the plan's original
  "hide cards, shrink --room-count" approach gone in.
- **P9 list fallback works** and does not touch the view preference: grid hidden, list shown at
  roomCount 1, and switching back restores the grid.
- **P14 lens-scoped denominator works**: "sur 2" and "sur 1", never "sur 3".
- **D-2 holds**: the active-filter badge stays empty in both lenses, and the break bands are intact
  in the technical lens.
- **P13/D-8 URL contract holds**: `?audience=leadership` written on switch, parameter DELETED on
  return to technical, `?audience=leadership` deep-links correctly on load, and `?audience=banana`
  falls back to technical AND strips the bogus parameter.

**Step 3 — reverted.** `git diff` clean, LEADERSHIP_TRACKS back to the single entry, rebuilt: all
three editions `data-has-audiences="false"`, no control anywhere.

Task 7: complete (no commits — verification only)

### Observation for the user, pre-existing and out of scope
The result line reads "1 sessions sur 1" — French pluralisation. `schedule.results.count` is
"{n} sessions sur {total}" with no plural handling, so this predates the lens (2026 with one match
already says "1 sessions sur 51"). Not introduced here, not fixed here.
### Final whole-branch review (opus, range 7ad69cb..88f3927 scoped to src/ and tests/)

Verdict: **needs work before merge** — two Important UI defects in new code, ~5 lines between them.
Everything else sound. All ten spec decisions traced and holding; escaping intact everywhere the
lens touches; 2023/2026 risk assessed as genuinely nil (four touchpoints, all inert without a
leadership track); no dead ends; no comment describing a superseded design.

All six deferred minors triaged **fine to leave**. Notably it checked the FAILURE DIRECTION of the
`indexOf("};")` guard I had worried about: if that slice truncates early the assertion goes red,
not falsely green — so it cannot produce a false pass for the property it asserts.

Important findings, both dispatched in one fix wave:
1. The grid/list toggle LIES in the leadership lens. `renderView()` forces list when
   `lensForcesList`, but computes `aria-pressed` from `preferredView`, and `.toolbar-views` is
   hidden only by the 767px media query. Desktop, 2027, leadership lens, click "Grille": the
   button turns primary, reports pressed, writes localStorage and the URL — and nothing moves.
   A visible control that reports success and does nothing, in this feature's NORMAL 2027 state.
2. Activating the cross-lens remainder by keyboard dumps focus to `<body>`: the button lives
   inside `#schedule-result-count`, and `apply()`'s first act is `textContent =`, destroying the
   node the user is standing on. This is spec D-3's headline affordance and the only control on
   the page that self-destructs on activation.
Plus minors folded into the same wave: the clash label's ordered double-replace can land the room
inside the title (extracted to a pure `substituteClashLabel` and tested), the remainder not gated
on `hasAudiences`, the `hasLens`/`hasAudiences` alias, and process "Task N" references leaking
into shipped source.

Deliberately NOT fixed, recorded so nobody reads them as oversights:
- D-4's parenthetical ("also quietly improves the 2023 archive") is not implemented —
  `pruneFacetsForLens` early-returns for single-lens editions. Correct: it contradicts the spec's
  own "Out of scope: any change to how 2026 or 2023 render", and the code comment says so.
- The remainder counts the query only, not the active facets. Spec D-3 does not require
  facet-awareness. Flagged as a promise the next screen may not keep.
- Two DOM→plain-object card readers (`lensCards()` and `applyAudience`'s own). A future editor
  adding a lens-relevant attribute must remember both files.
- `:global(.is-audience-hidden)` lives in ScheduleGridView.astro but governs list cards too —
  comment requested in the fix wave rather than a move.
- Ruling (P28): the spec's Data prerequisite now names the exact required literal and says it must
  be the FRENCH name, because 2027 resolves tracks through `localised()`, which prefers `fr`. The
  reviewer flagged this as the feature's most likely operational failure and it is entirely
  silent — a mismatched name renders no control, ignores the URL parameter, and reports nothing,
  looking exactly like a legitimate one-audience edition. Commit b248baf.
Final fix wave: 4 commits (8032186, 6d911d0, 40a0498, ac7a897) closing all six findings.
750 passed / 0 skipped; astro check 0/0; builds 390 (flag on) / 374 (flag off). Every new or
changed assertion proven red then green, with multiple deliberate breaks for the two source-shape
guards.
Implementer's standing concern: Importants 1 and 2 are DOM behaviour, guarded only by source shape
— no runtime proof, no browser available to them.
- Ruling (P29): the controller will close that gap with a second browser pass, reusing the CDP
  harness built for Task 7 (chromium over the DevTools Protocol, Node 22 native WebSocket, no
  repo dependency). Both Importants are precisely the class of defect a source-shape guard cannot
  confirm — one is "a control reports success and does nothing", the other is "focus lands on
  <body>". Shipping them on a regex alone would repeat this run's defining mistake in the last
  step. Cost if skipped: two user-visible defects verified only by the shape of the code that
  claims to fix them.
Final fix wave re-review: **READY TO MERGE.** All seven findings verified addressed with traced
reasoning, not report say-so. Both Important fixes checked against every path: single-audience
editions leave the toggle visible (`lensForcesList` stays at its `false` initializer and the
unconditional boot `setView` still runs `renderView`); narrow-viewport CSS and the JS `hidden`
attribute are orthogonal and idempotent; the focus target lives in a different DOM subtree from
the element `apply()` destroys, and its render condition is the same `hasBothAudiences` that gates
the button existing at all. No new breakage.

### Controller browser pass — the gap the re-review said only a browser could close

Rebuilt with the throwaway track, driven over CDP. Both Important fixes CONFIRMED at runtime:

**Important 1 — the dead toggle disappears and comes back**

| | technical | leadership | back to technical |
|---|---|---|---|
| `.toolbar-views` hidden | false | **true** | false |
| computed display | flex | **none** | flex |
| rendered view | grid | list | grid |

And the visitor's stored choice survives: after choosing **List** in the technical lens
(`localStorage` = "list", `?view=list`), a round trip through the leadership lens leaves it
still "list", still rendering the list, toggle still visible. The fallback constrains what is
rendered without touching what was chosen — P9's guarantee, holding through the new hiding logic.

**Important 2 — focus lands where a keyboard user should be**
Searching "ebpf" from the technical lens produces
`"Aucune session ne correspond à votre recherche. · 1 de plus dans Strategy & Leadership"` —
spec D-3's exact scenario, and the remainder reads **1**, not 2, so the dedup fix holds in the
real page. Focus before activating: `.toolbar-cross-lens`. After: `BUTTON`,
`data-audience="leadership"`, `aria-pressed="true"`, lens switched, `activeIsBody: false`.
Focus landed on the newly-pressed lens button.

Throwaway reverted, `git diff` clean, rebuilt: 2023/2026/2027 all `data-has-audiences="false"`,
no control anywhere.

### Pre-existing trap worth knowing about (NOT introduced by this work)
`pnpm test` is not independent of how `dist/` was last built. `tests/build/newsletter-callout.test.ts`
asserts `programme/2027/index.html` opts out of the newsletter band; with a
`FLAG_OVERRIDES=programme=on` build in place, 2027 is a real page and that assertion fails. Build
plainly (`pnpm build`, 374 pages) before `pnpm test` and it is 750/750. This comes from the earlier
2027 preview-gating work, not the lens.

FINAL: 750/750, astro check 0 errors / 0 warnings (16 pre-existing hints), tracked tree clean,
HEAD ac7a897.
