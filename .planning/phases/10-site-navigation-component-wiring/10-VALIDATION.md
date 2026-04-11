---
phase: 10
slug: site-navigation-component-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if added) or manual browser verification |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && pnpm astro check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm astro check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SC-01 | — | N/A | build | `pnpm build` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | SC-02 | — | N/A | build | `pnpm build` | ✅ | ⬜ pending |
| 10-01-03 | 01 | 1 | SC-03 | — | N/A | build | `pnpm build` | ✅ | ⬜ pending |
| 10-01-04 | 01 | 1 | SC-04 | — | N/A | manual | browser check | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile nav opens/closes | SC-01 | Requires browser interaction | Open dev tools, resize to mobile, tap hamburger, verify drawer |
| Active page highlight | SC-01 | Visual verification | Navigate to speakers page, verify nav link is highlighted |
| Scroll border effect | SC-01 | Visual verification | Scroll down on any page, verify subtle border appears on header |
| TranslationNotice visibility | SC-03 | Locale-dependent rendering | Switch to EN, verify notice appears below header |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
