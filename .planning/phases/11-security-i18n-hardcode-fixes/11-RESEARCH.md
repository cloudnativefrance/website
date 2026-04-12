# Phase 11: Security & i18n Hardcode Fixes - Research

**Researched:** 2026-04-12
**Domain:** i18n hygiene + completion check of security hardening
**Confidence:** HIGH

## Summary

Phase 11's Success Criteria #1 (SocialLinks URL validation), #3 (pages use `getLangFromUrl`), and #4 (twitter field rendered) are **already implemented on `main`** in commits `09f3c5a` and `440eba0`. Verification in current source (Step "Pre-existing SC Verification" below) confirms all three are correctly in place, with **one minor residual**: the `[slug].astro` dynamic speaker pages still hardcode the locale as `const lang: "fr" = "fr"` / `"en" = "en"` rather than using `getLangFromUrl`. This is semantically fine (routing guarantees the constant matches the URL), but it contradicts SC #3's literal wording. **The planner must decide** whether to fix these two files or document them as an accepted exception.

The **active scope** for Phase 11 is **SC #2**: replace all remaining hardcoded English/locale-dependent user-visible strings with i18n translation keys. An exhaustive grep over `src/components/**` and `src/pages/**` surfaced **eight** such strings across four files. The existing i18n infrastructure (`src/i18n/ui.ts` + `src/i18n/utils.ts` with `useTranslations(lang)`) is exactly the pattern to extend — no new library, no architecture change. The naming convention is dot-delimited namespace-first (e.g., `speakers.keynote_badge`, `schedule.format.keynote`), and both `fr` and `en` dictionaries are sibling objects in the same file.

**Primary recommendation:** Add seven new key/value pairs to `src/i18n/ui.ts` (both `fr` and `en` branches), migrate the five hardcoded strings in `SpeakerCard.astro`, `CountdownTimer.tsx`, `TalkCard.astro`, and `ScheduleGrid.astro` to use `t()`, and decide with the user whether to also migrate the two `[slug].astro` hardcoded lang constants.

## Project Constraints (from CLAUDE.md)

- **Stitch-first rule**: Every new page or significant UI change is designed in Stitch first. Phase 11 is **non-visual** (string swaps with zero UX change), so Stitch-first does NOT apply. Document this exemption in the plan so it doesn't block execution.
- **No co-authored commits, no "Generated with Claude Code" attribution** (global `~/.claude/CLAUDE.md`).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CR-01 | SocialLinks.astro renders href without URL validation (XSS vector) | **Already satisfied** — `safeUrl()` in `src/components/speakers/SocialLinks.astro:20-31` validates protocol is `http:`/`https:` via `new URL()` parser, returns `null` otherwise. Verified in commit `09f3c5a`. |
| IN-01 | Hardcoded `'fr'`/`'en'` in page data calls instead of `getLangFromUrl` | **Partially satisfied** — all `src/pages/**/index.astro` files use `getLangFromUrl(Astro.url)` (verified via grep). **Residual**: `src/pages/speakers/[slug].astro:21` and `src/pages/en/speakers/[slug].astro:21` still use `const lang: "fr" = "fr"` / `"en" = "en"` and `getTalksForSpeaker("fr", slug)` / `("en", slug)` on line 24. Needs planner decision. |
| IN-02 | Track badge names hardcoded English on French pages | **Active** — `src/components/speakers/TalkCard.astro:25-30` has `trackNames` map with "Cloud & Infra", "DevOps & Platform", "Security", "Community" regardless of locale. Also line 32 `capitalizedFormat` hardcodes capitalized English format name ("Talk", "Keynote", "Lightning", "Workshop") even though `schedule.format.*` keys already exist in `ui.ts` for both languages. |
| WR-01 | Hardcoded English "remaining" in CountdownTimer aria-label | **Active** — `src/components/hero/CountdownTimer.tsx:47` contains `... ${t("countdown.minutes")} remaining\`` — the word "remaining" is not translated. |
| WR-02 | `twitter` field in SocialLinks declared but never rendered | **Already satisfied** — verified `src/components/speakers/SocialLinks.astro:135-147` renders a twitter `<a>` block with X/Twitter SVG icon. Commit `09f3c5a`. |
| keynote_badge | `speakers.keynote_badge` i18n key defined but SpeakerCard hardcodes "Keynote" | **Active** — `src/components/speakers/SpeakerCard.astro:35` literally emits the string `Keynote` instead of calling `t("speakers.keynote_badge")`. Both FR ("Keynote") and EN ("Keynote") values already exist in `ui.ts:45` and `ui.ts:179`. **No new key needed — just a wire-up.** |
| schedule_link | `speakers.schedule_link` i18n key defined but TalkCard renders `schedule_placeholder` unconditionally | **Partially active** — this requirement predates Phase 7. Now that `/programme` exists, TalkCard should render a real `<a>` link to the schedule using `t("speakers.schedule_link")` ("Voir dans le programme" / "View in schedule") **when** the talk is mappable to a session — otherwise continue to show `schedule_placeholder`. Needs a lookup from talk → session id (see Open Question Q1). |

## Pre-existing Success Criterion Verification

| SC | Claim | Evidence (file:line) | Status |
|----|-------|----------------------|--------|
| #1 | SocialLinks validates URLs before rendering href | `src/components/speakers/SocialLinks.astro:20-31` — `safeUrl()` uses `new URL()` and checks `u.protocol === "http:" || "https:"`; all five anchors go through `links.{github,linkedin,bluesky,website,twitter}` which are the `safeUrl`-processed values. | **VERIFIED complete** |
| #3 | All page data calls use `getLangFromUrl` result instead of hardcoded `'fr'`/`'en'` | `src/pages/{index,speakers/index,programme/index,venue/index}.astro` and their `/en/` mirrors all call `const lang = getLangFromUrl(Astro.url)` (grep confirmed). | **VERIFIED for index pages. GAP**: `src/pages/speakers/[slug].astro:21,24` and `src/pages/en/speakers/[slug].astro:21,24` still hardcode `const lang: "fr" = "fr"` and `getTalksForSpeaker("fr", slug)`. These are dynamic routes where the locale is structurally guaranteed by the URL segment, so behavior is correct — but literal SC #3 wording says "all page data calls". Planner should decide: (a) fix for consistency, or (b) document as accepted exception. |
| #4 | twitter field in SocialLinks rendered OR removed from Props | `src/components/speakers/SocialLinks.astro:8` declares `twitter?: string`, line 38 adds it to `links`, lines 135-147 render the X/Twitter anchor. | **VERIFIED complete** |

## Hardcoded-String Inventory (SC #2 active scope)

**Exhaustive, file:line.** Every item below is user-visible and locale-dependent.

| # | File | Line | Current (hardcoded) | Proposed key | FR value | EN value | Notes |
|---|------|------|---------------------|--------------|----------|----------|-------|
| 1 | `src/components/speakers/SpeakerCard.astro` | 35 | `Keynote` (literal text child of `<span>`) | **existing**: `speakers.keynote_badge` | "Keynote" | "Keynote" | Key already exists in `ui.ts:45,179`. Only the wire-up is missing. Requires `t` — add `import { useTranslations }` + `const t = useTranslations(lang)` and replace the literal. |
| 2 | `src/components/hero/CountdownTimer.tsx` | 47 | word `remaining` in aria-label template literal: `` `${tl.days} ${t("countdown.days")}, ${tl.hours} ${t("countdown.hours")}, ${tl.minutes} ${t("countdown.minutes")} remaining` `` | **new**: `countdown.aria_template` | "Plus que {days} {daysLabel}, {hours} {hoursLabel} et {minutes} {minutesLabel}" | "{days} {daysLabel}, {hours} {hoursLabel}, {minutes} {minutesLabel} remaining" | Simpler alternative: **new** key `countdown.remaining_suffix` with FR = "restant" / EN = "remaining". Either approach works; template approach is more idiomatic for FR word order. **Recommend template** — see Architecture Patterns Pattern 2. |
| 3 | `src/components/speakers/TalkCard.astro` | 25-30 | `const trackNames = { "cloud-infra": "Cloud & Infra", "devops-platform": "DevOps & Platform", "security": "Security", "community": "Community" }` | **new (4 keys)**: `talks.track.cloud-infra`, `talks.track.devops-platform`, `talks.track.security`, `talks.track.community` | "Cloud & Infra", "DevOps & Plateforme", "Securite", "Communaute" | "Cloud & Infra", "DevOps & Platform", "Security", "Community" | The four values are the track enum in `content.config.ts` speaker talks schema (separate data from `schedule.ts` tracks which are free-text from CSV). Replace `trackNames[track]` with `t(\`talks.track.${track}\` as any)`. Note the naming: `talks.track.*` rather than `schedule.track.*` to avoid colliding with the free-text schedule tracks. |
| 4 | `src/components/speakers/TalkCard.astro` | 32, 52 | `const capitalizedFormat = format.charAt(0).toUpperCase() + format.slice(1)` → rendered as `{capitalizedFormat} - {duration}min` | **reuse existing**: `schedule.format.{keynote,talk,lightning,workshop}` | (already in `ui.ts`) | (already in `ui.ts`) | Replace with `t(\`schedule.format.${format}\` as any)`. Keys already defined with proper FR/EN values. Drop the `capitalizedFormat` variable entirely. |
| 5 | `src/components/schedule/ScheduleGrid.astro` | 897-900 | `formatPalette = { keynote: { label: "KEYNOTE", ... }, talk: { label: "TALK", ... }, lightning: { label: "LIGHTNING", ... }, workshop: { label: "WORKSHOP", ... } }` in inline `<script>` | **reuse existing**: `schedule.format.*` | (already in `ui.ts`) | (already in `ui.ts`) | **Subtle**: this is in a client-side `<script>` block, not Astro frontmatter, so `t()` is unavailable at runtime. Strategy: render a `data-i18n-*` attribute on the root (e.g., `data-schedule-format-keynote={t("schedule.format.keynote").toUpperCase()}` etc.) on the `.schedule-root` element, then read them in JS via `document.documentElement.getAttribute(...)` — this is the **same pattern already used for `data-schedule-empty`** on line 1083. Apply `.toUpperCase()` to preserve the visual style of the format chip (or drop uppercase and let CSS handle it via `text-transform: uppercase`, which is cleaner). |
| 6 | `src/components/schedule/ScheduleGrid.astro` | 1106 | `p.textContent = emptyLabel \|\| "Votre agenda est vide."` (fallback FR string) | **existing**: `schedule.agenda.empty` (already wired via `data-schedule-empty`, see note below) | (already in `ui.ts`) | (already in `ui.ts`) | The primary path already uses `data-schedule-empty`. **The `\|\| "Votre agenda est vide."` fallback is French-only dead code** — remove it, or replace with empty string. Low priority but in scope for "no hardcoded locale-dependent strings". |
| 7 | `src/components/schedule/ScheduleGrid.astro` | 1129 | `aria-label="Remove"` on the agenda remove button (inline `<button>` in injected HTML) | **new**: `schedule.agenda.remove` | "Retirer" | "Remove" | User-visible via screen readers. Plumb via new `data-i18n-*` attribute on root (same pattern as item 5). |
| 8 | `src/pages/speakers/[slug].astro` + `src/pages/en/speakers/[slug].astro` | 21, 24 | `const lang: "fr" = "fr"`; `getTalksForSpeaker("fr", slug)` (FR file); mirror for `"en"` | N/A — not a string, locale constant | N/A | N/A | **Planner decision point** (see Open Questions). Either (a) convert to `const lang = getLangFromUrl(Astro.url)` and drop the literal type assertion for consistency with SC #3, or (b) leave as-is and add a comment explaining the constant is structurally guaranteed by the route. |

Where the `data-schedule-empty` pattern already lives: `src/components/schedule/ScheduleGrid.astro:1083` — `const emptyLabel = document.documentElement.getAttribute("data-schedule-empty") || "";`. The attribute must be set in `Layout.astro` or at the top of `ScheduleGrid.astro` markup. Grepping for `data-schedule-empty=` in the codebase will identify where the setter is — plan tasks should locate and extend that setter.

## Standard Stack

**No new libraries.** Phase 11 uses only the already-present i18n primitives.

### Core (existing, no changes)
| Module | File | Purpose |
|--------|------|---------|
| `ui` dictionary | `src/i18n/ui.ts` | Flat `fr` + `en` objects with dot-delimited keys. Edit both sibling objects. |
| `useTranslations(lang)` | `src/i18n/utils.ts:18-22` | Returns `t(key)` function. Falls back to default locale (`fr`) on missing key. |
| `getLangFromUrl(Astro.url)` | `src/i18n/utils.ts:8-12` | Extracts locale from URL pathname's first segment. |
| `type Locale` | `src/i18n/ui.ts:3` | `"fr" \| "en"` union. |

**Version verification:** N/A — no npm dependencies touched. Sanity check: `pnpm list astro` → should be Astro 6.x (per FNDN-01 completed).

## Architecture Patterns

### Pattern 1: Astro component i18n (already established)

**What:** Astro components receive `lang: Locale` as a prop and call `useTranslations(lang)` in frontmatter.

**Example (current, correct):** `src/components/speakers/TalkCard.astro:15-16`
```astro
---
const { title, track, format, duration, coSpeakers, lang } = Astro.props;
const t = useTranslations(lang);
---
<span>{t("speakers.cospeaker_prefix")}</span>
```

**Apply to:** `SpeakerCard.astro` needs to add `useTranslations` import + `const t` + replace the literal. It already accepts `lang` as a prop (line 13).

### Pattern 2: Locale-safe templated aria-label (React component)

**What:** Don't string-concatenate translated fragments with hardcoded glue words — FR and EN word orders differ. Use a single template key with placeholders, or multiple dedicated keys per locale-specific phrasing.

**Anti-pattern (current `CountdownTimer.tsx:47`):**
```ts
`${tl.days} ${t("countdown.days")}, ${tl.hours} ${t("countdown.hours")}, ${tl.minutes} ${t("countdown.minutes")} remaining`
```
Fragile: French would be "Plus que X jours, Y heures et Z minutes" — different structure.

**Pattern (recommended):** define `countdown.aria_template` with `{days}`/`{daysLabel}` etc. placeholders and interpolate in JS:
```ts
// ui.ts
"countdown.aria_template": "Plus que {days} {daysLabel}, {hours} {hoursLabel} et {minutes} {minutesLabel}"  // fr
"countdown.aria_template": "{days} {daysLabel}, {hours} {hoursLabel}, {minutes} {minutesLabel} remaining"    // en

// CountdownTimer.tsx
const tpl = t("countdown.aria_template");
const label = tpl
  .replace("{days}", String(tl.days))
  .replace("{daysLabel}", t("countdown.days"))
  .replace("{hours}", String(tl.hours))
  .replace("{hoursLabel}", t("countdown.hours"))
  .replace("{minutes}", String(tl.minutes))
  .replace("{minutesLabel}", t("countdown.minutes"));
```
No new library — plain string replace is adequate for four placeholders.

### Pattern 3: Client-side i18n via `data-*` attributes

**What:** Inline `<script>` blocks in Astro files execute in the browser where `t()` doesn't exist. Pass translations via `data-*` attributes on a root element, read them in JS.

**Example (already used, `ScheduleGrid.astro:1083`):**
```js
const emptyLabel = document.documentElement.getAttribute("data-schedule-empty") || "";
```
The setter lives on `<html>` (likely in `Layout.astro`) or on the component root. **Plan task must locate and extend it** to include the new keys (`schedule.format.keynote`/`talk`/`lightning`/`workshop` and `schedule.agenda.remove`).

**Anti-pattern:** Bundling a second translation dictionary in the `<script>` block — duplicates truth and drifts.

### Anti-Patterns to Avoid

- **Glue-word concatenation across locales** — see Pattern 2 above.
- **Adding new keys without also adding the matching FR (or EN) value** — the `useTranslations` fallback silently returns the default-locale value, so EN pages would display FR text without compile errors. Always add both sibling values.
- **Typing key arguments as `string` instead of `as any`** when the key is templated (e.g., `schedule.format.${fmt}`) — current codebase uses `as any` cast (see `ScheduleGrid.astro:168,227`); follow precedent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Translation function | New i18n helper | Existing `useTranslations(lang)` in `src/i18n/utils.ts` | Already handles fallback to default locale. |
| URL validation (scheme allowlist) | Regex-based scheme check | **Already in place**: `new URL()` + `u.protocol === "http:" \|\| "https:"` (SocialLinks.astro) | Browser URL parser rejects malformed input natively; no need for extra logic. |
| Locale detection | Hardcoded constants in pages | `getLangFromUrl(Astro.url)` | Single source of truth; honors routing invariants. |

## Common Pitfalls

### Pitfall 1: Forgetting to add EN (or FR) sibling value
**What goes wrong:** Adding `"talks.track.security": "Securite"` to `ui.fr` but not `ui.en` means EN pages display "Securite" (FR fallback) without any error.
**How to avoid:** Always edit both `fr` and `en` objects in the same commit. A task verification step can grep both branches.
**Warning signs:** TypeScript won't catch it — the `ui` type is inferred as `const`, and the fallback in `useTranslations` swallows the missing key silently.

### Pitfall 2: Client-side script can't call `t()`
**What goes wrong:** Putting `t("schedule.agenda.remove")` inside a `<script>` block in an Astro file — compilation silently strips it or fails, since the script runs in the browser where `t` is undefined.
**How to avoid:** Follow Pattern 3 — pass via `data-*` attribute from server-rendered markup.
**Warning signs:** `aria-label` or `textContent` shows `undefined` or the literal key string at runtime.

### Pitfall 3: Dynamic routes and `getLangFromUrl` — race-looking code
**What goes wrong:** A maintainer reading `const lang: "fr" = "fr"` in `[slug].astro` assumes it's a bug and "fixes" it without realizing the route only matches FR URLs.
**How to avoid:** If the planner leaves the literal in place, add a comment: `// locale is guaranteed by the /speakers/[slug] route in src/pages (no /en prefix)`.

### Pitfall 4: Uppercase / casing baked into the English fallback
**What goes wrong:** `formatPalette` labels are uppercase ("KEYNOTE"). If we translate to e.g. French "Keynote" (not "KEYNOTE"), and the chip has no `text-transform: uppercase` CSS, the visual differs between locales.
**How to avoid:** Either uppercase in JS after translation (`.toUpperCase()` — works for Latin-script languages), or add `text-transform: uppercase` to the chip's CSS class. Recommend **CSS** — locale-safe and separates style from data.

## Code Examples

### Example 1: Wire `speakers.keynote_badge` in SpeakerCard

Source pattern: `src/components/speakers/TalkCard.astro:15-16` (existing). Apply to `SpeakerCard.astro`:

```astro
---
import SpeakerAvatar from "./SpeakerAvatar.astro";
import { getLocalePath, useTranslations } from "@/i18n/utils";  // add useTranslations
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/ui";

interface Props { name: string; company?: string; slug: string; photo?: string; isKeynote: boolean; lang: Locale; }
const { name, company, slug, photo, isKeynote, lang } = Astro.props;
const t = useTranslations(lang);  // add this line
---
...
{isKeynote && (
  <span class="inline-block mt-2 px-2 py-0.5 text-sm uppercase tracking-widest text-accent bg-accent/15 rounded-full">
    {t("speakers.keynote_badge")}   {/* was: literal "Keynote" */}
  </span>
)}
```

### Example 2: Localize track + format in TalkCard

```astro
---
// Delete: const trackNames = { ... };
// Delete: const capitalizedFormat = ...;
---
<span class={cn("...", trackColors[track])}>
  {t(`talks.track.${track}` as any)}     {/* was: {trackNames[track]} */}
</span>
<span class="text-sm text-muted-foreground">
  {t(`schedule.format.${format}` as any)} - {duration}min    {/* was: {capitalizedFormat} */}
</span>
```

### Example 3: Countdown aria template (React)

See Pattern 2 above.

### Example 4: Extending the `data-*` bridge for client-side schedule strings

Locate where `data-schedule-empty` is set (likely `Layout.astro` or near the top of `ScheduleGrid.astro` markup — grep `data-schedule-empty=`). Add siblings:

```astro
<div
  class="schedule-root"
  data-date={dayDateIso}
  data-schedule-format-keynote={t("schedule.format.keynote")}
  data-schedule-format-talk={t("schedule.format.talk")}
  data-schedule-format-lightning={t("schedule.format.lightning")}
  data-schedule-format-workshop={t("schedule.format.workshop")}
  data-schedule-agenda-remove={t("schedule.agenda.remove")}
  style={`--grid-rows: ${GRID_ROWS}; --grid-cols: ${rooms.length};`}
>
```

Then in the `<script>` block (around line 896):
```js
const root = document.querySelector(".schedule-root");
const formatPalette = {
  keynote:   { label: (root?.getAttribute("data-schedule-format-keynote")   || "KEYNOTE"),   cls: "bg-accent/15 text-accent" },
  talk:      { label: (root?.getAttribute("data-schedule-format-talk")      || "TALK"),      cls: "bg-primary/15 text-primary" },
  lightning: { label: (root?.getAttribute("data-schedule-format-lightning") || "LIGHTNING"), cls: "bg-[color:var(--color-tertiary)]/15 text-[color:var(--color-tertiary)]" },
  workshop:  { label: (root?.getAttribute("data-schedule-format-workshop")  || "WORKSHOP"),  cls: "bg-secondary text-foreground" },
};
const agendaRemoveLabel = root?.getAttribute("data-schedule-agenda-remove") || "Remove";
// use agendaRemoveLabel in the injected HTML at line 1129 instead of hardcoded "Remove"
```

Apply `text-transform: uppercase` in CSS to the format chip class so localized values stay visually consistent without JS casing.

## State of the Art

No "current vs. outdated approach" relevant — the i18n pattern in this repo is stable and idiomatic for small-scale bilingual Astro sites. No migration to Paraglide or similar is needed (and would be out of scope per CONTEXT absence / tech-debt phase framing).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `data-schedule-empty` setter lives in `Layout.astro` or similar root-level template | Pattern 3, Example 4 | **Low** — plan tasks can grep to locate it; if it's elsewhere, the task just adjusts the file path. |
| A2 | `talks.track.*` is a safe namespace that doesn't collide with free-text `schedule.track.*` track names from CSV | String Inventory #3 | **Low** — the ui.ts keys are already scoped by namespace; free-text CSV track values don't become i18n keys. |
| A3 | French track translations: "DevOps & Plateforme", "Securite", "Communaute" are acceptable to the user. ("Cloud & Infra" reads the same in both languages.) | String Inventory #3 | **MEDIUM** — user may prefer to keep English brand-style track names even on FR pages (community convention at cloud-native events). **Recommend surfacing in discussion/plan phase.** |
| A4 | French countdown aria phrasing "Plus que X jours, Y heures et Z minutes" is stylistically preferred over "X jours, Y heures, Z minutes restants" | String Inventory #2 | **Low** — either works; both are natural French. Surface as a micro-decision but default to the "Plus que" template (matches common conference countdown copy). |
| A5 | SC #3 `[slug].astro` residual is **acceptable** given routing invariants, but planner should confirm | SC Verification row | **Low** — both options are defensible; the plan just needs to pick one. |
| A6 | Phase 11 is non-visual and therefore exempt from the Stitch-first rule | Project Constraints | **Low** — string swaps produce zero visible-layout change. Plan should assert this in its description so the user agrees up-front. |

## Open Questions

1. **TalkCard schedule link (`speakers.schedule_link`) wire-up scope**
   - What we know: `speakers.schedule_link` ("Voir dans le programme" / "View in schedule") is defined but TalkCard always shows the placeholder. `/programme` now exists after Phase 7.
   - What's unclear: Is there a reliable talk-id → session-id mapping to build a deep-link (`#session-<id>`)? `ScheduleGrid.astro` renders `data-session-id` on cards, so anchoring is feasible, but it requires knowing the session id at TalkCard render time. The speaker talks schema and `sessions.csv` may or may not share ids.
   - Recommendation: **Scope check with user in `/gsd-discuss-phase`.** If ids align, render the real link; if not, leave the placeholder and document as deferred.

2. **Hardcoded `lang` in `[slug].astro`**
   - What we know: Pages work correctly; literal type assertion is structurally safe.
   - What's unclear: Does the user want strict literal compliance with SC #3 ("ALL page data calls"), or accept the current pattern with a comment?
   - Recommendation: Surface in discuss-phase; default to **fix for consistency** (costs ~4 lines, reduces cognitive load for future maintainers).

3. **Track name translations — localize or leave English?**
   - What we know: Cloud-native community conferences often keep track names in English even on localized sites (brand convention).
   - What's unclear: User preference.
   - Recommendation: Surface in discuss-phase. Two valid paths: (a) translate ("Securite", "Communaute", "DevOps & Plateforme"), (b) keep English verbatim but wire through i18n keys anyway (both `fr` and `en` values are the English string) — this makes future re-translation zero-effort.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (detected via `src/lib/__tests__/` directory) |
| Config file | `vitest.config.*` — verify via `ls` during Wave 0 |
| Quick run command | `pnpm test` (per standard Astro+Vitest setup — verify in `package.json` scripts) |
| Full suite command | `pnpm test` + `pnpm build` (build is the strongest i18n validation — catches TS errors on typed keys) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| keynote_badge | SpeakerCard renders `t("speakers.keynote_badge")` not literal "Keynote" | smoke (grep) | `grep -q 't("speakers.keynote_badge")' src/components/speakers/SpeakerCard.astro && ! grep -Pq ">\s*Keynote\s*<" src/components/speakers/SpeakerCard.astro` | n/a (inline grep) |
| WR-01 | CountdownTimer aria-label has no hardcoded " remaining" outside EN dict | smoke (grep) | `! grep -q '" remaining"' src/components/hero/CountdownTimer.tsx` | n/a |
| IN-02 | TalkCard uses `t()` for track and format labels | smoke (grep) | `grep -q 't(\`talks.track' src/components/speakers/TalkCard.astro && grep -q 't(\`schedule.format' src/components/speakers/TalkCard.astro && ! grep -q 'trackNames\s*=' src/components/speakers/TalkCard.astro` | n/a |
| IN-02 (schedule side) | ScheduleGrid format chip labels come from data-attr, not hardcoded | smoke (grep) | `grep -q 'data-schedule-format-keynote=' src/components/schedule/ScheduleGrid.astro` | n/a |
| schedule.agenda.remove | aria-label="Remove" removed from inline HTML | smoke (grep) | `! grep -q 'aria-label="Remove"' src/components/schedule/ScheduleGrid.astro` | n/a |
| (build integrity) | All translation keys resolvable at build time | build | `pnpm build` | — |
| (visual, manual) | FR homepage shows French keynote badge; EN shows English | manual | browser visit `/` and `/en/` — check `<span>Keynote</span>` locale | — |

### Sampling Rate
- **Per task commit:** `pnpm build` (fast + catches typed-key errors)
- **Per wave merge:** `pnpm build && pnpm test`
- **Phase gate:** Full build green + manual FR/EN page spot-check before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Confirm `package.json` `scripts.test` exists and maps to Vitest — if missing, fix before test commands are run.
- [ ] Confirm `vitest.config.*` exists at repo root.

*(If no unit tests per string swap are desired, smoke greps embedded in task `<automated>` verification blocks are sufficient — see Test Map above.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (static site, no auth) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | **yes** | CR-01 target: `safeUrl()` in `SocialLinks.astro` — validates URL scheme allowlist. **Already implemented.** |
| V6 Cryptography | no | — |
| V14.4 HTTP Security (output encoding / XSS) | **yes** | Astro auto-escapes interpolated expressions `{expr}`. The only attack surface Phase 11 touches is the href rewrite in SocialLinks, already hardened by scheme allowlist. |

### Known Threat Patterns for Astro + Speaker-Sourced URL Fields

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `javascript:` URI in `href` (stored XSS from Google Sheets admin input) | Tampering / Elevation | Scheme allowlist via `new URL().protocol` check — **already in place** at `SocialLinks.astro:25-27`. |
| `data:text/html` URI in `href` | Tampering | Same allowlist mitigation (only `http:`/`https:` permitted). |
| Unicode homograph in visible speaker name | Spoofing | **Out of scope** for Phase 11 (content trust boundary is the speakers.csv/Sheets editor, not the rendering pipeline). |
| Open redirect via `window.location.href = "/programme.ics"` in schedule export | Tampering | Hardcoded internal path — not user-controllable. No mitigation needed. |

No new security work required beyond verifying CR-01 stays satisfied after any refactor that touches SocialLinks.

## Sources

### Primary (HIGH confidence)
- `src/i18n/ui.ts` — full translation dictionary inspected (277 lines, both fr/en keys enumerated)
- `src/i18n/utils.ts` — `getLangFromUrl`, `useTranslations`, `getLocalePath` implementations inspected
- `src/components/speakers/SocialLinks.astro` — full file read, confirmed `safeUrl()` active and twitter rendered
- `src/components/speakers/SpeakerCard.astro` — confirmed hardcoded "Keynote" at line 35
- `src/components/speakers/TalkCard.astro` — confirmed hardcoded `trackNames` + `capitalizedFormat`
- `src/components/hero/CountdownTimer.tsx` — confirmed hardcoded "remaining" at line 47
- `src/components/schedule/ScheduleGrid.astro` — confirmed hardcoded `formatPalette` labels (line 897-900), aria-label="Remove" (line 1129), French fallback (line 1106)
- `src/pages/**/*.astro` — grepped; all `index.astro` files use `getLangFromUrl`; `[slug].astro` files hardcode literal lang
- `.planning/v1.0-MILESTONE-AUDIT.md` — CR-01, IN-01, IN-02, WR-01, WR-02, keynote_badge, schedule_link definitions verified against source
- `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` — phase goals and SCs confirmed

### Secondary (MEDIUM confidence)
- Recent commits `09f3c5a` (SocialLinks validation + twitter) and `440eba0` (pages use derived lang) — referenced in objective, cross-verified by source inspection.

### Tertiary (LOW confidence)
- None — every claim in this research is verified against present source or committed audit document.

## Metadata

**Confidence breakdown:**
- Hardcoded-string inventory: **HIGH** — exhaustive grep + manual file-read across `src/components/**`, `src/pages/**`, `src/i18n/**`; every item has file:line.
- Pre-existing SC verification: **HIGH** — direct source inspection matches commit titles.
- `[slug].astro` residual: **HIGH** finding, **LOW** confidence on remediation preference — planner must choose.
- Architecture patterns: **HIGH** — all three patterns have an in-repo precedent cited by line number.
- Security (CR-01): **HIGH** — `safeUrl()` implementation directly inspected, matches OWASP scheme-allowlist pattern.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days — stable domain, no fast-moving deps)
