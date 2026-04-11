---
phase: 04
slug: speakers
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~0.2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SPKR-04 | T-04-01 / T-04-02 | Zod validates frontmatter at build; social URLs are public | unit | `pnpm test src/lib/__tests__/speakers.test.ts` | ✅ | ✅ green |
| 04-02-01 | 02 | 2 | SPKR-01 | T-04-03 / T-04-04 | Links use noopener noreferrer; Astro auto-escapes expressions | integration | `pnpm test tests/build/speakers-grid.test.ts` | ✅ | ✅ green |
| 04-03-01 | 03 | 3 | SPKR-02 | T-04-05 / T-04-07 | Static generation from trusted content; Markdown sanitized | integration | `pnpm test tests/build/speaker-profile.test.ts` | ✅ | ✅ green |
| 04-03-02 | 03 | 3 | SPKR-03 | T-04-06 | Social URLs intentionally public | integration | `pnpm test tests/build/speaker-talks.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — vitest configuration with path aliases
- [x] `package.json` — added vitest devDependency, test and test:watch scripts
- [x] `src/lib/__tests__/speakers.test.ts` — unit tests for 7 utility functions (mocked astro:content)
- [x] `tests/build/speakers-grid.test.ts` — build-output tests for speaker grid pages
- [x] `tests/build/speaker-profile.test.ts` — build-output tests for speaker profile pages
- [x] `tests/build/speaker-talks.test.ts` — build-output tests for co-speaker cross-references

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual grid layout (4/3/2/1 columns) | SPKR-01 | Responsive CSS breakpoints require a browser | Resize browser at /speakers/ to verify column count |
| Avatar initials rendering | SPKR-01 | Visual output depends on CSS styling | Verify initials circles appear on speaker cards |
| Hover/focus states on cards | SPKR-01 | CSS transitions need live interaction | Hover and tab through speaker cards |
| EN locale content | SPKR-02 | Full i18n rendering needs browser | Visit /en/speakers/ and /en/speakers/speaker-1 |

---

## Validation Audit 2026-04-11

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-11
