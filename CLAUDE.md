# CND France Website

Astro + React islands + Tailwind 4 + shadcn/ui. Deployed on Kubernetes. French/English bilingual site: sessions come from Pretalx, speakers/sponsors/team from a Google Sheet → CSV pipeline.

## Workflow

This project uses the [Superpowers](https://github.com/obra/superpowers) plugin for task-level workflow (brainstorming → writing-plans → executing-plans → verification). Superpowers skills auto-surface when their triggering conditions are met — let them.

- For any non-trivial visual or feature work, start with `superpowers:brainstorming` to clarify intent and design before code.
- For multi-step implementation, use `superpowers:writing-plans` then `superpowers:executing-plans` / `superpowers:subagent-driven-development`.
- For bugs or unexpected behavior, use `superpowers:systematic-debugging` before proposing fixes.
- Always run `superpowers:verification-before-completion` before claiming work is done — no success claims without evidence.

There is no persistent per-phase state directory. Historical GSD-era planning artifacts are frozen under `.planning.gsd-archive/` for reference and `git log --follow` traceability; do not resume authoring there.

## Project Skills

Auto-discovered from `.claude/skills/`. They surface themselves when conditions match — don't re-state their rules from memory, invoke them:

- **`stitch-first`** — every new page, component, or significant UI change is designed in Google Stitch first, validated by the user, then implemented. Triggers on any visual work.
- **`csv-source-of-truth`** — sessions and speakers are authored in Pretalx; sponsors and team are authored in Google Sheets. Never hardcode rows in `.astro`/`.ts`/`.tsx`; always load via the helper or `getCollection(...)`. Triggers when touching those data types.

Schema changes that span the CSV pipeline (Sheet column → parser → Zod schema → consumers) must ship as one atomic change — see `csv-source-of-truth` for the sequence.

## Stack Notes

- **Astro** for pages/components; **React** only for interactive islands.
- **Tailwind 4** + **shadcn/ui** for styling. Design tokens live in the Stitch design system (CND France 2027) — source of truth for colors/spacing/type.
- **Data pipeline**: sessions come from the self-hosted Pretalx released-schedule export
  (`src/lib/pretalx.ts`), fetched at build time with a committed snapshot fallback in
  `src/content/schedule/pretalx-{year}.json` — refresh it with `pnpm sync:pretalx`.
  Speakers also come from Pretalx (`src/lib/speaker-source.ts`): name, bio and photo
  from the public export, company/role/socials from speaker questions read with an API
  token. Two things stay in the repo because Pretalx cannot own them — `src/data/speaker-slugs.ts`
  (URL identity) and `src/data/keynote-cast.ts` (the opening-keynote running order).
  Sponsors and team remain Google Sheet CSVs via `src/lib/remote-csv.ts`.
  Env: `PRETALX_BASE_URL`, `PRETALX_API_TOKEN` or `PRETALX_API_TOKEN_FILE`,
  `PRETALX_TOKEN_REQUIRED=1` to make a missing or rejected token fatal (the image
  build sets it). A *transient* Pretalx failure is retried and then, still under
  that flag, fails with a message naming `PRETALX_ALLOW_DEGRADED=1` — the
  deliberate "Pretalx is down and I need this deploy out" override, which ships
  the build with no speaker affiliations and no level chips.
  Locally: `cp .env.example .env.local` and fill in the token — `scripts/load-local-env.mjs`
  bridges it into `process.env` for dev, build and test. Also:
  `SPONSORS_CSV_URL_{2023,2026,2027}`, `TEAM_CSV_URL`.
  Editions with no Pretalx event read a frozen `src/content/schedule/sessions-{year}.json`.
- **Site origin**: `PUBLIC_SITE_URL` (build-time only) sets `site` in `astro.config.mjs`, which drives canonical URLs, hreflang, the sitemap, `robots.txt` and the `noindex` meta tag. Falls back to production when unset or empty — the single production-origin literal lives in `src/lib/site-env.ts`. CI sets it to the staging origin for the `staging` branch.
- **Testing**: `pnpm test` (Vitest). Component tests may mock `astro:content` via `vi.mock`.
- **Build/dev**: `pnpm build` / `pnpm dev`. Hosted in Docker + nginx (see `Dockerfile`, `nginx/`).

## Conventions

- Bilingual routes: French at `/`, English mirrored at `/en/`. Keep i18n keys in sync.
- Commit style: Conventional commits (`feat:`, `fix:`, `chore:`, `ci:`). Short subject, "why" in body.
- See `DESIGN.md` for visual/UX decisions log and `STITCH_WORKFLOW.md` for the Stitch process.
