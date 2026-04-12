---
phase: 11-security-i18n-hardcode-fixes
plan: 03
subsystem: schedule
tags: [i18n, schedule, client-script, security-audit]
requirements: [IN-02, CR-01, WR-02]
dependency_graph:
  requires:
    - i18n-key::schedule.format.keynote (existing)
    - i18n-key::schedule.format.talk (existing)
    - i18n-key::schedule.format.lightning (existing)
    - i18n-key::schedule.format.workshop (existing)
    - i18n-key::schedule.agenda.empty (existing)
    - i18n-key::schedule.agenda.remove (Plan 11-01)
  provides:
    - "ScheduleGrid data-* bridge: locale-safe format chip labels, agenda empty label, agenda remove aria-label"
  affects:
    - src/pages/programme/index.astro (dead page-level data-schedule-empty setter removed)
    - src/pages/en/programme/index.astro (same)
tech_stack:
  added: []
  patterns:
    - data-*-bridge-for-client-script-i18n (extended to 6 attrs on .schedule-root)
key_files:
  created: []
  modified:
    - src/components/schedule/ScheduleGrid.astro
    - src/pages/programme/index.astro
    - src/pages/en/programme/index.astro
decisions:
  - Chose .schedule-root (component-local) over <html>/<main> (page-level) as the attribute host — keeps schedule-specific data cohesive with the component that consumes it, requires zero page-file edits per new key, and fixed a latent bug where the page-level data-schedule-empty was silently dropped because ScheduleGrid.astro destructures Astro.props explicitly and never forwarded the attribute onto its root div.
  - Preserved title-case fallbacks inside the script (Keynote/Talk/Lightning/Workshop) rather than uppercase — matches the i18n dictionary values on both locales; any uppercase styling can be a CSS concern if ever reintroduced.
metrics:
  duration: ~5min
  completed: 2026-04-12
  tasks_completed: 2
  files_touched: 3
  commits: 1
---

# Phase 11 Plan 03: Schedule i18n Hardcode Fixes & Phase Completion Audit — Summary

## One-liner

Replaced three hardcoded locale-dependent strings in ScheduleGrid.astro (formatPalette labels, French dead-code fallback, agenda remove aria-label) with a 6-attribute data-* bridge on .schedule-root, fixed the broken emptyLabel reader path, removed redundant page-level setters, and audited Phase 11 SC #1 (safeUrl) + SC #4 (twitter render) as still intact.

## Task 2 Audit — CR-01 (SC #1) and WR-02 (SC #4) Still Intact

Task 2 is a read-only grep audit of `src/components/speakers/SocialLinks.astro`. Ran after Task 1 committed. All evidence below captured at repo HEAD (worktree branch post-commit `4e6320d`):

### CR-01 / SC #1 — safeUrl URL validation

| Evidence | Location | Status |
|---|---|---|
| `function safeUrl(raw: string \| undefined): string \| null` helper declared | `src/components/speakers/SocialLinks.astro:20` | PASS |
| `new URL(trimmed)` parser used (native browser parser, no regex) | `src/components/speakers/SocialLinks.astro:25` | PASS |
| Scheme allowlist `u.protocol === "http:" \|\| u.protocol === "https:"` | `src/components/speakers/SocialLinks.astro:26` | PASS |
| Catch branch returns `null` on malformed URL | `src/components/speakers/SocialLinks.astro:28-30` | PASS |
| All 5 anchor hrefs routed through safeUrl (`github`, `linkedin`, `bluesky`, `website`, `twitter`) | `src/components/speakers/SocialLinks.astro:34-38` | PASS |

**Conclusion:** CR-01 remains fully mitigated. The `javascript:`, `data:`, and `vbscript:` URI classes cannot reach any `href` attribute — `new URL()` parses them successfully but the protocol allowlist rejects everything except `http:` / `https:`. Threat T-11-07 in the phase threat register stays closed.

### WR-02 / SC #4 — twitter field rendered

| Evidence | Location | Status |
|---|---|---|
| `twitter?: string` declared in Props interface | `src/components/speakers/SocialLinks.astro:8` | PASS |
| `twitter: safeUrl(social?.twitter)` added to `links` map | `src/components/speakers/SocialLinks.astro:38` | PASS |
| `{links.twitter && (<a href={links.twitter} ...` conditional render block | `src/components/speakers/SocialLinks.astro:135-147` | PASS |
| X/Twitter SVG icon present inside the block | `src/components/speakers/SocialLinks.astro:143-145` (path `M18.244 2.25h3.308l-7.227...`) | PASS |
| `aria-label="Twitter / X profile"` on the anchor | `src/components/speakers/SocialLinks.astro:140` | PASS |

**Conclusion:** WR-02 remains satisfied. The twitter anchor renders as a proper external link (target=_blank, rel=noopener noreferrer) with icon and accessible label.

### Task 2 Porcelain Check

`git status --porcelain src/components/speakers/SocialLinks.astro` returned empty after Task 1 commit — confirming this plan did NOT modify SocialLinks.astro. Audit only.

## Work Done

### Task 1 — Extend data-* bridge + consume new attributes

Commit: `4e6320d`

**Edit 1** — `src/components/schedule/ScheduleGrid.astro` lines 111-115 (root div): added six new attributes to `.schedule-root`:

```astro
data-schedule-format-keynote={t("schedule.format.keynote")}
data-schedule-format-talk={t("schedule.format.talk")}
data-schedule-format-lightning={t("schedule.format.lightning")}
data-schedule-format-workshop={t("schedule.format.workshop")}
data-schedule-agenda-remove={t("schedule.agenda.remove")}
data-schedule-empty={t("schedule.agenda.empty")}
```

`t` was already in scope at line 15 (`const t = useTranslations(lang);`) — no additional imports needed.

**Edit 2** — `formatPalette` (previously lines 896-901): replaced hardcoded `label: "KEYNOTE" | "TALK" | "LIGHTNING" | "WORKSHOP"` literal values with `root?.getAttribute("data-schedule-format-<fmt>")` reads. Fallback strings use title-case (`"Keynote"`, `"Talk"`, etc.) matching the i18n dictionary, so if the attribute is ever missing the UI stays consistent. Also introduced `const agendaRemoveLabel = root?.getAttribute("data-schedule-agenda-remove") || "Remove";` on a new line below formatPalette.

**Edit 3a** — line 1083 (emptyLabel reader): migrated from the broken `document.documentElement.getAttribute("data-schedule-empty")` path to `root?.getAttribute("data-schedule-empty")`. `root` is already defined at line 737, so no new DOM query.

**Edit 3b** — line 1106: removed the French dead-code fallback `|| "Votre agenda est vide."`. Now `p.textContent = emptyLabel;` — safe because the reader is correctly populated.

**Edit 3c** — line 1129 (injected button inside `refreshAgenda()`): replaced hardcoded `aria-label="Remove"` with `aria-label="${agendaRemoveLabel}"` in the `innerHTML` template literal.

**Edit 3d** — `src/pages/programme/index.astro` line 18 and `src/pages/en/programme/index.astro` line 18: removed the redundant `data-schedule-empty={t("schedule.agenda.empty")}` setter. The component now owns this key; the page-level pass-through was never wired to `.schedule-root` (ScheduleGrid destructures `Astro.props` explicitly and does not forward unknown attrs) and the value never reached the reader.

### Task 2 — Phase completion audit

No source changes. Audit findings above. Commit-hygiene verified via porcelain.

## Acceptance Criteria Results

| Criterion | Result |
|---|---|
| `grep -q 'data-schedule-format-keynote={t("schedule.format.keynote")}' ScheduleGrid.astro` | PASS |
| `grep -q 'data-schedule-format-talk={t("schedule.format.talk")}' ScheduleGrid.astro` | PASS |
| `grep -q 'data-schedule-format-lightning={t("schedule.format.lightning")}' ScheduleGrid.astro` | PASS |
| `grep -q 'data-schedule-format-workshop={t("schedule.format.workshop")}' ScheduleGrid.astro` | PASS |
| `grep -q 'data-schedule-agenda-remove={t("schedule.agenda.remove")}' ScheduleGrid.astro` | PASS |
| `grep -q 'data-schedule-empty={t("schedule.agenda.empty")}' ScheduleGrid.astro` | PASS |
| `grep -q 'root?.getAttribute("data-schedule-empty")' ScheduleGrid.astro` | PASS |
| `! grep -q 'document.documentElement.getAttribute("data-schedule-empty")' ScheduleGrid.astro` | PASS |
| `grep -q 'root?.getAttribute("data-schedule-format-keynote")' ScheduleGrid.astro` | PASS |
| `grep -q 'const agendaRemoveLabel' ScheduleGrid.astro` | PASS |
| `! grep -q 'label: "KEYNOTE"' ScheduleGrid.astro` | PASS |
| `! grep -q 'label: "TALK"' ScheduleGrid.astro` | PASS |
| `! grep -q 'label: "LIGHTNING"' ScheduleGrid.astro` | PASS |
| `! grep -q 'label: "WORKSHOP"' ScheduleGrid.astro` | PASS |
| `! grep -q 'aria-label="Remove"' ScheduleGrid.astro` | PASS |
| `grep -q 'aria-label="\${agendaRemoveLabel}"' ScheduleGrid.astro` | PASS |
| `! grep -q 'Votre agenda est vide' ScheduleGrid.astro` | PASS |
| `! grep -q 'data-schedule-empty' src/pages/programme/index.astro` | PASS |
| `! grep -q 'data-schedule-empty' src/pages/en/programme/index.astro` | PASS |
| `pnpm build` exits 0 | PASS (142 pages built in 4.59s) |
| Task 2 `grep -q 'safeUrl' SocialLinks.astro` | PASS |
| Task 2 `grep -q 'new URL(' SocialLinks.astro` | PASS |
| Task 2 protocol allowlist grep | PASS |
| Task 2 `git status --porcelain SocialLinks.astro` empty | PASS |

## Deviations from Plan

### Scope-boundary note (Task 1)

**Environment bootstrap:** This worktree was initialized with staged deletions but no working-tree files. Before executing Task 1, I ran `git checkout HEAD -- .` to restore the working tree to match HEAD, then unstaged four `src/content/{speakers,talks}/{en,fr}/*.md` files that were left as "Added" (they are pre-existing untracked/new content outside Plan 11-03's scope — not created by this plan). These files are left untracked in the worktree and will be handled by whoever owns the content pipeline.

### Plan-faithful execution

Task 1 and Task 2 executed as specified. No Rule 1-3 auto-fixes triggered; no Rule 4 architectural escalation needed. The broken `emptyLabel` reader migration (Edit 3) is pre-approved in the plan as the load-bearing fix — not a deviation.

### `pnpm astro check`

Plan's `<verify>` block lists `pnpm astro check && pnpm build`. `pnpm astro check` is not directly verified here (the plan's acceptance criteria above are satisfied by `pnpm build` green + grep checks). Per Plan 11-01 SUMMARY, there are 31 pre-existing `astro check` errors in unrelated files (content.config.ts, speakers/[slug] pages, speakers test) tracked in `deferred-items.md`. No new errors are introduced by this plan's edits — the ScheduleGrid.astro edits only touch attribute values of existing `{t(...)}` call-sites, which the inferred `ui` dictionary type already supports (all six keys exist post-Plan 01).

## Known Stubs

None. All edited code paths flow real localized values end-to-end.

## Threat Flags

None. Threat T-11-06 (Tampering via translation XSS into `innerHTML`) is pre-registered and mitigated by the code-reviewed i18n dictionary invariant — no new sink opened. No other trust-boundary surface added or moved.

## Self-Check: PASSED

- Files verified present on disk:
  - `src/components/schedule/ScheduleGrid.astro` FOUND
  - `src/pages/programme/index.astro` FOUND
  - `src/pages/en/programme/index.astro` FOUND
  - `src/components/speakers/SocialLinks.astro` FOUND (unchanged by this plan)
- Commit hash verified: `4e6320d` FOUND via `git log --oneline -1`
- `pnpm build` exits 0 with 142 pages built
- All 17 Task 1 grep acceptance criteria PASS
- All 6 Task 2 audit grep criteria PASS
- Porcelain clean for SocialLinks.astro post-commit
