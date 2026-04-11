---
status: partial
phase: 04-speakers
source: [04-VERIFICATION.md]
started: 2026-04-11T23:30:00Z
updated: 2026-04-11T23:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Stitch-first rule compliance
expected: Pages designed in Stitch first, validated, then implemented per CLAUDE.md design rule
result: [pending]

### 2. Speaker grid visual confirmation
expected: Keynote-first ordering (Marie Laurent, Thomas Nguyen first), responsive 4/3/2/1 columns, initials avatars with correct 2-letter initials, hover border/lift effects
result: [pending]

### 3. Speaker profile visual confirmation
expected: Large avatar (128px), track badge colors per spec (cloud-infra=primary, devops-platform=accent, security=destructive, community=chart-4), schedule placeholder as muted text
result: [pending]

### 4. Co-speaker cross-link traversal
expected: Speaker-5 (Amina Diallo) profile shows talk-5 with co-speaker "David Moreau" as clickable link; speaker-6 (David Moreau) shows talk-5 with "Amina Diallo" as co-speaker link; both links navigate correctly
result: [pending]

### 5. English locale pages
expected: /en/speakers/ shows "Our Speakers" heading with English content; EN speaker profiles have English bios and talk descriptions; locale routing works correctly
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
