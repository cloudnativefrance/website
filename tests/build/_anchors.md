# Test Anchor Speakers (Phase 13 / D-10)

These speakers are referenced by `tests/build/speaker-profile.test.ts` and `tests/build/speaker-talks.test.ts`.
Before removing any of these rows from `src/content/schedule/speakers-2026.csv`, or these sessions from
Pretalx (talk codes GJ89TV / S3SPP8 — see `src/content/schedule/pretalx-2026.json`, refreshed via
`pnpm sync:pretalx`), update the corresponding test assertions.

| Slug | Name | Why anchored | Source |
|------|------|--------------|--------|
| petazzoni | Jérôme Petazzoni | Keynote MC, lowest churn risk; sole speaker on keynote session GJ89TV | speakers-2026.csv |
| arthur-outhenin-chalandre | Arthur Outhenin-Chalandre | Co-speaker pair anchor (with quentin-swiech) on session S3SPP8 | speakers-2026.csv |
| quentin-swiech | Quentin Swiech | Co-speaker pair anchor (with arthur-outhenin-chalandre) on session S3SPP8 | speakers-2026.csv |
| vache | Aurélie Vache | Non-keynote regular speaker; profile-existence assertion only | speakers-2026.csv |

Selection rationale per D-10 (CONTEXT.md): keynotes are rarely dropped; canonical
co-presented talks survive CFP churn better than solo talks. petazzoni is the
strongest anchor because removing him would mean replanning the opening keynote.
