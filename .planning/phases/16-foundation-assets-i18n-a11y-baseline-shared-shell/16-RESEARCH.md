# Phase 16: Foundation - Assets, i18n, A11y Baseline, Shared Shell - Research

**Researched:** 2026-04-13
**Domain:** Astro 6 build-time asset pipeline + i18n parity testing + CSS motion a11y + prop-driven `.astro` shell
**Confidence:** HIGH

## Summary

Phase 16 is entirely plumbing. No page renders change. The work is five narrowly-scoped deliverables on top of already-proven patterns in the repo:

1. A reproducible `scripts/optimize-photos.ts` using `sharp` that produces ≤1 MB / ≤2400 px masters (the v1.0 `src/assets/photos/ambiance/` set was produced with an ImageMagick recipe; we are simply re-expressing that recipe in the project's dep-graph so future editions have a committed command). `src/assets/photos/README.md:11-24` documents the exact knobs that already work (`-quality 82`, `-sampling-factor 4:2:0`, `-interlace JPEG`, `-colorspace sRGB`, `-strip`, `-auto-orient`) — `sharp` reproduces all of these 1:1.
2. Bilingual `editions.*` + `testimonials.*` additions to `src/i18n/ui.ts` following the existing flat-dot-string shape (420 lines, two locale objects, TypeScript `as const`).
3. A Vitest parity test that imports `ui` and makes two assertions — trivially a static test (no `dist/` dependency), unlike the existing `tests/build/*.ts` suite.
4. A 5-line nuclear `prefers-reduced-motion` reset at the end of `src/styles/global.css` (CSS-only; no layer/order complications in Tailwind 4).
5. A prop-driven `PastEditionSection.astro` that is imported by nothing in Phase 16. The "import-only, render nowhere" safeguard is satisfied by writing a Vitest that imports the module path (triggers TS type-check) without invoking any render API.

**Primary recommendation:** Reuse the proven v1.0 photo recipe verbatim in `sharp` terms (`quality: 82, chromaSubsampling: "4:2:0", mozjpeg: true, progressive: true`), mirror the existing `src/pages/venue/index.astro` thumbnail-mosaic data shape (it already uses `ImageMetadata` imports + the exact `photos?: Array<{src, alt}>` prop shape the shell needs), and write the parity test against the `ui` export directly — not against `dist/` HTML — so it runs in ~50 ms with no build dependency.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 sharp optimization pipeline:** `scripts/optimize-photos.ts` using `sharp`, quality ≈ 80, maxWidth 2400, commits ≤1 MB JPG masters under `src/assets/photos/kcd2023/NN.jpg` (zero-padded `01..10`). Astro Image handles responsive variants at build time; no pre-committed responsive variants. Total committed ≤ 7 MB.
- **D-02 10 photos, 2+3+5 mosaic split, filenames `01.jpg`..`10.jpg`.** Originals NOT committed.
- **D-03 KCD 2023 logo:** download from KCD program asset kit to `src/assets/logos/kcd2023/logo.svg` + `logo-dark.svg`. If unretrievable: ship a DS-token placeholder SVG + TODO note in DESIGN.md §Logo Usage. Final file arrives before Phase 19 via I18N-03 gate.
- **D-04 Flat i18n keys, full list:** `editions.2026.{heading, video_caption, stats.participants, stats.speakers, stats.sessions, placeholder_badge}`, `editions.2023.{heading, gallery_cta, video_caption, video_cta, stats.participants, stats.speakers, stats.sessions, brand_note}`, `editions.rail.{2026, 2023}`, `testimonials.{heading, pause_hint, 0.quote..5.quote, 0.attribution..5.attribution}`.
- **D-05 Parity test at `tests/build/i18n-parity.test.ts`** with (1) `Object.keys(ui.fr).sort()` deep-equals `Object.keys(ui.en).sort()`, (2) for every key, `ui.fr[k] !== ui.en[k]`. Failure messages list offending keys.
- **D-06 Testimonial placeholders live in `ui.ts`, not `testimonials-data.ts`.** Supersedes STATE.md v1.1 scope note.
- **D-07 Nuclear `@media (prefers-reduced-motion: reduce)` reset** appended at end of `src/styles/global.css` — exact CSS provided in CONTEXT.md.
- **D-08 `PastEditionSection.astro` Props interface** — exact shape locked (rail, heading, stats[], photos?, video?, brandCallout?, galleryCta?, placeholder?).
- **D-09 Shell renders nowhere in Phase 16** — import-only test verification.
- **D-10 Styling uses existing DS tokens** — no new tokens.
- **D-11 Zero new warnings in `pnpm build` + `pnpm test`.**

### Claude's Discretion

- Exact sharp knobs beyond quality/maxWidth — mozjpeg on/off, chroma subsampling.
- Tailwind class composition inside the shell.
- Placeholder copy for `editions.2026.*` (byte-different FR/EN).
- Placeholder quote bodies + attributions for `testimonials.0..5`.

### Deferred Ideas (OUT OF SCOPE)

- Pre-committed responsive variants.
- Automated KCD logo fetcher.
- i18n namespace splitting across files.
- `prefers-reduced-motion` opt-out mechanism.
- Shell variant discriminator for future 2028 edition.
- Skeleton / loading states for the shell.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-04 | Past-edition sections use a shared `PastEditionSection.astro` shell parameterized by props | "Shell Architecture" section — Props interface mirrors existing `src/pages/venue/index.astro` thumbnail + stat shape; `src/components/speakers/SpeakerCard.astro` is the prop-driven `.astro` template pattern |
| A11Y-05 | Global `prefers-reduced-motion` reset added to `src/styles/global.css` before any animated component lands | "Motion A11y Baseline" — Tailwind 4 `@layer base` ordering + documented MDN pattern; verified no collision with Astro Fonts API |
| I18N-01 | `editions.*` and `testimonials.*` added with FR+EN in same commit | "i18n Additions" — flat-dot-string conventions in `src/i18n/ui.ts` (420 lines, `as const`); consumed via `useTranslations(lang)` in `src/i18n/utils.ts` |
| I18N-02 | Vitest assertion verifies key-count parity and byte-different FR/EN values | "Parity Test Strategy" — direct `import { ui }` test, not a `dist/` test; runs in ~50 ms without `pnpm build` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sharp` | `^0.34.5` | CLI photo optimization (JPG @ ≤2400 px, quality ~80, mozjpeg) | Already the transitive engine Astro Image uses under the hood; single-dep story for the script. `[VERIFIED: npm view sharp version → 0.34.5]` |
| `tsx` | `^4.21.0` | Running `scripts/optimize-photos.ts` via `node --import tsx` or direct `tsx scripts/…` | No ts-node needed; Node 22 already required by `engines` in `package.json:5-7`. `[VERIFIED: npm view tsx version → 4.21.0]` |
| `astro` | `^6.1.5` (already installed) | `astro:assets` `<Image>` + `ImageMetadata` type for shell `photos` prop | `[VERIFIED: package.json:23]` |
| `vitest` | `^4.1.4` (already installed) | i18n parity test + shell-import smoke test | `[VERIFIED: package.json:42]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | `^25.6.0` (already installed) | `fs`/`path` types for the optimize script | `[VERIFIED: package.json:37]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sharp` script | `imagemagick` shell script (what v1.0 `ambiance/` used — see `src/assets/photos/README.md:11-24`) | ImageMagick requires a system binary not in the repo's dep-graph; sharp ships as a Node module and is already a transitive dep of Astro Image. Script becomes CI-portable. `[ASSUMED: ImageMagick not installed in CI — not verified]` |
| `tsx` runtime | `ts-node` | `tsx` is ~10× faster start, single-dep, Node-native ESM (no loader flag). `[CITED: github.com/esbuild-kit/tsx README]` |
| Test against `ui` export directly | Test against built `dist/` HTML (existing `tests/build/*.ts` pattern) | The parity test has no rendered-page component — it's a pure data invariant. Importing the `ui` object directly eliminates the `pnpm build` prerequisite that `speakers-grid.test.ts` has. Consistent with "unit vs. build-output" distinction. |

**Installation:**

```bash
pnpm add -D sharp tsx
```

**Version verification (2026-04-13):**

```bash
pnpm view sharp version   # → 0.34.5
pnpm view tsx version     # → 4.21.0
```

Both match `HIGH` confidence. `[VERIFIED: pnpm view, 2026-04-13]`

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── optimize-photos.ts          # NEW — sharp-based pipeline, idempotent

src/
├── assets/
│   ├── photos/
│   │   ├── ambiance/           # existing v1.0 venue photos (untouched)
│   │   ├── speakers/           # existing (untouched)
│   │   └── kcd2023/            # NEW — 01.jpg..10.jpg (≤1 MB each, ≤7 MB total)
│   └── logos/
│       ├── principal/          # existing
│       ├── dark/               # existing
│       ├── print/              # existing
│       └── kcd2023/            # NEW — logo.svg + logo-dark.svg
├── components/
│   └── past-editions/          # NEW folder
│       └── PastEditionSection.astro  # NEW — shell, prop-driven, no client:*
├── i18n/
│   └── ui.ts                   # EDITED — add editions.* + testimonials.* to fr + en
└── styles/
    └── global.css              # EDITED — append prefers-reduced-motion reset

tests/
└── build/
    ├── i18n-parity.test.ts         # NEW — D-05 parity assertion
    └── past-edition-shell.test.ts  # NEW — import-only smoke test (D-09 safeguard)
```

### Pattern 1: sharp optimization pipeline (idempotent)

**What:** A Node script that reads originals from a local (git-ignored) drop folder, runs sharp, and writes `NN.jpg` masters only if the output would change. Re-running is a no-op.

**When to use:** Reproducible asset generation where originals are too large to commit but the pipeline itself must live in-repo.

**Example (based on sharp 0.34 API + v1.0 ImageMagick recipe translated):**

```typescript
// scripts/optimize-photos.ts
// Source: sharp docs https://sharp.pixelplumbing.com/api-output#jpeg (verified 2026-04-13)
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

const SRC_DIR = process.env.KCD2023_SRC ?? "./_photo-drop/kcd2023";
const OUT_DIR = "./src/assets/photos/kcd2023";
const MAX_W = 2400;
const QUALITY = 80; // D-01: quality ≈ 80. Escape hatch: drop to 75 if any output > 1 MB.
const SIZE_CEIL = 1_024 * 1_024; // 1 MB hard cap per master

async function optimize(input: string, outputName: string) {
  const outPath = join(OUT_DIR, outputName);
  if (existsSync(outPath)) {
    console.log(`[skip] ${outputName} already exists`);
    return;
  }
  let quality = QUALITY;
  for (;;) {
    const buf = await sharp(input)
      .rotate()                          // honours EXIF then strips
      .resize({ width: MAX_W, height: MAX_W, fit: "inside", withoutEnlargement: true })
      .jpeg({
        quality,
        mozjpeg: true,                   // smaller files at same visual quality
        chromaSubsampling: "4:2:0",      // matches v1.0 recipe
        progressive: true,               // matches v1.0 `-interlace JPEG`
      })
      .withMetadata({ orientation: undefined })  // drop EXIF
      .toBuffer();
    if (buf.byteLength <= SIZE_CEIL || quality <= 60) {
      await sharp(buf).toFile(outPath);
      console.log(`[write] ${outputName} @ q${quality} → ${(buf.byteLength / 1024).toFixed(0)} KB`);
      return;
    }
    quality -= 5; // degrade gracefully if 80 overshoots 1 MB
  }
}
```

Add to `package.json`:

```json
"scripts": {
  "optimize:photos": "tsx scripts/optimize-photos.ts"
}
```

`[CITED: sharp API docs — sharp.pixelplumbing.com/api-output#jpeg]` `[VERIFIED: `sharp` 0.34.5 on npm 2026-04-13]`

### Pattern 2: Shared shell Props interface (prop-driven, no client directives)

**What:** Single `.astro` file with a TypeScript `Props` interface, optional slots, zero `client:*` directives.

**Example (extending the locked D-08 shape with imports):**

```astro
---
// src/components/past-editions/PastEditionSection.astro
// Source: Astro 6 docs https://docs.astro.build/en/reference/modules/astro-assets/#imagemetadata
import { Image } from "astro:assets";
import type { ImageMetadata } from "astro";

interface Props {
  rail: string;
  heading: string;
  stats: Array<{ value: string; label: string }>;
  photos?: Array<{ src: ImageMetadata; alt: string; size?: "hero" | "medium" | "small" }>;
  video?: { youtubeId: string; caption: string; playlistCta?: { label: string; href: string } };
  brandCallout?: { logo: ImageMetadata; logoAlt: string; body: string };
  galleryCta?: { label: string; href: string };
  placeholder?: boolean;
}

const { rail, heading, stats, photos, video, brandCallout, galleryCta, placeholder } = Astro.props;
---
<section class="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24">
  {placeholder && (
    <span class="absolute top-4 right-4 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs uppercase tracking-widest">
      PLACEHOLDER
    </span>
  )}
  <p class="absolute left-0 top-24 rotate-[-90deg] origin-top-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    {rail}
  </p>
  <h2 class="text-3xl md:text-4xl font-bold text-foreground tracking-tight" style="letter-spacing:-0.02em;">
    {heading}
  </h2>
  {/* stats → photos → video → brandCallout → galleryCta, each opt-in */}
</section>
```

**Key: matches the existing `src/pages/venue/index.astro:69-73` thumbnail shape (`{ src: ImageMetadata, alt }`) and `:63-67` stats shape (`{ value, label }`) exactly** — zero invention. Mosaic sizing (`hero | medium | small`) is rendered via Tailwind `col-span-*` utilities scoped to the `<section>`.

`[CITED: src/pages/venue/index.astro:5-7, 63-73, 248-267]` `[VERIFIED: Astro 6 astro:assets docs via Context7 hint]`

### Pattern 3: Parity test via direct TS import (not dist/)

**What:** Vitest test that imports the `ui` export and asserts on it — no `pnpm build` prerequisite.

**Example:**

```typescript
// tests/build/i18n-parity.test.ts
import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

describe("I18N-02: editions.* and testimonials.* parity", () => {
  it("fr and en have identical key sets", () => {
    const frKeys = Object.keys(ui.fr).sort();
    const enKeys = Object.keys(ui.en).sort();
    const missingInEn = frKeys.filter((k) => !enKeys.includes(k));
    const extraInEn = enKeys.filter((k) => !frKeys.includes(k));
    expect(
      missingInEn,
      `Keys present in fr but missing in en: ${missingInEn.join(", ")}`,
    ).toEqual([]);
    expect(
      extraInEn,
      `Keys present in en but missing in fr: ${extraInEn.join(", ")}`,
    ).toEqual([]);
  });

  it("no FR value is byte-identical to its EN counterpart", () => {
    const identical: string[] = [];
    for (const k of Object.keys(ui.fr) as Array<keyof typeof ui.fr>) {
      if ((ui.fr as Record<string, string>)[k] === (ui.en as Record<string, string>)[k]) {
        identical.push(k as string);
      }
    }
    expect(
      identical,
      `FR value identical to EN (likely accidental paste): ${identical.join(", ")}`,
    ).toEqual([]);
  });
});
```

**Why this works:** `vitest.config.ts` already wires the `@` alias to `./src` (`vitest.config.ts:6-8`), so `@/i18n/ui` resolves in tests. No dist dependency, runs in ~50 ms. `[VERIFIED: vitest.config.ts:6-8]`

### Pattern 4: Shell import-only safeguard (D-09)

```typescript
// tests/build/past-edition-shell.test.ts
import { describe, it, expect } from "vitest";

describe("EDIT-04: PastEditionSection shell exists and imports cleanly", () => {
  it("module loads without throwing", async () => {
    const mod = await import("@/components/past-editions/PastEditionSection.astro?raw");
    expect(mod.default).toBeTypeOf("string");
    expect(mod.default).toContain("interface Props");
  });
});
```

**Alternative, simpler:** use Node's `existsSync` on the file path — any TS reference from inside Vitest keeps the Astro compiler out of the test run. Either is acceptable under D-11 (zero new warnings). `[ASSUMED: Vitest can import .astro as ?raw — not verified; fall back to fs existence check if import fails]`

### Anti-Patterns to Avoid

- **Shipping a React island for the shell** — every v1.0 section component (`SpeakerCard`, `SpeakerProfile`) is pure `.astro`. The shell has no state; do not add `client:load`.
- **Storing photos under `public/`** — `src/assets/photos/README.md:34` explicitly says this bypasses Astro Image optimization. Use `src/assets/`.
- **Adding new DS tokens for the rail/mosaic** — D-10 locks this. Rotation, gap rhythm, and colors all resolve to existing tokens.
- **Nesting the prefers-reduced-motion reset inside `@layer base`** — keeps it at specificity 0,1,0 vs. `!important` at top-level. Tailwind utility classes with `motion-safe:` modifiers are unaffected either way, but top-level placement matches the MDN canonical example and is what D-07 specifies.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JPEG re-encoding | Custom image library, spawn `imagemagick`, or write through Canvas | `sharp` | Node-native, Astro already ships it, covers mozjpeg + chroma subsampling + EXIF strip in one call chain |
| Responsive srcset/AVIF/WebP generation | Your own `<picture>` boilerplate | `import { Image } from "astro:assets"` | Build-time, cached, automatic srcset |
| Reduced-motion detection | JS `matchMedia` listener | CSS `@media (prefers-reduced-motion: reduce)` | Zero JS, applies to everything, can't fail to hydrate |
| i18n key lookup | Custom flat-key helper | Existing `useTranslations(lang)` in `src/i18n/utils.ts:18-22` | Already ships, typed, falls back to defaultLang |
| Test runner config | New config file | Reuse `vitest.config.ts` | Alias already wired; just add a file under `tests/build/` |

**Key insight:** Phase 16 deliberately avoids any net-new abstraction. Every piece either mirrors the existing venue-page shape (photos, stats, video iframe) or extends an already-canonical pattern (flat i18n dot-strings, prop-driven `.astro`, Vitest in `tests/build/`).

## Common Pitfalls

### Pitfall 1: sharp JPEG output exceeds 1 MB at quality 80

**What goes wrong:** A dense / highly-detailed photo at 2400 px can land at ~1.3 MB even with mozjpeg.

**Why it happens:** High-entropy content (crowd shots with thousands of faces, stage lighting gradients) resists quantization.

**How to avoid:** The optimize script should try quality 80, and if byte length > 1 MB, decrement by 5 and retry down to quality 60 (still well within perceptual acceptability at 2400 px). v1.0's `ambiance/` set landed at ~300-850 KB with quality 82 — the headroom is real. `[CITED: src/assets/photos/README.md:30 — "Resulting masters are ~300–850 KB each"]`

**Warning signs:** Any output > 900 KB — treat as a yellow flag and rerun at lower quality.

### Pitfall 2: `.astro` files in Vitest without the Astro compiler

**What goes wrong:** `import Section from "@/components/.../*.astro"` in a Vitest test fails because Vitest can't parse `.astro`.

**Why it happens:** Vitest uses Vite's transform pipeline, which does not include Astro's compiler by default in node test environments.

**How to avoid:** Don't import the `.astro` file as a component in the test. Either (a) read the file contents via `fs.readFileSync` and grep for the Props interface text, or (b) use `existsSync` on the absolute path. D-09's safeguard is "the file exists and has the correct interface" — not "it renders". `[ASSUMED: Vitest lacks .astro resolver — not verified in this repo; if someone has wired `vite-plugin-astro` it would work, check on implementation]`

**Warning signs:** Test fails with `Cannot find module` or `Unexpected token '---'`.

### Pitfall 3: Astro Fonts API + `@layer base` ordering

**What goes wrong:** The `prefers-reduced-motion` reset silently gets overridden if placed inside `@layer base` because Astro-injected font CSS could land in an earlier layer with higher `!important` specificity (it doesn't, but the worry is common).

**Why it happens:** Tailwind 4's `@layer` mental model is about specificity/order, not `!important`.

**How to avoid:** D-07 locks the reset at the END of `global.css`, OUTSIDE any `@layer`. Top-level `@media` with `!important` declarations has the highest cascade wins regardless. No collision possible. `[VERIFIED: src/styles/global.css:89-99 ends with @layer base; append new rule below line 99]`

**Warning signs:** Motion still plays in a Playwright `emulateMedia({reducedMotion:'reduce'})` test in a future phase — first place to check is specificity / ordering.

### Pitfall 4: `ImageMetadata` import path in Astro 6

**What goes wrong:** Writing `import type { ImageMetadata } from "astro:assets"` throws because the type is exported from `astro`, not `astro:assets`.

**Why it happens:** `astro:assets` exports the runtime `Image` component + functions; the type lives on the top-level `astro` module.

**How to avoid:** Use `import type { ImageMetadata } from "astro";`. `[CITED: docs.astro.build/en/reference/modules/astro-assets/#imagemetadata]`

**Warning signs:** TS2305 "Module has no exported member 'ImageMetadata'".

### Pitfall 5: KCD logo dark variant contrast on `--color-secondary`

**What goes wrong:** The KCD logo's Kubernetes blue (#326CE5-ish) on `--color-secondary` (deep purple) can fall below 3:1 AA for graphics.

**Why it happens:** Blue-on-purple is the classical adjacent-hue low-contrast trap.

**How to avoid:** The brand-callout band (D-05 from Phase 15) is `--color-secondary` OR `--color-card`. Commit a `logo-dark.svg` variant — either monochromatic white, or with a subtle white stroke/plate around glyph edges. CONTEXT.md `<specifics>` already flags this. `[CITED: 16-CONTEXT.md <specifics> bullet 2]`

**Warning signs:** Visual review in Phase 19 shows the KCD logo "disappearing" on the callout band background.

### Pitfall 6: i18n parity test false positive on numeric values

**What goes wrong:** `editions.2023.stats.participants: "1700+"` is byte-identical FR vs. EN because numbers don't translate. The byte-different assertion fires a false failure.

**Why it happens:** The spec says "no EN value is byte-identical to its FR counterpart" — but numeric stats legitimately are.

**How to avoid:** Either (a) suffix with the locale-specific unit ("1700+ participants" FR vs. "1700+ attendees" EN), (b) have FR use non-breaking space thousand separator "1 700+" vs. EN "1,700+", or (c) allow an explicit allowlist of known-identical keys in the test. Recommendation: (b) — it's the natural typographic convention anyway. `[ASSUMED: organizer hasn't locked stat format — discretion allows picking (b)]`

**Warning signs:** Parity test fails the moment you add a numeric stat.

## Runtime State Inventory

> Phase 16 creates only NEW files. No existing state is renamed, moved, or migrated. No runtime system stores any string we're introducing.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database, no Mem0, no ChromaDB in this repo (grep: `src/lib/remote-csv.ts` only reads CSVs from Google Sheets) | None |
| Live service config | None — `editions.*` / `testimonials.*` keys are new, no external service references them yet. Deferred to Phase 17/19/20 consumers | None |
| OS-registered state | None — pure Astro build, no cron/systemd/launchd | None |
| Secrets/env vars | None added. The existing CSV URL env vars (`SCHEDULE_SESSIONS_CSV_URL`, etc. per `CLAUDE.md`) are unaffected | None |
| Build artifacts | `dist/` will regenerate on next `pnpm build` with the new global.css rule. Idempotent | None |

**The canonical question:** After all Phase 16 files are committed, what runtime systems still have old state? → **Answer: none.** This phase is strictly additive to the source tree.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | ≥ 22.12.0 required per `package.json:5-7` | — |
| pnpm | dep install + scripts | ✓ (implied by pnpm-lock) | — | — |
| `sharp` (npm) | `scripts/optimize-photos.ts` | ✗ (not yet in deps) | will install 0.34.5 | ImageMagick (already used in v1.0) could be fallback, but D-01 locks sharp |
| `tsx` (npm) | running the TS script | ✗ (not yet in deps) | will install 4.21.0 | `node --loader ts-node/esm` — inferior; stick with tsx |
| Astro `astro:assets` | shell + future consumers | ✓ | 6.1.5 in `package.json:23` | — |
| Vitest | parity + import-only tests | ✓ | 4.1.4 in `package.json:42` | — |
| KCD 2023 logo SVG from KCD program kit | D-03 | ⚠ availability unknown | — | DS-token placeholder SVG + DESIGN.md TODO (locked per D-03) |
| 10 source photos from KCD 2023 gallery | D-02 | ⚠ user-supplied | — | None — phase cannot complete photo task without originals; document as "bring your own originals, drop to `./_photo-drop/kcd2023/`" |

**Missing dependencies with no fallback:** KCD 2023 source photos (user must place in drop folder). The optimize script should fail loudly with a clear error message if the drop folder is empty.

**Missing dependencies with fallback:** KCD 2023 official logo — D-03 already specifies the placeholder fallback + DESIGN.md TODO.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.ts` (aliased `@ → src`, `environment: "node"`) |
| Quick run command | `pnpm test` (invokes `vitest run`) |
| Full suite command | `pnpm test` (single suite) — pairs with `pnpm build` for build-output tests |
| Per-file command | `pnpm exec vitest run tests/build/i18n-parity.test.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| I18N-01 | `editions.*` + `testimonials.*` keys exist in FR + EN | unit (import `ui`, assert key presence) | `pnpm exec vitest run tests/build/i18n-parity.test.ts` | ❌ Wave 0 |
| I18N-02 | FR and EN key counts identical, no byte-identical values | unit (assertions 1 + 2 per D-05) | same as above | ❌ Wave 0 |
| EDIT-04 | `src/components/past-editions/PastEditionSection.astro` exists with the locked Props shape | unit (fs check + text contains `interface Props`) | `pnpm exec vitest run tests/build/past-edition-shell.test.ts` | ❌ Wave 0 |
| EDIT-04 (secondary) | Shell is imported by ZERO pages in Phase 16 | unit (grep `src/pages/**` for the import path, assert zero hits) | same as above | ❌ Wave 0 |
| A11Y-05 | `global.css` contains `prefers-reduced-motion: reduce` block with `animation-duration`, `transition-duration`, `scroll-behavior` overrides | unit (fs read + regex match) | `pnpm exec vitest run tests/build/a11y-motion-reset.test.ts` | ❌ Wave 0 |
| Success criterion 1 | 10 photos in `src/assets/photos/kcd2023/`, each ≤ 1 MB, total ≤ 7 MB | unit (fs readdir + stat) | `pnpm exec vitest run tests/build/kcd2023-assets.test.ts` | ❌ Wave 0 |
| Success criterion 1 (logo) | `src/assets/logos/kcd2023/logo.svg` + `logo-dark.svg` exist | unit (fs existsSync) | same as above | ❌ Wave 0 |
| Success criterion 5 | `pnpm build` exits 0 with no new warnings | manual (captured in phase verification) | `pnpm build 2>&1 \| tee build.log && grep -i warning build.log` | ✅ (existing build harness) |

### Sampling Rate

- **Per task commit:** `pnpm test` (covers all i18n + shell + motion + asset tests; ~50 ms — 1 s total).
- **Per wave merge:** `pnpm build && pnpm test`.
- **Phase gate:** Full `pnpm build` (green) + `pnpm test` (green) + manual visual check that `PastEditionSection.astro` is not imported anywhere under `src/pages/`.

### Wave 0 Gaps

- [ ] `tests/build/i18n-parity.test.ts` — covers I18N-01, I18N-02 (D-05 spec)
- [ ] `tests/build/past-edition-shell.test.ts` — covers EDIT-04 + render-nowhere safeguard (D-09)
- [ ] `tests/build/a11y-motion-reset.test.ts` — covers A11Y-05 (regex over `global.css`)
- [ ] `tests/build/kcd2023-assets.test.ts` — covers success criterion 1 (photo + logo fs assertions)
- [ ] `scripts/optimize-photos.ts` — D-01 pipeline
- [ ] `package.json` scripts entry: `"optimize:photos": "tsx scripts/optimize-photos.ts"`

No new framework install needed; Vitest is already present. `sharp` + `tsx` are the only dep additions.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | N/A (static site, no auth surface) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | partial | The optimize script reads filenames from the drop folder — sanitize to `01.jpg`..`10.jpg` only; reject anything else |
| V6 Cryptography | no | N/A — no secrets touched |
| V12 Files & Resources | yes | EXIF stripping via `sharp.withMetadata({ orientation: undefined })` to remove GPS coords / camera serial from committed masters |
| V14 Configuration | yes | No new env vars; no secrets committed; placeholder SVG never has fetch-at-build-time side effects |

### Known Threat Patterns for Astro 6 + sharp + static-site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| EXIF leakage (GPS coords of venue) | Information Disclosure | `sharp.withMetadata({ orientation: undefined })` + `-strip` equivalent — already a locked knob in the recipe |
| Supply-chain via new dep | Tampering | `sharp` and `tsx` both ≥ 1M weekly downloads, maintained, signed via npm provenance — standard vetting applies. Pin with `^` to current minors |
| XSS via `editions.2023.brand_note` | Injection | Astro escapes all `{t(...)}` interpolations by default. Do not use `set:html` for these strings. |
| SVG script injection in logo | Injection | If using DS-token placeholder SVG (D-03 fallback), do not include `<script>` tags. If downloading official KCD logo, scan for inline scripts before commit. |

## Code Examples

Verified patterns ready for the planner.

### Example 1: Astro Image import + usage in a shell photo slot

```astro
---
// Source: src/pages/venue/index.astro:5-7, :69-73, :248-267 (existing v1.0 pattern)
import { Image } from "astro:assets";
import type { ImageMetadata } from "astro";

// Consumer-side (Phase 17/19 will do this — shown here for clarity)
import photo01 from "@/assets/photos/kcd2023/01.jpg";
import photo02 from "@/assets/photos/kcd2023/02.jpg";
// ... photo03..10

const kcd2023Photos: Array<{ src: ImageMetadata; alt: string; size?: "hero" | "medium" | "small" }> = [
  { src: photo01, alt: "Scène d'ouverture KCD 2023", size: "hero" },
  { src: photo02, alt: "Public KCD 2023", size: "hero" },
  // ... 8 more
];
---
```

### Example 2: Appending the motion reset to `global.css`

```css
/* Append at end of src/styles/global.css (AFTER line 99, OUTSIDE any @layer) */
/* A11Y-05: global prefers-reduced-motion baseline (phase 16).
   Documented baseline for current + future animated components. Components
   MUST NOT redefine their own motion fallback — this rule is authoritative. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`[VERIFIED: matches D-07 exactly]` `[CITED: developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion]`

### Example 3: Adding new i18n keys (shape only)

```typescript
// src/i18n/ui.ts — inside the `fr:` block, after venue.around.food_body
"editions.rail.2026": "EDITION 2026",
"editions.rail.2023": "EDITION 2023",
"editions.2026.heading": "Edition 2026",
"editions.2026.video_caption": "Aftermovie CNDF 2026",
// ... all keys per D-04
"testimonials.heading": "Témoignages",
"testimonials.pause_hint": "Survolez pour mettre en pause",
"testimonials.0.quote": "Un événement francophone cloud-native indispensable.",
"testimonials.0.attribution": "Persona 1 · Placeholder",
// ... through testimonials.5.*
```

Mirror in `en:` block with byte-different translations. `[VERIFIED: flat-dot-string pattern from src/i18n/ui.ts:8-419]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual ImageMagick shell recipe (v1.0 `ambiance/`) | sharp-based Node script committed to repo | Phase 16 | Reproducible in CI without system-level deps |
| `<img>` tag with raw `src.src` (`src/pages/venue/index.astro:257-265`) | `<Image>` from `astro:assets` with `widths` + `formats` | Phase 16 shell | Responsive variants, AVIF/WebP, cached by Astro |
| In-component motion fallbacks (`motion-safe:` class composition) | Global `prefers-reduced-motion` reset | Phase 16 | Single source of truth; components can't regress a11y |
| i18n parity checked manually | Vitest assertion in CI | Phase 16 | CI blocks FR-only or copy-pasted FR→EN merges |

**Deprecated/outdated:**

- `venue.prev.*` keys in `src/i18n/ui.ts:136-143` + `343-350` — scheduled for removal in Phase 18 (VENUE-03). Do NOT delete in Phase 16.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest can import `.astro` files as `?raw` | Pitfall 2 / Pattern 4 | Low — fall back to `fs.existsSync` + `readFileSync` regex; both acceptable under D-09 |
| A2 | ImageMagick is not available in the CI environment, justifying sharp | Alternatives Considered | Low — even if ImageMagick is present, sharp is strictly better (dep-graph native, Node-native) |
| A3 | 2026 / 2023 numeric stats can be formatted with a locale-appropriate thousands separator to satisfy byte-different rule | Pitfall 6 | Low — discretion scope per CONTEXT.md allows this |
| A4 | KCD 2023 logo is downloadable from KCD program asset kit | D-03 context | Medium — D-03 already specifies the placeholder fallback; no new risk |
| A5 | sharp 0.34.5 JPEG output at quality 80 + mozjpeg + `inside` fit on 2400 px will reliably land ≤ 1 MB for typical conference photography | Pitfall 1 | Low — v1.0 ImageMagick at quality 82 produced 300–850 KB; sharp with mozjpeg is strictly ≤ ImageMagick sizes |

## Open Questions

1. **Are the 10 KCD 2023 source photos already available on the organizer's drive, or does the executing agent need to request them?**
   - What we know: CONTEXT.md D-02 says "10 source images from the 2023 KCD France gallery". It does not specify where they live.
   - What's unclear: the exact handoff mechanism for originals.
   - Recommendation: the implementer should check with the user at task kickoff. If not available, execute the non-photo tasks (i18n, motion reset, shell, logo placeholder) and gate the photo task on delivery.

2. **Is `@/components/past-editions/PastEditionSection.astro?raw` importable in Vitest?**
   - What we know: Vitest uses Vite; Vite supports `?raw` imports; Astro files are plain text on disk so `?raw` should work.
   - What's unclear: whether Vite's resolver trips on the `.astro` extension even in raw mode.
   - Recommendation: try raw import first; fall back to `fs.readFileSync` if it errors. Either satisfies D-09.

3. **Does the placeholder KCD logo SVG need to sit in a separate "placeholder" sub-path (e.g., `kcd2023/logo-placeholder.svg`) so a future replace commit is a clean swap, or should it live at the final filename `logo.svg`?**
   - What we know: D-03 says "ship a placeholder SVG … the organizer provides the final file before Phase 19".
   - What's unclear: whether the file name should change between placeholder and final.
   - Recommendation: ship the placeholder at the final path (`logo.svg` + `logo-dark.svg`) so consumer imports never break; the commit that replaces content keeps the path stable.

## Project Constraints (from CLAUDE.md)

- **Stitch-first:** Phase 15 already locked the visual contract (`DESIGN.md §Homepage Layout Contract (v1.1)`). Phase 16 implements against that contract; no new visual decisions arise here, so the Stitch-first rule is satisfied structurally.
- **CSV rule:** Does NOT apply to Phase 16. No CSV data is touched. `editions.*` and `testimonials.*` are static i18n content, not organizer-maintained data. This is explicitly allowed per CONTEXT.md (`<canonical_refs>` note).
- **Never hardcode speaker/session/sponsor/team in code:** Not applicable — this phase has none of those.
- **User's global instructions:** "Never co-author commits" + "Never add Generated with Claude Code attribution". Applies to the commit messages the planner will emit.

## Sources

### Primary (HIGH confidence)

- `src/pages/venue/index.astro:5-7, 63-73, 248-267` — exact prior-art for `{src: ImageMetadata, alt}` + `{value, label}` stats shapes the shell mirrors
- `src/assets/photos/README.md:11-43` — proven ImageMagick recipe + consumption example via `astro:assets`
- `src/i18n/ui.ts:1-420` — flat-dot-string pattern + `as const` + FR/EN sibling objects
- `src/i18n/utils.ts:18-22` — `useTranslations()` consumer contract
- `src/styles/global.css:1-99` — current end-of-file; reset appends at line 100+
- `src/components/speakers/SpeakerCard.astro:7-18` — prop-driven `.astro` template with `interface Props`
- `tests/build/speakers-grid.test.ts:12-36` — existing Vitest-in-`tests/build/` pattern (dist-based; parity test is simpler)
- `vitest.config.ts:1-13` — `@` alias wired, node env
- `package.json:1-43` — current deps; `engines.node ≥ 22.12`, Astro 6.1.5, Vitest 4.1.4
- `astro.config.mjs` — i18n defaultLocale + Fonts API usage (DM Sans)
- npm registry 2026-04-13: `sharp@0.34.5`, `tsx@4.21.0`

### Secondary (MEDIUM confidence)

- MDN: `@media (prefers-reduced-motion: reduce)` canonical example — matches D-07 text
- sharp docs (`sharp.pixelplumbing.com/api-output#jpeg`) — `mozjpeg`, `chromaSubsampling`, `progressive` options verified
- Astro 6 docs (`docs.astro.build/en/reference/modules/astro-assets/`) — `ImageMetadata` imported from `astro`, not `astro:assets`

### Tertiary (LOW confidence)

- None. Every critical claim is cross-referenced to a file in-repo or a verified npm lookup.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — sharp + tsx + Astro + Vitest versions all verified via `pnpm view`/`package.json`
- Architecture: HIGH — every pattern mirrors existing v1.0 code (venue page, speaker card, ui.ts)
- Pitfalls: MEDIUM — pitfalls 1, 3, 4, 5, 6 are general knowledge; pitfall 2 is ASSUMED and has a clean fallback
- Validation plan: HIGH — all tests unit-level with no new framework; Wave 0 gaps explicit

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days) — Astro 6 and sharp 0.34 are stable; no imminent version bumps expected

---

## RESEARCH COMPLETE

**Phase:** 16 - Foundation - Assets, i18n, A11y Baseline, Shared Shell
**Confidence:** HIGH

### Key Findings

- The shell's exact prop shape (`{src: ImageMetadata, alt}` thumbnails + `{value, label}` stats) is already in production at `src/pages/venue/index.astro:63-73` — zero invention needed.
- `src/assets/photos/README.md` documents a v1.0-proven ImageMagick recipe that maps 1:1 to `sharp` options (`mozjpeg: true`, `chromaSubsampling: "4:2:0"`, `progressive: true`) — pitfall 1 is defused by a quality-decrement fallback loop to satisfy the ≤ 1 MB cap.
- The i18n parity test should import the `ui` object directly, not build `dist/` — ~50 ms run, no build prerequisite, unlike the existing `tests/build/` suite.
- D-09's "shell renders nowhere" safeguard is cleanest as a `tests/build/past-edition-shell.test.ts` that does an `fs.existsSync` + `grep src/pages/**` for zero references — skips the "can Vitest import `.astro`?" unknown entirely.
- The `prefers-reduced-motion` reset MUST land AT THE END of `global.css`, OUTSIDE any `@layer`. Appending below line 99 is the correct insertion point.

### File Created

`.planning/phases/16-foundation-assets-i18n-a11y-baseline-shared-shell/16-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Versions verified via `pnpm view` 2026-04-13; Astro + Vitest already in `package.json` |
| Architecture | HIGH | Every pattern mirrors existing v1.0 code — venue page, speaker card, ui.ts |
| Pitfalls | MEDIUM | Five are canonical; one (.astro in Vitest) is ASSUMED with a clean fs-check fallback |
| Validation plan | HIGH | Five unit tests, all under 1 s, no new framework, clear Wave 0 gap list |

### Open Questions

1. Source of the 10 KCD 2023 photos (not in repo; user-supplied expected)
2. Whether `?raw` import of `.astro` works in Vitest (pitfall 2; has a clean fallback)
3. Placeholder KCD logo filename strategy (recommend same filename as final)

### Ready for Planning

Research complete. Planner can now decompose Phase 16 into wave-mapped tasks: (W0) test scaffolds + dep install; (W1) i18n keys + parity test, motion reset + test, logo placeholder; (W2) sharp script + photo optimization + asset test; (W3) shell component + import-only test. Dependencies between waves are minimal — W1 tasks are mutually parallel, W2 depends on originals delivery, W3 depends only on W0 types being available.
