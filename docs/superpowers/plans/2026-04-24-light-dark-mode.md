# Light/Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make light mode the new default visual identity of the Cloud Native Days France site, with dark preserved as an opt-in toggle in the navigation header.

**Architecture:** Three-phase rollout. Phase A is a pure-refactor tokenization pass with no visible change (replaces hardcoded `text-white`/`border-white/15`/dark logo imports with semantic tokens and theme-aware swaps). Phase B publishes the light palette (sourced from Stitch), inverts the default by moving dark values under a `.dark` class block, ships a `ThemeToggle.astro` component with bilingual labels, adds a FOUC-prevention inline script to `Layout.astro`, and rewrites `DESIGN.md`. Phase C polishes per-component visuals that need light-mode-specific treatment (hero overlay, glow shadows, hex pattern).

**Tech Stack:** Astro 6 + React islands + Tailwind 4 (CSS-vars-only theming via `@theme inline`) + shadcn/ui (`@custom-variant dark` already wired). Vitest for tests. `localStorage.theme` for persistence (origin-scoped, survives FR↔EN locale switch). All theming uses inline scripts and Astro SSR — no React island, no client bundle.

**Spec reference:** `docs/superpowers/specs/2026-04-24-light-dark-mode-design.md`

---

## File Structure

### Files modified (Phase A — tokenization pass, no visible change)

| File | Change |
|------|--------|
| `src/components/LanguageToggle.astro` | Replace `text-white`, `text-white/40`, `hover:text-white/80` with `text-foreground`, `text-muted-foreground`, `hover:text-foreground` |
| `src/components/Navigation.astro` | Replace `text-white` (link), `border-white/15` (scroll divider) with `text-foreground`, `border-border`. Replace hardcoded `dark/` logo imports with dual-render that picks via `dark:hidden`/`hidden dark:block` |
| `src/components/Footer.astro` | Replace hardcoded `dark/` logo import with dual-render |
| `src/components/hero/HeroSection.astro` | Replace hardcoded `dark/` logo import with dual-render |
| `src/components/schedule/ScheduleGrid.astro` | Replace `border-white/10` with `border-border` |

**Intentionally NOT tokenized in Phase A** (dark-by-design overlays):

- `src/components/past-editions/Edition2023Lightbox.astro` — modal lightbox uses `bg-black/90` scrim + `text-white` chrome on top. Dark scrim regardless of theme is the canonical pattern for image lightboxes (think Google Photos, GitHub). Leaving these classes hardcoded is correct.

### Files modified (Phase B — palette + toggle, visible rebrand)

| File | Change |
|------|--------|
| `src/styles/global.css` | `:root` becomes light tokens (from Stitch winner). Add `.dark { … }` block with current dark values verbatim. Brand hues stay in `:root`. Glow shadows move under `.dark`. |
| `src/layouts/Layout.astro` | Remove `class="dark"` from `<html>` (line 60). Add `<script is:inline>` FOUC-prevention block in `<head>` before `<Font>`. |
| `src/i18n/ui.ts` | Add 4 keys (FR + EN): `theme.toggle.aria.to_dark`, `theme.toggle.aria.to_light` |
| `src/components/Navigation.astro` | Import `<ThemeToggle />`; render next to `<LanguageToggle />` desktop right cluster + mobile menu top utility row |
| `DESIGN.md` | Rewrite "Dark Theme Rationale" → "Light Default + Dark Opt-in Rationale". Token table grows to two columns (Light value | Dark value). Update shadow guidance per-mode. Update Logo Backgrounds note. |

### Files created (Phase B)

| File | Responsibility |
|------|---------------|
| `src/components/ThemeToggle.astro` | Single `<button id="theme-toggle">` with two inline SVGs (sun + moon), `data-label-to-dark` / `data-label-to-light` attributes for bilingual `aria-label`, inline script that toggles `.dark` on `<html>` + writes `localStorage.theme`. No React, no client bundle. |
| `tests/build/theme-toggle-i18n.test.ts` | Vitest assertion that the four new i18n keys exist for both `fr` and `en` (a parity-check stronger than the existing `i18n-parity.test.ts` because it asserts the *specific* keys, not just key-set equality). |
| `tests/build/theme-css-shape.test.ts` | Vitest assertion that `global.css` contains a top-level `.dark { … }` block AND that the brand hue tokens (`--primary`, `--accent`, `--destructive`) live in `:root`, not under `.dark`. |

### Files modified (Phase C — polish, reactive)

Per-component, surfaced by walking the live site in light mode after Phase B ships. Best-guess inventory below; each fix is its own micro-commit.

| File | Likely change |
|------|---------------|
| `src/components/hero/HeroSection.astro` | Add a light-mode overlay tint over `ambiance-00.jpg` so headline text stays legible. |
| `src/styles/global.css` | Light-mode `--shadow-glow-*` either dropped (`none`) or substituted with `var(--shadow-md)`. |
| `src/components/patterns/*.astro` (if any) | Hex mesh pattern opacity / hue tweak if it reads weak on light bg. |

---

## Phase A — Tokenization pass (no visible change)

> **Goal of this phase:** the site looks identical to `main` after every commit. We are only swapping hardcoded color literals for semantic tokens and making logo imports theme-aware. The `<html class="dark">` line stays — Phase B inverts the default.

---

### Task A1: Tokenize `LanguageToggle.astro`

**Files:**
- Modify: `src/components/LanguageToggle.astro:14,20`

- [ ] **Step 1: Confirm baseline — current dark site renders identically before changes**

Run: `pnpm dev`
Open: `http://localhost:4321/`
Inspect the `EN / FR` language switcher in the nav header. Note what it looks like (current locale label brighter, other locale dim, slash separator dim). This is the visual we must preserve.

- [ ] **Step 2: Replace hardcoded white classes with semantic tokens**

Edit `src/components/LanguageToggle.astro`:

```astro
<nav aria-label={t("toggle.aria")} class="inline-flex items-center gap-0 text-xs font-medium tracking-wide">
  {entries.map(([lang, label], i) => (
    <>
      {i > 0 && <span aria-hidden="true" class="px-1 text-muted-foreground">/</span>}
      <a
        href={getLocalePath(lang, currentPath)}
        aria-current={lang === currentLang ? "true" : undefined}
        class:list={[
          "uppercase rounded-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          lang === currentLang ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        ]}
      >
        {label}
      </a>
    </>
  ))}
</nav>
```

Why these mappings: `text-white` (active label) → `text-foreground` (will read as white today against the dark `.dark` background, will read as near-black after Phase B inverts). `text-white/40` (inactive label, slash separator) → `text-muted-foreground` (DESIGN.md token: secondary text/captions). `hover:text-white/80` → `hover:text-foreground` (full foreground on hover is the standard hover pattern; matches what shadcn does).

- [ ] **Step 3: Verify no visible change**

Run: `pnpm dev` (if not already running)
Reload `http://localhost:4321/` and `http://localhost:4321/en/`. The language switcher must look identical to Step 1's baseline. Take a screenshot of each (desktop + mobile widths via dev-tools device toggle) for the PR.

- [ ] **Step 4: Run test suite — confirm nothing broke**

Run: `pnpm test`
Expected: all tests pass (no test asserts colors).

- [ ] **Step 5: Commit**

```bash
git add src/components/LanguageToggle.astro
git commit -m "refactor: tokenize LanguageToggle hardcoded white classes

Replace text-white, text-white/40, hover:text-white/80 with semantic
tokens (text-foreground, text-muted-foreground, hover:text-foreground)
so the component themes correctly when light mode lands. No visible
change while .dark stays the default on <html>."
```

---

### Task A2: Tokenize `Navigation.astro` link + scroll divider

**Files:**
- Modify: `src/components/Navigation.astro:72,159`

- [ ] **Step 1: Edit the desktop nav link class list**

In `src/components/Navigation.astro` find the `<a>` inside the desktop links `<ul>` (around line 72) and replace `text-white` with `text-foreground`:

```astro
class:list={[
  "text-sm font-medium text-foreground transition-colors pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
  active
    ? "border-b-2 border-primary"
    : "border-b-2 border-transparent hover:border-primary/60",
]}
```

- [ ] **Step 2: Edit the scroll-divider script (line ~159)**

In the `<script>` block at the bottom of `Navigation.astro`, the `onScroll` handler toggles `border-white/15` when scrolled. Change to `border-border`:

```ts
const onScroll = () => {
  const scrolled = window.scrollY > 0;
  header.classList.toggle("border-border", scrolled);
  header.classList.toggle("shadow-[0_4px_12px_rgba(0,0,0,0.2)]", scrolled);
  header.classList.toggle("border-transparent", !scrolled);
};
```

The shadow class stays as a literal `rgba(0,0,0,0.2)` — that's a drop shadow color, not a foreground/background color, and a 20% black drop reads correctly on both light and dark backgrounds. Tokenizing it would be premature.

- [ ] **Step 3: Verify no visible change**

Run: `pnpm dev`
Reload `/`. Scroll down. The nav should still get a subtle border + shadow when scrolled (currently dark bg so the border reads white-ish via `--border` resolving to a light purple — visually equivalent to the old `border-white/15`).

- [ ] **Step 4: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Navigation.astro
git commit -m "refactor: tokenize Navigation link color and scroll divider

Replace text-white on desktop nav links with text-foreground; replace
border-white/15 on the scrolled header divider with border-border. The
black-dropshadow literal stays — it reads correctly on both light and
dark and isn't tied to surface color."
```

---

### Task A3: Make logo imports theme-aware

**Files:**
- Modify: `src/components/Navigation.astro:5-6,55-58`
- Modify: `src/components/Footer.astro:3` (and the `<img>` site that uses it)
- Modify: `src/components/hero/HeroSection.astro:8` (and the `<img>` site that uses it)

> **Why dual-render rather than a JS swap:** Astro builds statically. A theme-aware logo needs to render correctly in both modes the moment the page paints — *before* any JS runs. Rendering both `<img>` tags and hiding one with Tailwind's `dark:` variant is the only zero-flicker pattern. The cost is two HTTP requests for two SVGs, but they're tiny (≤4 KB each) and cacheable.

- [ ] **Step 1: Modify `Navigation.astro` imports and `<img>` block**

Replace lines 5-6 of `src/components/Navigation.astro`:

```astro
import logoFullDark from "@/assets/logos/dark/logo.svg";
import logoCompactDark from "@/assets/logos/dark/logo-notext.svg";
import logoFullLight from "@/assets/logos/principal/logo.svg";
import logoCompactLight from "@/assets/logos/principal/logo-notext.svg";
```

Replace the `<a>` block at lines 55-58:

```astro
<a href={homeHref} class="shrink-0 flex items-center" aria-label="CND France">
  <!-- Compact mark (mobile) -->
  <img src={logoCompactLight.src} alt="CND France" class="h-8 md:hidden dark:hidden" />
  <img src={logoCompactDark.src}  alt="CND France" class="h-8 md:hidden hidden dark:block" />
  <!-- Full wordmark (desktop) -->
  <img src={logoFullLight.src} alt="CND France" class="hidden md:block md:h-10 dark:hidden" />
  <img src={logoFullDark.src}  alt="CND France" class="hidden md:dark:block md:h-10" />
</a>
```

Note: Tailwind doesn't natively support compound `md:dark:block`. Confirm by checking the rendered HTML in the browser; if the dark wordmark doesn't appear at md+ in dark mode, fall back to:

```astro
<img src={logoFullDark.src} alt="CND France" class="hidden md:block md:h-10 dark:block hidden" />
```

…and reorder the `dark:hidden` / `dark:block` classes so the `dark:` variant wins on desktop. Test both modes at desktop and mobile widths to verify all four states render the right asset.

- [ ] **Step 2: Modify `Footer.astro` imports and `<img>` block**

Read `src/components/Footer.astro` first to find the current import line (line 3) and the `<img>` site that consumes it. Replace:

```astro
import logoFullDark from "@/assets/logos/dark/logo.svg";
import logoFullLight from "@/assets/logos/principal/logo.svg";
```

And at the `<img>` site:

```astro
<img src={logoFullLight.src} alt="CND France" class="dark:hidden h-10" />
<img src={logoFullDark.src}  alt="CND France" class="hidden dark:block h-10" />
```

(Adjust `h-10` to whatever the existing class set is — keep all non-color classes verbatim.)

- [ ] **Step 3: Modify `HeroSection.astro` imports and `<img>` block**

Same pattern as Footer. Read first, then replace the single `dark/logo.svg` import with paired light + dark imports, and dual-render the `<img>`.

- [ ] **Step 4: Verify both modes render the right asset**

Run: `pnpm dev`
Reload `/`. The dark logo (current `dark/logo.svg`) should still appear because `<html>` still has `class="dark"`. Open dev tools, manually remove the `dark` class from `<html>`, and the light logo (`principal/logo.svg`) should appear instantly without reload. Re-add `dark`, the dark logo returns. Repeat at mobile width (the compact mark should swap correctly too).

- [ ] **Step 5: Run test suite**

Run: `pnpm test`
Expected: all tests pass. (No existing test imports these logo paths.)

- [ ] **Step 6: Commit**

```bash
git add src/components/Navigation.astro src/components/Footer.astro src/components/hero/HeroSection.astro
git commit -m "refactor: dual-render logos for theme-aware swap

Import both principal/ (light bg) and dark/ logo variants in Navigation,
Footer, and HeroSection. Render both <img> tags and hide one with
dark:hidden / hidden dark:block so the correct logo paints
synchronously without a JS swap. No visible change while <html> stays
class=dark."
```

---

### Task A4: Tokenize `ScheduleGrid.astro` sticky header

**Files:**
- Modify: `src/components/schedule/ScheduleGrid.astro:123`

- [ ] **Step 1: Replace `border-white/10`**

In `src/components/schedule/ScheduleGrid.astro` line 123, the sticky day-header uses `border-white/10`. Change to `border-border`:

```astro
<div class="sticky top-[64px] z-20 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-3 bg-background/90 backdrop-blur-sm border-b border-border">
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Open `/programme`. Scroll. The sticky day-header divider must still be visible (currently a faint white line on dark bg).

- [ ] **Step 3: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/schedule/ScheduleGrid.astro
git commit -m "refactor: tokenize ScheduleGrid sticky header divider

Replace border-white/10 with border-border so the sticky day-header
divider themes correctly in light mode."
```

---

### Task A5: Phase A audit + verification gate

**Files:**
- (read-only inspection)

- [ ] **Step 1: Re-grep for any remaining hardcoded colors in `src/`**

Run:

```bash
grep -rn 'text-white\|border-white\|bg-white\|text-black\|bg-black\|text-purple-\|bg-purple-' src/ --include='*.astro' --include='*.tsx' --include='*.ts'
```

Expected output (only the lightbox carve-out should remain):

```
src/components/past-editions/Edition2023Lightbox.astro:49:  class="… bg-black/90 …"
src/components/past-editions/Edition2023Lightbox.astro:63:    <div class="… text-white">
src/components/past-editions/Edition2023Lightbox.astro:71:        class="… bg-white/10 hover:bg-white/20 text-white …"
src/components/past-editions/Edition2023Lightbox.astro:99:        class="… text-white/80 …"
src/components/past-editions/Edition2023Lightbox.astro:111:        class="… bg-white/10 hover:bg-white/20 text-white …"
src/components/past-editions/Edition2023Lightbox.astro:121:        class="… bg-white/10 hover:bg-white/20 text-white …"
```

If any other lines appear, tokenize them following the patterns above (`text-white` → `text-foreground`, `text-white/40` → `text-muted-foreground`, `border-white/N` → `border-border`) and add another commit.

- [ ] **Step 2: Re-grep for `dark/logo` and `principal/logo` imports**

Run:

```bash
grep -rn 'logos/dark\|logos/principal' src/ --include='*.astro' --include='*.tsx' --include='*.ts'
```

Expected: every match is paired (a `dark/` line and a `principal/` line in the same file), in `Navigation.astro`, `Footer.astro`, `HeroSection.astro`. If any file has only a `dark/` import without a paired `principal/`, that's an unmigrated logo — apply the dual-render pattern from Task A3.

- [ ] **Step 3: Visual walk-through (still dark, since `<html class=dark>` is unchanged)**

Run: `pnpm dev`
Walk these pages in browser at desktop + mobile widths and confirm zero visual change vs `main`:

- `/`
- `/en/`
- `/speakers`
- `/programme`
- `/sponsors`
- `/team`
- `/venue`
- One legal page (e.g. `/mentions-legales` or `/legal`)

For each, eyeball: logo, nav links, language toggle, hero, sticky headers, card chrome, footer. Anything that looks different from `main` is a Phase A bug — debug and fix before proceeding.

- [ ] **Step 4: Run test suite one more time**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Verification commit (no code change — adds a marker)**

If everything checks out, no commit is needed for this task; Phase A is done. If you'd like a tag for clarity, run:

```bash
git tag -a phase-a-tokenization -m "Tokenization pass complete; site visually unchanged"
```

(Don't push the tag unless the user asks — local-only marker.)

---

## Phase B — Light palette + toggle (visible rebrand)

> **Goal of this phase:** the site visually flips to light by default. Dark is preserved as an opt-in via the new `ThemeToggle` button. The `DESIGN.md` rationale is rewritten. After this phase, every visitor with no `localStorage.theme` set sees the new light brand.

---

### Task B0: INPUT GATE — Stitch palette winner

**Files:** *(none — this is a coordination task)*

- [ ] **Step 1: Confirm Stitch palette is finalized**

Per the spec, the user is responsible for producing in Stitch:
- 3 light-palette directions on the existing CND France 2027 design system
- One representative mockup per direction (hero + Edition 2026 card section)
- Picking a winner

**Do not proceed with Tasks B1–B7 until the user has handed over:**

1. The 9-token light OKLCH set (or color names mapped to OKLCH values):
   - `--background`
   - `--foreground`
   - `--card`, `--card-foreground`
   - `--popover`, `--popover-foreground`
   - `--secondary`, `--secondary-foreground`
   - `--muted`, `--muted-foreground`
   - `--border`, `--input`
   - `--ring`
   - Sidebar variants (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`)

2. Confirmation that brand hues stay unchanged (`--primary`, `--accent`, `--destructive`, `--chart-1` through `--chart-5`).

3. Decision on glow shadows in light mode: **drop** (set to `none`) or **substitute** with `--shadow-md`. Recommend dropping for v1; can be added back as part of Phase C if visually needed.

- [ ] **Step 2: Record the palette in this plan**

Once received, replace the `// LIGHT PALETTE FROM STITCH` placeholder block in Task B1 below with the actual OKLCH values. Commit this plan update first (so the values are in git history before any code references them):

```bash
git add docs/superpowers/plans/2026-04-24-light-dark-mode.md
git commit -m "docs: record light palette from Stitch in implementation plan"
```

---

### Task B1: Restructure `global.css` — light becomes default, dark moves to `.dark` block

**Files:**
- Modify: `src/styles/global.css`

> **Critical**: do NOT touch the `@media (prefers-reduced-motion: reduce)` block or the `:target { scroll-margin-top: 5rem; }` block. The existing `tests/build/a11y-motion-reset.test.ts` asserts the motion reset block is top-level (not inside `@layer`) and contains four specific declarations. Preserve verbatim.

- [ ] **Step 1: Write the failing test for the new CSS shape**

Create `tests/build/theme-css-shape.test.ts`:

```ts
/**
 * Theme CSS shape guard.
 *
 * Asserts that src/styles/global.css has the post-rebrand structure:
 *   1. A top-level `.dark { … }` block exists (holds dark token overrides).
 *   2. Brand hue tokens (--primary, --accent, --destructive) live in :root,
 *      not inside .dark — they must NOT change between modes.
 *   3. The `:root` block defines --background as a light value (lightness >= 90%).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(import.meta.dirname, "../../src/styles/global.css");

function readCss(): string {
  return readFileSync(CSS_PATH, "utf-8");
}

/** Extract the contents of the first matching top-level block: `selector { … }`. */
function extractBlock(css: string, selector: string): string | null {
  const re = new RegExp(`(?:^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*\\{`, "g");
  const m = re.exec(css);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  return css.slice(m.index + m[0].length, i - 1);
}

describe("theme CSS shape (light default + .dark override)", () => {
  it("contains a top-level .dark { … } block", () => {
    const css = readCss();
    const dark = extractBlock(css, "\\.dark");
    expect(dark, "missing top-level .dark block").not.toBeNull();
    expect(dark!.length, ".dark block is empty").toBeGreaterThan(0);
  });

  it("brand hue tokens live in :root, not in .dark", () => {
    const css = readCss();
    const root = extractBlock(css, ":root");
    const dark = extractBlock(css, "\\.dark");
    expect(root, "missing :root block").not.toBeNull();
    for (const token of ["--primary:", "--accent:", "--destructive:"]) {
      expect(root!.includes(token), `${token} must be defined in :root`).toBe(true);
      expect(dark!.includes(token), `${token} must NOT be redefined in .dark`).toBe(false);
    }
  });

  it("--background in :root is a light OKLCH value (lightness >= 90%)", () => {
    const css = readCss();
    const root = extractBlock(css, ":root")!;
    const m = root.match(/--background:\s*oklch\(\s*([\d.]+)%/);
    expect(m, ":root must define --background as oklch(...)").not.toBeNull();
    const lightness = Number(m![1]);
    expect(lightness, `--background lightness ${lightness}% should be >= 90% for light mode`).toBeGreaterThanOrEqual(90);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `pnpm test tests/build/theme-css-shape.test.ts`
Expected: 3 failures — `:root` does not yet contain a light `--background`, and there is no `.dark` block.

- [ ] **Step 3: Restructure `global.css`**

Replace the entire `:root { … }` block (lines 8-43) with the new structure. The light tokens come from the user-provided Stitch palette (Task B0). For values not yet provided, use these placeholders that will satisfy the test temporarily — replace with real Stitch values before committing:

```css
/* Design tokens from DESIGN.md -- single source of truth.
   Light is the default; dark is opt-in via the .dark class on <html>. */
:root {
  /* Mode-specific surface/text/border tokens — LIGHT defaults from Stitch */
  --background: oklch(98.4% 0.005 286);             /* LIGHT PALETTE FROM STITCH */
  --foreground: oklch(15.0% 0.045 286);             /* LIGHT PALETTE FROM STITCH */
  --card: oklch(100% 0 0);                          /* LIGHT PALETTE FROM STITCH */
  --card-foreground: oklch(15.0% 0.045 286);        /* LIGHT PALETTE FROM STITCH */
  --popover: oklch(100% 0 0);                       /* LIGHT PALETTE FROM STITCH */
  --popover-foreground: oklch(15.0% 0.045 286);     /* LIGHT PALETTE FROM STITCH */
  --secondary: oklch(95.0% 0.012 286);              /* LIGHT PALETTE FROM STITCH */
  --secondary-foreground: oklch(20.0% 0.060 286);   /* LIGHT PALETTE FROM STITCH */
  --muted: oklch(95.0% 0.012 286);                  /* LIGHT PALETTE FROM STITCH */
  --muted-foreground: oklch(45.0% 0.030 286);       /* LIGHT PALETTE FROM STITCH */
  --border: oklch(88.0% 0.020 286);                 /* LIGHT PALETTE FROM STITCH */
  --input: oklch(88.0% 0.020 286);                  /* LIGHT PALETTE FROM STITCH */
  --ring: oklch(62.5% 0.162 259.9);                 /* primary blue, same hue both modes */

  --sidebar: oklch(98.4% 0.005 286);                /* LIGHT PALETTE FROM STITCH */
  --sidebar-foreground: oklch(15.0% 0.045 286);     /* LIGHT PALETTE FROM STITCH */
  --sidebar-primary: oklch(62.5% 0.162 259.9);
  --sidebar-primary-foreground: oklch(100% 0 0);
  --sidebar-accent: oklch(95.0% 0.012 286);         /* LIGHT PALETTE FROM STITCH */
  --sidebar-accent-foreground: oklch(20.0% 0.060 286); /* LIGHT PALETTE FROM STITCH */
  --sidebar-border: oklch(88.0% 0.020 286);         /* LIGHT PALETTE FROM STITCH */
  --sidebar-ring: oklch(62.5% 0.162 259.9);

  /* Brand hues — same in light and dark, never overridden */
  --primary: oklch(62.5% 0.162 259.9);              /* CND blue */
  --primary-foreground: oklch(100% 0 0);
  --accent: oklch(76.6% 0.142 10.1);                /* CND pink */
  --accent-foreground: oklch(16.8% 0.052 286.4);    /* dark text on pink (works on light & dark) */
  --destructive: oklch(54.0% 0.216 25.2);           /* CND red */
  --destructive-foreground: oklch(100% 0 0);
  --chart-1: oklch(62.5% 0.162 259.9);
  --chart-2: oklch(54.0% 0.216 25.2);
  --chart-3: oklch(76.6% 0.142 10.1);
  --chart-4: oklch(88.4% 0.061 244.8);
  --chart-5: oklch(24.6% 0.101 286.7);

  /* Light-mode shadows: traditional drop shadows */
  --shadow-glow-primary: none;                      /* glows are dark-only */
  --shadow-glow-accent: none;

  --radius: 6px;
}

/* Dark opt-in — preserves the v1.0 dark palette verbatim */
.dark {
  --background: oklch(16.8% 0.052 286.4);
  --foreground: oklch(95.6% 0.023 291.3);
  --card: oklch(22.5% 0.083 285.5);
  --card-foreground: oklch(95.6% 0.023 291.3);
  --popover: oklch(22.5% 0.083 285.5);
  --popover-foreground: oklch(95.6% 0.023 291.3);
  --secondary: oklch(27.1% 0.091 286.5);
  --secondary-foreground: oklch(95.6% 0.023 291.3);
  --muted: oklch(27.1% 0.091 286.5);
  --muted-foreground: oklch(66.8% 0.047 290.8);
  --border: oklch(30.8% 0.102 285.5);
  --input: oklch(30.8% 0.102 285.5);
  --ring: oklch(62.5% 0.162 259.9);

  --sidebar: oklch(16.8% 0.052 286.4);
  --sidebar-foreground: oklch(95.6% 0.023 291.3);
  --sidebar-accent: oklch(27.1% 0.091 286.5);
  --sidebar-accent-foreground: oklch(95.6% 0.023 291.3);
  --sidebar-border: oklch(30.8% 0.102 285.5);

  /* Dark-mode shadows: glow effects on CTAs */
  --shadow-glow-primary: 0 0 20px oklch(62.5% 0.162 259.9 / 0.3);
  --shadow-glow-accent: 0 0 20px oklch(76.6% 0.142 10.1 / 0.25);
}
```

Lines 45-87 (`@theme inline { … }`) stay unchanged — they already point at `var(--background)` etc., so the indirection works for both modes. Lines 89-99 (`@layer base { … }`) stay unchanged. The motion-reset block (lines 101-112) and `:target` rule (lines 114-119) stay verbatim.

- [ ] **Step 4: Run the test — confirm it passes**

Run: `pnpm test tests/build/theme-css-shape.test.ts`
Expected: 3 passes.

- [ ] **Step 5: Run the existing motion-reset test — confirm it still passes**

Run: `pnpm test tests/build/a11y-motion-reset.test.ts`
Expected: 4 passes. (If any fail, the motion block was accidentally moved into a `@layer` or its declarations were modified — fix and re-run.)

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 7: Visual sanity check (still dark — `<html class=dark>` not yet removed)**

Run: `pnpm dev`
Open `/`. The site must still render dark (because `<html class="dark">` is still in `Layout.astro`). If you see the light palette, something forced the order — verify `<html>` still has `class="dark"`. Walk the homepage and confirm zero visible change vs `main`.

- [ ] **Step 8: Commit**

```bash
git add src/styles/global.css tests/build/theme-css-shape.test.ts
git commit -m "feat: split theme tokens into light :root + .dark override

Move the v1.0 dark palette under .dark { } so it becomes opt-in. :root
now holds the new light-default palette (placeholder values until
Stitch winner is recorded — see Task B0). Brand hues live once in
:root and never change between modes. Add theme-css-shape.test.ts to
guard the structure."
```

---

### Task B2: Add FOUC-prevention script + remove hardcoded `class="dark"`

**Files:**
- Modify: `src/layouts/Layout.astro:60-63`

- [ ] **Step 1: Edit `Layout.astro`**

In `src/layouts/Layout.astro`, line 60 currently reads:

```astro
<html lang={resolvedLang} class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
```

Change to:

```astro
<html lang={resolvedLang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script is:inline>
      try {
        if (localStorage.getItem('theme') === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (_) {}
    </script>
```

The `is:inline` directive keeps the script out of the bundled JS so it executes synchronously during HTML parsing, before any body content paints. The `try/catch` guards against environments where `localStorage` throws (Safari private browsing in some configurations).

- [ ] **Step 2: Visual verification — light is now default**

Run: `pnpm dev`
Open a fresh incognito window on `http://localhost:4321/`. The site must now render in **light mode** (placeholder palette from B1; not necessarily pretty yet — that's expected, real values come from Stitch). The dark palette is gone unless you opt in.

In dev tools console, run:

```js
localStorage.setItem('theme', 'dark'); location.reload();
```

The site must reload directly into dark mode with **no flash of light** before dark applies (FOUC test). Throttle CPU to 6× slowdown in dev tools and reload again to be sure.

Then:

```js
localStorage.removeItem('theme'); location.reload();
```

The site must return to light, again with no flash.

- [ ] **Step 3: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: flip default to light, add FOUC-prevention inline script

Remove hardcoded class=dark from <html>. Add an is:inline <head>
script that reads localStorage.theme and applies .dark synchronously
before paint. The OS prefers-color-scheme is intentionally ignored
(per spec Q5 = A — light is the new brand default)."
```

---

### Task B3: Add the four theme i18n keys

**Files:**
- Modify: `src/i18n/ui.ts`
- Create: `tests/build/theme-toggle-i18n.test.ts`

> **Why a dedicated test:** the existing `i18n-parity.test.ts` only checks that FR and EN have *the same* key set — it would pass if both locales were missing the new keys. We need a stronger guard that the four specific theme keys exist.

- [ ] **Step 1: Write the failing test**

Create `tests/build/theme-toggle-i18n.test.ts`:

```ts
/**
 * ThemeToggle i18n key guard.
 *
 * Asserts that the four theme-toggle aria-label keys exist in BOTH
 * fr and en, and that the FR and EN values for each key are NOT
 * byte-identical (would indicate an accidental copy/paste).
 */
import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

const KEYS = [
  "theme.toggle.aria.to_dark",
  "theme.toggle.aria.to_light",
] as const;

describe("ThemeToggle i18n keys", () => {
  it.each(KEYS)("key %s exists in fr", (key) => {
    expect((ui.fr as Record<string, string>)[key]).toBeTruthy();
  });

  it.each(KEYS)("key %s exists in en", (key) => {
    expect((ui.en as Record<string, string>)[key]).toBeTruthy();
  });

  it.each(KEYS)("FR value for %s differs from EN", (key) => {
    const fr = (ui.fr as Record<string, string>)[key];
    const en = (ui.en as Record<string, string>)[key];
    expect(fr).not.toBe(en);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `pnpm test tests/build/theme-toggle-i18n.test.ts`
Expected: failures because the keys don't exist yet.

- [ ] **Step 3: Add the keys to both `fr` and `en` blocks of `ui.ts`**

Open `src/i18n/ui.ts`. In the `fr` object, add (placement: near other `*.aria` keys, e.g. after `"toggle.aria"`):

```ts
"theme.toggle.aria.to_dark": "Basculer en mode sombre",
"theme.toggle.aria.to_light": "Basculer en mode clair",
```

In the `en` object, add the matching keys at the same relative position:

```ts
"theme.toggle.aria.to_dark": "Switch to dark mode",
"theme.toggle.aria.to_light": "Switch to light mode",
```

- [ ] **Step 4: Run the new test — confirm it passes**

Run: `pnpm test tests/build/theme-toggle-i18n.test.ts`
Expected: 6 passes (2 keys × 3 assertions).

- [ ] **Step 5: Run the existing parity test**

Run: `pnpm test tests/build/i18n-parity.test.ts`
Expected: passes (FR and EN both got the same 2 new keys).

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ui.ts tests/build/theme-toggle-i18n.test.ts
git commit -m "feat(i18n): add theme.toggle.aria keys for FR + EN

Adds the four bilingual aria-label strings that ThemeToggle.astro will
render via data-* attributes. Includes a dedicated test that asserts
the keys exist in both locales and that FR/EN values aren't
byte-identical."
```

---

### Task B4: Create `ThemeToggle.astro` component

**Files:**
- Create: `src/components/ThemeToggle.astro`

- [ ] **Step 1: Create the component**

Create `src/components/ThemeToggle.astro` with this content:

```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const labelToDark = t("theme.toggle.aria.to_dark");
const labelToLight = t("theme.toggle.aria.to_light");
---

<button
  id="theme-toggle"
  type="button"
  class="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  aria-label={labelToDark}
  aria-pressed="false"
  data-label-to-dark={labelToDark}
  data-label-to-light={labelToLight}
>
  <!-- Sun icon: visible in light mode (current = light → next = dark) -->
  <svg
    class="dark:hidden"
    xmlns="http://www.w3.org/2000/svg"
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/><path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/><path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </svg>
  <!-- Moon icon: visible in dark mode (current = dark → next = light) -->
  <svg
    class="hidden dark:block"
    xmlns="http://www.w3.org/2000/svg"
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
</button>

<script>
  const btn = document.getElementById("theme-toggle") as HTMLButtonElement | null;
  if (btn) {
    const toDark = btn.dataset.labelToDark ?? "Switch to dark mode";
    const toLight = btn.dataset.labelToLight ?? "Switch to light mode";

    // Sync initial state in case the FOUC script applied .dark before this ran.
    const startDark = document.documentElement.classList.contains("dark");
    btn.setAttribute("aria-pressed", String(startDark));
    btn.setAttribute("aria-label", startDark ? toLight : toDark);

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      try {
        if (isDark) localStorage.setItem("theme", "dark");
        else localStorage.removeItem("theme");
      } catch (_) {}
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? toLight : toDark);
    });
  }
</script>
```

Notes on the SVGs: both use `currentColor` so they pick up `text-foreground` from the button class. The 20px icon size matches the project's existing icon scale (Navigation hamburger uses 24px; 20px is appropriate for a tighter utility button).

- [ ] **Step 2: Visual smoke test — render in isolation by temporarily importing into a page**

Add a temporary import to `src/pages/index.astro` (or any homepage), drop a `<ThemeToggle />` somewhere visible, and run `pnpm dev`. Click the button:

- The icon swap (sun ↔ moon) happens immediately on click.
- `localStorage.theme` updates (verify in dev tools Application tab).
- Reload — the persisted theme is restored without flash (FOUC script in B2 handles this).
- `aria-pressed` flips on the button (verify in dev tools Elements tab).
- `aria-label` updates (verify same).

Once verified, **remove the temporary import** — the toggle will be wired into Navigation in Task B5.

- [ ] **Step 3: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeToggle.astro
git commit -m "feat: add ThemeToggle.astro component

Sun/moon icon button with bilingual aria-label (data-* attributes
pre-populated from i18n). Inline script toggles .dark on <html> and
persists choice in localStorage. No React, no client bundle. Synced
with FOUC script so initial aria state is correct on first paint."
```

---

### Task B5: Wire `ThemeToggle` into `Navigation.astro` (desktop + mobile)

**Files:**
- Modify: `src/components/Navigation.astro`

- [ ] **Step 1: Import the component**

In `src/components/Navigation.astro`, after the existing `import LanguageToggle from "@/components/LanguageToggle.astro";` line, add:

```astro
import ThemeToggle from "@/components/ThemeToggle.astro";
```

- [ ] **Step 2: Render in the desktop right-side cluster**

Find the desktop right cluster (around lines 84-94) and insert `<ThemeToggle />` between the register CTA and `<LanguageToggle />`:

```astro
<!-- Right side -->
<div class="flex items-center gap-3">
  <a
    href={TICKETING_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="hidden md:inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium px-4 h-9 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    {ctaLabel}
  </a>
  <ThemeToggle />
  <LanguageToggle />
  <button
    id="mobile-menu-btn"
    …
  >
```

- [ ] **Step 3: Render in the mobile menu panel**

Find the mobile menu panel (around lines 110-135). Add a utility-row `<li>` at the top of the `<ul>` containing both `<ThemeToggle />` and `<LanguageToggle />` side by side (this is the only place in mobile where these utility controls live):

```astro
<!-- Mobile menu panel -->
<div id="mobile-menu" class="hidden md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
  <ul class="px-4 py-2" role="list">
    <li class="flex items-center justify-end gap-3 py-3 border-b border-border">
      <ThemeToggle />
      <LanguageToggle />
    </li>
    {links.map(({ label, href, active, postEventOnly }) => (
      …
    ))}
    <li>
      <a href="#" class="…">{ctaLabel}</a>
    </li>
  </ul>
</div>
```

> **Note on duplication:** rendering `<ThemeToggle />` twice (desktop nav + mobile panel) means the inline script in the component runs against two `<button id="theme-toggle">` elements — but `getElementById` only returns the first. To avoid this collision, change Step 1 of Task B4 to use a class instead of an ID, OR (simpler) only render the mobile copy when actually visible. Pick one:
>
> **Option (a) — class-based selector:** in `ThemeToggle.astro`, change `id="theme-toggle"` to `class="theme-toggle"` and the script to `document.querySelectorAll(".theme-toggle").forEach(btn => { … })`. Each button binds its own listener and updates its own attributes. **Cost:** the script grows by one `forEach`; behavior is identical.
>
> **Option (b) — single rendered button:** the mobile menu is hidden via `md:hidden` but its `<ThemeToggle>` still renders into the DOM. So Option (a) is required regardless. **Pick Option (a).**
>
> Apply Option (a) to Task B4's component before continuing — see step "B4 amendment" below.

- [ ] **Step 4: B4 amendment — switch ThemeToggle to class-based selector**

Edit `src/components/ThemeToggle.astro`. Change `id="theme-toggle"` on the button to `class="theme-toggle <existing-classes>"` (preserve all existing classes). Change the inline `<script>` to:

```ts
<script>
  document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((btn) => {
    const toDark = btn.dataset.labelToDark ?? "Switch to dark mode";
    const toLight = btn.dataset.labelToLight ?? "Switch to light mode";

    const startDark = document.documentElement.classList.contains("dark");
    btn.setAttribute("aria-pressed", String(startDark));
    btn.setAttribute("aria-label", startDark ? toLight : toDark);

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      try {
        if (isDark) localStorage.setItem("theme", "dark");
        else localStorage.removeItem("theme");
      } catch (_) {}
      // Update ALL toggle buttons on the page (desktop + mobile)
      document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((b) => {
        b.setAttribute("aria-pressed", String(isDark));
        b.setAttribute("aria-label", isDark ? toLight : toDark);
      });
    });
  });
</script>
```

The click handler now updates *all* `.theme-toggle` buttons so desktop and mobile stay in sync after a click in either.

- [ ] **Step 5: Visual + behavioral verification**

Run: `pnpm dev`. Test in fresh incognito at:

**Desktop (≥768px):**
- ThemeToggle is visible in the nav, between register CTA and language toggle.
- Click it → site flips to dark (or light if starting in dark). `localStorage.theme` updates. Reload — theme persists.
- Tab order: hamburger button is hidden at desktop, so the order is: home logo → nav links → register CTA → ThemeToggle → LanguageToggle. Verify with Tab key.

**Mobile (<768px, e.g. dev tools 390×844):**
- Hamburger menu opens. The first row inside the menu is the utility row with ThemeToggle + LanguageToggle, right-aligned.
- Click ThemeToggle in mobile → site flips. Close menu, reopen — toggle button reflects the new state correctly.
- Click ThemeToggle in desktop after it's been clicked in mobile (resize back up) — both buttons stay in sync (they share the same `localStorage` and inline script keeps DOM in sync via the `forEach` in the click handler).

**A11y:**
- Hover ThemeToggle (desktop) — bg picks up `hover:bg-muted` (subtle).
- Focus ThemeToggle with Tab — focus ring visible.
- Open browser inspector → accessibility tree → ThemeToggle button shows `aria-pressed` + `aria-label` correctly. Label flips after click.

- [ ] **Step 6: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/Navigation.astro src/components/ThemeToggle.astro
git commit -m "feat: wire ThemeToggle into Navigation desktop + mobile menu

Renders next to LanguageToggle in the desktop right cluster and as a
top utility row in the mobile menu panel. Switched ThemeToggle to a
class-based selector so multiple instances on the same page stay in
sync after either is clicked."
```

---

### Task B6: Rewrite `DESIGN.md`

**Files:**
- Modify: `DESIGN.md`

> **Why this is its own task:** DESIGN.md is the design contract and the source of truth referenced by `.planning.gsd-archive/` and the project skills. Updating it correctly is non-trivial: the OKLCH token table needs to grow to two columns, the Dark Theme Rationale section needs to be replaced (not just edited), and the Logo Usage / Backgrounds guidance needs flipping.

- [ ] **Step 1: Update the "Semantic Token Map" table to two columns**

In `DESIGN.md`, find the "Semantic Token Map" section (around line 25). The current table has three columns: `Token | OKLCH Value | Hex Approx | Usage`. Replace with a four-column table:

```markdown
| Token | Light value | Dark value | Usage |
|-------|-------------|-----------|-------|
| `--background` | oklch(98.4% 0.005 286) ≈ #fafafc | oklch(16.8% 0.052 286.4) ≈ #0e0a24 | Page background |
| `--foreground` | oklch(15.0% 0.045 286) ≈ #14102d | oklch(95.6% 0.023 291.3) ≈ #f0eeff | Primary text |
| ...etc for every mode-specific token... |
```

For tokens that don't change between modes (`--primary`, `--accent`, `--destructive`, `--chart-*`), keep a single value column or note "same in both modes".

Use the actual Stitch-derived OKLCH values from Task B0 (the Hex approximations can be computed via any OKLCH→sRGB tool or omitted if not previously cited).

- [ ] **Step 2: Replace "Dark Theme Rationale" with "Light Default + Dark Opt-in Rationale"**

Find the "Dark Theme Rationale" section (around line 292). Replace with:

```markdown
## Light Default + Dark Opt-in Rationale

The 2027 edition refreshes the brand to a light-default visual identity, with dark preserved as an opt-in choice via the navigation toggle. Reasoning:

1. **Brand refresh.** A lighter visual identity reads as a deliberate evolution from the v1.0 dark site — fresh, current, and distinct from prior editions.
2. **Reader comfort.** Dark sites are harder to read in bright environments — outdoor venues, daylight, projector views, bright lobbies. Light mode covers these reading contexts.
3. **Inclusivity.** Not every visitor prefers dark; offering a choice is a baseline UX courtesy.
4. **Accessibility maintained.** Brand hues (`--primary`, `--accent`, `--destructive`) are unchanged across modes — they meet WCAG AA contrast against both backgrounds. Mode-specific tokens are tuned to keep all text combinations at AA or above.

Dark mode is preserved verbatim from v1.0. Visitors who prefer it click the sun/moon button in the navigation; their choice is persisted in `localStorage` and survives across the FR ↔ EN locale switch.

The OS `prefers-color-scheme` media query is intentionally NOT honored on first visit — the new light brand is what every visitor sees by default. Per-user override is via the toggle, not via OS detection.
```

- [ ] **Step 3: Update the "Shadows" section guidance**

Find the "Shadows" section (around line 159). Replace the leading sentence with:

```markdown
Shadow style depends on mode. Light mode uses traditional drop shadows (subtle dark shadows on lighter surfaces). Dark mode uses elevation through lighter surfaces and optional glow effects on CTAs.
```

Update the table to mark `--shadow-glow-primary` and `--shadow-glow-accent` as **dark-mode only** (resolves to `none` in light mode).

- [ ] **Step 4: Update Logo Usage "Backgrounds" guidance**

In the "Logo Usage" section, the current text says: `dark/ variant on the site's deep-purple Background token. principal/ variant only on light backgrounds (press decks, invoices).`

Replace with:

```markdown
**Backgrounds:** the site renders the `principal/` (light-bg) variant by default. The `dark/` variant renders when a visitor opts into dark mode via the navigation toggle, and on dark surfaces in press kits, slide decks, and email signatures. Components consume both via the dual-render `dark:hidden` / `hidden dark:block` pattern — never hardcode a single variant.
```

- [ ] **Step 5: Add a closing rule to the "Token Export Reference" section**

After the existing CSS code block at the end of "Token Export Reference", add:

```markdown
All visual decisions in this file ship as token pairs. Never introduce a hardcoded color in component code that doesn't have both a light and a dark resolution — use `text-foreground`, `border-border`, `bg-card`, etc. The shadcn `@custom-variant dark (&:is(.dark *))` is wired in `global.css`, so any Tailwind utility prefixed with `dark:` will work as expected.

The only intentional exception is overlays whose dark scrim is the design (image lightboxes, modal backdrops). These keep their hardcoded `bg-black/N` and `text-white` because the scrim color is independent of the page theme.
```

- [ ] **Step 6: Run test suite (DESIGN.md isn't tested but make sure nothing broke)**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add DESIGN.md
git commit -m "docs(design): rewrite for light-default + dark opt-in

Token table grows to two columns (Light value | Dark value). Dark
Theme Rationale replaced with Light Default + Dark Opt-in Rationale
explaining the 2027-edition refresh. Shadow guidance and Logo Usage
Backgrounds note updated. New rule added: all colors ship as token
pairs except intentional dark-scrim overlays."
```

---

### Task B7: Phase B verification gate

**Files:** *(none — integration verification)*

- [ ] **Step 1: Full visual walk in BOTH modes**

Run: `pnpm dev`. Walk these pages in fresh incognito at desktop (1280×800) and mobile (390×844) widths. For each, exercise both modes (toggle in nav).

| Page | Light mode check | Dark mode check |
|------|------------------|-----------------|
| `/` | Hero, KeyNumbers, CFP, Edition 2026, Edition 2023, Testimonials, Footer all read correctly | Identical to current `main` |
| `/en/` | Same as `/` but English copy | Same |
| `/speakers` | Speaker cards, headings, badges | Identical to `main` |
| `/programme` | Schedule grid, sticky day-header divider visible | Identical to `main` |
| `/sponsors` | Sponsor logos render (note any that look weak on light — flag for Phase C) | Identical to `main` |
| `/team` | Team cards | Identical to `main` |
| `/venue` | Venue content + any embedded map | Identical to `main` |
| Legal page | Plain text content | Identical to `main` |

For each visual issue in light mode, write it down on a Phase C checklist. Don't fix here; that's Phase C.

- [ ] **Step 2: FOUC test (CPU throttled)**

Open dev tools → Performance tab → CPU 6× slowdown. With `localStorage.theme=dark` set, hard-reload `/`. There must be **no flash of light** before dark applies.

Repeat with `localStorage.theme` removed — light loads with no flash.

- [ ] **Step 3: Cross-locale persistence**

Set theme to dark on `/`. Click the language toggle to switch to `/en/`. The dark mode must persist (because `localStorage` is origin-scoped). Reload — still dark.

- [ ] **Step 4: A11y check**

In dev tools Accessibility tree, verify on `/`:
- ThemeToggle button has `aria-pressed` and `aria-label` matching current state.
- Click toggle — both attributes flip.
- Tab order on desktop: home logo → nav links → register CTA → ThemeToggle → LanguageToggle.
- Tab order on mobile (menu open): close-menu button → ThemeToggle → LanguageToggle → first nav link → ... → register CTA.

If using macOS, run VoiceOver (`Cmd+F5`), focus the ThemeToggle, confirm it announces the current `aria-label` correctly in both FR and EN.

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 6: Build check**

Run: `pnpm build`
Expected: clean build (no errors). Astro will tree-shake unused imports; verify the dual-rendered logos all end up referenced (no "unused asset" warnings).

- [ ] **Step 7: No commit needed; Phase B is done**

If everything checks out, Phase B is complete. The site visually rebrands the moment Phase B's commits land on `main`. Move to Phase C.

---

## Phase C — Light-mode polish

> **Goal of this phase:** fix the per-component visual nits surfaced by walking the live light-mode site in Phase B Step 1. Each fix is a small, reactive commit. Tasks below are best-guesses; some may be unnecessary, others may surface that aren't listed here.

---

### Task C1: Hero ambiance overlay tint for light mode

**Files:**
- Modify: `src/components/hero/HeroSection.astro`

> Skip this task entirely if the headline still reads cleanly over the dark photo in light mode (the white/foreground text-color contrast is what matters, not the photo brightness).

- [ ] **Step 1: Inspect current hero in light mode**

Run: `pnpm dev`, open `/` in light mode. The hero photo (`ambiance-00.jpg`) is dark. The headline color in light mode is `text-foreground` (now near-black). Black text directly over a dark photo is unreadable.

- [ ] **Step 2: Add a theme-aware overlay**

In `HeroSection.astro`, find the absolute-positioned overlay div above the hero photo (or add one if it doesn't exist). Make the tint theme-aware:

```astro
<!-- Light mode: warm white tint at 60% so dark photo brightens enough for dark text -->
<!-- Dark mode: subtle deep-purple tint at 40% to harmonize with the dark theme -->
<div class="absolute inset-0 bg-background/60 dark:bg-background/40"></div>
```

The exact opacities (60%/40%) are starting points; adjust visually until headline text reads cleanly in both modes.

- [ ] **Step 3: Verify both modes**

Reload `/`. In light mode, headline must be clearly legible over the photo. In dark mode, the hero must still feel like the v1.0 visual (no regression).

- [ ] **Step 4: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/HeroSection.astro
git commit -m "fix(hero): theme-aware overlay tint over ambiance photo

Light mode brightens the dark photo with bg-background/60 so dark
headline text stays legible. Dark mode keeps the original visual
weight with bg-background/40."
```

---

### Task C2: Glow shadow handling

**Files:**
- Modify: `src/styles/global.css` (only if Task B1's `none` substitution looks wrong)
- Modify: any component that uses `--shadow-glow-*` and reads weak in light

- [ ] **Step 1: Audit glow usage**

Run:

```bash
grep -rn 'shadow-glow' src/
```

For each file, open in light mode. If the CTA still pops without the glow (because of the brand-blue background), no fix needed — the `none` substitution from B1 is correct. If the CTA looks flat or invisible, substitute a subtle drop shadow:

In `global.css`, change:

```css
--shadow-glow-primary: none;
--shadow-glow-accent: none;
```

to:

```css
--shadow-glow-primary: 0 4px 12px oklch(62.5% 0.162 259.9 / 0.25);
--shadow-glow-accent: 0 4px 12px oklch(76.6% 0.142 10.1 / 0.25);
```

These are drop shadows tinted with the brand hue, low opacity — subtle on light backgrounds.

- [ ] **Step 2: Verify**

Reload affected pages in light mode. CTAs should have visual lift but not look "haloed."

- [ ] **Step 3: Run test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit (only if changed)**

```bash
git add src/styles/global.css
git commit -m "fix(theme): subtle drop shadow on light CTAs in place of glow

The dark-mode glow effect collapses to none on light bg by default;
where CTAs needed visual lift, substitute a low-opacity brand-tinted
drop shadow instead."
```

---

### Task C3: Hex mesh pattern verification

**Files:**
- Modify: hex pattern asset/component (if one exists in `src/components/patterns/` or inline in HeroSection)

- [ ] **Step 1: Find the hex pattern**

Run:

```bash
grep -rn 'hex' src/components/ --include='*.astro' --include='*.tsx' --include='*.svg' | head -10
```

If an SVG pattern is rendered (most likely in `HeroSection.astro` or a `patterns/` subdirectory), open in light mode.

- [ ] **Step 2: Verify visibility**

The hex stroke uses `--color-border` per DESIGN.md. In light mode, `--border` is light (e.g. oklch 88%), so on a light `--background` (oklch 98%), the stroke contrast is ~10% lightness difference — likely too subtle.

If the pattern is invisible or barely visible, bump opacity locally on the SVG (e.g. `stroke-opacity="0.6"` in light mode via `dark:stroke-opacity="0.3"` if using a Tailwind-controlled SVG, or duplicate the SVG with theme-aware visibility).

- [ ] **Step 3: Verify both modes**

Pattern reads as a subtle texture in both modes — never competing with content.

- [ ] **Step 4: Run test suite + commit (only if changed)**

```bash
git add <pattern-file>
git commit -m "fix(pattern): bump hex mesh opacity in light mode for visibility"
```

---

### Task C4: Catch-all for any other visual issues

**Files:** TBD per issue

For each item flagged on the Phase C checklist from Task B7 Step 1 that isn't addressed by C1–C3, create a focused micro-commit:

1. Identify the file and line.
2. Apply the smallest fix that resolves the issue.
3. Verify in browser (both modes).
4. Run `pnpm test`.
5. Commit with a `fix(<scope>): <one-line>` message.

Common candidates:
- Sponsor card hover state on light bg (border `--primary/50` may be too subtle).
- Card hover border transition on light cards.
- Specific sponsor SVGs designed for dark only — flag the sponsor as needing per-tier handling (decision out of scope for this plan; document and move on).

- [ ] **Phase C exit gate:** walk both modes one final time. Anything that still looks wrong is documented as a follow-up issue (not blocking). Phase C ships when the site reads as a coherent light brand.

---

## Self-review notes

Plan covers spec sections:

- ✅ **Architecture / Token strategy** → Task B1
- ✅ **FOUC prevention** → Task B2
- ✅ **Persistence** → Task B4 + B5 (Option a)
- ✅ **Phase A tokenization audit** → Tasks A1–A5 (all hardcoded `text-white`/`border-white/N`/`dark/logo` paths handled)
- ✅ **Phase B Stitch input dependency** → Task B0 input gate
- ✅ **Phase B `:root` + `.dark` split** → Task B1 (with test guard)
- ✅ **Phase B Layout.astro flip + FOUC script** → Task B2
- ✅ **Phase B i18n keys** → Task B3 (with test guard)
- ✅ **Phase B ThemeToggle component** → Task B4 (amended in B5 for multi-instance)
- ✅ **Phase B Navigation wiring** → Task B5
- ✅ **Phase B DESIGN.md rewrite** → Task B6
- ✅ **Phase B verification gate** → Task B7
- ✅ **Phase C polish** → Tasks C1–C4
- ✅ **Out of scope items** → not included in plan; documented in spec
- ✅ **Risks** → addressed inline (FOUC test in B7, dual-rendered logos in A3, lightbox carve-out in A1/A5)

Type / signature consistency:
- `theme.toggle.aria.to_dark` and `theme.toggle.aria.to_light` are the i18n key names used in both Task B3 (definition) and Task B4 (consumption via `t()`).
- `data-label-to-dark` / `data-label-to-light` are the data-attribute names used in both Task B4 (rendering) and Task B5 amendment (script reads).
- `.theme-toggle` (class) is the selector — Task B5 amendment changes from `id="theme-toggle"` to `class="theme-toggle"` and the script uses `document.querySelectorAll(".theme-toggle")`. Consistent across the amendment.
- `localStorage.theme === 'dark'` is the same key used by the FOUC script (B2) and the toggle persistence (B4/B5). Light mode is represented by *absence* of the key, not by `'light'`.

Placeholder scan: Task B0 contains `LIGHT PALETTE FROM STITCH` markers — these are deliberate input-dependency markers, not author placeholders. The Stitch winner replaces them before Task B1 ships. Task C4 says "TBD per issue" for files but is reactive-by-design (driven by Phase B walk-through findings) — every actual fix gets its own concrete commit when surfaced.
