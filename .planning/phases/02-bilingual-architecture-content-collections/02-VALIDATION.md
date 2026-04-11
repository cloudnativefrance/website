---
phase: 2
slug: bilingual-architecture-content-collections
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build (Zod schema enforcement) + grep assertions on dist/ |
| **Config file** | `astro.config.ts` (i18n config), `src/content.config.ts` (schemas) |
| **Quick run command** | `npx astro build 2>&1 \| tail -20` |
| **Full suite command** | `npx astro build && bash .planning/phases/02-bilingual-architecture-content-collections/validate.sh` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx astro build 2>&1 | tail -20`
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FNDN-02 | — | N/A | build | `npx astro build` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | FNDN-02 | — | N/A | grep | `ls dist/en/index.html && ls dist/index.html` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | FNDN-03 | — | N/A | build | `npx astro build` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 1 | FNDN-03 | — | N/A | grep | `grep -l 'lang="en"' dist/en/index.html` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | FNDN-04 | — | N/A | build | `npx astro build` | ✅ | ⬜ pending |
| 02-03-02 | 03 | 2 | FNDN-04 | — | N/A | grep | `grep 'schema' src/content.config.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Validation script (if needed) for post-build grep assertions
- [ ] Negative schema test: intentionally invalid frontmatter file to prove Zod enforcement

*Existing infrastructure covers most requirements — Astro build IS the test framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Language toggle preserves current page | FNDN-02 | Requires browser navigation | Build site, open in browser, click toggle, verify URL changes between /page and /en/page |
| Locale detection / Accept-Language | FNDN-02 | SSG doesn't do server-side detection | Verify meta redirect or JS-based detection if implemented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
