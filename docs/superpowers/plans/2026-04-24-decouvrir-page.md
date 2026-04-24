# Discover Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/decouvrir` (FR) and `/en/discover` (EN) pages per CLO-52, composing a video hero, photo gallery, values section, audience profiles, and replay grid.

**Architecture:** Five dumb Astro components under `src/components/discover/`, each receiving pre-translated strings as props from the page. A static `src/data/replays.ts` file provides replay data. The nav gets a `pathEn` override field to handle the FR/EN slug asymmetry (`/decouvrir` vs `/discover`).

**Tech Stack:** Astro (SSG), Tailwind 4, native `<dialog>` for lightbox, YouTube thumbnail URLs (no API), Vitest for tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/data/replays.ts` | Static 2026 replay data (6 items) |
| Create | `src/components/discover/DiscoverVideoHero.astro` | YouTube embed hero |
| Create | `src/components/discover/PhotoGallery.astro` | Masonry photo grid + lightbox |
| Create | `src/components/discover/DiscoverValues.astro` | Values text + 2026 stats strip |
| Create | `src/components/discover/AudienceProfiles.astro` | 3 profile cards |
| Create | `src/components/discover/ReplayGrid.astro` | 6 YouTube thumbnails + CTA |
| Create | `src/pages/decouvrir.astro` | FR page — composes all components |
| Create | `src/pages/en/discover.astro` | EN page — identical, lang resolves to "en" |
| Create | `src/lib/__tests__/replays.test.ts` | Unit test for replays data shape |
| Create | `tests/build/discover-page.test.ts` | Integration test for built HTML |
| Modify | `src/i18n/ui.ts` | Add `nav.discover` + `discover.*` keys (both locales) |
| Modify | `src/components/Navigation.astro` | Add `nav.discover` link with locale-aware path |
| Modify | `src/components/hero/HeroSection.astro` | Add secondary "Découvrir" CTA button |

---

## Task 1: i18n keys

**Files:**
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add FR keys**

In `src/i18n/ui.ts`, find the last line of the `fr` object (currently `"flags.programme.soon.body": "Le programme complet sera dévoilé en avril 2027."`). Add after it, before the closing `},`:

```typescript
    "nav.discover": "Découvrir",
    "hero.cta.discover": "Découvrir l'événement",
    "discover.page.title": "Découvrir CND France",
    "discover.page.description":
      "Découvrez l'événement cloud-native de référence en France : ambiance, valeurs, talks 2026.",
    "discover.hero.title": "Découvrir CND France",
    "discover.hero.subtitle": "L'événement cloud-native de référence en France",
    "discover.gallery.title": "L'ambiance 2026 en images",
    "discover.gallery.lightbox.close": "Fermer",
    "discover.gallery.lightbox.prev": "Photo précédente",
    "discover.gallery.lightbox.next": "Photo suivante",
    "discover.values.title": "Notre démarche",
    "discover.values.body":
      "CND France est un événement indépendant, piloté par une communauté de praticiens passionnés par le cloud-native, l'open source et l'écosystème CNCF. Nous croyons à un numérique souverain, à la diversité des profils et à l'apprentissage entre pairs. Chaque édition rassemble des ingénieur·es, des ops, des architects et des curieux·ses autour de talks concrets, de retours d'expérience et d'échanges authentiques.",
    "discover.stats.participants": "participants",
    "discover.stats.talks": "talks",
    "discover.stats.speakers": "speakers",
    "discover.stats.tracks": "tracks",
    "discover.audience.title": "À qui ça s'adresse ?",
    "discover.audience.dev.title": "Développeur·se",
    "discover.audience.dev.topics": "Kubernetes · WASM · IA applicative",
    "discover.audience.ops.title": "Ops / SRE",
    "discover.audience.ops.topics": "Observabilité · Platform Engineering · FinOps",
    "discover.audience.lead.title": "Tech Lead / Architecte",
    "discover.audience.lead.topics": "Stratégie cloud · Patterns distribués · Gouvernance",
    "discover.replays.title": "Les talks 2026",
    "discover.replays.cta": "Voir tous les replays",
```

- [ ] **Step 2: Add EN keys**

Find the last line of the `en` object (currently `"flags.programme.soon.body": "The full programme will be unveiled in April 2027."`). Add after it, before the closing `},`:

```typescript
    "nav.discover": "Discover",
    "hero.cta.discover": "Discover the event",
    "discover.page.title": "Discover CND France",
    "discover.page.description":
      "Discover the reference cloud-native event in France: atmosphere, values, and 2026 talks.",
    "discover.hero.title": "Discover CND France",
    "discover.hero.subtitle": "The reference cloud-native event in France",
    "discover.gallery.title": "2026 in pictures",
    "discover.gallery.lightbox.close": "Close",
    "discover.gallery.lightbox.prev": "Previous photo",
    "discover.gallery.lightbox.next": "Next photo",
    "discover.values.title": "Our approach",
    "discover.values.body":
      "CND France is an independent event run by a community of practitioners passionate about cloud-native, open source, and the CNCF ecosystem. We believe in digital sovereignty, diversity of backgrounds, and peer-to-peer learning. Each edition brings together engineers, ops, architects, and curious minds around concrete talks, real-world experience reports, and genuine conversations.",
    "discover.stats.participants": "participants",
    "discover.stats.talks": "talks",
    "discover.stats.speakers": "speakers",
    "discover.stats.tracks": "tracks",
    "discover.audience.title": "Who is it for?",
    "discover.audience.dev.title": "Developer",
    "discover.audience.dev.topics": "Kubernetes · WASM · Applied AI",
    "discover.audience.ops.title": "Ops / SRE",
    "discover.audience.ops.topics": "Observability · Platform Engineering · FinOps",
    "discover.audience.lead.title": "Tech Lead / Architect",
    "discover.audience.lead.topics": "Cloud strategy · Distributed patterns · Governance",
    "discover.replays.title": "2026 talks",
    "discover.replays.cta": "Watch all replays",
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/katia/workdir/CNDF/website
pnpm astro check 2>&1 | head -20
```

Expected: no type errors related to `ui.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ui.ts
git commit -m "feat(i18n): add discover.* and nav.discover keys (FR + EN)"
```

---

## Task 2: Static replay data

**Files:**
- Create: `src/data/replays.ts`
- Create: `src/lib/__tests__/replays.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/replays.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { REPLAYS_2026, REPLAYS_PLAYLIST_ID } from "@/data/replays";

describe("REPLAYS_2026", () => {
  it("contains exactly 6 entries", () => {
    expect(REPLAYS_2026).toHaveLength(6);
  });

  it("each entry has a non-empty id and title", () => {
    for (const replay of REPLAYS_2026) {
      expect(typeof replay.id).toBe("string");
      expect(replay.id.length).toBeGreaterThan(0);
      expect(typeof replay.title).toBe("string");
      expect(replay.title.length).toBeGreaterThan(0);
    }
  });
});

describe("REPLAYS_PLAYLIST_ID", () => {
  it("is the 2026 playlist ID", () => {
    expect(REPLAYS_PLAYLIST_ID).toBe("PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/__tests__/replays.test.ts
```

Expected: FAIL with `Cannot find module '@/data/replays'`.

- [ ] **Step 3: Collect the 6 video IDs**

Open `https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2` in a browser. For each video, hover over the thumbnail to see the URL in the status bar — note the `v=XXXXXXXXXXX` parameter (11-character ID). Pick 6 videos and their titles.

- [ ] **Step 4: Create `src/data/replays.ts`**

Replace `VIDEO_ID_N` and `"Talk title N"` with the actual values from Step 3:

```typescript
export interface Replay {
  id: string;
  title: string;
}

export const REPLAYS_2026: Replay[] = [
  { id: "lJXUhqHWCDo", title: "Talk title 1" },
  { id: "VIDEO_ID_2",  title: "Talk title 2" },
  { id: "VIDEO_ID_3",  title: "Talk title 3" },
  { id: "VIDEO_ID_4",  title: "Talk title 4" },
  { id: "VIDEO_ID_5",  title: "Talk title 5" },
  { id: "VIDEO_ID_6",  title: "Talk title 6" },
];

export const REPLAYS_PLAYLIST_ID = "PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2";
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test src/lib/__tests__/replays.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/replays.ts src/lib/__tests__/replays.test.ts
git commit -m "feat(data): add REPLAYS_2026 static data and unit test"
```

---

## Task 3: Integration test (write first)

**Files:**
- Create: `tests/build/discover-page.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
/**
 * CLO-52: asserts /decouvrir and /en/discover render key sections.
 * Reads built dist/ HTML. Skips if dist is missing (run `pnpm build` first).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/decouvrir/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/discover/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages: Array<{ label: string; path: string }> = [
  { label: "FR (/decouvrir/)", path: DIST_FR },
  { label: "EN (/en/discover/)", path: DIST_EN },
];

describe("CLO-52: discover page", () => {
  for (const { label, path } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("embeds the behind-the-scenes video (A51PGVvrt_8)", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/youtube-nocookie\.com\/embed\/A51PGVvrt_8/);
      });

      it.skipIf(!distExists)("has photos section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="photos"/);
      });

      it.skipIf(!distExists)("has values section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="values"/);
      });

      it.skipIf(!distExists)("has audience section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="audience"/);
      });

      it.skipIf(!distExists)("has replays section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="replays"/);
      });

      it.skipIf(!distExists)("renders YouTube thumbnail images", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/img\.youtube\.com\/vi\//);
      });

      it.skipIf(!distExists)("links to the replays page", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/href="[^"]*\/replays/);
      });
    });
  }
});
```

- [ ] **Step 2: Run test — expect all to skip (dist not built yet)**

```bash
pnpm test tests/build/discover-page.test.ts
```

Expected: 14 tests skipped (dist does not exist yet).

- [ ] **Step 3: Commit**

```bash
git add tests/build/discover-page.test.ts
git commit -m "test(discover): write integration test before implementation (CLO-52)"
```

---

## Task 4: `DiscoverVideoHero.astro`

**Files:**
- Create: `src/components/discover/DiscoverVideoHero.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  title: string;
  subtitle: string;
}

const { title, subtitle } = Astro.props;
const VIDEO_ID = "A51PGVvrt_8";
---

<section class="w-full bg-background">
  <div class="mx-auto max-w-7xl px-4 md:px-6 pt-16 pb-8 text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
    <p class="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{subtitle}</p>
    <div class="relative w-full rounded-xl overflow-hidden" style="padding-top: 56.25%;">
      <iframe
        class="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/discover/DiscoverVideoHero.astro
git commit -m "feat(discover): add DiscoverVideoHero component"
```

---

## Task 5: `PhotoGallery.astro`

**Files:**
- Create: `src/components/discover/PhotoGallery.astro`

- [ ] **Step 1: Create the component**

```astro
---
import { Image } from "astro:assets";
import amb00 from "@/assets/photos/ambiance/ambiance-00.jpg";
import amb01 from "@/assets/photos/ambiance/ambiance-01.jpg";
import amb02 from "@/assets/photos/ambiance/ambiance-02.jpg";
import amb03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import amb04 from "@/assets/photos/ambiance/ambiance-04.jpg";
import amb05 from "@/assets/photos/ambiance/ambiance-05.jpg";
import amb06 from "@/assets/photos/ambiance/ambiance-06.jpg";
import amb07 from "@/assets/photos/ambiance/ambiance-07.jpg";
import amb08 from "@/assets/photos/ambiance/ambiance-08.jpg";
import amb09 from "@/assets/photos/ambiance/ambiance-09.jpg";
import amb10 from "@/assets/photos/ambiance/ambiance-10.jpg";

interface Props {
  title: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}

const { title, closeLabel, prevLabel, nextLabel } = Astro.props;

const photos = [
  { src: amb00, alt: "Ambiance CND France 2026 — photo 1" },
  { src: amb01, alt: "Ambiance CND France 2026 — photo 2" },
  { src: amb02, alt: "Ambiance CND France 2026 — photo 3" },
  { src: amb03, alt: "Ambiance CND France 2026 — photo 4" },
  { src: amb04, alt: "Ambiance CND France 2026 — photo 5" },
  { src: amb05, alt: "Ambiance CND France 2026 — photo 6" },
  { src: amb06, alt: "Ambiance CND France 2026 — photo 7" },
  { src: amb07, alt: "Ambiance CND France 2026 — photo 8" },
  { src: amb08, alt: "Ambiance CND France 2026 — photo 9" },
  { src: amb09, alt: "Ambiance CND France 2026 — photo 10" },
  { src: amb10, alt: "Ambiance CND France 2026 — photo 11" },
];
---

<section id="photos" class="mx-auto max-w-7xl px-4 md:px-6 py-16">
  <h2 class="text-3xl font-bold text-foreground mb-8 text-center">{title}</h2>

  <div class="columns-1 sm:columns-2 lg:columns-3 gap-4">
    {photos.map(({ src, alt }, i) => (
      <button
        class="gallery-btn w-full mb-4 rounded-lg overflow-hidden block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-index={String(i)}
        aria-label={alt}
      >
        <Image
          src={src}
          alt={alt}
          widths={[400, 800]}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          class="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
        />
      </button>
    ))}
  </div>

  <dialog
    id="gallery-lightbox"
    class="fixed inset-0 z-50 bg-black/90 w-full max-w-none h-full m-0 p-0 backdrop:bg-transparent"
    aria-label={title}
  >
    <div class="flex items-center justify-center w-full h-full relative p-4">
      <button
        id="lb-close"
        class="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label={closeLabel}
      >✕</button>
      <button
        id="lb-prev"
        class="absolute left-4 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label={prevLabel}
      >‹</button>
      <img id="lb-img" src="" alt="" class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
      <button
        id="lb-next"
        class="absolute right-4 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label={nextLabel}
      >›</button>
    </div>
  </dialog>
</section>

<script>
  const btns = Array.from(document.querySelectorAll<HTMLButtonElement>(".gallery-btn"));
  const dialog = document.getElementById("gallery-lightbox") as HTMLDialogElement | null;
  const lbImg = document.getElementById("lb-img") as HTMLImageElement | null;

  if (!dialog || !lbImg) throw new Error("Lightbox elements not found");

  const srcs = btns.map((btn) => (btn.querySelector("img") as HTMLImageElement).src);
  const alts = btns.map((btn) => (btn.querySelector("img") as HTMLImageElement).alt);
  let current = 0;

  function showSlide(i: number) {
    current = (i + srcs.length) % srcs.length;
    lbImg!.src = srcs[current];
    lbImg!.alt = alts[current];
  }

  btns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      showSlide(i);
      dialog!.showModal();
    });
  });

  document.getElementById("lb-close")?.addEventListener("click", () => dialog!.close());
  document.getElementById("lb-prev")?.addEventListener("click", () => showSlide(current - 1));
  document.getElementById("lb-next")?.addEventListener("click", () => showSlide(current + 1));

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showSlide(current - 1);
    if (e.key === "ArrowRight") showSlide(current + 1);
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/discover/PhotoGallery.astro
git commit -m "feat(discover): add PhotoGallery component with native dialog lightbox"
```

---

## Task 6: `DiscoverValues.astro`

**Files:**
- Create: `src/components/discover/DiscoverValues.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Stats {
  participants: string;
  talks: string;
  speakers: string;
  tracks: string;
}

interface Props {
  title: string;
  body: string;
  stats: Stats;
}

const { title, body, stats } = Astro.props;
---

<section id="values" class="bg-card">
  <div class="mx-auto max-w-7xl px-4 md:px-6 py-16">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl font-bold text-foreground mb-6">{title}</h2>
        <p class="text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <div class="flex flex-wrap gap-8 justify-center md:justify-end">
        {[
          { emoji: "🌐", label: "Open Source" },
          { emoji: "🤝", label: "Communauté" },
          { emoji: "🌱", label: "Souveraineté" },
          { emoji: "♾️", label: "Inclusion" },
        ].map(({ emoji, label }) => (
          <div class="flex flex-col items-center gap-2">
            <span class="text-5xl" aria-hidden="true">{emoji}</span>
            <span class="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>

    <div class="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-border pt-8">
      <div class="text-center">
        <div class="text-4xl font-bold text-primary">2 000</div>
        <div class="text-sm text-muted-foreground mt-1">{stats.participants}</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-bold text-primary">50+</div>
        <div class="text-sm text-muted-foreground mt-1">{stats.talks}</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-bold text-primary">30+</div>
        <div class="text-sm text-muted-foreground mt-1">{stats.speakers}</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-bold text-primary">2</div>
        <div class="text-sm text-muted-foreground mt-1">{stats.tracks}</div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/discover/DiscoverValues.astro
git commit -m "feat(discover): add DiscoverValues component with 2026 stats strip"
```

---

## Task 7: `AudienceProfiles.astro`

**Files:**
- Create: `src/components/discover/AudienceProfiles.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Profile {
  icon: string;
  title: string;
  topics: string;
}

interface Props {
  title: string;
  profiles: Profile[];
}

const { title, profiles } = Astro.props;
---

<section id="audience" class="mx-auto max-w-7xl px-4 md:px-6 py-16">
  <h2 class="text-3xl font-bold text-foreground mb-10 text-center">{title}</h2>
  <div class="grid md:grid-cols-3 gap-6">
    {profiles.map(({ icon, title: profileTitle, topics }) => (
      <div class="bg-card border border-border rounded-xl p-8 flex flex-col gap-4">
        <span class="text-5xl" aria-hidden="true">{icon}</span>
        <h3 class="text-xl font-semibold text-foreground">{profileTitle}</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">{topics}</p>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/discover/AudienceProfiles.astro
git commit -m "feat(discover): add AudienceProfiles component"
```

---

## Task 8: `ReplayGrid.astro`

**Files:**
- Create: `src/components/discover/ReplayGrid.astro`

- [ ] **Step 1: Create the component**

```astro
---
import type { Replay } from "@/data/replays";
import { REPLAYS_PLAYLIST_ID } from "@/data/replays";
import { getLocalePath } from "@/i18n/utils";
import type { Locale } from "@/i18n/ui";

interface Props {
  title: string;
  cta: string;
  replays: Replay[];
  lang: Locale;
}

const { title, cta, replays, lang } = Astro.props;
const replaysHref = getLocalePath(lang, "/replays");
---

<section id="replays" class="bg-muted/30">
  <div class="mx-auto max-w-7xl px-4 md:px-6 py-16">
    <h2 class="text-3xl font-bold text-foreground mb-10 text-center">{title}</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      {replays.map(({ id, title: talkTitle }) => (
        <a
          href={`https://www.youtube.com/watch?v=${id}&list=${REPLAYS_PLAYLIST_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          class="group relative rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 block"
          aria-label={talkTitle}
        >
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt={talkTitle}
            class="w-full aspect-video object-cover"
            loading="lazy"
            width="480"
            height="360"
          />
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-end p-3">
            <span class="text-white text-sm font-medium line-clamp-2">{talkTitle}</span>
          </div>
          <div class="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-0 transition-opacity">
            <div class="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
    <div class="mt-10 text-center">
      <a
        href={replaysHref}
        class="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4 text-lg"
      >
        {cta}
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/discover/ReplayGrid.astro
git commit -m "feat(discover): add ReplayGrid component"
```

---

## Task 9: Astro pages

**Files:**
- Create: `src/pages/decouvrir.astro`
- Create: `src/pages/en/discover.astro`

- [ ] **Step 1: Create `src/pages/decouvrir.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
import DiscoverVideoHero from "@/components/discover/DiscoverVideoHero.astro";
import PhotoGallery from "@/components/discover/PhotoGallery.astro";
import DiscoverValues from "@/components/discover/DiscoverValues.astro";
import AudienceProfiles from "@/components/discover/AudienceProfiles.astro";
import ReplayGrid from "@/components/discover/ReplayGrid.astro";
import { REPLAYS_2026 } from "@/data/replays";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<Layout
  title={t("discover.page.title")}
  description={t("discover.page.description")}
  lang={lang}
  canonicalPath="/decouvrir"
>
  <main>
    <DiscoverVideoHero
      title={t("discover.hero.title")}
      subtitle={t("discover.hero.subtitle")}
    />
    <PhotoGallery
      title={t("discover.gallery.title")}
      closeLabel={t("discover.gallery.lightbox.close")}
      prevLabel={t("discover.gallery.lightbox.prev")}
      nextLabel={t("discover.gallery.lightbox.next")}
    />
    <DiscoverValues
      title={t("discover.values.title")}
      body={t("discover.values.body")}
      stats={{
        participants: t("discover.stats.participants"),
        talks: t("discover.stats.talks"),
        speakers: t("discover.stats.speakers"),
        tracks: t("discover.stats.tracks"),
      }}
    />
    <AudienceProfiles
      title={t("discover.audience.title")}
      profiles={[
        { icon: "💻", title: t("discover.audience.dev.title"), topics: t("discover.audience.dev.topics") },
        { icon: "⚙️", title: t("discover.audience.ops.title"), topics: t("discover.audience.ops.topics") },
        { icon: "🏗️", title: t("discover.audience.lead.title"), topics: t("discover.audience.lead.topics") },
      ]}
    />
    <ReplayGrid
      title={t("discover.replays.title")}
      cta={t("discover.replays.cta")}
      replays={REPLAYS_2026}
      lang={lang}
    />
  </main>
</Layout>
```

- [ ] **Step 2: Create `src/pages/en/discover.astro`**

The EN page is identical — `getLangFromUrl` resolves to `"en"` from the URL, so all translations and paths are locale-correct automatically:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
import DiscoverVideoHero from "@/components/discover/DiscoverVideoHero.astro";
import PhotoGallery from "@/components/discover/PhotoGallery.astro";
import DiscoverValues from "@/components/discover/DiscoverValues.astro";
import AudienceProfiles from "@/components/discover/AudienceProfiles.astro";
import ReplayGrid from "@/components/discover/ReplayGrid.astro";
import { REPLAYS_2026 } from "@/data/replays";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<Layout
  title={t("discover.page.title")}
  description={t("discover.page.description")}
  lang={lang}
  canonicalPath="/en/discover"
>
  <main>
    <DiscoverVideoHero
      title={t("discover.hero.title")}
      subtitle={t("discover.hero.subtitle")}
    />
    <PhotoGallery
      title={t("discover.gallery.title")}
      closeLabel={t("discover.gallery.lightbox.close")}
      prevLabel={t("discover.gallery.lightbox.prev")}
      nextLabel={t("discover.gallery.lightbox.next")}
    />
    <DiscoverValues
      title={t("discover.values.title")}
      body={t("discover.values.body")}
      stats={{
        participants: t("discover.stats.participants"),
        talks: t("discover.stats.talks"),
        speakers: t("discover.stats.speakers"),
        tracks: t("discover.stats.tracks"),
      }}
    />
    <AudienceProfiles
      title={t("discover.audience.title")}
      profiles={[
        { icon: "💻", title: t("discover.audience.dev.title"), topics: t("discover.audience.dev.topics") },
        { icon: "⚙️", title: t("discover.audience.ops.title"), topics: t("discover.audience.ops.topics") },
        { icon: "🏗️", title: t("discover.audience.lead.title"), topics: t("discover.audience.lead.topics") },
      ]}
    />
    <ReplayGrid
      title={t("discover.replays.title")}
      cta={t("discover.replays.cta")}
      replays={REPLAYS_2026}
      lang={lang}
    />
  </main>
</Layout>
```

- [ ] **Step 3: Type-check**

```bash
pnpm astro check 2>&1 | head -30
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/decouvrir.astro src/pages/en/discover.astro
git commit -m "feat(discover): add /decouvrir and /en/discover pages"
```

---

## Task 10: Navigation update

**Files:**
- Modify: `src/components/Navigation.astro`

- [ ] **Step 1: Add `pathEn` to the navItem type**

In `src/components/Navigation.astro`, find the `navItems` type declaration:

```typescript
const navItems: Array<{
  key: "nav.home" | "nav.speakers" | "nav.schedule" | "nav.replays" | "nav.sponsors" | "nav.venue" | "nav.team";
  path: string;
  dead: boolean;
  postEventOnly?: boolean;
}> = [
```

Replace with:

```typescript
const navItems: Array<{
  key: "nav.home" | "nav.speakers" | "nav.schedule" | "nav.replays" | "nav.sponsors" | "nav.venue" | "nav.team" | "nav.discover";
  path: string;
  pathEn?: string;
  dead: boolean;
  postEventOnly?: boolean;
}> = [
```

- [ ] **Step 2: Add the discover entry after the home entry**

Find `{ key: "nav.home", path: "/", dead: false },` and add the discover item immediately after:

```typescript
  { key: "nav.home",     path: "/",          dead: false },
  { key: "nav.discover", path: "/decouvrir", pathEn: "/discover", dead: false },
```

- [ ] **Step 3: Update the links mapping to use `pathEn`**

Find:

```typescript
const links = navItems.map(({ key, path, dead, postEventOnly }) => ({
  key,
  label: t(key),
  href: getLocalePath(lang, path),
  active: isActive(currentPath, getLocalePath(lang, path), dead),
  postEventOnly: !!postEventOnly,
}));
```

Replace with:

```typescript
const links = navItems.map(({ key, path, pathEn, dead, postEventOnly }) => {
  const resolvedPath = lang === "en" && pathEn ? pathEn : path;
  const href = getLocalePath(lang, resolvedPath);
  return {
    key,
    label: t(key),
    href,
    active: isActive(currentPath, href, dead),
    postEventOnly: !!postEventOnly,
  };
});
```

- [ ] **Step 4: Type-check**

```bash
pnpm astro check 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Navigation.astro
git commit -m "feat(nav): add Découvrir link with FR/EN locale-aware paths"
```

---

## Task 11: Homepage hero CTA

**Files:**
- Modify: `src/components/hero/HeroSection.astro`

- [ ] **Step 1: Add i18n key and discover URL**

In `src/components/hero/HeroSection.astro`, find the line:

```typescript
const SCHEDULE_URL: string | null = getLocalePath(lang, "/programme");
```

Add after it:

```typescript
const DISCOVER_URL = getLocalePath(lang, lang === "en" ? "/discover" : "/decouvrir");
```

- [ ] **Step 2: Add the discover button to the CTA group**

Find the `<div class="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">` block. After the closing `</a>` of the register button (the first `<a>` in the group), add:

```astro
      <a
        href={DISCOVER_URL}
        class={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-[52px] px-8 text-lg font-bold"
        )}
      >
        {t("hero.cta.discover")}
      </a>
```

- [ ] **Step 3: Type-check**

```bash
pnpm astro check 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/HeroSection.astro
git commit -m "feat(hero): add Découvrir l'événement secondary CTA"
```

---

## Task 12: Build and run all tests

- [ ] **Step 1: Run unit tests**

```bash
pnpm test
```

Expected: all tests pass including `replays.test.ts` and existing suite.

- [ ] **Step 2: Build the site**

```bash
pnpm build
```

Expected: build completes with no errors. Check output includes `decouvrir/index.html` and `en/discover/index.html`.

- [ ] **Step 3: Run integration tests**

```bash
pnpm test tests/build/discover-page.test.ts
```

Expected: 14 tests pass (none skipped — dist now exists).

- [ ] **Step 4: Smoke-test in browser**

```bash
pnpm preview
```

Open `http://localhost:4321/decouvrir` and verify:
- Video embeds and plays
- Clicking a photo opens the lightbox; arrows navigate; Escape closes
- Values section shows 4 stats
- 3 audience cards render
- 6 replay thumbnails render with play icon overlay
- "Voir tous les replays" links to `/replays`
- Nav shows "Découvrir" link and it is active on this page

Open `http://localhost:4321/en/discover` and verify same in English.

Open `http://localhost:4321` and verify the "Découvrir l'événement" button appears in the hero.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix(discover): post-smoke-test corrections"
```
