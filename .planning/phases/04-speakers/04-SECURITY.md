---
phase: 04-speakers
asvs_level: 1
audited: 2026-04-11
threats_total: 7
threats_closed: 7
threats_open: 0
---

# Security Audit — Phase 04: Speakers

## Summary

**All 7 registered threats closed. No open threats. No unregistered flags.**

| Metric | Value |
|--------|-------|
| ASVS Level | 1 |
| Threats Registered | 7 |
| Threats Closed | 7 |
| Threats Open | 0 |
| Unregistered Flags | 0 |

---

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-04-01 | Tampering | accept | CLOSED | Static build; Zod schema validation at build time via `getCollection("speakers")` and `getCollection("talks")` in `src/lib/speakers.ts`. No runtime user input path exists. |
| T-04-02 | Information Disclosure | accept | CLOSED | Social link fields are intentionally public speaker profile data authored in git-controlled content files. |
| T-04-03 | Spoofing | accept | CLOSED | All social link anchors carry `target="_blank" rel="noopener noreferrer"` — confirmed in `src/components/speakers/SocialLinks.astro` lines 21–22, 43–44, 67–68, 84–85. Content is git-controlled. |
| T-04-04 | Injection | mitigate | CLOSED | Speaker name and company are rendered via Astro template expressions (`{name}`, `{company}`) which Astro auto-escapes. Confirmed in `src/components/speakers/SpeakerCard.astro` lines 29–31, `src/components/speakers/SpeakerProfile.astro` lines 49–54. |
| T-04-05 | Spoofing | accept | CLOSED | `[slug].astro` (FR and EN) use `getStaticPaths` with slugs sourced exclusively from `getCollection("speakers")` at build time — confirmed in `src/pages/speakers/[slug].astro` lines 14–21 and `src/pages/en/speakers/[slug].astro` lines 14–21. No runtime routing. |
| T-04-06 | Information Disclosure | accept | CLOSED | Speaker social URLs are intentionally public conference profile information. |
| T-04-07 | Injection | mitigate | CLOSED | Speaker bio Markdown rendered via `render(speaker)` (Astro 6 built-in pipeline) with output wrapped in `<article class="prose prose-invert max-w-none">` — confirmed in `src/pages/speakers/[slug].astro` lines 28 and 45, and `src/pages/en/speakers/[slug].astro` lines 28 and 45. Astro's Markdown pipeline sanitizes HTML; raw HTML in `.md` frontmatter fields is not rendered as HTML. |

---

## Accepted Risks Log

| Threat ID | Rationale |
|-----------|-----------|
| T-04-01 | Static site generation model eliminates runtime tampering surface. Zod rejects malformed content at build, preventing bad data from ever reaching the HTML output. |
| T-04-02 | Social URLs (GitHub, LinkedIn, Bluesky, website) are voluntarily submitted public information required for a speaker profile. Disclosure is the intended behavior. |
| T-04-03 | Social link spoofing risk is bounded by git access controls on content files. `rel="noopener noreferrer"` prevents tab-napping. No user-supplied URLs are accepted. |
| T-04-05 | `getStaticPaths` consumes only content-collection entries compiled at build time. The slug parameter cannot be influenced by a visitor at runtime. |
| T-04-06 | Duplicate of T-04-02 scope; same rationale applies. Intentionally public conference information. |

---

## Unregistered Flags

None. No threat flags were recorded in `04-01-SUMMARY.md`, `04-02-SUMMARY.md`, or `04-03-SUMMARY.md`.

---

## Mitigation Evidence Details

### T-04-04 — Injection via speaker name/bio in HTML

Astro auto-escapes all `{}` template expressions. Spot-checked rendering sites:

- `SpeakerCard.astro:29` — `{name}` inside `<p>` tag
- `SpeakerCard.astro:31` — `{company}` inside `<p>` tag
- `SpeakerProfile.astro:50` — `{name}` inside `<h1>` tag
- `SpeakerProfile.astro:57–59` — `{role}` and `{company}` inside `<p>` tag
- `TalkCard.astro:41` — `{title}` inside `<h3>` tag

None of these use `set:html` or `Fragment` with raw HTML. Escaping is automatic and unconditional.

### T-04-07 — Injection via speaker bio Markdown rendering

Both FR and EN profile pages use the Astro 6 standalone `render(entry)` function imported from `astro:content`. The resulting `<Content />` component is placed inside `<article class="prose prose-invert max-w-none">`. Astro's Markdown pipeline does not allow frontmatter string fields to inject unescaped HTML into the rendered output. The `prose` Tailwind class scopes typography without introducing injection vectors.
