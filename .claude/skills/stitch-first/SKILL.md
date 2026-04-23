---
name: stitch-first
description: Use when creating a new page, new Astro/React component with visual output, or making significant UI changes to existing components — before touching code
---

# Stitch-First Design

## Overview

Visual work on this site is designed in **Google Stitch** first, validated by the user against the design system, then implemented in code. Skipping to code for UI work is the single most reliable way to waste a full iteration — the user will reject the PR and ask for a Stitch mockup anyway.

## When to Use

Triggers (act on any of these without being asked):
- User asks to build/add/redesign a page (`/schedule`, `/venue`, a new `/partners` page, etc.)
- User asks to add a new section, hero variant, card type, or layout block
- User asks to restyle an existing component meaningfully (not a 1-line token swap)
- User describes a visual feature in words only, with no accompanying mockup link

When NOT to use:
- Bug fixes that preserve the existing visual (e.g. fixing a focus ring, a11y label, a mobile overflow)
- Data/content changes that don't alter layout (CSV updates, i18n string tweaks)
- Pure refactors with no visual delta
- Changes the user explicitly scoped as "just code, skip Stitch"

## Core Flow

1. **Ask the user for the Stitch mockup** — either an existing screen ID, a project link, or "design it in Stitch now".
2. **Generate/refine the screen in Stitch** using `mcp__stitch__*` MCP tools. Always bind to the project's design system (see `reference_stitch.md` memory: project + DS IDs). Never override DS colors in prompts — use token roles (primary/secondary/surface/etc.).
3. **Present the mockup to the user for approval** before writing any `.astro`, `.tsx`, or CSS.
4. **Only after approval**, implement in code. Reference the Stitch screen ID in the commit message for traceability.
5. **After execution**, present the built page back in Stitch (screenshot or side-by-side) so the user can confirm parity.

## Quick Reference

| Step | Tool / Action |
|---|---|
| Discover project | `mcp__stitch__list_projects` then `mcp__stitch__get_project` |
| Apply DS | `mcp__stitch__apply_design_system` with the CND France 2027 DS ID |
| Generate screen | `mcp__stitch__generate_screen_from_text` (use DS token roles, not hex) |
| Edit screen | `mcp__stitch__edit_screens` |
| Explore variants | `mcp__stitch__generate_variants` before committing to one |

Full workflow and DS conventions: `STITCH_WORKFLOW.md`, `DESIGN.md`.

## Common Mistakes

- **Writing Astro/TSX first, "Stitch later"** — the mockup drives the component API; reversing the order forces a rewrite.
- **Hex colors in Stitch prompts** — breaks DS consistency. Always use role names (primary, surface, accent).
- **Skipping user approval** — "it looks right to me" is not a substitute for the user green-lighting the mockup.
- **Forgetting the post-implementation Stitch review** — the phase isn't done until the built page has been validated against the mockup.
