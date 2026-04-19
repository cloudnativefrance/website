---
phase: 23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/editions-data.ts
  - src/i18n/ui.ts
autonomous: true
requirements:
  - ED26-01
  - ED26-02
  - ED26-03
must_haves:
  truths:
    - "EDITION_2026.thumbnails array length equals 3 (ambiance-03, ambiance-06, ambiance-10 in that order)"
    - "EDITION_2026.replaysUrl points to the 2026 YouTube playlist (D-05)"
    - "EDITION_2026.pdfUrl points to the Google Drive one-pager (D-06)"
    - "src/lib/editions-data.ts no longer imports ambiance-08"
    - "src/i18n/ui.ts fr block contains all 4 new editions.2026.* keys (replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading)"
    - "src/i18n/ui.ts en block contains all 4 new editions.2026.* keys (replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading)"
    - "editions.2026.thumbnail_alt.3 FR + EN copy describes 'vue générale de l'événement' / 'overall venue view' to match ambiance-10 semantics"
    - "bun run astro check exits 0 after the edits"
  artifacts:
    - path: "src/lib/editions-data.ts"
      provides: "Updated EDITION_2026 const with 3 thumbnails, replaysUrl, pdfUrl; ambiance-08 import removed"
      contains: "replaysUrl"
    - path: "src/i18n/ui.ts"
      provides: "4 new editions.2026.* keys in both fr and en locale blocks; thumbnail_alt.3 copy reassigned to overall venue view"
      contains: "editions.2026.replays_cta"
  key_links:
    - from: "src/lib/editions-data.ts"
      to: "src/i18n/ui.ts"
      via: "altKey references (editions.2026.thumbnail_alt.1/2/3) must resolve in both locales"
      pattern: "altKey:\\s*\"editions\\.2026\\.thumbnail_alt\\.[123]\""
    - from: "src/i18n/ui.ts fr block"
      to: "src/i18n/ui.ts en block"
      via: "every fr key must have a matching en key (PITFALLS.md #2 — i18n drift guard)"
      pattern: "Object.keys(ui.fr).length === Object.keys(ui.en).length"
---

<objective>
Wire the data and copy foundation for the Edition 2026 combined section: mutate the EDITION_2026 typed const so it exposes the 3 photos, replays playlist URL, and PDF URL the component will consume, and add the 4 new i18n keys (both locales) that the component will render.

Purpose: Phase 23's component (plan 23-02) is a pure-SSR Astro file that imports EDITION_2026 and uses t() on new keys. Both sides of that interface must exist before the component can compile. Executing data + i18n in a single atomic plan guarantees the downstream component plan never sees a half-wired state and keeps the "i18n keys land in fr + en in the same commit" invariant (PITFALLS #2) intact.

Output: Updated `src/lib/editions-data.ts` and `src/i18n/ui.ts`, both type-checking clean via `bun run astro check`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/23-edition-2026-combined-section/23-CONTEXT.md
@.planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md
@.planning/phases/23-edition-2026-combined-section/23-PATTERNS.md
@.planning/research/PITFALLS.md

<interfaces>
<!-- Current EDITION_2026 shape (src/lib/editions-data.ts lines 25-56, per 23-PATTERNS.md). -->
<!-- Executor should treat this as the "before" state; the action mutates it to the "after" state below. -->

BEFORE (current, abbreviated):
```ts
import ambiance03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import ambiance06 from "@/assets/photos/ambiance/ambiance-06.jpg";
import ambiance08 from "@/assets/photos/ambiance/ambiance-08.jpg";   // ← becomes orphan, REMOVE
import ambiance10 from "@/assets/photos/ambiance/ambiance-10.jpg";

export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl: "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  stats: [ ...three stat entries... ] as const satisfies ReadonlyArray<Stat>,
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero" },
    { src: ambiance08, altKey: "editions.2026.thumbnail_alt.2", size: "hero" },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.3", size: "hero" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.4", size: "hero" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: false,
} as const;
```

AFTER (target, verbatim — executor copies this into the file):
```ts
// (ambiance08 import deleted)
import ambiance03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import ambiance06 from "@/assets/photos/ambiance/ambiance-06.jpg";
import ambiance10 from "@/assets/photos/ambiance/ambiance-10.jpg";

export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl:
    "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  // NEW (D-05) — 2026 replays YouTube playlist
  replaysUrl:
    "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2",
  // NEW (D-06) — one-pager bilan 2026 PDF on Google Drive
  pdfUrl:
    "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+",   labelKey: "editions.2026.stats.speakers" },
    { value: "40+",   labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  // CHANGED (D-04 + UI-SPEC §3) — 3 entries, sized for asymmetric mosaic
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero"   },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.2", size: "medium" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.3", size: "medium" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: false,
} as const;
```

Preserve the exact `stats` entry values shown above (NOTE: the current file at line ~257 has values `"1700+" / "50+" / "40+"` per 23-PATTERNS.md — if the actual source shows different values, keep whatever is currently there; do NOT touch the `stats` block). The `Stat` and `Thumbnail` type names are the existing TS types in the file — do not invent new type names.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Mutate EDITION_2026 const — add replaysUrl, pdfUrl; trim thumbnails to 3; remove ambiance-08 import</name>
  <files>src/lib/editions-data.ts</files>

  <read_first>
    - src/lib/editions-data.ts (current state — read in full; it is &lt; 100 lines)
    - .planning/phases/23-edition-2026-combined-section/23-PATTERNS.md §"`src/lib/editions-data.ts` (MODIFY — typed const mutation, D-04/D-05/D-06)" (target state code block)
    - .planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md §"Data Module Changes" (verbatim target code)
    - .planning/phases/23-edition-2026-combined-section/23-CONTEXT.md §"Data Module Changes" (D-04, D-05, D-06 decisions)
    - .planning/research/PITFALLS.md (orphan-import pitfall — applies to ambiance-08 same as the 2023 analog)
  </read_first>

  <action>
    Open `src/lib/editions-data.ts` and make the following edits in a single pass:

    1. **Delete the `ambiance08` import line** (currently `import ambiance08 from "@/assets/photos/ambiance/ambiance-08.jpg";` near line 27). It becomes orphan after the thumbnail trim; leaving it in makes Astro bundle an unused asset.

    2. **Add two new string properties** to the `EDITION_2026` const, immediately after the existing `galleryUrl` property and BEFORE the `stats` array:

       ```ts
       // NEW (D-05) — 2026 replays YouTube playlist
       replaysUrl:
         "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2",
       // NEW (D-06) — one-pager bilan 2026 PDF on Google Drive
       pdfUrl:
         "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view",
       ```

       Use the `playlist?list=…` form (NOT the `watch?v=…&list=…` form) per CONTEXT.md §Specific Ideas. Use the exact Drive URL above verbatim.

    3. **Replace the `thumbnails` array** with the following 3-element version, preserving the `as const satisfies ReadonlyArray<Thumbnail>` suffix:

       ```ts
       thumbnails: [
         { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero"   },
         { src: ambiance06, altKey: "editions.2026.thumbnail_alt.2", size: "medium" },
         { src: ambiance10, altKey: "editions.2026.thumbnail_alt.3", size: "medium" },
       ] as const satisfies ReadonlyArray<Thumbnail>,
       ```

       This drops ambiance-08 entirely, promotes ambiance-06 to slot 2, ambiance-10 to slot 3, and re-points slot 3's altKey to `thumbnail_alt.3` (which Task 2 rewrites to describe "overall venue view"). Note that `thumbnail_alt.4` becomes an orphan key — leave it in `ui.ts` per UI-SPEC accessibility checklist (clean-up deferred).

    4. **Do NOT touch:**
       - The `stats` array (UI-SPEC drops the stats ROW from the component but keeps the DATA for future consumers).
       - The `placeholder: false` field.
       - The `EDITION_2023` const or the `Thumbnail` / `Stat` type definitions elsewhere in the file.
       - The `ambiance03`, `ambiance06`, `ambiance10` imports (still used).

    Per D-04, D-05, D-06 from 23-CONTEXT.md. Using the `playlist?list=…` URL form per CONTEXT §Specific Ideas (research suggested this clean form over `watch?v=…&list=…`).
  </action>

  <verify>
    <automated>bun run astro check</automated>
  </verify>

  <acceptance_criteria>
    - File `src/lib/editions-data.ts` exists after edit
    - `grep -n 'ambiance-08' src/lib/editions-data.ts` returns 0 matches (import fully removed)
    - `grep -n 'ambiance08' src/lib/editions-data.ts` returns 0 matches (identifier fully removed)
    - `grep -c 'replaysUrl' src/lib/editions-data.ts` returns exactly 1
    - `grep -c 'pdfUrl' src/lib/editions-data.ts` returns exactly 1
    - `grep -n 'https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2' src/lib/editions-data.ts` returns exactly 1 match
    - `grep -n 'https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view' src/lib/editions-data.ts` returns exactly 1 match
    - `grep -c 'thumbnail_alt\.' src/lib/editions-data.ts` returns exactly 3 (one per remaining thumbnail; no `.4` reference)
    - `grep -n 'thumbnail_alt\.4' src/lib/editions-data.ts` returns 0 matches
    - `grep -cE 'size:\s*"medium"' src/lib/editions-data.ts` returns at least 2 (the two new medium-sized thumbnails)
    - `grep -cE 'size:\s*"hero"' src/lib/editions-data.ts` returns at least 1 (ambiance-03 slot 1); 2026 contributes exactly 1
    - The `thumbnails` array for `EDITION_2026` contains exactly 3 entries in order ambiance-03, ambiance-06, ambiance-10 (manual read-back confirmation; a grep-based check: the three lines must appear in that order — `grep -nE 'src: ambiance0?[3 6 0]' src/lib/editions-data.ts` yields lines in ascending order of source line number)
    - `bun run astro check` exits with code 0
  </acceptance_criteria>

  <done>
    EDITION_2026 exposes 3 thumbnails (ambiance-03 hero, ambiance-06 medium, ambiance-10 medium), plus replaysUrl and pdfUrl string properties. The ambiance-08 import is gone. Type-checker is clean. The file remains the sole source of truth for editions metadata (no testimonial data crept in — CLAUDE.md rule).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add 4 new editions.2026.* i18n keys to both locales; rewrite thumbnail_alt.3 to match ambiance-10</name>
  <files>src/i18n/ui.ts</files>

  <read_first>
    - src/i18n/ui.ts (current state — open the file, find the `fr` locale block around lines 206-219 where other `editions.2026.*` keys live, and the `en` locale block around lines 495-508; read both blocks in full)
    - .planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md §"Copywriting Contract" (verbatim FR/EN copy for the 4 new keys) and §"i18n Key Manifest" (full key table)
    - .planning/phases/23-edition-2026-combined-section/23-PATTERNS.md §"`src/i18n/ui.ts` (MODIFY — 4 new keys × 2 locales, D-07/D-08 + UI-SPEC)" (insertion pattern + verbatim key blocks)
    - .planning/research/PITFALLS.md (i18n drift pitfall — fr and en MUST have the same key set)
  </read_first>

  <action>
    Open `src/i18n/ui.ts` and make the following edits to BOTH locale blocks:

    **A. Rewrite `editions.2026.thumbnail_alt.3` copy in both locales** so it describes ambiance-10's "overall venue view" semantics (required because Task 1 now points slot 3 at ambiance-10 instead of ambiance-06):

    - FR block — locate the existing line `"editions.2026.thumbnail_alt.3": "..."` and replace its value with exactly:
      ```ts
      "editions.2026.thumbnail_alt.3": "Photo CND France 2026 — vue générale de l'événement",
      ```

    - EN block — locate the matching `"editions.2026.thumbnail_alt.3": "..."` line and replace its value with exactly:
      ```ts
      "editions.2026.thumbnail_alt.3": "CND France 2026 photo — overall venue view",
      ```

    Leave `thumbnail_alt.1`, `thumbnail_alt.2`, `thumbnail_alt.4` untouched in both locales. (`thumbnail_alt.4` is now orphan but kept per UI-SPEC §Accessibility checklist — housekeeping deferred.)

    **B. Add 4 new `editions.2026.*` keys to the FR block**, inserted after the existing `"editions.2026.thumbnail_alt.4": ...` line and BEFORE the next non-`editions.2026.*` key (e.g. `"editions.placeholder_badge_aria": ...`). Copy this block verbatim (including trailing commas, double quotes, and real Unicode em-dash / accented characters):

    ```ts
    "editions.2026.replays_cta": "Voir tous les replays",
    "editions.2026.pdf_cta": "Télécharger le bilan 2026 (PDF)",
    "editions.2026.pdf_cta_aria": "Télécharger le bilan 2026 (PDF, nouvelle fenêtre)",
    "editions.2026.testimonials_heading": "Ils en parlent mieux que nous",
    ```

    **C. Add the same 4 keys to the EN block**, inserted in the mirrored location (after `"editions.2026.thumbnail_alt.4": ...` in the `en` object). Copy this block verbatim:

    ```ts
    "editions.2026.replays_cta": "Watch all replays",
    "editions.2026.pdf_cta": "Download 2026 report (PDF)",
    "editions.2026.pdf_cta_aria": "Download 2026 report (PDF, new window)",
    "editions.2026.testimonials_heading": "They said it better than we could",
    ```

    Preserve the surrounding indentation style (4-space or whatever the file already uses — match the neighbouring `editions.2026.*` lines exactly). Per D-07, D-08, and UI-SPEC §Copywriting Contract.

    **Do NOT:**
    - Rename or remove any existing key (including the orphan `editions.2026.thumbnail_alt.4`).
    - Add other locales.
    - Touch `testimonials.0.quote` … `testimonials.2.attribution` keys (they already exist per D-09).
    - Reorder keys outside the edits above.
  </action>

  <verify>
    <automated>bun run astro check</automated>
  </verify>

  <acceptance_criteria>
    - `grep -c '"editions\.2026\.replays_cta"' src/i18n/ui.ts` returns exactly 2 (one fr, one en)
    - `grep -c '"editions\.2026\.pdf_cta"' src/i18n/ui.ts` returns exactly 2 (one fr, one en)
    - `grep -c '"editions\.2026\.pdf_cta_aria"' src/i18n/ui.ts` returns exactly 2 (one fr, one en)
    - `grep -c '"editions\.2026\.testimonials_heading"' src/i18n/ui.ts` returns exactly 2 (one fr, one en)
    - `grep -n 'Voir tous les replays' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'Watch all replays' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'Télécharger le bilan 2026 (PDF)' src/i18n/ui.ts` returns exactly 1 match (pdf_cta FR; note the pdf_cta_aria variant is a different string)
    - `grep -n 'Download 2026 report (PDF)' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'Télécharger le bilan 2026 (PDF, nouvelle fenêtre)' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'Download 2026 report (PDF, new window)' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'Ils en parlent mieux que nous' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'They said it better than we could' src/i18n/ui.ts` returns exactly 1 match
    - `grep -n 'vue générale de l.événement' src/i18n/ui.ts` returns at least 1 match (thumbnail_alt.3 FR)
    - `grep -n 'overall venue view' src/i18n/ui.ts` returns at least 1 match (thumbnail_alt.3 EN)
    - `grep -c '"editions\.2026\.thumbnail_alt\.4"' src/i18n/ui.ts` returns exactly 2 (the orphan key stays in both locales)
    - `bun run astro check` exits with code 0
  </acceptance_criteria>

  <done>
    Both `fr` and `en` locale blocks in `src/i18n/ui.ts` carry the 4 new `editions.2026.*` keys with the exact copy from UI-SPEC §Copywriting Contract, and `editions.2026.thumbnail_alt.3` describes an overall venue view so it matches the ambiance-10 photo that now occupies slot 3. `bun run astro check` is clean.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Verify fr/en key parity and type-check pass</name>
  <files>(no file modifications — verification-only task)</files>

  <read_first>
    - src/i18n/ui.ts (read the full file to confirm final fr and en blocks are complete and consistent)
    - .planning/research/PITFALLS.md (i18n key drift pitfall #2 — guard against silent FR fallback in EN locale)
  </read_first>

  <action>
    Run the type-checker and a key-parity sanity check that encodes PITFALLS.md #2.

    1. Run `bun run astro check` — must exit 0. If it fails, fix the ui.ts syntax (trailing commas, missing quotes, duplicate keys) and re-run before proceeding.

    2. Run a one-liner key-parity check — the fr and en exported dictionaries MUST have identical key sets. Use this exact command:

       ```bash
       bun run --bun -e 'import("./src/i18n/ui.ts").then(m => { const fr = Object.keys(m.ui.fr).sort(); const en = Object.keys(m.ui.en).sort(); const onlyFr = fr.filter(k => !m.ui.en.hasOwnProperty(k)); const onlyEn = en.filter(k => !m.ui.fr.hasOwnProperty(k)); console.log("fr count:", fr.length); console.log("en count:", en.length); console.log("only in fr:", onlyFr); console.log("only in en:", onlyEn); if (onlyFr.length || onlyEn.length) process.exit(1); })'
       ```

       If the command runtime cannot be invoked that way (e.g. the project's `bun` script wrapper blocks direct `--bun -e` calls), fall back to:

       ```bash
       node -e 'const src = require("fs").readFileSync("src/i18n/ui.ts", "utf8"); const fr = [...src.matchAll(/^\s{4}"([^"]+)":/gm)].map(m=>m[1]); /* crude — may over-count — use as smoke test only */'
       ```

       If neither works, read `src/i18n/ui.ts` and confirm by eye that every key in the `fr` object has a matching key in the `en` object (focus on the 4 new `editions.2026.*` keys added in Task 2 plus the existing keys). Report the key counts or the diff in the summary file.

    3. Run `bun run build` — must exit 0. Captures any issue that astro check alone misses (e.g. Vite-time config errors from the orphan-import removal).

    No file modifications in this task. If either check fails, return control to the executor to fix the source (update ui.ts or editions-data.ts, then re-run).
  </action>

  <verify>
    <automated>bun run astro check &amp;&amp; bun run build</automated>
  </verify>

  <acceptance_criteria>
    - `bun run astro check` exits with code 0
    - `bun run build` exits with code 0
    - Key parity check reports `only in fr: []` and `only in en: []` (OR, if the dynamic check could not be invoked, a manual read confirms parity for at least the 4 new keys: replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading all appear in BOTH fr and en blocks — this is already verified by Task 2's grep acceptance criteria, so this task's burden is the build + astro check)
    - No dead / orphan import warnings for `ambiance-08` appear in the build output (grep the build log: `grep -i 'ambiance-08' build.log` should return 0 matches if the log is captured; otherwise confirm the build log output does not mention ambiance-08)
  </acceptance_criteria>

  <done>
    Plan 23-01 passes the type-check and production build, and the new i18n keys are present in both locales. The codebase is ready for plan 23-02 to create the component against this data+copy foundation.
  </done>
</task>

</tasks>

<verification>
After all three tasks:
- `src/lib/editions-data.ts` — EDITION_2026 has 3 thumbnails, replaysUrl, pdfUrl; ambiance-08 import is gone.
- `src/i18n/ui.ts` — fr and en locale blocks each contain 4 new `editions.2026.*` keys; thumbnail_alt.3 copy describes an overall venue view in both locales.
- `bun run astro check` exits 0.
- `bun run build` exits 0.
- No homepage file (`src/pages/index.astro`, `src/pages/en/index.astro`) was modified — Phase 26 owns that.
- `TestimonialsStrip.astro`, `PastEditionSection.astro`, and any page mount of them is untouched — the homepage still renders as-is.
</verification>

<success_criteria>
- EDITION_2026.thumbnails.length === 3; entries are (ambiance-03, ambiance-06, ambiance-10) in order.
- `EDITION_2026.replaysUrl === "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2"`
- `EDITION_2026.pdfUrl === "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view"`
- All 4 new `editions.2026.*` keys exist in both `ui.fr` and `ui.en`.
- Type-check + build are green.
- Phase 23 requirements ED26-01, ED26-02, ED26-03 have their data + copy layer satisfied (component consumption in plan 23-02).
</success_criteria>

<output>
After completion, create `.planning/phases/23-edition-2026-combined-section/23-01-SUMMARY.md` covering:
- Data edits applied to `src/lib/editions-data.ts` (final EDITION_2026 shape excerpt).
- i18n edits applied to `src/i18n/ui.ts` (4 new keys + thumbnail_alt.3 copy rewrite).
- Astro check + build exit codes.
- Any deviation from the action block (should be none).
</output>
