# Cloud Native Days France Website

The bilingual (French / English) marketing and program site for [Cloud Native Days France 2027](https://cloudnativedays.fr) — the third edition of the community-run Kubernetes-and-friends conference held at CENTQUATRE-PARIS in June 2027.

## Stack

- **[Astro 6](https://astro.build)** — content-first static site generator. Pages ship zero JavaScript by default.
- **React 19 islands** — used only for genuinely interactive UI (countdown timer, schedule filter, bookmarks).
- **Tailwind CSS 4** with `shadcn/ui` primitives for the design system.
- **DM Sans** as the single typeface family (Google Fonts, self-hosted at build time).
- **Node 22 + pnpm** package manager.
- **CSV content** — speakers, sessions, sponsors, and team rosters live in published Google Sheets consumed as CSV at build time.

## Deployment

The site is a static HTML bundle served by `nginx` from a multi-stage `Dockerfile`. Production deploys are managed via Kubernetes out of the separate [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) GitOps repository. This repository ships the site image; the platform repo owns the manifests.

CI builds the image on every push via `.github/workflows/build-image.yml`.

## Quickstart

```bash
# Install dependencies (uses pnpm via corepack)
pnpm install

# Start the dev server at http://localhost:4321
pnpm dev

# Produce a production bundle in dist/
pnpm build

# Run the full test suite (vitest)
pnpm test
```

The dev server watches `src/` and the local CSV fallbacks under `src/content/`.

## Where to find what

The site is small but deliberate. Start with the doc that matches what you're doing:

- **Adding a speaker, session, sponsor, or team member?** → [`docs/updating-content.md`](docs/updating-content.md) — the CSV runbook. Covers which Google Sheet backs each entity, the required/optional columns sourced from the Zod schemas in `src/content.config.ts`, and how to trigger a rebuild.
- **Getting oriented in the codebase?** → [`docs/repo-structure.md`](docs/repo-structure.md) — a short tour of `src/`, `tests/`, and the `.planning/` GSD workflow artifacts.
- **Running tests / triaging failures?** → [`docs/testing.md`](docs/testing.md) — what each command covers, plus the currently known non-blocking failures.
- **Contributing a PR?** → [`CONTRIBUTING.md`](CONTRIBUTING.md) — branching, commit style, and the three non-negotiable rules.

## Data sources

Four CSVs back the site. Production reads them from published Google Sheets (URLs configured via env vars); development falls back to the committed files under `src/content/`:

| Entity | Env var | Local fallback |
|--------|---------|----------------|
| Sessions | `SCHEDULE_SESSIONS_CSV_URL` | `src/content/schedule/sessions.csv` |
| Speakers | `SCHEDULE_SPEAKERS_CSV_URL` | `src/content/schedule/speakers.csv` |
| Sponsors | `SPONSORS_CSV_URL` | `src/content/sponsors/sponsors.csv` |
| Team | `TEAM_CSV_URL` | `src/content/team/team.csv` |

See [`docs/updating-content.md`](docs/updating-content.md) for the editor runbook.

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — authoritative Design Rules (Stitch-first) and Data Rules (CSV source-of-truth) enforced throughout the repo.
- [`DESIGN.md`](DESIGN.md) — the design system (tokens, typography, spacing, component patterns).
- [`STITCH_WORKFLOW.md`](STITCH_WORKFLOW.md) — how we drive Google Stitch from Claude Code for visual work.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution rules and PR flow.
- [`docs/repo-structure.md`](docs/repo-structure.md) — repository layout.
- [`docs/updating-content.md`](docs/updating-content.md) — CSV editor runbook.
- [`docs/testing.md`](docs/testing.md) — test commands and known non-blockers.

## License

See the CoC and legal pages under the running site — `/code-of-conduct` and `/privacy`. Source released under the terms in the repository's license file.
