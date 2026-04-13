# Pitfalls Research — v1.1 Past Editions Showcase

**Domain:** Astro 6 content site — adding static past-edition sections + animated testimonials to an already-shipped homepage
**Researched:** 2026-04-13
**Confidence:** HIGH — grounded in repo inspection (actual file paths, line ranges, installed deps, existing conventions) and v1.1 architecture + stack research

> Numbered "pitfalls" align to the phase map from `ARCHITECTURE.md` so each can be pinned to a single owning phase.

---

## Critical Pitfalls

### Pitfall 1: Shipping 21 MB of raw JPG masters through `astro:assets` (LCP cliff + build slowdown)

**Severity:** HIGH
**Owning phase:** Phase 1 — Asset prep

**What goes wrong:**
All 10 KCD 2023 photos get dropped into `src/assets/photos/kcd2023/` as provided (≈2.1 MB average). Astro's Sharp pipeline re-encodes them per requested width/format, but the *master* still sits in the git tree forever. Homepage LCP regresses, `pnpm build` slows, the git pack grows permanently.

**Why it happens:**
Fastest path: drag-and-drop into the folder. `<Picture>` "just works" visually in dev, so the issue is invisible until Lighthouse or a cold `pnpm build` on CI exposes it.

**How to avoid:**
- Run the repo-standard recipe from `src/assets/photos/README.md` BEFORE `git add`: long edge ≤ 2400 px, quality 82, EXIF stripped.
- Target per-master: 300–850 KB. Total 2023 masters under ~6 MB.
- Add a pre-commit assertion: `find src/assets/photos/kcd2023 -size +1M` must print nothing.
- Verify `<Picture>` renders AVIF + WebP + JPG fallback (`formats={["avif","webp"]}`, explicit `widths`, explicit `sizes`).

**Warning signs:**
- `git status` shows any `src/assets/photos/kcd2023/*.jpg` over 1 MB.
- `pnpm build` reports Sharp processing time > 10 s for kcd2023/.
- Dev-server "Compiling..." stalls on homepage load after the 2023 section renders.

---

### Pitfall 2: No `width`/`height` reservation on the 10-photo grid → CLS regression on homepage

**Severity:** HIGH
**Owning phase:** Phase 6 — Build Edition2023Section

**What goes wrong:**
Photos load after layout → page jumps → CLS score on `/` and `/en/` drops below v1.0 baseline. Mobile users scrolling past the 2023 section lose their place mid-scroll.

**Why it happens:**
`<Picture src={imported}>` infers dimensions from the imported asset, BUT if the grid uses `object-cover` with flexible aspect ratios without constraining the wrapper, the browser still cannot reserve space until the first byte lands. A developer in a hurry uses raw `<img>` for a "quick preview" commit and forgets to convert back.

**How to avoid:**
- Always import via `import photo from "@/assets/photos/kcd2023/kcd2023-01.jpg"` and pass to `<Picture src={photo}>`. Never `<img src="/...">` from `public/`.
- Wrap every tile in `aspect-[3/2]` (or whatever Stitch specifies) + `overflow-hidden` so reserved space is set before decode.
- Set explicit `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` — same pattern as v1.0 venue block.
- Run mobile Lighthouse before PR merge; CLS must stay ≤ 0.02 above v1.0 baseline.

**Warning signs:**
- Chrome DevTools "Rendering → Layout shift regions" flashes over the 2023 grid on first load.
- Lighthouse mobile CLS rises above 0.05.
- Manual test: throttle to Slow 4G and watch tiles pop in and push content down.

---

### Pitfall 3: Over-hydrating past-edition sections as React islands

**Severity:** HIGH
**Owning phase:** Phase 2 — Build `PastEditionSection.astro`

**What goes wrong:**
`Edition2026Section` or `Edition2023Section` is implemented as `.tsx` with `client:load` "because it was easier to copy from an existing island." Homepage JS payload balloons by 30–80 KB for content that is 100% static. LCP worsens, v1.0's "zero-JS-by-default" posture is broken.

**Why it happens:**
React muscle memory + precedent (`KeyNumbers client:idle` is already on the homepage) makes an island feel like the house pattern even though it is not.

**How to avoid:**
- Both past-edition sections MUST be `.astro` (per ARCHITECTURE.md layout). No React, no `client:*` directive.
- In PR review, grep the diff for `client:` — any hit under `src/components/past-editions/` is a red flag.
- Only `TestimonialsStrip` may be an island, and only if Stitch requires JS-driven animation (default: pure CSS `.astro`, no island — see Pitfall 10).

**Warning signs:**
- `pnpm build` output shows a growing "client-side JS" figure vs v1.0 baseline.
- `view-source:/` reveals `<astro-island>` tags wrapping photo grids.
- Network tab shows additional `.js` bundles on first homepage load.

---

### Pitfall 4: Missing EN translations → bilingual copy drift

**Severity:** HIGH
**Owning phase:** Phase 3 — Add i18n `editions.*` keys

**What goes wrong:**
FR keys added to `src/i18n/ui.ts` but `en` block forgotten or incomplete. Because `useTranslations` falls back to FR silently (project's "single-locale schema with FR fallback" decision), `/en/` renders mixed English/French copy — invisible in a FR-only dev check.

**Why it happens:**
FR fallback is deliberately forgiving. The safety net hides the bug during development.

**How to avoid:**
- Add every key to FR **and** EN in the same commit — treat `ui.ts` edits as a paired diff.
- After Phase 3, key counts under `editions.*` and `testimonials.*` must be equal between FR and EN.
- Add a Vitest assertion: for each `editions.*` / `testimonials.*` key in `fr`, assert `en` has the same path **and** value is NOT byte-identical to FR (prevents the accidental "copy FR into EN" shortcut that looks translated but isn't).
- Manual QA: visit `/en/` with DevTools → search rendered HTML for French diacritics (à â ç é è ê ë î ï ô û ù ü œ) inside the new sections.

**Warning signs:**
- PR diff shows FR additions but no EN additions.
- Key-count mismatch in i18n test.
- `/en/` rendered HTML contains French diacritics inside `editions.*` / `testimonials.*` regions.

---

### Pitfall 5: Deleting `venue.prev.*` keys + 2026 venue block before homepage 2026 section is verified live

**Severity:** HIGH
**Owning phase:** Phase 5 — Remove 2026 block / Phase 7 — Delete `venue.prev.*` keys

**What goes wrong:**
Venue page loses the only "previous edition" content on the site, then homepage rollout is delayed by design feedback → the site ships to prod with a content gap. Or: keys are deleted too eagerly and another page that secretly depends on them (search, sitemap, structured data) breaks at build time. `venue.prev.*` has 16 entries in `src/i18n/ui.ts` today — a big sweep.

**Why it happens:**
"Refactor while you're there" impulse. The block is right there at lines 216–283 of `src/pages/venue/index.astro` and deletion is a single hunk.

**How to avoid:**
- Sequence mandated by ARCHITECTURE.md: Phase 4 lands homepage 2026 FIRST, Phase 5 deletes venue block SECOND, Phase 7 deletes i18n keys LAST — each in its own commit.
- Before Phase 5 PR merges: confirm `src/pages/index.astro` AND `src/pages/en/index.astro` BOTH render `<Edition2026Section />` in production preview.
- Before Phase 7 PR merges: `grep -rn "venue.prev" src/` must return zero hits.
- Phase 5 is a surgical commit on its own — enables clean `git revert` if the venue page looks broken.

**Warning signs:**
- PR bundles both "add homepage 2026" and "delete venue block" in one diff.
- `pnpm build` fails on an undefined `t("venue.prev.X")` call from an overlooked consumer.
- Staging venue page shows a blank gap where the 2026 block used to be.

---

### Pitfall 6: Animated testimonials ship without `prefers-reduced-motion` fallback

**Severity:** HIGH (accessibility / WCAG 2.2.2 failure)
**Owning phase:** Phase 8 — Build TestimonialsStrip

**What goes wrong:**
CSS marquee or React animation runs unconditionally. Users with vestibular sensitivities get motion sickness; users with `prefers-reduced-motion: reduce` are ignored. Site fails WCAG 2.2.2 "Pause, Stop, Hide."

**Why it happens:**
STACK.md flags the repo gap: "grep across `src/` shows zero existing uses of `prefers-reduced-motion`." v1.1 is the codebase's first animated feature; no established pattern to copy.

**How to avoid:**
- Add the global reset from STACK.md §3 to the TOP of `src/styles/global.css` BEFORE any testimonial animation lands (baseline exists even if the testimonial CSS forgets the media query).
- Inside the testimonial component, wrap the `animation:` declaration in `@media (prefers-reduced-motion: no-preference)` OR use Tailwind's `motion-safe:animate-*` variant.
- Provide pause-on-hover AND pause-on-focus: `.marquee:hover, .marquee:focus-within { animation-play-state: paused; }`.
- Playwright test: `await page.emulateMedia({ reducedMotion: 'reduce' })` → assert computed `animation` on the strip is `none`.

**Warning signs:**
- DevTools "Rendering → Emulate CSS media feature prefers-reduced-motion → reduce" still shows movement.
- Hover over the strip — if it does not pause, keyboard focus will not either.
- No `motion-safe:` or `prefers-reduced-motion` string anywhere in the testimonial component or `global.css`.

---

### Pitfall 7: Testimonials strip not keyboard-accessible (focus trap + duplicated quotes in tab order)

**Severity:** HIGH (accessibility)
**Owning phase:** Phase 8 — Build TestimonialsStrip

**What goes wrong:**
The canonical CSS infinite-marquee pattern duplicates the quote list for seamless looping. Without `aria-hidden` + `tabindex="-1"` on the clone, each quote (and any inner focusable element) is in the tab order twice, some of them moving off-screen. Keyboard users land on invisible content.

**Why it happens:**
Copy-pasting the marquee template from Magic UI / Ryan Mulligan's CSS-only recipe without adding the clone-hiding attributes.

**How to avoid:**
- Mark the duplicated track `aria-hidden="true"` and give every focusable descendant `tabindex="-1"`.
- Quotes are plain text + `<cite>` — no inner links in v1.1 — keeps tab order clean.
- If autoplay is kept, provide a visible pause button (shadcn / Base UI button) reachable via Tab BEFORE entering the strip (WCAG 2.2.2).
- Playwright: tab from the section preceding the strip → assert next focus lands on the pause button, not on a cloned quote.

**Warning signs:**
- Tabbing through `/` lands focus on content scrolling off-screen.
- Screen reader announces each quote twice.
- No `aria-hidden` on the duplicated track.

---

### Pitfall 8: Fake / anonymous testimonials shipping to prod as "placeholders"

**Severity:** HIGH (trust + brand)
**Owning phase:** Phase 8 — Build TestimonialsStrip (content gate)

**What goes wrong:**
Three placeholder quotes ("Super conf !" — Alice D., Developer at Acme) land in production with fabricated attributions. Community spots them; trust damage is real and public. Alternative: quotes run without any attribution → feel fabricated anyway.

**Why it happens:**
Milestone brief explicitly allows placeholder quotes. "Temporary" content is famous for becoming permanent (see Pitfall 15).

**How to avoid:**
- Placeholders in `testimonials-data.ts` MUST use clearly non-real attribution: `author: "[Placeholder — quote pending]"`, no fabricated names, no fake companies.
- Add a dev/staging-only badge: `{import.meta.env.DEV && <Badge>Placeholder testimonials</Badge>}`.
- Create a tracking issue `testimonials-real-quotes` referenced in the header comment of `testimonials-data.ts`. Milestone exit criterion: "real quotes sourced OR placeholder badge visible on staging."
- Do NOT use AI-generated attributions. Do NOT use any real community member's name without explicit written consent.

**Warning signs:**
- `testimonials-data.ts` contains a plausible-looking full `"Firstname Lastname"` pair or a `@company.com` domain with no linked consent record.
- Placeholder still live > 2 weeks post-launch with no tracker.

---

## Moderate Pitfalls

### Pitfall 9: Stitch design drift — past-edition sections do not match existing homepage rhythm

**Severity:** MEDIUM
**Owning phase:** Phase 0 — Stitch designs

**What goes wrong:**
New sections are designed in a blank Stitch canvas → spacing, rail-label typography, card radius, color tokens drift from the shipped Hero / KeyNumbers / Cfp sections. Homepage feels "stitched together."

**Why it happens:**
Stitch prompts often start from "design a past-editions section" without loading the existing homepage context. MEMORY note warns: "Never override design system colors in Stitch prompts; use token roles."

**How to avoid:**
- Pre-load the current `/` screenshot + design-system IDs from MEMORY `reference_stitch.md` into the Stitch prompt.
- Reuse the existing rail-label pattern verbatim: `text-xs uppercase tracking-[0.2em]` in muted/tertiary token color (used 6× in venue page today).
- Stitch deliverable must include a full-page mock (Hero → KeyNumbers → Cfp → 2026 → 2023 → Testimonials), not per-section in isolation.
- Tokens only (per MEMORY feedback) — no hex codes in Stitch prompts.

**Warning signs:**
- Stitch mock uses section padding that does not match the existing homepage cadence.
- Designer invents an accent color not in `components.json` / Tailwind theme.
- Heading sizes do not match the existing `h2` scale on `/`.

---

### Pitfall 10: Unnecessary React island for testimonials

**Severity:** MEDIUM
**Owning phase:** Phase 8 — Build TestimonialsStrip

**What goes wrong:**
A React island (`TestimonialsStrip.tsx` + `client:visible`) is created for what is a static list of 3 strings cycling via CSS. React runtime + hydration cost added for zero functional benefit.

**Why it happens:**
ARCHITECTURE.md initially proposed `.tsx`; STACK.md subsequently recommends pure-CSS `.astro`. The gap between the two docs is where this pitfall sneaks in.

**How to avoid:**
- Default: `TestimonialsStrip.astro` with CSS `@keyframes`. No island.
- Escalate to `.tsx` + `client:visible` ONLY if Stitch mandates behavior that CSS cannot do (pointer-driven scrub, drag-to-pause, instrumentation).
- Phase 8 kickoff checklist: "Does Stitch mock require JS behavior? If no → `.astro`."

**Warning signs:**
- `TestimonialsStrip.tsx` exists but contains no `useState` / `useEffect` / `useRef` — pure presentation that should be `.astro`.
- Build report shows an added JS chunk for the homepage route.

---

### Pitfall 11: Duplicate or skipped heading levels on homepage

**Severity:** MEDIUM (SEO + a11y)
**Owning phase:** Phase 4, Phase 6, Phase 8

**What goes wrong:**
Three new sections each wrap their title in `<h2>`, and the internal brand-history callout uses another `<h2>` instead of `<h3>`. Homepage ends with a jumbled h1/h2/h4 hierarchy, or two `<h1>` competing.

**Why it happens:**
Copy-pasting the venue page's block — which was an `<h2>` in page context — into a homepage section that now wraps yet another `<h2>`.

**How to avoid:**
- Hero stays the only `<h1>`. Every past-edition section title is `<h2>`. Brand-history callout heading is `<h3>`. Stat labels are NOT headings.
- Run `pa11y http://localhost:4321/` (or Lighthouse a11y) — flags heading-level jumps.
- Manual check: Chrome DevTools → "Accessibility → Headings" must read h1 → h2 → h2 → h2 → h2.

**Warning signs:**
- Lighthouse a11y score drops below v1.0 baseline.
- `pa11y` reports "Heading levels should only increase by one."
- Multiple `<h1>` in rendered `/` HTML.

---

### Pitfall 12: Homepage becomes too long — CFP CTA buried below the fold on mobile

**Severity:** MEDIUM (conversion impact)
**Owning phase:** Phase 0 — Stitch designs (ordering decision) / Phases 4 + 6 (implementation)

**What goes wrong:**
After adding 2026 + 2023 + testimonials, the CFP section (highest-value conversion asset per PROJECT.md core value) is 4–5 viewport heights down on mobile. Registration conversion drops.

**Why it happens:**
Insertion-order bias: "new stuff at the bottom." But "the bottom" in v1.0 was just after `CfpSection`. Default placement pushes CFP up-page but the past editions push it down.

**How to avoid:**
- Stitch mock MUST specify final scroll order AND validate that CFP stays within 2 viewport heights on iPhone 13 width (390×844).
- Recommended order (from FEATURES.md): Hero → KeyNumbers → **CFP** → 2026 → 2023 → Testimonials → Footer. CFP remains above the past-edition tail.
- Post-implementation: measure `getBoundingClientRect().top` of CFP on 390×844 viewport; target ≤ 1200 px to enter viewport.

**Warning signs:**
- On mobile staging, CFP CTA requires > 3 full swipes to reach.
- Analytics (if present) show CFP click-through ratio dropping post v1.1.

---

### Pitfall 13: Orphaned imports / dead constants in venue page after cleanup

**Severity:** MEDIUM
**Owning phase:** Phase 5 — Remove 2026 block from venue page

**What goes wrong:**
Section deleted (lines 216–283) but imports (lines 5–7) and stats arrays (lines 63–73) remain. TS/ESLint may only warn. Unused ambiance-*.jpg imports still feed Sharp, producing dist assets no page references.

**Why it happens:**
Jump-to-section-and-delete misses top-of-file imports and mid-file constants.

**How to avoid:**
- Enable `noUnusedLocals: true` in `tsconfig.json` (if not already) → `pnpm exec tsc --noEmit` fails on orphans.
- Diff `dist/_astro/` output before/after cleanup; any still-present asset that is no longer referenced is an orphan.
- Grep the file for each deleted symbol after surgery: `grep -n "ambiance03\|previousStats\|YOUTUBE_ID\|GALLERY_URL" src/pages/venue/index.astro` must return zero hits.

**Warning signs:**
- `dist/` still contains `ambiance-*.jpg` variants after cleanup.
- ESLint `no-unused-vars` warning in `venue/index.astro`.

---

### Pitfall 14: Broken anchor links / navigation references to venue's old 2026 block

**Severity:** MEDIUM
**Owning phase:** Phase 5 — Remove 2026 block from venue page

**What goes wrong:**
Any link like `/venue#previous-edition` (in footer, mobile menu, blog post, external sharing, social media) now scrolls nowhere. Silent UX regression with no build error.

**Why it happens:**
Anchor references do not break the build and are easy to miss.

**How to avoid:**
- Before Phase 5: `grep -rn "#previous-edition\|#prev\|#2026\|venue#" src/` to capture current references.
- If anchors exist on the soon-deleted block, either (a) relocate the anchor ID onto the new homepage section (`/#edition-2026`) and update the links, or (b) add a server-side redirect (nginx in the Docker image / cnd-platform manifest) from `/venue#previous-edition` → `/#edition-2026`.
- Update footer / header / mobile nav if they point to the deleted anchor.

**Warning signs:**
- After deploy, clicking an existing link scrolls to page bottom or hero instead of target.
- Manual: open the previous edition's shared social post → click → land on wrong content.

---

### Pitfall 15: 2026 "temporary placeholder" content shipping to prod and never being updated

**Severity:** MEDIUM
**Owning phase:** Phase 4 — Build Edition2026Section (content gate)

**What goes wrong:**
Placeholder 2026 stats and copy ship. Real 2026 recap content "comes later." Later never comes; months pass; visitors see the 2026 edition looking staler than the 2023 edition beside it.

**Why it happens:**
PROJECT.md explicitly allows placeholder content. The v1.0 venue page's numbers (1700+ / 50+ / 40+) are already placeholder-ish with no tracker.

**How to avoid:**
- Every placeholder string wrapped in a marker: `[TODO:2026-recap] 1700+`. Use a single source of truth file `editions-data.ts` with `placeholder: true` flag per field.
- In dev/staging only, render a visible `<Badge>` on any section where `placeholder === true`.
- Create a GitHub issue `2026-recap-final-content` with a target date; link from `editions-data.ts` header.
- Milestone exit criterion: placeholder flag SHIPS with a tracker; not blocked on real content, blocked on *tracking*.

**Warning signs:**
- No TODO comment, no tracker issue, no staging badge — content is visually indistinguishable from final.
- 3+ months post-launch, `placeholder: true` still true.

---

### Pitfall 16: Over-fetching image variants (Sharp builds 40–120 variants for 10 photos)

**Severity:** MEDIUM (build time)
**Owning phase:** Phase 6 — Build Edition2023Section

**What goes wrong:**
`widths={[480, 800, 1200, 1600]}` × `formats=["avif","webp"]` × fallback JPG × 10 photos = 120 encodes per build. Sharp on CI takes minutes; container build slows.

**Why it happens:**
Defensive "support every viewport" instinct without consulting the actual rendered size from the Stitch mock.

**How to avoid:**
- Inspect Stitch mock to determine actual rendered widths. A 3-col desktop grid capped at 1280 px content width → max tile ≈ 400 CSS px = 800 px at DPR 2. `widths={[480, 800]}` is enough.
- Target: 2 widths × 2 formats × 10 photos = 40 encodes.
- Measure: `time pnpm build` before/after — Sharp stage target ≤ 30 s.

**Warning signs:**
- `pnpm build` Sharp phase exceeds 60 s on dev laptop.
- CI job time jumps > 2× post v1.1.

---

### Pitfall 17: Brand-history callout legal / brand-review gap (KCD / CNCF wording)

**Severity:** MEDIUM (legal / brand)
**Owning phase:** Phase 6 — Build Edition2023Section (content gate)

**What goes wrong:**
"Originally named Kubernetes Community Days France" + KCD logo ship without CNCF / KCD program review. Team may be asked to change wording or remove the logo post-launch.

**Why it happens:**
FEATURES.md flags this as "legal-adjacent copy." Easy to skip in dev excitement.

**How to avoid:**
- Before Phase 6 PR merges: exact FR + EN wording sent to CND board + (if affiliated) KCD program / CNCF contact for written sign-off.
- Use the KCD logo file the organizer provides; do NOT download from KCD's public assets without confirming redistribution terms.
- Store approval reference in `.planning/milestones/v1.1-*` with date + approver.

**Warning signs:**
- No written approval trail for the exact string.
- KCD logo sourced "from kcd-france.fr" with no license check.

---

## Minor Pitfalls

### Pitfall 18: Missing or generic image `alt` text on the 10 photos

**Severity:** LOW (a11y + SEO)
**Owning phase:** Phase 6

**How to avoid:** Each photo gets a unique descriptive FR + EN alt ("Public lors de KCD France 2023 au Centre Georges Pompidou"). Centralize in `editions-data.ts` so both locales consume the same structured data. `alt=""` is only valid for decorative images — not the case here.

---

### Pitfall 19: Section scroll anchors missing `scroll-margin-top` under sticky nav

**Severity:** LOW (UX polish)
**Owning phase:** Phase 4, Phase 6

**How to avoid:** If `/#edition-2026` deep links are exposed, set `scroll-margin-top: 5rem` (or matching sticky-nav height) on section wrappers. Prevents the title being hidden behind the sticky header.

---

### Pitfall 20: i18n key naming collision with existing `venue.*` tree during coexistence window

**Severity:** LOW
**Owning phase:** Phase 3 + Phase 7

**How to avoid:** New keys live under `editions.*` (per ARCHITECTURE.md). Do NOT reuse `venue.prev.*` for homepage content even briefly — keeps Phase 7 a clean sweep. Verify: `grep -c "editions\\." src/i18n/ui.ts` matches expected count for both FR and EN.

---

### Pitfall 21: Git LFS not configured — pressure to "enable it just in case"

**Severity:** LOW
**Owning phase:** Phase 1 — Asset prep

**Context:** Repo has NO `.gitattributes` / LFS config today. After Pitfall 1 mitigation (pre-optimized ~6 MB of 2023 photos total), LFS is not worth the setup cost for v1.1.

**How to avoid:** Do NOT add LFS now — it introduces checkout complexity, CI runner token cost, and workflow surface for ~6 MB of savings. Re-evaluate when photo masters total > 50 MB (plausible at v2 with multiple editions).

**Warning signs:** Someone proposes enabling LFS mid-milestone "to be safe" — push back; solve the real problem (pre-optimization, Pitfall 1) first.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Hardcoded testimonial data in `testimonials-data.ts` instead of CSV loader | Ships in 1 PR, no Google Sheet setup | Diverges from "CSVs are single source of truth" rule in CLAUDE.md; two places to edit if real quotes arrive | Acceptable for v1.1 (explicit in PROJECT.md). Move to CSV in v1.2 when real quotes exist. |
| Skipping EN translation pass on `editions.*` keys and relying on FR fallback | Faster Phase 3 | EN visitors get mixed-language sections; SEO sees duplicate FR content on `/en/`; erodes trust | Never. FR fallback is a safety net, not a shipping strategy. |
| Bundling Phase 4 (add homepage 2026) + Phase 5 (delete venue block) in one PR | One review cycle | No clean rollback if homepage has bugs; venue regresses with no recovery path | Never. ARCHITECTURE.md calls this out as highest regression risk. |
| Using `<img>` from `public/` for the 10 photos "just to prototype" | Skips Astro `<Picture>` setup | Bypasses AVIF/WebP pipeline → 10× payload + CLS + worse image SEO | Never — even prototypes must use `astro:assets`. Prototype with ONE photo, not ten. |
| Designing testimonials in Stitch in isolation without the full homepage mock | Faster Stitch iteration | Design drifts from existing section rhythm; requires redesign later | Never per MEMORY `feedback_stitch_first.md` + `feedback_stitch_ds_tokens.md`. Always Stitch the full homepage. |
| Leaving `placeholder: true` on 2026 content without a tracking issue | Ships the milestone | Placeholder becomes de facto permanent; site looks stale | Acceptable only if a dated tracker issue + visible (non-prod) badge exist. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| YouTube aftermovie embed (2026) | Using `youtube.com` embed URL (sets cookies → GDPR banner risk) | `youtube-nocookie.com` (already the v1.0 venue pattern). Verify when relocating. |
| Ente.io external gallery link | Hardcoding URL in component JSX | Put in `editions-data.ts` so FR + EN share the same URL and it is discoverable. |
| `astro:assets` + Sharp in Docker container | Build works locally, fails in K8s Docker image (glibc vs musl) | STACK.md confirms current image ships glibc → Sharp works. Do NOT switch base image to alpine without testing Sharp. |
| `tw-animate-css` utilities | Reaching for the deprecated `tailwindcss-animate` plugin (pre-Tailwind 4) | Only `tw-animate-css@1.4.0` is valid in Tailwind 4; already imported in `global.css`. |
| Stitch → code handoff | Pasting hex colors from Stitch export instead of token names | Reject any diff introducing raw hex values in new sections; use token roles (`primary`, `muted-foreground`, etc.). |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| 10 photos all eager-loaded | Network tab shows 10 parallel image requests on `/` nav; mobile LCP ≥ 4s | `<Picture>` defaults `loading="lazy"` + `decoding="async"`; also `content-visibility: auto` on grid wrapper below the fold | Immediately on mobile 4G; less visible on fiber desktop |
| React island for pure CSS animation | JS chunk added to homepage bundle; TBT creeps up | Default `.astro` + CSS keyframes (Pitfall 10) | Mid-range Android; silent on dev laptop |
| Missing `sizes` attribute on `<Picture>` | Browser downloads the largest variant always; LCP picks wrong candidate | Explicit `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` on every gallery `<Picture>` | Mobile with limited bandwidth |
| Full-bleed background image on brand-history callout via CSS `background-image` | Section render blocks on a large asset outside Sharp pipeline | If Stitch mandates a background, use `<Picture>` + `position:absolute inset-0 object-cover` on the first image; never `background-image: url()` on imported asset | Cold cache mobile loads |
| Too many Sharp variants per build | CI build time creeps from 2 min to 8 min | Cap `widths` to 2 values based on actual Stitch layout (Pitfall 16) | When future editions add more photos |
| Autoplay without pause-on-hover/focus | User complaints + a11y escalation | `:hover, :focus-within { animation-play-state: paused }` + optional visible pause button (Pitfalls 6, 7) | Every production page post-launch |

---

## Phase-Owned Pitfall Map (for roadmap)

| Phase | Primary Pitfalls | Gate (must pass before merge) |
|---|---|---|
| 0 — Stitch designs | 9, 12 | Full-page mock (all 6 sections) using design-system tokens only; CFP position validated on mobile |
| 1 — Asset prep | 1, 21 | Every photo ≤ 1 MB (grep check); total masters < 7 MB; no LFS introduced |
| 2 — PastEditionSection.astro | 3 | File is `.astro`; no `client:*` directive anywhere under `src/components/past-editions/` |
| 3 — i18n keys | 4, 20 | FR and EN key counts match under `editions.*` + `testimonials.*`; no collision with `venue.*` |
| 4 — Edition2026Section | 11, 15, 19 | h1/h2 hierarchy correct; placeholder flag + tracker issue; `scroll-margin-top` set |
| 5 — Delete venue 2026 block | 5, 13, 14 | Separate commit; homepage 2026 already verified in preview; no orphaned imports; anchor audit done |
| 6 — Edition2023Section | 2, 11, 16, 17, 18 | CLS delta ≤ 0.02; unique FR + EN alts; brand-history copy signed off; Sharp variant count capped |
| 7 — Delete `venue.prev.*` keys | 5, 20 | `grep -rn "venue.prev" src/` returns zero hits; `pnpm build` passes |
| 8 — TestimonialsStrip | 6, 7, 8, 10 | Reduced-motion + pause-on-hover/focus verified via Playwright; placeholder attributions clearly non-real; default `.astro` not `.tsx` |

---

## Sources

- Repo grep: 16 `venue.prev.*` entries in `src/i18n/ui.ts` (verified 2026-04-13) → Pitfalls 5, 20
- Repo check: no `.gitattributes`, no LFS configured → Pitfall 21
- `src/assets/photos/README.md` — authoritative pre-processing recipe → Pitfall 1
- `.planning/research/ARCHITECTURE.md` — phase sequencing + 2026 block file:line refs → Pitfalls 3, 5, 13
- `.planning/research/STACK.md` — "zero existing `prefers-reduced-motion` uses" + `<Picture>` pattern → Pitfalls 2, 6, 16
- `.planning/research/FEATURES.md` — carousel anti-pattern + CNCF/KCD review flag + CFP prominence warning → Pitfalls 8, 12, 17
- `CLAUDE.md` — "CSVs are single source of truth" + Stitch-first rule → Tech-debt table, Pitfall 9
- MEMORY (Stitch-first + Stitch DS tokens) → Pitfall 9
- WCAG 2.2.2 "Pause, Stop, Hide" — testimonial autoplay a11y → Pitfalls 6, 7
- MDN `prefers-reduced-motion` — global reset pattern → Pitfall 6

---
*Pitfalls research for: v1.1 Past Editions Showcase. Each pitfall tagged with severity + owning phase; prevention actions reference concrete files, greps, or Playwright assertions.*
*Researched: 2026-04-13*
