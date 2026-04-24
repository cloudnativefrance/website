# Light/Dark Mode — Design Spec

**Date:** 2026-04-24
**Status:** Approved (brainstorm), pending implementation plan
**Owner:** Smaine

---

## Goal

Make light mode the new default visual identity of the Cloud Native Days France site, with dark mode preserved as an opt-in choice via a toggle in the navigation header. This is a brand refresh, not a "preference toggle on top of dark."

### Motivation

Driven by, in priority order:

1. **Aesthetic refresh (E)** — the current dark-only design feels heavy; a lighter brand reads fresher and is more appropriate for the 2027 edition.
2. **Reader comfort (A)** — dark sites are harder to read in bright environments (outdoor venues, daylight, projector views).
3. **Inclusivity (B)** — not every visitor prefers dark; offering a choice is baseline UX.

### Locked decisions (from brainstorm)

| # | Decision | Choice |
|---|----------|--------|
| Q2 | Default mode after this lands | **C** — Light becomes default; dark is opt-in via toggle |
| Q3 | Scope for v1 | **A** — Whole site at once (no transitional half-rebrand) |
| Q4 | Light palette source | **D** — 3-direction Stitch exploration → user picks → go deep |
| Q5 | OS `prefers-color-scheme` | **A** — Always start light; ignore OS preference |
| Q6 | Toggle placement / form | **A** — Icon-only sun/moon next to `LanguageToggle` in nav; mirrored in mobile menu |
| Q7 | Hero ambiance photo handling | **(a)** — Same photo, theme-tinted overlay (no second asset for v1) |

### Implementation approach

**Approach 2 — Phased rebrand (3 phases)**, each independently shippable:

- **Phase A — Tokenization pass.** Pure refactor; no visible change. Replace hardcoded `text-white`, `border-white/15`, hardcoded logo imports, etc. with semantic tokens.
- **Phase B — Palette + toggle.** Visible rebrand lands here. Light tokens published, dark tokens move under `.dark`, `ThemeToggle` component shipped, `Layout.astro` default flipped, `DESIGN.md` rewritten.
- **Phase C — Polish.** Hero overlay, glow→drop-shadow swap, hex pattern hue tweak, per-component nits surfaced by walking the live site.

---

## Architecture

### Token strategy

Currently:
- `src/styles/global.css:8-43` — all tokens defined in `:root` (dark values).
- `src/layouts/Layout.astro:60` — `<html>` hardcoded `class="dark"`.
- `src/styles/global.css:5` — `@custom-variant dark (&:is(.dark *))` already wired (shadcn baseline) but unused.

Target:

```css
/* :root holds the LIGHT palette — the new default */
:root {
  --background: oklch(98% …);   /* values come from Stitch winner in Phase B */
  --foreground: oklch(15% …);
  --card: …;
  /* …all surface/border/muted tokens that differ per mode */

  /* Brand hues stay in :root, unchanged across modes */
  --primary: oklch(62.5% 0.162 259.9);          /* CND blue */
  --accent: oklch(76.6% 0.142 10.1);            /* CND pink */
  --destructive: oklch(54.0% 0.216 25.2);       /* CND red */
  --chart-1..5: …;                              /* unchanged */
}

/* .dark overrides — preserve today's dark palette verbatim */
.dark {
  --background: oklch(16.8% 0.052 286.4);
  --foreground: oklch(95.6% 0.023 291.3);
  /* …current dark values from today's :root */
  --shadow-glow-primary: …;                     /* glows are dark-only */
  --shadow-glow-accent: …;
}
```

The `@theme inline { --color-background: var(--background); … }` block at `global.css:45-87` stays unchanged — Tailwind 4 reads through CSS vars, so the theme system is already mode-aware.

**Brand-hue tokens** (`--primary`, `--accent`, `--destructive`, all chart colors) live once in `:root` and do not differ per mode. The CND blue/red/pink are part of the brand identity regardless of background.

**Mode-specific tokens** (different per mode): `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring` (subtle hue shift), and all sidebar tokens.

**Glow shadows** (`--shadow-glow-primary`, `--shadow-glow-accent`) are dark-only. Light mode either drops them entirely or substitutes a subtle drop shadow — TBD by visual judgment in Phase C.

### FOUC prevention

Astro is statically built — the theme class must be applied before paint to avoid a flash of light when a dark-mode user reloads.

In `Layout.astro` `<head>`, **before** the `<Font>` component, add:

```html
<script is:inline>
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch {}
</script>
```

`is:inline` keeps it out of the bundle and runs synchronously before body paint. The `try/catch` guards against private-browsing modes that throw on `localStorage` access. No OS preference check (Q5 = A).

### Persistence

`localStorage.theme` = `'dark'` or absent (light is default, no value stored). Origin-scoped, so the choice persists across the FR ↔ EN locale switch automatically.

---

## Phase A — Tokenization pass

### Scope

Replace hardcoded color literals and asset paths with semantic tokens or theme-aware swaps. The site continues to render dark by default after this phase (the `<html class="dark">` line stays until Phase B).

### Audit (provisional — confirm via `grep` before execution)

Patterns to find and replace across `src/**/*.{astro,tsx,ts}`:

| Pattern | Files known to contain it | Replacement |
|---------|--------------------------|-------------|
| `text-white` | `Navigation.astro:72,98`, `LanguageToggle.astro:20` | `text-foreground` |
| `text-white/40` | `LanguageToggle.astro:14,20` | `text-muted-foreground` |
| `text-white/80` | `LanguageToggle.astro:20` (hover) | `hover:text-foreground` |
| `border-white/15` | `Navigation.astro:159` | `border-border` |
| `bg-white`, `bg-black`, `text-black` | TBD via grep | tokens |
| `bg-purple-…`, `text-purple-…` | TBD via grep | tokens |
| `oklch(…)` inline in components | TBD via grep | move to `global.css` token |
| `import … from "@/assets/logos/dark/…"` | `Navigation.astro:5-6` | render both variants, hide one with `dark:hidden` / `hidden dark:block` |
| `import … from "@/assets/logos/principal/…"` | TBD via grep | same dual-render pattern |

Logo handling lives inline in `Navigation.astro` for now (and any other place that imports a logo). If 3+ files end up with the same dual-render snippet, extract a small `<ThemeAwareLogo variant="full"|"compact" />` component — otherwise YAGNI.

### Verification gate (Phase A)

- `pnpm test` passes (no test asserts color, so this should be free).
- `pnpm dev` and walk: `/`, `/en/`, `/speakers`, one card-heavy section. Visual diff vs `main` must be zero — same dark theme, same pixels (modulo any actual layout drift).
- Take before/after screenshots of the homepage hero + nav at desktop and mobile widths. Attach to PR description.

### Commit shape

`refactor: replace hardcoded colors with semantic tokens` — no behavior change. Split into smaller commits if the diff is large (e.g. one per component file).

---

## Phase B — Palette + toggle

### Stitch deliverable (user-driven, before code)

User produces in Stitch (per the project's `stitch-first` rule and `Stitch DS tokens only` rule):

- 3 light-palette directions on the existing CND France 2027 design system. Direction examples to consider: "warm paper", "cool gray", "off-white minimal" — final naming/approach is the user's call.
- One representative mockup per direction: hero + Edition 2026 card section.
- User picks one winner.

**Output handed to implementation:**

- The 9 mode-specific OKLCH tokens for `:root` (`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, plus sidebar variants).
- Confirmation that brand hues (`--primary`, `--accent`, `--destructive`) remain unchanged.
- A note on glow shadow handling in light mode (drop entirely vs. substitute).

### Code deliverables

#### 1. `src/styles/global.css`

- `:root` becomes light tokens (from Stitch winner).
- New `.dark { … }` block holds the current dark values verbatim (copied from today's `:root`).
- Brand hues live once in `:root`, unchanged across modes.
- Sidebar tokens follow the same split pattern.
- `@theme inline { … }` block unchanged.
- `@media (prefers-reduced-motion: reduce)` reset preserved verbatim (`global.css:103-112`).
- `:target { scroll-margin-top: 5rem; }` preserved (`global.css:117-119`).

#### 2. `src/layouts/Layout.astro`

- `Layout.astro:60` — `<html lang={resolvedLang} class="dark">` becomes `<html lang={resolvedLang}>`.
- Insert FOUC prevention script in `<head>` immediately after `<meta name="viewport">` and before `<Font cssVariable="--font-dm-sans" preload />`:
  ```astro
  <script is:inline>
    try {
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch {}
  </script>
  ```

#### 3. `src/components/ThemeToggle.astro` (new)

- Renders a single `<button id="theme-toggle">` with two inline SVGs inside (sun, moon), following the icon-swap pattern at `Navigation.astro:103-104`.
- Sun visible when light is active, moon visible when dark is active — controlled by `dark:hidden` / `hidden dark:block` Tailwind classes.
- Button shape matches `LanguageToggle` ergonomics: 36–44 px touch target, `rounded-md`, `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- Bilingual labels rendered as `data-label-to-dark` and `data-label-to-light` attributes on the button (from i18n keys `theme.toggle.aria.to_dark` and `theme.toggle.aria.to_light`). The initial `aria-label` is the to-dark string (light is the default).
- `aria-pressed="false"` initially (dark is not active); inline script flips it on click.
- Inline `<script>` (no bundled JS):
  ```js
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const toDark = btn.dataset.labelToDark;
    const toLight = btn.dataset.labelToLight;
    // Sync aria state on first paint in case FOUC script applied .dark.
    const startDark = document.documentElement.classList.contains('dark');
    btn.setAttribute('aria-pressed', String(startDark));
    btn.setAttribute('aria-label', startDark ? toLight : toDark);
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        if (isDark) localStorage.setItem('theme', 'dark');
        else localStorage.removeItem('theme');
      } catch {}
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? toLight : toDark);
    });
  }
  ```
- No Astro client island, no React. Pure SSR + tiny inline script — matches the existing `Navigation.astro` mobile-menu pattern.

#### 4. `src/i18n/ui.ts`

Add four new keys (FR + EN):

| Key | FR | EN |
|-----|----|----|
| `theme.toggle.aria.to_dark` | "Basculer en mode sombre" | "Switch to dark mode" |
| `theme.toggle.aria.to_light` | "Basculer en mode clair" | "Switch to light mode" |

#### 5. `src/components/Navigation.astro`

- Import and render `<ThemeToggle />` next to `<LanguageToggle />` in the desktop right-side cluster (`Navigation.astro:85-94`).
- Mirror in the mobile menu panel (`Navigation.astro:110-135`) — placed alongside `<LanguageToggle />` in the same row at the top or bottom of the menu (sibling controls, not list items). Same icon-only sun/moon button as desktop per Q6 = A; no inline text label, just the bilingual `aria-label`.
- Header divider transition (`Navigation.astro:159` — `border-white/15`) was already swapped to `border-border` in Phase A; verify it still reads correctly in light.

#### 6. `DESIGN.md` rewrite

- Replace "Dark Theme Rationale" section with "Light Default + Dark Opt-in Rationale" — explain the 2027-edition refresh, comfort, and inclusivity reasoning.
- Token table grows to two columns: "Light value" | "Dark value" for mode-specific tokens. Brand hues stay single-column.
- "Dark themes need subtle shadows" guidance becomes mode-specific: light mode uses traditional drop shadows; dark mode uses elevation through lighter surfaces + glows.
- Logo Usage section: update the "Backgrounds" guidance to note that `principal/` is now the default at the top of every page; `dark/` is the opt-in.
- Note added: "All visual decisions in this file ship as token pairs; never introduce a hardcoded color that doesn't have both a light and dark resolution."

### Verification gate (Phase B)

- `pnpm test` passes.
- `pnpm dev`, hard reload of `/` with `localStorage.theme=dark` set — no FOUC, dark applies before paint. Repeat with `localStorage.theme` removed — light applies cleanly.
- Toggle works in nav (desktop) and mobile menu. Persists across `/` → `/speakers` → reload.
- Tab order verified: nav links → register CTA → LanguageToggle → ThemeToggle → mobile menu (desktop); top to bottom inside the open menu (mobile).
- VoiceOver / browser a11y tree shows correct `aria-label` and `aria-pressed` after toggle.
- Walk in **both** modes: `/`, `/en/`, `/speakers`, `/programme`, `/sponsors`, `/team`, one legal page. Note any visual issues for Phase C.

### Commit shape

`feat: light theme by default with dark opt-in toggle` — single commit, since the changes are intertwined (token restructure + default flip + toggle component + DESIGN.md update are not independently shippable).

---

## Phase C — Polish

Triggered by walking the site in light mode after Phase B ships. Best-guess inventory:

- **Hero ambiance overlay** (`HeroSection.astro` + `public/...ambiance-00.jpg`) — add a light-mode overlay tint (e.g. warm white at 60–70 % opacity, or a brand-purple gradient at low opacity) so headline text stays legible over the photo. Implementation: a `dark:bg-…` / `bg-…` overlay div on top of the photo.
- **Glow shadows** — `--shadow-glow-primary`, `--shadow-glow-accent` likely look weird or invisible on light. Either drop them in light or swap to `--shadow-md`. Decide visually.
- **Hex mesh background pattern** — currently `--color-border at 30-40% opacity`. May need an opacity bump or hue shift on light backgrounds; verify reads correctly.
- **Card hover states** — `border-color → primary/50` should still pop on light surfaces; verify.
- **Sponsor logos** — some sponsor SVGs are designed for dark backgrounds only. If any sponsor logo breaks on light, flag for per-tier handling (separate decision; not blocking).
- **Replays page YouTube thumbnails** — verify framing reads on light.

This phase is small and scoped to what the eye catches. Each issue gets its own micro-commit.

### Verification gate (Phase C)

- Walk both modes again — every page that had Phase B issues now reads cleanly.
- `pnpm test` passes.

### Commit shape

`fix: light-mode polish — hero overlay, glows, pattern opacity` — or split per-fix if substantial.

---

## Out of scope for v1

Documented to prevent scope creep:

- Auto-following OS `prefers-color-scheme` (rejected in Q5 — always start light).
- A second hero photo for light mode (Phase C uses overlay instead; can revisit if user sources a daylit photo).
- Per-sponsor-tier light/dark logo variants (will be flagged in Phase C if a logo breaks; otherwise out of scope).
- Visual regression test suite (Playwright snapshots) — useful but is its own infra project.
- Coupling to the in-progress feature-flag system (see commits `20040aa`, `f5169b1`, `1522a86`) — do not couple two big rebuilds.
- Theme-aware OG images (the `og-default.png` stays as today; the social card doesn't need to flip).

---

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Hardcoded colors hide in components I haven't grepped yet | Phase A's audit pass uses grep + visual walk-through. Anything missed shows up as broken styling in Phase B and gets caught in the verification walk. |
| FOUC script runs before localStorage is available (private browsing, disabled storage) | `try/catch` falls back to light gracefully. |
| Stitch palette doesn't translate well to OKLCH | Stitch DS already speaks in token roles; the translation is direct. If the picked palette feels off in browser, iterate before Phase B is merged. |
| Dark-mode users disrupted by the default flip | They click the toggle once, then dark persists. The toggle is in the same place every session. The DESIGN.md rewrite documents the change. |
| Glow shadows look wrong in light and we forget Phase C | Phase B verification walk explicitly notes any "looks wrong" cases for Phase C; nothing ships visibly broken in light. |
| Hero photo + light overlay reads muddy | Phase C visual judgment call; if overlay can't make it work, fall back to a brand-purple gradient hero in light mode (no photo) as a Phase C tactical fix. |

---

## Open items for implementation plan

The `superpowers:writing-plans` skill will turn this spec into an executable plan. Items the plan will need to settle that this spec deliberately does not:

- Exact OKLCH values for the light palette (blocked on Stitch).
- Exact glow-shadow handling in light (drop vs. substitute).
- Exact hero overlay color and opacity (Phase C visual judgment).
- Order of files touched in Phase A (driven by grep results).
