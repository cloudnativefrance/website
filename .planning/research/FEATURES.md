# Feature Landscape

**Domain:** Community-driven cloud-native tech conference website (single-day, 1700+ attendees)
**Researched:** 2026-04-11
**Confidence:** HIGH (based on analysis of KubeCon, Devoxx, Web Summit, Cloud Native Rejekts, Cloud Native Days Bergen, and the existing CNDF 2026 site)

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero section with event name, date, venue, CTA | Every conference site leads with this. 5-second comprehension test. Visitors bounce without it. | Low | Include countdown pre-event, "watch replays" post-event. KubeCon, Devoxx, Rejekts all do this. |
| Registration/ticket CTA | Primary conversion goal. Every competitor has prominent ticket buttons. | Low | External link to ticketing platform. Not built in (out of scope). |
| Schedule page with track filtering | KubeCon uses sched.com, Devoxx has m.devoxx.com, Bergen has 43+ sessions across 3 tracks. Attendees need to plan their day. | Medium | Filter by track/tag. For a single-day event, a timeline/grid view showing parallel tracks is more useful than a multi-day calendar. |
| Speaker profiles (grid + individual pages) | Devoxx, Web Summit, Bergen all have dedicated speaker pages with bio, photo, company, talks. Attendees want to know who's presenting. | Medium | Individual pages with bio, company, social links, talk abstract. Link back to schedule slot. |
| Sponsor/partner showcase with tiers | Every conference: KubeCon (Diamond/Platinum/Gold), Rejekts (Partner/Supporter/Community/Media), Bergen (Ingress/Service/Pod/Special). Partners pay for visibility. | Low | Tiered layout with logos, descriptions, links. Use CNDF tiers: Platinum, Gold, Silver, Community. |
| Venue page with practical info | Bergen, Rejekts, KubeCon all have dedicated venue/travel sections. Attendees need directions, transport, accessibility. | Low | Map embed, transport options, nearby hotels, accessibility info. CENTQUATRE-PARIS specifics. |
| Code of Conduct | Every community conference (KubeCon, Rejekts, Bergen, Devoxx) has a visible CoC. Required for CNCF/KCD affiliation. | Low | Dedicated page, linked from footer and registration. |
| Responsive/mobile-first design | Attendees check the schedule on their phone at the event. Non-negotiable. | Low | Built into Tailwind/Astro approach. Mobile schedule view is critical. |
| Bilingual support (FR/EN) | Devoxx France does FR/EN. CNDF is a French event with international speakers and KCD affiliation. | Medium | Language toggle, duplicated content per locale. Astro i18n routing handles this well. |
| Social links + newsletter signup | Every conference site has footer social links. Mailing list is primary communication channel. | Low | LinkedIn, YouTube, Bluesky, X. External newsletter tool link. |
| Legal pages (privacy, terms) | GDPR compliance, association transparency. Devoxx has legal/purchasing info. | Low | Static pages. Required for French association (loi 1901). |

## Differentiators

Features that set CNDF apart from the typical conference site. Not expected but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bookmarkable talks with personal agenda | Most conference sites link to external tools (sched.com, sessionize) for this. Building it natively into the site with localStorage is a polished UX win. No login needed. | Medium | Store in localStorage. No auth required. Visual indicator on bookmarked talks. |
| iCal export of personal agenda | Attendees can export their bookmarked talks to Google Calendar/Outlook. Few community conferences offer this natively. | Medium | Generate .ics file from bookmarked talks. Standard iCalendar format. Depends on bookmark feature. |
| Visual timeline view with parallel tracks | Most community conference sites show a flat list or table. A proper timeline/swimlane view showing concurrent tracks visually is rare and highly useful for a single-day, multi-track event. | High | React island for interactivity. Shows time blocks across tracks. Most impactful schedule differentiator. |
| Post-event replay mode | After the event, the site transforms: countdown becomes "watch replays," schedule links to YouTube recordings, speaker pages link to talk videos. Bergen offers post-event recordings access. CNDF 2026 already links to YouTube playlist. | Medium | Content flag (pre/post event) that toggles UI state. YouTube embed or playlist link per talk. Photo gallery link. |
| Team page with roles and grouping | Few community conferences show their organizing team prominently. Builds trust, humanizes the event, encourages new volunteers. | Low | Grouped by function (core, program committee, volunteers). Photos, roles, social links. |
| Previous edition section | Key numbers (1700+ attendees, 50+ talks, 40+ partners), video recap, photo gallery link. Builds credibility for first-time visitors and sponsors. | Low | Static content with embedded video or photo gallery link. Social proof for sponsorship acquisition. |
| Dark theme with warm community aesthetic | Most cloud-native conference sites are generic or corporate. A bold, technical dark theme with geometric shapes (brand continuity) + community warmth (real photos, friendly copy) stands out. | Low | Design-driven, not feature-driven. Implemented via Tailwind theming. |
| Open Feedback integration | Direct link from each talk in the schedule to the Open Feedback page for that talk. Not just a generic link, but per-talk deep linking. | Low | Open Feedback supports external data sources. Link pattern: openfeedback.io/event/talkId. Requires matching talk IDs. |
| Conference Hall CFP integration | Link from the site to the CFP submission page on Conference Hall when CFP is open. Status indicator (CFP open/closed/coming soon). | Low | External link with status toggle based on date or manual flag. |

## Anti-Features

Features to explicitly NOT build. These add complexity without value for this project.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Built-in CFP system | Conference Hall already handles this well and is used by the French conference community. Building a CFP is months of work (submission forms, review workflow, notifications). Massive scope creep. | Link to Conference Hall. Show CFP status (open/closed) on the site. |
| Built-in feedback system | Open Feedback is purpose-built for conference talk feedback with anonymous voting, Firebase auth, and live results. Reimplementing this is pointless. | Deep-link to Open Feedback per talk. |
| User accounts / authentication | A static conference site does not need login. Bookmarks work with localStorage. Adding auth means managing users, passwords, sessions -- all for marginal benefit. | localStorage for bookmarks. No login. |
| Ticket sales / payment processing | External ticketing platforms (Eventbrite, Billetweb, etc.) handle payments, invoicing, VAT, refunds. Building this is a liability nightmare. | Prominent CTA linking to external ticketing. |
| Live chat / real-time features | Single-day event. Discord/Slack handles community chat. WebSocket infrastructure for a static site is absurd overengineering. | Link to community Discord/Slack if one exists. |
| Multi-edition archive | Maintaining multiple years of content is ongoing maintenance burden. Past editions can be static snapshots hosted separately. | "Previous edition" section with key numbers, link to YouTube playlist, link to photo gallery. |
| CMS integration | The organizing team is technical. Markdown/YAML in git is simpler, more portable, and cheaper than any CMS. No vendor lock-in. | Content collections in Astro with Markdown/YAML files. |
| Mobile app | Web works on phones. A native app for a single-day event is absurd. PWA is overkill too -- the schedule page on mobile is sufficient. | Responsive web design. Good mobile schedule UX. |
| Blog / news section | Content creation burden for a volunteer team. Social media (LinkedIn, Bluesky, X) handles announcements better. | Social media links. Newsletter for important updates. |
| Attendee networking / matchmaking | Web Summit does this at 70K+ scale with a dedicated app. For 1700 attendees at a single-day event, hallway conversations and social media work fine. | Link to social media accounts. |
| Analytics dashboard for organizers | Google Analytics or Plausible can be added as a script tag. Building custom analytics is pointless. | Add Plausible or similar privacy-respecting analytics via script tag. |
| Search functionality | With 50 talks and 50 speakers, a single-day schedule fits on one page. Browser Ctrl+F works. Full-text search is overengineered. | Good filtering on schedule page (by track/tag) is sufficient. |

## Feature Dependencies

```
Bilingual support (i18n routing) --> All content pages (must be set up first)
Speaker profiles --> Schedule page (talks reference speakers)
Schedule page --> Bookmark feature (needs schedule data)
Bookmark feature --> iCal export (exports bookmarked talks)
Content collections (Markdown/YAML) --> Speaker pages, Schedule, Sponsors, Team
Post-event mode flag --> Schedule (replay links), Hero (countdown toggle)
Open Feedback deep links --> Schedule page (per-talk links)
```

## MVP Recommendation

**Phase 1 -- Foundation (must ship first):**
1. i18n routing and bilingual content structure
2. Hero section with countdown + CTA
3. Content collections for speakers, talks, sponsors, team
4. Speaker grid and individual pages
5. Schedule page with track filtering (list/table view)
6. Sponsor tier showcase
7. Venue page with practical info
8. Code of Conduct, legal pages, footer

**Phase 2 -- Interactive polish:**
1. Bookmark talks (localStorage)
2. Visual timeline view (React island)
3. iCal export of personal agenda
4. Team page

**Phase 3 -- Event lifecycle:**
1. Post-event replay mode (countdown toggle, YouTube links per talk)
2. Previous edition section (key numbers, video, photos)
3. Open Feedback deep links per talk
4. Conference Hall CFP status indicator

**Defer indefinitely:** All anti-features listed above.

## Sources

- [KubeCon Europe](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/) -- Diamond/Platinum/Gold sponsor tiers, schedule via sched.com, co-located events, post-event YouTube recordings
- [Devoxx France](https://www.devoxx.fr/en/) -- Bilingual FR/EN, mobile companion app (m.devoxx.com), speaker pages, exhibitor floor plans, CFP via Conference Hall
- [Web Summit](https://websummit.com/) -- Content tracks, speaker lineup, startup programs, attendee/investor/media segmentation, Night Summit
- [Cloud Native Rejekts](https://cloud-native.rejekts.io/) -- Partner/Supporter/Community/Media sponsor tiers, Sessionize for schedule, community-driven model
- [Cloud Native Days Bergen](https://2025.cloudnativebergen.dev/) -- Ingress/Service/Pod sponsor tiers, 43+ sessions across 3 tracks, workshop registration, post-event recordings
- [Cloud Native Days France 2026](https://www.cloudnativedays.fr) -- Current site: basic navigation (Home, Programme, Photo Album, Partners, Venue, Contact), YouTube replay playlist, Open Feedback link, mailing list signup
- [Conference Hall](https://conference-hall.io/) -- Open SaaS CFP platform, API integration available, used by French conference community
- [Open Feedback](https://github.com/HugoGresse/open-feedback) -- Firebase-based, anonymous voting, Conference Hall integration, custom API data source support
