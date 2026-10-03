# Ticketing page 2027 v2 (showcase only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 2027 ticketing demo into the showcase-only page decided on 22/09/2026: variant B alone, no proof section, no inclusion footer, Strategy & Leadership always on sale, no "À confirmer" chip (with a production guard instead), and every hand-off to alf.io in a new tab.

**Architecture:** One purchase target (`purchaseTarget(config, phase)` → listing or newsletter) shared by door 1, the S&L band and the mobile bar. The demo collapses to one axis, the phase: 6 pre-rendered pages under `/billetterie/demo/`. `tbd()` stays in the config as an invisible marker read only through `shown()`; `assertShippable()` refuses a production-origin render while a draft is left.

**Tech Stack:** Astro 5 (`.astro` components, container API for tests), TypeScript, Tailwind 4, Vitest (projects `unit` and `astro-components`), pnpm.

**Spec:** `docs/superpowers/specs/2026-09-27-billetterie-v2-showcase-only-design.md`

## Global Constraints

- Every i18n string is a `tickets.*` key present in **both** `fr` and `en` of `src/i18n/ui.ts` (`tests/build/i18n-parity.test.ts` enforces it).
- French typography: `U+00A0` before `:`, `U+202F` before `? ! ;`, no-break spaces inside `« »`.
- Never show a quota, a stock, or the abbreviations SEB / EB / R / LC. Only the current tier shows a date.
- Prices, dates and the phase live only in `src/config/tickets.ts`.
- Do not touch `/billetterie` (`src/pages/billetterie/index.astro`), `/en/tickets`, `src/config/flags.ts`, `DESIGN.md`, `CLAUDE.md`.
- Nothing may link (`href`) to `/event/<slug>/code/<CODE>`.
- Umami attributes on CTAs: `billet`, `palier`, `phase` only.
- Commits: conventional (`feat(billetterie): …`, `refactor(billetterie): …`, `docs(billetterie): …`), short subject, "why" in the body, ending with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG
  ```
- Never stage `.gitignore` (it holds the owner's temporary entries) nor anything under `.claude/`, `.impeccable/`, `.superpowers/`.
- Test commands: `pnpm vitest run src/lib/__tests__/tickets.test.ts` (unit), `pnpm vitest run src/components/tickets` (container tests), `pnpm vitest run tests/build/i18n-parity.test.ts`, `pnpm astro check` (must report 0 errors). Ignore `mise WARN failed to write cache file` lines.

## Review Focus

- **A browser that blocks the code form's new tab** — the code must still reach alf.io (same tab), never nothing. Pinned by the `openInNewTab` unit tests (Task 5).
- **The last FAQ entry on a phone** — with the inclusion note gone, the mobile sticky bar must not cover it. Moved padding in Task 3; measured by a browser probe in Task 6.
- **An S&L price decided "per tier"** — the row must show the price of the tier on offer, the first tier before opening, not vanish. Pinned by `strategicPrice` unit tests (Task 4).
- **A value decided later (VAT, invoice, cancellation, terms, programme date)** — it must appear, replacing its waiting copy, rather than stay invisible. Pinned by the `TicketsFaq` container test (Task 4, terms-in-new-tab case in Task 5).
- **Old demo links and the sitemap** — `demo-a/…`, `demo-b/…` must no longer be emitted and `/billetterie/demo/…` must not leak into the staging sitemap. Pinned by the demo-path unit tests (Task 2) and the build checks (Task 6).

---

## File map (end state)

| File                                    | Responsibility                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tickets/drafts.ts` (new)       | `shown`, `shippingProblems`, `assertShippable`                                                                        |
| `src/lib/tickets/purchase.ts`           | `purchaseTarget` (listing / notify, with `rel`), `listingUrl`, `alfioHost`, `onHost`, `codeUrl`, `codeFallbackAction` |
| `src/lib/tickets/url.ts`                | `codeUrlFrom`, `openInNewTab` (client-safe)                                                                           |
| `src/lib/tickets/phase.ts`              | + `strategicPrice`                                                                                                    |
| `src/lib/tickets/demo.ts`               | gate + 6 demo URLs                                                                                                    |
| `src/lib/tickets/pricing.ts`, `rex.ts`  | deleted                                                                                                               |
| `src/config/tickets.ts`                 | A-only and S&L-state fields removed; flags as drafts                                                                  |
| `src/components/tickets/*`              | as described per task; `EditionProof`, `InclusionNote`, `Tbd` deleted                                                 |
| `src/pages/billetterie/[...demo].astro` | phase-only demo route                                                                                                 |
| `astro.config.mjs`                      | sitemap filter                                                                                                        |
| `src/i18n/ui.ts`                        | keys removed / added                                                                                                  |

---

### Task 1: The drafts module

**Files:**

- Create: `src/lib/tickets/drafts.ts`
- Test: `src/lib/__tests__/tickets.test.ts`

**Interfaces:**

- Consumes: `isTbd`, `Tbd`, `Maybe`, `TicketingConfig` from `@/config/tickets`.
- Produces:
  - `shown<T>(value: Maybe<T>): T | undefined`
  - `interface ShippingProblem { path: string; note: string }`
  - `shippingProblems(config: TicketingConfig): ShippingProblem[]`
  - `assertShippable(config: TicketingConfig): void` (throws `Error` listing every problem)

- [ ] **Step 1: Write the failing tests**

In `src/lib/__tests__/tickets.test.ts`, add to the imports:

```ts
import { assertShippable, shippingProblems, shown } from "@/lib/tickets/drafts";
```

Append at the end of the file:

```ts
describe("drafts", () => {
  // Every tbd() replaced by its draft, or by a stand-in when it has none: the
  // config as it will be once the team has decided everything.
  const decided = JSON.parse(JSON.stringify(TICKETING), (_key, value) =>
    isTbd(value) ? (value.draft ?? "decided") : value,
  ) as TicketingConfig;

  it("shows the decided value, else the draft, else nothing", () => {
    expect(shown("10:00")).toBe("10:00");
    expect(shown(tbd("Heure d'ouverture", "10:00"))).toBe("10:00");
    expect(shown(tbd("Taux de TVA"))).toBeUndefined();
  });

  it("lets a fully decided config ship", () => {
    expect(shippingProblems(decided)).toEqual([]);
    expect(() => assertShippable(decided)).not.toThrow();
  });

  it("blocks on a draft wherever it sits, arrays included, and names its path", () => {
    const config = {
      ...decided,
      opening: { ...decided.opening, time: tbd("Heure d'ouverture", "10:00") },
      tiers: decided.tiers.map((t, i) =>
        i === 0 ? { ...t, name: tbd("Nom public", t.name) } : t,
      ),
    } as unknown as TicketingConfig;
    expect(shippingProblems(config)).toEqual([
      { path: "opening.time", note: "Heure d'ouverture" },
      { path: "tiers.0.name", note: "Nom public" },
    ]);
  });

  it("lets an undecided value with no draft ship — its line is simply not rendered", () => {
    expect(
      shippingProblems({ ...decided, vatRate: tbd("Taux de TVA") }),
    ).toEqual([]);
  });

  it("still requires the Strategy & Leadership price, which has no draft to show", () => {
    const config = {
      ...decided,
      strategic: { ...decided.strategic, price: tbd("Prix") },
    };
    expect(shippingProblems(config)).toEqual([
      { path: "strategic.price", note: "Prix" },
    ]);
  });

  it("names every problem at once when it refuses", () => {
    const config = {
      ...decided,
      vatRate: tbd("Taux de TVA", "10 %"),
      strategic: { ...decided.strategic, price: tbd("Prix") },
    };
    expect(() => assertShippable(config)).toThrow(
      /vatRate — Taux de TVA[\s\S]*strategic\.price — Prix/,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/tickets/drafts"`.

- [ ] **Step 3: Write the module**

Create `src/lib/tickets/drafts.ts`:

```ts
/**
 * Reading an undecided value, and refusing to ship one.
 *
 * A `tbd()` in the config renders nothing of its own: the page shows its draft
 * when it has one — as the copy it will become — and leaves its line out when
 * it has none. What keeps a draft from reaching production is
 * `assertShippable`, which the page calls on a production-origin build: it
 * lists every draft still in the config, plus the values the page cannot ship
 * without.
 *
 * Pure: no environment read. The caller decides when to assert.
 */
import {
  isTbd,
  type Maybe,
  type Tbd,
  type TicketingConfig,
} from "@/config/tickets";

/** The decided value, else the draft, else undefined — the line is then not rendered. */
export function shown<T>(value: Maybe<T>): T | undefined {
  return isTbd(value) ? (value as Tbd<T>).draft : (value as T);
}

export interface ShippingProblem {
  /** Dotted path in the config, e.g. `opening.time` or `tiers.0.name`. */
  path: string;
  /** The `tbd()` note: what is still to decide. */
  note: string;
}

/**
 * Values an undecided `tbd()` cannot leave out: without a draft their line
 * would simply disappear, and the page is not worth shipping without them.
 */
const REQUIRED: ReadonlyArray<{
  path: string;
  read: (config: TicketingConfig) => unknown;
}> = [{ path: "strategic.price", read: (config) => config.strategic.price }];

/** Every draft left anywhere in the config, then every required value still undecided. */
export function shippingProblems(config: TicketingConfig): ShippingProblem[] {
  const problems: ShippingProblem[] = [];
  walk(config, "", (path, value) => {
    if (value.draft !== undefined) problems.push({ path, note: value.note });
  });
  for (const { path, read } of REQUIRED) {
    const value = read(config);
    if (isTbd(value) && value.draft === undefined)
      problems.push({ path, note: value.note });
  }
  return problems;
}

export function assertShippable(config: TicketingConfig): void {
  const problems = shippingProblems(config);
  if (problems.length === 0) return;
  throw new Error(
    "[tickets] src/config/tickets.ts is not ready for production — decide these values " +
      "(their drafts only show on staging):\n" +
      problems.map((p) => `- ${p.path} — ${p.note}`).join("\n"),
  );
}

function walk(
  node: unknown,
  path: string,
  visit: (path: string, value: Tbd<unknown>) => void,
): void {
  if (isTbd(node)) {
    visit(path, node);
    return;
  }
  if (node === null || typeof node !== "object") return;
  for (const [key, child] of Object.entries(node)) {
    walk(child, path ? `${path}.${key}` : key, visit);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts`
Expected: PASS (all tests, the 6 new ones included).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tickets/drafts.ts src/lib/__tests__/tickets.test.ts
git commit -m "feat(billetterie): read tbd() values through shown() and guard production

A placeholder chip will no longer be rendered: a draft shows as the copy it
will become, and a production-origin build must refuse the page while one is
left. This module holds both rules so no component re-derives them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG"
```

---

### Task 2: Collapse the demo to phases — variant B only, S&L always on sale

**Files:**

- Create: `.superpowers/drop-i18n-keys.mjs` (git-ignored helper, reused in Tasks 3–4)
- Modify: `src/config/tickets.ts`, `src/lib/tickets/purchase.ts`, `src/lib/tickets/url.ts`, `src/lib/tickets/demo.ts`, `src/lib/tickets/mailto.ts`, `src/lib/event.ts`, `src/pages/billetterie/[...demo].astro`, `astro.config.mjs`, `src/components/tickets/{TicketsPage,TicketsContent,PurchaseControl,StickyTicketBar,TeamDoor,GroupRates,CodeDoor,StrategicOffer,DemoBar,Icon}.astro`, `src/components/tickets/tickets-ui.ts`, `src/i18n/ui.ts`
- Delete: `src/lib/tickets/pricing.ts`
- Test: `src/components/tickets/__tests__/TicketsPage.test.ts`, `src/lib/__tests__/tickets.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1 yet.
- Produces:
  - `purchaseTarget(config: TicketingConfig, phase: Phase): PurchaseTarget` with `PurchaseTarget = { kind: "listing"; href: string } | { kind: "notify"; href: string }` (Task 5 adds `rel`)
  - `demoPath(phase?: Phase): string`, `demoStaticPaths(): Array<{ params: { demo: string }; props: DemoState }>`, `DemoState = { phase?: Phase }`
  - `TicketsContent` / `TicketsPage` props: `{ lang, phase, rex, demo? }` (`rex` leaves in Task 3)
  - `StrategicTicket` without `state`, `maxPerOrder`, `groupRatesApply`, `onSaleFrom`, `alfioCategoryCode`; no `StrategicState` type
  - `PurchaseControl` props: `{ target, lang, phase, analytics }`
  - `StickyTicketBar` prop `action: { href: string; text: string; external: boolean }` (Task 5 replaces `external` with `rel`)

- [ ] **Step 1: Rewrite the matrix test for the new shape**

Replace the whole of `src/components/tickets/__tests__/TicketsPage.test.ts` with:

```ts
// The whole demo — its 5 phases — rendered through the real page component,
// asserting the rules of the spec that a screenshot review would only catch by
// luck: no internal abbreviations, only the current tier's date, "Épuisé" on a
// past tier, every purchase sent to the alf.io listing and none before the
// opening, and group rates only when they beat the current price.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TicketsContent from "../TicketsContent.astro";
import { DEMO_PHASES } from "@/lib/tickets/demo";
import type { Phase } from "@/config/tickets";

const rex = { sessions: 17, organisations: ["SNCF", "Mistral AI"] };
let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

// The content, not the page: the layout needs a site origin the container does
// not provide, and the page wrapper is covered by the source checks below.
async function render(phase: Phase) {
  return container.renderToString(TicketsContent, {
    props: { lang: "fr", phase, rex, demo: true },
  });
}

/** Visible text only: scripts, styles and tags stripped, entities left alone. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * The page as the demo's "hide the placeholders" switch shows it: the CSS drops
 * every `.tbd-chip`, and every `[data-tbd-only]` line the chip was the whole
 * point of. Applied here the same way, so a test can read what is left.
 */
function withoutPlaceholders(html: string): string {
  let out = html;
  for (const pattern of [
    /<span\b[^>]*\bclass="tbd-chip/,
    /<(\w+)\b[^>]*\bdata-tbd-only\b/,
  ]) {
    for (let guard = 0; guard < 200; guard += 1) {
      const match = pattern.exec(out);
      if (!match) break;
      const tag = match[1] ?? "span";
      out =
        out.slice(0, match.index) +
        out.slice(endOfElement(out, match.index, tag));
    }
  }
  return out;
}

/** Index just past the element opening at `start`, counting nested `<tag>`s. */
function endOfElement(html: string, start: number, tag: string): number {
  const scan = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  scan.lastIndex = start;
  let depth = 0;
  for (let m = scan.exec(html); m; m = scan.exec(html)) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return scan.lastIndex;
  }
  throw new Error(`unbalanced <${tag}> from ${start}`);
}

/** The main page region, excluding the mobile bar rendered after it. */
function mainOf(html: string): string {
  const start = html.indexOf("<main");
  const end = html.indexOf("</main>");
  return html.slice(start, end);
}

/** A purchase link to the alf.io listing, as `PurchaseControl` writes it. */
const LISTING_LINK =
  /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr\/event\/cnd-2027"[^>]*data-umami-event="tickets-purchase"[^>]*>/g;

// As the ladder writes them: the box is narrow, so the month is abbreviated.
// The last tier is absent on purpose — it runs to the event day and shows no
// date of its own.
const TIER_END_DATES: Record<
  Exclude<Phase, "pre_opening" | "last_chance">,
  string
> = {
  seb: "29 nov.",
  eb: "7 févr.",
  regular: "16 mai",
};

describe.each(DEMO_PHASES)("phase %s", (phase) => {
  let html: string;
  let main: string;
  let text: string;

  beforeAll(async () => {
    html = await render(phase);
    main = mainOf(html);
    text = visibleText(main);
  });

  // Regular and Last Chance are the only tiers a group rate applies to: the two
  // early ones cap an order at 5 seats, which is how their quota is protected.
  const selling = phase === "regular" || phase === "last_chance";

  it("never shows an internal tier abbreviation", () => {
    expect(text).not.toMatch(/\b(SEB|EB|LC)\b/);
  });

  it("shows the date of the current tier and of no other", () => {
    const current = phase === "pre_opening" ? "seb" : phase;
    for (const [tier, date] of Object.entries(TIER_END_DATES)) {
      if (tier === current) expect(text).toContain(date);
      else expect(text, `${tier}'s date leaked`).not.toContain(date);
    }
  });

  it("marks every past tier as sold out, with no action", () => {
    const pastItems = [
      ...main.matchAll(/<li[^>]*data-tier-state="past"[\s\S]*?<\/li>/g),
    ];
    const expectedPast = {
      pre_opening: 0,
      seb: 0,
      eb: 1,
      regular: 2,
      last_chance: 3,
    }[phase];
    expect(pastItems).toHaveLength(expectedPast);
    for (const [item] of pastItems) {
      expect(item).toContain("Épuisé");
      expect(item).not.toMatch(/<(a|button|input)\b/);
    }
    // One word for a closed tier, and only that one.
    expect(text).not.toContain("Terminé");
  });

  it("writes what ends the tier on offer inside its ladder box, not above it", () => {
    expect([...main.matchAll(/data-tier-deadline/g)]).toHaveLength(
      phase === "last_chance" ? 0 : 1,
    );
    expect(text).not.toContain("dans la limite des places disponibles");
    expect(text).not.toContain("limité en nombre de places");
    expect(text).not.toContain("Vous payez par carte");
  });

  it("gives the tier on offer the one pink label that applies to it", () => {
    const early = phase === "pre_opening" || phase === "seb" || phase === "eb";
    expect(text.includes("Stock limité")).toBe(early);
    expect(text.includes("ou épuisement")).toBe(early);
    expect(text.includes("Dernières places")).toBe(phase === "last_chance");
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toContain("Dernières places");
  });

  it("states the price of each tier and nothing else — no step, no state word", () => {
    const ladder = main.slice(main.indexOf("data-tier-ladder"));
    expect(ladder).not.toMatch(/\+\s*\d+(\s|&nbsp;| | )*€/);
    for (const word of ["En cours", "À venir", "À l'ouverture"]) {
      expect(visibleText(ladder)).not.toContain(word);
    }
  });

  it("sends every purchase to the alf.io listing — door 1 and Strategy & Leadership — and none before the opening", () => {
    const purchases = [...main.matchAll(LISTING_LINK)];
    const notifies = [...main.matchAll(/data-umami-event="tickets-notify"/g)];
    if (phase === "pre_opening") {
      expect(purchases).toHaveLength(0);
      expect(notifies).toHaveLength(2);
    } else {
      expect(purchases).toHaveLength(2);
      expect(notifies).toHaveLength(0);
    }
    // Variant A is gone for good: no quantity is chosen on the site.
    expect(main).not.toContain("data-tickets-reserve");
    expect(main).not.toContain('name="qty"');
  });

  it("never links to an alf.io code URL", () => {
    expect(main).not.toMatch(/href="[^"]*\/code\//);
  });

  if (phase === "pre_opening") {
    it("offers the opening notification instead of any purchase", () => {
      expect(main).toContain('data-umami-event="tickets-notify"');
      expect(text).toContain("13 octobre");
      expect(main).not.toContain("data-tickets-code");
    });
  } else {
    it("keeps the code entry available", () => {
      expect(main).toContain("data-tickets-code");
    });
  }

  it("shows group rates only when they beat the current price and fit the order cap", () => {
    const shown = [...main.matchAll(/data-group-rate="([^"]+)"/g)].map(
      (m) => m[1],
    );
    const unique = [...new Set(shown)].sort();
    expect(unique).toEqual(selling ? ["10_plus", "4_9"] : []);
  });

  it("opens door 2 only when it has something to sell, and door 3 only once codes work", () => {
    expect(main.includes('id="door-team-title"')).toBe(selling);
    expect(main.includes("data-tickets-code")).toBe(phase !== "pre_opening");
    expect(main).toContain(selling ? "lg:col-span-8" : "lg:col-span-12");
  });

  it("prices each group rate against the price of the moment, in the section's pink", () => {
    const tierPrice = {
      pre_opening: 129,
      seb: 129,
      eb: 159,
      regular: 199,
      last_chance: 229,
    }[phase];
    const rows = [
      ...main.matchAll(/data-group-rate="([^"]+)"[\s\S]*?(?=<li|<\/ul>)/g),
    ];
    expect(rows).toHaveLength(selling ? 2 : 0);
    for (const [row, id] of rows) {
      const price = { "4_9": 169, "10_plus": 149 }[id as "4_9" | "10_plus"];
      const percent = Math.floor(((tierPrice - price) / tierPrice) * 100);
      expect(row).toContain(`−${percent} %`);
      expect(row).toContain("bg-accent");
    }
  });

  it("lists the group rates without making them clickable, and asks for them by mail", () => {
    expect(main).not.toContain("data-group-apply");
    expect(main).not.toContain("data-team-or");
    expect(text).not.toContain("Contacter la billetterie");
    expect(text).not.toContain("Choisir ce tarif");
    expect(text.includes("Demander mon tarif de groupe")).toBe(selling);
  });

  it("leaves the manager kit as the whole bottom section, in every phase", () => {
    expect(main).toContain('id="convaincre"');
    expect(text).toContain("Un kit pour convaincre votre manager");
    expect(text).not.toContain("Chacun prend sa place");
    expect(text).not.toContain("Vous commandez en ligne");
  });

  it("always shows the Strategy & Leadership ticket, apart from the tiers", () => {
    expect(main).toContain('id="strategie-leadership"');
    expect(main).not.toMatch(/data-tier="strategi/);
    expect(main).not.toContain("data-strategic-state");
    expect(text).not.toContain("Mise en vente");
  });

  it("sends the Strategy & Leadership reader to the group rates only where they exist", () => {
    expect([...main.matchAll(/href="#equipe"/g)]).toHaveLength(selling ? 1 : 0);
    expect(main.includes('id="equipe"')).toBe(selling);
  });

  it("marks every placeholder as such", () => {
    expect(main).toContain('class="tbd-chip');
    expect(text).toContain("À confirmer");
  });

  it("still reads as finished copy once the placeholders are hidden", () => {
    const left = visibleText(withoutPlaceholders(main));
    for (const dangling of [
      "Taux de TVA",
      "Conditions générales de vente",
      "Le détail de la soirée",
    ]) {
      expect(left).not.toContain(dangling);
    }
    expect(left).not.toContain("À confirmer");
    expect(left).not.toContain("à confirmer");
    expect(withoutPlaceholders(main)).not.toMatch(/<(dd|dt)\b[^>]*>\s*<\/\1>/);
    expect(left).toContain("Je prends ma place");
    expect(left).toContain("Ce que comprend votre billet");
    expect(left).toContain("Questions fréquentes");
  });

  it("stripes the mobile bar as a demo", () => {
    expect(html).toContain("demo-stripe");
  });
});

describe("the page wrapper", () => {
  const source = readFileSync(
    resolve(import.meta.dirname, "../TicketsPage.astro"),
    "utf-8",
  );

  it("forces noindex whenever it renders a demo", () => {
    expect(source).toMatch(/noindex=\{Boolean\(demo\)\}/);
  });

  it("renders the demo switcher only on demo routes", () => {
    expect(source).toMatch(/\{demo && \(\s*<DemoBar/);
  });
});
```

- [ ] **Step 2: Rewrite the unit tests that describe variant A or the S&L states**

In `src/lib/__tests__/tickets.test.ts`:

(a) Replace these import lines:

```ts
import { orderSegments, segmentAt } from "@/lib/tickets/pricing";
import {
  ALFIO_MAX_PER_ORDER,
  alfioHost,
  clampQuantity,
  codeFallbackAction,
  codeUrl,
  listingUrl,
  purchaseTarget,
  reserveUrl,
} from "@/lib/tickets/purchase";
```

with:

```ts
import {
  alfioHost,
  codeFallbackAction,
  codeUrl,
  listingUrl,
  purchaseTarget,
} from "@/lib/tickets/purchase";
import { NEWSLETTER_URL } from "@/lib/event";
```

(b) In `it("refuses a rate table that does not climb")`, replace the two rate literals with:

```ts
        { id: "4_9", min: 4, max: 9, price: 169 },
        { id: "10_plus", min: 8, price: 179 },
```

(c) Delete the whole `describe("orderSegments", …)` block and the whole `describe("clampQuantity", …)` block.

(d) Replace the whole `describe("purchaseTarget", …)` block with:

```ts
describe("purchaseTarget", () => {
  it("sends every buyer to the listing once the ticketing is open", () => {
    for (const id of ["seb", "eb", "regular", "last_chance"] as const) {
      expect(purchaseTarget(TICKETING, id)).toEqual({
        kind: "listing",
        href: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
      });
    }
  });

  it("offers the newsletter, not a purchase, before the opening", () => {
    expect(purchaseTarget(TICKETING, "pre_opening")).toEqual({
      kind: "notify",
      href: NEWSLETTER_URL,
    });
  });

  it("names the alf.io host buyers land on", () => {
    expect(alfioHost(TICKETING)).toBe("billetterie.cloudnativedays.fr");
    expect(
      listingUrl({
        ...TICKETING,
        alfio: { baseUrl: "https://x.test/", eventSlug: "e" },
      }),
    ).toBe("https://x.test/event/e");
  });
});
```

(e) In `describe("demo gate", …)`, replace the last two tests (`"emits both variants × 5 phases …"` and `"keeps every demo URL under /billetterie/demo-"`) with:

```ts
it("emits one page per phase, plus the entry URL", () => {
  const paths = demoStaticPaths();
  expect(paths.map((p) => p.params.demo)).toEqual([
    "demo",
    "demo/avant-ouverture",
    "demo/super-early-bird",
    "demo/early-bird",
    "demo/regular",
    "demo/last-chance",
  ]);
  expect(paths[0].props).toEqual({});
  expect(paths[3].props).toEqual({ phase: "eb" });
  expect(demoPath()).toBe("/billetterie/demo/");
  expect(demoPath("pre_opening")).toBe("/billetterie/demo/avant-ouverture/");
});

it("keeps every demo URL under /billetterie/demo/, and none of the old variant URLs", () => {
  for (const p of demoStaticPaths()) {
    expect(`/billetterie/${p.params.demo}/`).toMatch(/^\/billetterie\/demo\//);
    expect(p.params.demo).not.toMatch(/^demo-/);
  }
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets`
Expected: FAIL — `purchaseTarget` still takes a variant, `demoStaticPaths` returns 32 entries, the matrix finds reserve forms.

- [ ] **Step 4: Write the i18n key helper**

Create `.superpowers/drop-i18n-keys.mjs` (the folder is git-ignored):

```js
// Removes ticketing i18n entries from src/i18n/ui.ts, in both locales.
// Usage: node .superpowers/drop-i18n-keys.mjs '<key>' ['<key>' …]   ("prefix.*" drops a namespace)
// Quote every key: zsh expands a bare `*`.
import { readFileSync, writeFileSync } from "node:fs";
const file = "src/i18n/ui.ts";
const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
const value = String.raw`"(?:[^"\\]|\\.)*"`;
let src = readFileSync(file, "utf8");
for (const key of process.argv.slice(2)) {
  const prefix = key.endsWith(".*");
  const name = prefix ? esc(key.slice(0, -1)) + String.raw`[^"]+` : esc(key);
  const entry = new RegExp(
    String.raw`^[ \t]*"${name}":(?:[ \t]*${value}|\n[ \t]*${value}),\n`,
    "gm",
  );
  const found = src.match(entry)?.length ?? 0;
  if (found === 0 || (!prefix && found !== 2) || (prefix && found % 2 !== 0)) {
    console.error(
      `${key}: ${found} entries found — expected ${prefix ? "an even number" : "2 (fr and en)"}; nothing written`,
    );
    process.exit(1);
  }
  src = src.replace(entry, "");
  console.log(`${key}: removed ${found}`);
}
writeFileSync(file, src);
```

- [ ] **Step 5: Drop the config fields only variant A and the S&L states read**

In `src/config/tickets.ts`:

1. Run: `sed -i '' '/alfioCategoryCode: tbd("Code de catégorie alf.io (JC)", "DEMO-/d' src/config/tickets.ts` — removes the four tier lines and the S&L one. Check with `grep -c alfioCategoryCode src/config/tickets.ts` → `2` (the two type declarations, removed next).
2. In `interface TierDefinition`, delete:
   ```ts
   /** alf.io category code behind the variant-A reservation link (created by JC). */
   alfioCategoryCode: Maybe<string>;
   ```
3. In `interface GroupRate`, delete:
   ```ts
   /**
    * The alf.io code that carries the rate — a promo code or a category,
    * depending on which of the three mechanisms under study lands (see
    * `src/lib/tickets/purchase.ts`). Deliberately not named "category".
    */
   alfioCode: Maybe<string>;
   ```
4. Delete the line `export type StrategicState = "hidden" | "announced" | "on_sale";`.
5. Replace `export interface StrategicTicket { … }` with:
   ```ts
   /** Always displayed and always on sale (22/09/2026): every fact is due for the opening. */
   export interface StrategicTicket {
     name: Maybe<Localized>;
     price: Maybe<StrategicPrice>;
     /** What it includes from the standard ticket (talks, evening…). */
     includesStandard: Maybe<Localized>;
     programme: Maybe<Localized>;
     /** Idea under study: dedicated networking area with catering. */
     networking: Maybe<Localized>;
     accessConditions: Maybe<Localized>;
   }
   ```
6. Replace the two `groupRates` entries with:
   ```ts
       { id: "4_9", min: 4, max: 9, price: 169 },
       { id: "10_plus", min: 10, price: 149 },
   ```
7. Replace the `strategic: { … }` value with:
   ```ts
     strategic: {
       name: tbd("Nom public (« Stratégie & Leadership » est le nom de travail)", {
         fr: "Stratégie & Leadership",
         en: "Strategy & Leadership",
       }),
       price: tbd("Prix : fixe, ou décliné par palier ?"),
       includesStandard: tbd("Ce qu'il inclut du billet standard (conférences, soirée)"),
       programme: tbd("Programme et intervenant(e)s de la salle dédiée"),
       networking: tbd("Piste non actée : espace d'échange dédié avec restauration", {
         fr: "Un espace d'échange dédié, avec restauration",
         en: "A dedicated networking area, with catering",
       }),
       accessConditions: tbd("Conditions d'accès éventuelles"),
     },
   ```

- [ ] **Step 6: Reduce the purchase layer to listing / notify**

Replace the whole of `src/lib/tickets/purchase.ts` with:

```ts
/**
 * The purchase action — built here and nowhere else.
 *
 * The page is a showcase: every buyer is sent to the alf.io listing, where the
 * quantity and the category are chosen and any group discount applies. Before
 * the ticketing opens there is nothing to buy, so the action is the newsletter.
 * Components receive a `PurchaseTarget` and render it; they never build an
 * alf.io URL of their own.
 *
 * Nothing here points at `/event/<slug>/code/<CODE>`: a real code creates a
 * reservation that blocks tickets, so the only code URL is the one a visitor
 * types into the code form (`codeUrl`).
 *
 * Pure: no environment reads.
 */
import type { Phase, TicketingConfig } from "@/config/tickets";
import { NEWSLETTER_URL } from "@/lib/event";
import { codeUrlFrom, type CodeResult } from "./url";

export type { CodeResult };

export type PurchaseTarget =
  | { kind: "listing"; href: string }
  | { kind: "notify"; href: string };

export function listingUrl(config: TicketingConfig): string {
  return `${trimSlash(config.alfio.baseUrl)}/event/${encodeURIComponent(config.alfio.eventSlug)}`;
}

/** Hostname buyers land on, named in the copy so the hand-off is never a surprise. */
export function alfioHost(config: TicketingConfig): string {
  return new URL(config.alfio.baseUrl).host;
}

/** Before the opening: the newsletter. Once selling: the alf.io listing. */
export function purchaseTarget(
  config: TicketingConfig,
  phase: Phase,
): PurchaseTarget {
  if (phase === "pre_opening") return { kind: "notify", href: NEWSLETTER_URL };
  return { kind: "listing", href: listingUrl(config) };
}

/** "I have a code" → the alf.io URL that applies it (see `codeUrlFrom`). */
export function codeUrl(config: TicketingConfig, raw: string): CodeResult {
  return codeUrlFrom(listingUrl(config), raw);
}

/**
 * No-JS fallback for the code form: a plain GET to the listing with `?code=`.
 * alf.io's support for it is still to be confirmed with JC; the script
 * upgrades the form to `/code/<CODE>`.
 */
export function codeFallbackAction(config: TicketingConfig): {
  action: string;
  param: "code";
} {
  return { action: listingUrl(config), param: "code" };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
```

Replace the whole of `src/lib/tickets/url.ts` with:

```ts
/**
 * The purchase logic the browser also runs: the "I have a code" URL.
 * Dependency-free on purpose: `tickets-ui.ts` imports this module, and
 * anything it imports ships in the client bundle.
 */

export type CodeResult =
  | { ok: true; code: string; url: string }
  | { ok: false; reason: "empty" };

/**
 * "I have a code": the site validates nothing and prices nothing — alf.io
 * knows the codes. Whitespace anywhere is dropped (codes never contain it and
 * copy-paste adds it), an empty code is refused, the rest is URL-encoded as a
 * single path segment of the event listing URL.
 */
export function codeUrlFrom(listingUrl: string, raw: string): CodeResult {
  const code = raw.replace(/\s+/g, "");
  if (!code) return { ok: false, reason: "empty" };
  return {
    ok: true,
    code,
    url: `${listingUrl}/code/${encodeURIComponent(code)}`,
  };
}
```

Delete the pricing module: `git rm src/lib/tickets/pricing.ts`

- [ ] **Step 7: Reduce the demo module to phases**

Replace the whole of `src/lib/tickets/demo.ts` with:

```ts
/**
 * Hidden demo routes for the ticketing page, and the gate on unfinished values.
 *
 * The demo exists so the ticketing team can walk the page through every phase
 * on staging before it replaces /billetterie. It must never reach a production
 * build: the gate reads the build's origin, the same fail-closed rule as
 * `src/lib/preview-fixture.ts` — an unset or empty PUBLIC_SITE_URL means
 * production, so a misconfigured pipeline hides the demo rather than
 * publishing it. `astro dev` always has it.
 *
 * The same rule decides whether a draft value may be shown: a production build
 * refuses the page while the config still holds one (`assertShippable`).
 */
import type { Phase } from "@/config/tickets";
import { isProductionOrigin, resolveSiteOrigin } from "@/lib/site-env";

interface GateInput {
  env?: Record<string, string | undefined>;
  dev?: boolean;
}

export function ticketDemosEnabled({
  env = process.env,
  dev = import.meta.env.DEV,
}: GateInput = {}): boolean {
  return dev || !isProductionOrigin(resolveSiteOrigin(env));
}

export function placeholdersAllowed(input: GateInput = {}): boolean {
  return ticketDemosEnabled(input);
}

export const DEMO_PHASES: readonly Phase[] = [
  "pre_opening",
  "seb",
  "eb",
  "regular",
  "last_chance",
];

/** URL segments. The demo is internal, but tier ids are never shown to visitors. */
export const PHASE_SLUGS: Record<Phase, string> = {
  pre_opening: "avant-ouverture",
  seb: "super-early-bird",
  eb: "early-bird",
  regular: "regular",
  last_chance: "last-chance",
};

const DEMO_BASE = "/billetterie/demo";

export interface DemoState {
  /** Undefined on the entry URL: the page then shows the config's own phase. */
  phase?: Phase;
}

export function demoPath(phase?: Phase): string {
  return phase ? `${DEMO_BASE}/${PHASE_SLUGS[phase]}/` : `${DEMO_BASE}/`;
}

/** Every demo URL as `[...demo]` route params, the entry URL first. */
export function demoStaticPaths(): Array<{
  params: { demo: string };
  props: DemoState;
}> {
  return [
    { params: { demo: "demo" }, props: {} },
    ...DEMO_PHASES.map((phase) => ({
      params: { demo: `demo/${PHASE_SLUGS[phase]}` },
      props: { phase },
    })),
  ];
}
```

- [ ] **Step 8: Route, page wrapper and sitemap**

Replace the whole of `src/pages/billetterie/[...demo].astro` with:

```astro
---
/**
 * Hidden demo of the 2027 ticketing page, for the team to walk through every
 * phase on staging:
 *
 *   /billetterie/demo/              the config's own phase
 *   /billetterie/demo/early-bird/   one simulated phase
 *
 * `getStaticPaths` returns nothing on a build for the production origin, so
 * these URLs never exist on cloudnativedays.fr (see src/lib/tickets/demo.ts).
 * French only; the i18n keys exist in both languages for the real page.
 * /billetterie itself stays the "coming soon" page until the switch.
 */
import TicketsPage from "@/components/tickets/TicketsPage.astro";
import { TICKETING } from "@/config/tickets";
import {
  demoStaticPaths,
  ticketDemosEnabled,
  type DemoState,
} from "@/lib/tickets/demo";
import { loadSessions } from "@/lib/schedule";
import { assertEditionPublishable } from "@/lib/edition-visibility";
import { rexSummary } from "@/lib/tickets/rex";

export function getStaticPaths() {
  return ticketDemosEnabled() ? demoStaticPaths() : [];
}

const { phase } = Astro.props as DemoState;

// The proof section quotes the last edition's experience reports, and that
// edition only: the page has no coming-soon state, so it refuses any edition
// that is not public rather than reading it.
const PROOF_EDITION = 2026;
assertEditionPublishable(PROOF_EDITION, "billetterie");
const rex = rexSummary(await loadSessions(PROOF_EDITION));
---

<TicketsPage
  lang="fr"
  phase={phase ?? TICKETING.currentPhase}
  rex={rex}
  demo={{ fromConfig: !phase }}
/>
```

Replace the whole of `src/components/tickets/TicketsPage.astro` with:

```astro
---
/**
 * The ticketing page: the site layout around `TicketsContent`, plus — on demo
 * routes only — the phase switcher and a forced noindex.
 */
import Layout from "@/layouts/Layout.astro";
import { TICKETING, type Phase } from "@/config/tickets";
import { useTranslations } from "@/i18n/utils";
import type { Locale } from "@/i18n/ui";
import type { RexSummary } from "@/lib/tickets/rex";
import TicketsContent from "./TicketsContent.astro";
import DemoBar from "./DemoBar.astro";

interface Props {
  lang: Locale;
  phase: Phase;
  rex: RexSummary;
  /** Present on demo routes only: renders the switcher and forces noindex. */
  demo?: { fromConfig: boolean };
}

const { lang, phase, rex, demo } = Astro.props;
const t = useTranslations(lang);
---

<Layout
  title={t("tickets.meta.title")}
  description={t("tickets.meta.description")}
  lang={lang}
  newsletter={false}
  noindex={Boolean(demo)}
>
  {
    demo && (
      <DemoBar
        lang={lang}
        config={TICKETING}
        phase={phase}
        fromConfig={demo.fromConfig}
      />
    )
  }
  <TicketsContent lang={lang} phase={phase} rex={rex} demo={Boolean(demo)} />
</Layout>

<script>
  import "./tickets-ui.ts";
</script>
```

In `astro.config.mjs`, replace:

```js
      // The ticketing demos only exist on non-production builds (see
      // src/lib/tickets/demo.ts); kept out of the sitemap there too.
      filter: (page) =>
        !/\/replays\/?$/.test(page) &&
        !/\/en\/replays\/?$/.test(page) &&
        !/\/billetterie\/demo-/.test(page),
```

with:

```js
      // The ticketing demo only exists on non-production builds (see
      // src/lib/tickets/demo.ts); kept out of the sitemap there too.
      filter: (page) =>
        !/\/replays\/?$/.test(page) &&
        !/\/en\/replays\/?$/.test(page) &&
        !/\/billetterie\/demo(\/|$)/.test(page),
```

- [ ] **Step 9: The purchase control, the mobile bar and door 2**

Replace the whole of `src/components/tickets/PurchaseControl.astro` with:

```astro
---
/**
 * The purchase action, rendered from a `PurchaseTarget` — door 1 and the
 * Strategy & Leadership band render the same one:
 *
 *   listing — one link to the alf.io listing, where the quantity is chosen.
 *   notify  — before the opening: the newsletter, no purchase anywhere.
 */
import type { PurchaseTarget } from "@/lib/tickets/purchase";
import type { Phase } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import Icon from "./Icon.astro";

interface Props {
  target: PurchaseTarget;
  lang: Locale;
  phase: Phase;
  analytics: { billet: "standard" | "strategique"; palier: string };
}

const { target, lang, phase, analytics } = Astro.props;
const t = useTranslations(lang);

const umami = {
  "data-umami-event-billet": analytics.billet,
  "data-umami-event-palier": analytics.palier,
  "data-umami-event-phase": phase,
};

const buttonClass =
  "inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-7 text-xl font-bold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-[background-color,scale] duration-150 ease-out hover:bg-primary/90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card";
---

{
  target.kind === "listing" && (
    <div>
      <a
        href={target.href}
        class={buttonClass}
        data-umami-event="tickets-purchase"
        {...umami}
      >
        {t("tickets.purchase.buy")}
        <Icon name="arrow-right" size={20} />
      </a>
    </div>
  )
}

{
  target.kind === "notify" && (
    <div class="flex flex-col items-start gap-2">
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        class={buttonClass}
        data-umami-event="tickets-notify"
        {...umami}
      >
        <Icon name="bell" size={20} />
        {t("tickets.offer.notify")}
      </a>
      <p class="text-muted-foreground text-sm">
        {t("tickets.offer.notify_note")}
      </p>
    </div>
  )
}
```

Replace the whole of `src/components/tickets/StickyTicketBar.astro` with:

```astro
---
/**
 * Mobile only: once door 1's action has scrolled away, a bar keeps the price
 * and the action one thumb away — the alf.io listing, or before the opening the
 * notification. Hidden while door 1's action is on screen so the page never
 * shows the same call to action twice.
 */
import type { Locale } from "@/i18n/ui";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  label: string;
  price: string;
  action: { href: string; text: string; external: boolean };
  analytics: Record<string, string>;
  demo?: boolean;
}

const { label, price, action, analytics, demo = false } = Astro.props;
---

<div
  class="sticky-ticket-bar fixed inset-x-0 bottom-0 z-40 md:hidden"
  data-sticky-bar
  data-visible="false"
  aria-hidden="true"
>
  {demo && <div class="demo-stripe h-1.5" aria-hidden="true" />}
  <div
    class="border-border bg-background/95 flex items-center justify-between gap-4 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
  >
    <p class="flex min-w-0 flex-col leading-tight">
      <span class="text-muted-foreground truncate text-sm">{label}</span>
      <span
        class="text-foreground text-xl font-bold tracking-[-0.02em] tabular-nums"
        >{price}</span
      >
    </p>
    <a
      href={action.href}
      target={action.external ? "_blank" : undefined}
      rel={action.external ? "noopener noreferrer" : undefined}
      class="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex h-12 shrink-0 items-center gap-2 rounded-lg px-5 text-xl font-bold transition-[background-color,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:outline-none active:scale-[0.96]"
      tabindex="-1"
      data-sticky-action
      data-umami-event="tickets-sticky"
      {...analytics}
    >
      {action.text}
      <Icon name="arrow-right" size={20} />
    </a>
  </div>
</div>

<style>
  .sticky-ticket-bar {
    transition:
      translate 220ms cubic-bezier(0.2, 0, 0, 1),
      opacity 220ms cubic-bezier(0.2, 0, 0, 1);
  }
  .sticky-ticket-bar[data-visible="false"] {
    translate: 0 100%;
    opacity: 0;
    pointer-events: none;
  }
  .demo-stripe {
    background: repeating-linear-gradient(
      -45deg,
      var(--color-destructive) 0 8px,
      var(--color-background) 8px 16px
    );
  }
</style>
```

Replace the whole of `src/components/tickets/TeamDoor.astro` with:

```astro
---
/**
 * Door 2, "Venir en équipe". It is rendered only when a group rate actually
 * beats the price of the moment *and* fits the tier's order cap
 * (`cheaperGroupRates`) — before that it had nothing to sell and said so, which
 * read as a dead end in a card that promises an offer.
 *
 * The rates, then one call to action asking for one: the quantity is chosen on
 * the alf.io listing, so the site sells no group order of its own.
 */
import type { GroupRate, TierDefinition } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import GroupRates from "./GroupRates.astro";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  tier: TierDefinition;
  rates: GroupRate[];
  groupMailto: string;
}

const { lang, tier, rates, groupMailto } = Astro.props;
const t = useTranslations(lang);
---

{
  /* `id="equipe"`: the group rates live here and nowhere else, so the Strategy
    & Leadership band points at this card. */
}
<article
  id="equipe"
  class="door border-border bg-card flex grow flex-col gap-5 rounded-xl border p-5 sm:p-6"
  aria-labelledby="door-team-title"
  style="--door-index: 1"
>
  <h2
    id="door-team-title"
    class="text-foreground text-2xl font-semibold tracking-[-0.01em]"
  >
    {t("tickets.team.title")}
  </h2>

  <div class="flex flex-col gap-2">
    <p class="text-muted-foreground text-sm font-medium">
      {t("tickets.team.rates")}
    </p>
    <GroupRates lang={lang} tier={tier} rates={rates} />
  </div>

  <div class="mt-auto">
    <a
      href={groupMailto}
      class="border-input bg-card text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-base font-semibold transition-[background-color,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:outline-none active:scale-[0.96]"
      data-umami-event="tickets-group-contact"
      data-umami-event-source="door"
    >
      <Icon name="mail" size={18} />
      {t("tickets.team.cta.group")}
    </a>
  </div>
</article>
```

Replace the whole of `src/components/tickets/GroupRates.astro` with:

```astro
---
/**
 * The group rates of the moment, as a price list in door 2.
 *
 * Each row carries the discount against the current tier in the section's pink,
 * the same pill as "Stock limité": the percentage is what a manager reads first,
 * the price per seat is what they check second. Nothing is clickable — door 2's
 * own call to action is the way to ask for a rate.
 */
import type { GroupRate, TierDefinition } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { formatDiscount, formatPrice } from "@/lib/tickets/format";

interface Props {
  lang: Locale;
  /** The tier the discount is measured against — the price on offer today. */
  tier: TierDefinition;
  rates: GroupRate[];
  class?: string;
}

const { lang, tier, rates, class: className } = Astro.props;
const t = useTranslations(lang);
---

<ul
  class:list={[
    "divide-border border-border flex flex-col divide-y overflow-hidden rounded-lg border",
    className,
  ]}
>
  {
    rates.map((rate) => (
      <li class="flex flex-col gap-1 px-4 py-3" data-group-rate={rate.id}>
        <span class="flex items-center justify-between gap-3">
          <span class="text-muted-foreground text-sm">
            {t(`tickets.team.rate.${rate.id}`)}
          </span>
          <span class="bg-accent text-accent-foreground inline-flex items-center rounded-full px-2 py-1 text-xs leading-none font-bold tracking-[0.02em] tabular-nums">
            {formatDiscount(tier.price, rate.price, lang)}
          </span>
        </span>
        <span class="text-foreground text-xl font-bold tracking-[-0.02em] tabular-nums">
          {formatPrice(rate.price, lang)}
        </span>
      </li>
    ))
  }
</ul>
```

In `src/components/tickets/CodeDoor.astro`: delete the `variant: string;` line from `Props`, change the destructuring to `const { lang, phase, listingUrl, fallback, host, layout } = Astro.props;`, and delete the line `        data-umami-event-variante={variant}` from the submit button.

- [ ] **Step 10: The Strategy & Leadership band, always on sale**

Replace the whole of `src/components/tickets/StrategicOffer.astro` with (the placeholder chips stay until Task 4):

```astro
---
/**
 * The Strategy & Leadership ticket: another product, not a fifth tier. It sits
 * under the three doors in its own material (the deep brand purple) so
 * decision-makers find it without it outshining the standard ticket.
 *
 * Always displayed and always on sale: its action is the page's own — the
 * alf.io listing, or the newsletter before the opening — passed in the
 * `purchase` slot. Its quota is never shown, like every other.
 */
import { isTbd, type Maybe, type StrategicTicket } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { formatPrice } from "@/lib/tickets/format";
import Icon from "./Icon.astro";
import Tbd from "./Tbd.astro";

interface Props {
  lang: Locale;
  ticket: StrategicTicket;
  /** Door 2's anchor, set only while a group rate applies — there is nowhere
   *  else on the page to send a reader looking for one. */
  teamHref?: string;
}

const { lang, ticket, teamHref } = Astro.props;
const t = useTranslations(lang);

const name = isTbd(ticket.name)
  ? (ticket.name.draft?.[lang] ?? "")
  : ticket.name[lang];

function text(value: Maybe<{ fr: string; en: string }>): string | undefined {
  if (isTbd(value)) return value.draft?.[lang];
  return value[lang];
}

const priceText = isTbd(ticket.price)
  ? undefined
  : ticket.price.kind === "fixed"
    ? formatPrice(ticket.price.amount, lang)
    : undefined;

const facts: Array<{ label: string; value?: string; tbd?: string }> = [
  {
    label: t("tickets.strategic.fact.price"),
    value: priceText,
    tbd: isTbd(ticket.price) ? ticket.price.note : undefined,
  },
  {
    label: t("tickets.strategic.fact.includes"),
    value: text(ticket.includesStandard),
    tbd: isTbd(ticket.includesStandard)
      ? ticket.includesStandard.note
      : undefined,
  },
  {
    label: t("tickets.strategic.fact.programme"),
    value: text(ticket.programme),
    tbd: isTbd(ticket.programme) ? ticket.programme.note : undefined,
  },
  {
    label: t("tickets.strategic.fact.networking"),
    value: text(ticket.networking),
    tbd: isTbd(ticket.networking) ? ticket.networking.note : undefined,
  },
  {
    label: t("tickets.strategic.fact.access"),
    value: text(ticket.accessConditions),
    tbd: isTbd(ticket.accessConditions)
      ? ticket.accessConditions.note
      : undefined,
  },
];

const topics = [1, 2, 3, 4, 5, 6].map((n) =>
  t(`tickets.strategic.topic.${n}` as Parameters<typeof t>[0]),
);
---

<section
  id="strategie-leadership"
  class="strategic bg-chart-5 text-primary-foreground dark:bg-secondary dark:ring-accent/30 relative overflow-hidden rounded-xl dark:ring-1"
  aria-labelledby="strategic-title"
>
  <div
    class="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14"
  >
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2
          id="strategic-title"
          class="text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl"
        >
          {name}
        </h2>
        {
          isTbd(ticket.name) && (
            <Tbd note={ticket.name.note} lang={lang} tone="inverse" />
          )
        }
      </div>
      <p class="max-w-[60ch] text-lg text-pretty">
        {t("tickets.strategic.lead")}
      </p>
      <p class="text-chart-4 max-w-[60ch] text-base text-pretty">
        {t("tickets.strategic.body")}
      </p>
      <div class="flex flex-col gap-3">
        <p class="text-chart-4 text-sm font-medium">
          {t("tickets.strategic.topics")}
        </p>
        <ul class="flex flex-wrap gap-2">
          {
            topics.map((topic) => (
              <li class="border-primary-foreground/25 rounded-full border px-3 py-1 text-sm font-medium">
                {topic}
              </li>
            ))
          }
        </ul>
      </div>
      <p class="text-accent text-base font-medium">
        {t("tickets.strategic.no_pitch")}
      </p>
    </div>

    <div class="flex flex-col gap-6">
      <dl
        class="divide-primary-foreground/15 border-primary-foreground/15 divide-y border-y"
      >
        {
          facts.map((fact) => (
            <div
              class="flex flex-col gap-1 py-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4"
              data-tbd-only={fact.value ? undefined : true}
            >
              <dt class="text-chart-4 text-sm">{fact.label}</dt>
              <dd class="flex flex-wrap items-center gap-2 text-base font-semibold sm:justify-end sm:text-right">
                {fact.value && <span class="tabular-nums">{fact.value}</span>}
                {fact.tbd && <Tbd note={fact.tbd} lang={lang} tone="inverse" />}
              </dd>
            </div>
          ))
        }
      </dl>

      <div class="strategic-purchase">
        <slot name="purchase" />
      </div>

      {
        teamHref && (
          <a
            href={teamHref}
            class="text-primary-foreground inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("tickets.strategic.team")}
            <Icon name="arrow-right" size={14} />
          </a>
        )
      }
    </div>
  </div>
</section>

<style>
  /* The shared purchase control is drawn for light cards; on the purple band
     its note takes the band's own ink. */
  .strategic-purchase :global(.text-muted-foreground) {
    color: var(--color-chart-4);
  }
</style>
```

- [ ] **Step 11: The page content**

Replace the whole of `src/components/tickets/TicketsContent.astro` with:

```astro
---
/**
 * The ticketing page's content, composed around the three ways people arrive —
 * take my seat, come as a team, I have a code — weighted by importance.
 * `TicketsPage` wraps it in the layout; kept apart so the demo matrix test can
 * render every phase without a site origin.
 *
 * Everything is derived from `src/config/tickets.ts` and the phase, so the demo
 * routes and a future production route render the same page. Every purchase —
 * door 1, the Strategy & Leadership band, the mobile bar — goes to the alf.io
 * listing through one `purchaseTarget`.
 */
import GeoBackground from "@/components/patterns/GeoBackground.astro";
import { TICKETING, isTbd, type Maybe, type Phase } from "@/config/tickets";
import { useTranslations } from "@/i18n/utils";
import type { Locale } from "@/i18n/ui";
import { CONTACT_EMAILS, TARGET_DATE } from "@/lib/event";
import { buildMailto } from "@/lib/tickets/mailto";
import {
  fill,
  formatDayMonth,
  formatFullDate,
  formatPrice,
  formatTime,
} from "@/lib/tickets/format";
import {
  assertTicketingConfig,
  cheaperGroupRates,
  offerTier,
  tierStates,
} from "@/lib/tickets/phase";
import {
  alfioHost,
  codeFallbackAction,
  listingUrl,
  purchaseTarget,
} from "@/lib/tickets/purchase";
import type { RexSummary } from "@/lib/tickets/rex";
import OfferDoor from "./OfferDoor.astro";
import TeamDoor from "./TeamDoor.astro";
import CodeDoor from "./CodeDoor.astro";
import PurchaseControl from "./PurchaseControl.astro";
import StrategicOffer from "./StrategicOffer.astro";
import IncludedInTicket from "./IncludedInTicket.astro";
import EditionProof from "./EditionProof.astro";
import TeamOffer from "./TeamOffer.astro";
import TicketsFaq from "./TicketsFaq.astro";
import InclusionNote from "./InclusionNote.astro";
import StickyTicketBar from "./StickyTicketBar.astro";
import Tbd from "./Tbd.astro";

interface Props {
  lang: Locale;
  phase: Phase;
  rex: RexSummary;
  /** Demo routes stripe the mobile bar so no capture passes for the real page. */
  demo?: boolean;
}

const { lang, phase, rex, demo } = Astro.props;
const t = useTranslations(lang);
const config = TICKETING;
assertTicketingConfig(config);

/** The note of a `tbd` value, for its chip; undefined once the value is decided. */
const note = (value: Maybe<unknown>) => (isTbd(value) ? value.note : undefined);
const draftText = (value: Maybe<{ fr: string; en: string }>) =>
  isTbd(value) ? (value.draft?.[lang] ?? "") : value[lang];

const tier = offerTier(config, phase);
const ladder = tierStates(config, phase);
const rates = cheaperGroupRates(config, tier);
const host = alfioHost(config);
const email = CONTACT_EMAILS.tickets;

const groupMailto = buildMailto(
  email,
  t("tickets.team.mail.subject"),
  t("tickets.team.mail.body"),
);
const inclusionMailto = buildMailto(
  email,
  t("tickets.inclusion.mail.subject"),
  t("tickets.inclusion.mail.body"),
);

// One action for the whole page: the alf.io listing, or before the opening the
// newsletter. Door 1, the Strategy & Leadership band and the mobile bar share it.
const target = purchaseTarget(config, phase);

// Door 2 is rendered only when a group rate actually beats the price of the
// moment and fits the tier's order cap; below that it had nothing to sell.
// Everything else about the first viewport follows from it.
const showTeam = rates.length > 0;
const showCode = phase !== "pre_opening";
const wideOffer = !showTeam;

const openingTime = isTbd(config.opening.time)
  ? (config.opening.time.draft ?? "")
  : config.opening.time;
const opening = {
  date: config.opening.date,
  time: formatTime(openingTime, lang),
  timeNote: note(config.opening.time),
};
const programmeWhen = draftText(config.programmeAnnouncement);
const programmeNote = note(config.programmeAnnouncement);

const eventDate = formatFullDate(TARGET_DATE, lang);
// Split around {venue} so the venue can be set unbreakable: "CENTQUATRE-PARIS"
// must never break at its hyphen on a narrow screen.
const [whenBefore, whenAfter = ""] = t("tickets.when").split("{venue}");
const when = {
  before: fill(whenBefore, {
    date: eventDate.charAt(0).toUpperCase() + eventDate.slice(1),
  }),
  venue: t("hero.venue"),
  after: whenAfter,
};

const sticky = {
  label:
    phase === "pre_opening"
      ? fill(t("tickets.sticky.opens"), {
          date: formatDayMonth(config.opening.date, lang),
        })
      : tier.name[lang],
  price: formatPrice(tier.price, lang),
  action:
    target.kind === "listing"
      ? { href: target.href, text: t("tickets.sticky.buy"), external: false }
      : { href: target.href, text: t("tickets.sticky.notify"), external: true },
  analytics: {
    "data-umami-event-billet": "standard",
    "data-umami-event-palier": tier.id,
    "data-umami-event-phase": phase,
  },
};

const early = config.tiers
  .filter((x) => x.closesWhenSoldOut)
  .map((x) => x.maxPerOrder);
const later = config.tiers
  .filter((x) => !x.closesWhenSoldOut)
  .map((x) => x.maxPerOrder);
const perOrder = { early: Math.max(...early), later: Math.max(...later) };
---

<main class="tickets-page" data-phase={phase}>
  <section class="relative isolate overflow-hidden">
    <GeoBackground class="tickets-mesh absolute inset-0 -z-10" />
    <div
      class="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-8 pb-16 md:px-6 md:pt-12 md:pb-20 lg:px-8"
    >
      <header class="flex max-w-4xl flex-col gap-3">
        <h1
          class="text-foreground text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance sm:text-5xl"
        >
          {t("tickets.h1")}
        </h1>
        <p class="text-foreground text-lg font-semibold text-pretty sm:text-xl">
          {when.before}<span class="whitespace-nowrap">{when.venue}</span>{
            when.after
          }, {t("tickets.when_evening")}
          {
            note(config.eveningIncluded) && (
              <Tbd
                note={note(config.eveningIncluded)!}
                lang={lang}
                class="ml-1.5 align-[0.15em]"
              />
            )
          }
        </p>
        <p
          class="text-muted-foreground max-w-[58ch] text-base text-pretty sm:text-lg"
        >
          {t("tickets.lead")}
        </p>
      </header>

      {
        /* Door 1 spans the grid whenever door 2 has nothing to sell: a lone short
          card beside it would leave the right column hollow. "J'ai un code"
          then becomes a slim band underneath rather than that lone card. */
      }
      <div class="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {
          /* `flex flex-col` so door 1 inherits the row height the right column
            sets, rather than sitting short inside a stretched wrapper. */
        }
        <div
          class:list={[
            "flex flex-col",
            wideOffer ? "lg:col-span-12" : "lg:col-span-8",
          ]}
        >
          <OfferDoor
            lang={lang}
            phase={phase}
            tier={tier}
            ladder={ladder}
            opening={opening}
            namesNote={note(config.tierNames)}
          >
            <PurchaseControl
              slot="purchase"
              target={target}
              lang={lang}
              phase={phase}
              analytics={{ billet: "standard", palier: tier.id }}
            />
          </OfferDoor>
        </div>
        {
          showTeam && (
            <div class="flex flex-col gap-5 lg:col-span-4 lg:gap-6">
              <TeamDoor
                lang={lang}
                tier={tier}
                rates={rates}
                groupMailto={groupMailto}
              />
              <CodeDoor
                lang={lang}
                phase={phase}
                listingUrl={listingUrl(config)}
                fallback={codeFallbackAction(config)}
                host={host}
                layout="card"
              />
            </div>
          )
        }
        {
          showCode && !showTeam && (
            <div class="lg:col-span-12">
              <CodeDoor
                lang={lang}
                phase={phase}
                listingUrl={listingUrl(config)}
                fallback={codeFallbackAction(config)}
                host={host}
                layout="band"
              />
            </div>
          )
        }
      </div>
    </div>
  </section>

  {/* Always displayed, always on sale: the same action as door 1. */}
  <div class="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
    <StrategicOffer
      lang={lang}
      ticket={config.strategic}
      teamHref={showTeam ? "#equipe" : undefined}
    >
      <PurchaseControl
        slot="purchase"
        target={target}
        lang={lang}
        phase={phase}
        analytics={{ billet: "strategique", palier: "strategique" }}
      />
    </StrategicOffer>
  </div>

  <div
    class="mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-28 md:pb-24 lg:px-8"
  >
    <IncludedInTicket
      lang={lang}
      contentsNote={note(config.contents)}
      eveningIncludedNote={note(config.eveningIncluded)}
      eveningNote={note(config.eveningDetails)}
    />
  </div>

  <div class="border-border bg-card/60 border-y py-20 md:py-24">
    <EditionProof
      lang={lang}
      rex={rex}
      programmeWhen={programmeWhen}
      programmeNote={programmeNote}
    />
  </div>

  <div
    class="mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-28 md:pb-24 lg:px-8"
  >
    <TeamOffer
      lang={lang}
      programmeWhen={programmeWhen}
      programmeNote={programmeNote}
      kitNote={note(config.managerKitUrl)}
      kitUrl={isTbd(config.managerKitUrl) ? undefined : config.managerKitUrl}
    />
  </div>

  <div class="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-24 lg:px-8">
    <TicketsFaq
      lang={lang}
      host={host}
      email={email}
      inclusionMailto={inclusionMailto}
      perOrder={perOrder}
      programmeWhen={programmeWhen}
      notes={{
        vat: note(config.vatRate),
        invoice: note(config.invoice),
        transfer: note(config.transferAndRefund),
        terms: note(config.termsUrl),
        programme: programmeNote,
      }}
    />
  </div>

  <div class="mx-auto max-w-7xl px-4 pb-28 md:px-6 md:pb-24 lg:px-8">
    <InclusionNote lang={lang} inclusionMailto={inclusionMailto} />
  </div>
</main>

<StickyTicketBar
  lang={lang}
  label={sticky.label}
  price={sticky.price}
  action={sticky.action}
  analytics={sticky.analytics}
  demo={Boolean(demo)}
/>

<style>
  .tickets-page :global(::selection) {
    background: color-mix(in oklab, var(--color-primary) 28%, transparent);
    color: var(--color-foreground);
  }
  .tickets-page :global(.tickets-mesh) {
    mask-image: linear-gradient(
      to bottom,
      black 0%,
      black 35%,
      transparent 85%
    );
    opacity: 0.9;
  }

  /* One authored entrance: the three doors settle in sequence, once, from an
     already-visible default (reduced motion keeps them still, global.css). */
  @media (prefers-reduced-motion: no-preference) {
    .tickets-page :global(.door) {
      animation: door-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--door-index, 0) * 90ms + 60ms);
    }
  }
  @keyframes door-in {
    from {
      opacity: 0;
      translate: 0 14px;
      filter: blur(3px);
    }
  }
</style>
```

- [ ] **Step 12: The demo menu — phase only**

Replace the whole of `src/components/tickets/DemoBar.astro` with:

```astro
---
/**
 * Demo-only phase switcher: each phase is a link to a pre-rendered page —
 * exactly what a production build renders in that phase, with no client
 * re-implementation. Never rendered outside the demo routes.
 *
 * It stays out of the way on purpose: the page must look exactly like the
 * future production page, so the only permanent mark is the striped "DÉMO"
 * pill in the bottom-left corner. Clicking it opens the switcher in a native
 * popover (top layer, light-dismiss and Esc for free, no JS needed to open it).
 */
import type { Phase, TicketingConfig } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { DEMO_PHASES, demoPath } from "@/lib/tickets/demo";

interface Props {
  lang: Locale;
  config: TicketingConfig;
  phase: Phase;
  /** True on the entry URL, which shows the config's own phase. */
  fromConfig: boolean;
}

const { lang, config, phase, fromConfig } = Astro.props;
const t = useTranslations(lang);

const phaseLabel = (p: Phase) =>
  p === "pre_opening"
    ? t("tickets.demo.pre_opening")
    : config.tiers.find((tier) => tier.id === p)!.name[lang];

const legend =
  "text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
const chip =
  "inline-flex min-h-8 items-center rounded-md px-2.5 text-[0.8125rem] font-medium transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const idle = "text-foreground hover:bg-muted";
const active = "bg-foreground text-background";
---

<div class="demo-root" data-demo-bar>
  <button
    type="button"
    popovertarget="demo-panel"
    class="demo-trigger text-destructive-foreground focus-visible:ring-ring focus-visible:ring-offset-background fixed left-4 z-50 inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold tracking-widest uppercase shadow-[0_2px_8px_oklch(0_0_0/0.25)] transition-[scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.96]"
    aria-label={t("tickets.demo.settings")}
  >
    <span>{t("tickets.demo.badge")}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      class="shrink-0 opacity-80"
    >
      <path d="M4 6h10"></path>
      <path d="M18 6h2"></path>
      <path d="M4 12h4"></path>
      <path d="M12 12h8"></path>
      <path d="M4 18h10"></path>
      <path d="M18 18h2"></path>
      <circle cx="16" cy="6" r="2"></circle>
      <circle cx="10" cy="12" r="2"></circle>
      <circle cx="16" cy="18" r="2"></circle>
    </svg>
  </button>

  <div id="demo-panel" popover class="demo-panel" data-demo-panel>
    <div
      class="border-border bg-card flex max-h-[min(30rem,calc(100dvh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-y-auto rounded-xl border shadow-[0_12px_32px_oklch(0_0_0/0.22)]"
    >
      <div class="demo-stripe h-1.5 shrink-0" aria-hidden="true"></div>

      <div class="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <p class="flex flex-col gap-1">
          <strong
            class="bg-destructive text-destructive-foreground w-fit rounded-sm px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase"
          >
            {t("tickets.demo.badge")}
          </strong>
          <span class="text-muted-foreground text-xs"
            >{t("tickets.demo.notice")}</span
          >
        </p>
        <button
          type="button"
          popovertarget="demo-panel"
          popovertargetaction="hide"
          class="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring -mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={t("tickets.demo.close")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      </div>

      <nav
        class="border-border flex flex-col gap-1.5 border-t px-4 py-3"
        aria-label={t("tickets.demo.phase")}
      >
        <span class={legend}>{t("tickets.demo.phase")}</span>
        <div class="flex flex-wrap gap-1">
          {
            DEMO_PHASES.map((p) => (
              <a
                href={demoPath(p)}
                class:list={[chip, !fromConfig && p === phase ? active : idle]}
                aria-current={!fromConfig && p === phase ? "page" : undefined}
                data-demo-link
              >
                {phaseLabel(p)}
              </a>
            ))
          }
        </div>
      </nav>

      <p
        class="border-border text-muted-foreground border-t px-4 py-3 text-[0.6875rem] leading-relaxed"
      >
        {fromConfig ? `${t("tickets.demo.config")} · ` : ""}{
          t("tickets.demo.scenario")
        }
      </p>
    </div>
  </div>
</div>

<style>
  .demo-root {
    /* Clear of the mobile sticky ticket bar; in the corner on wider screens. */
    --demo-bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  }
  @media (min-width: 768px) {
    .demo-root {
      --demo-bottom: 1rem;
    }
  }

  .demo-trigger {
    bottom: var(--demo-bottom);
    background: var(--color-destructive);
  }

  /* Override the UA popover box: it centres itself and draws its own frame. */
  .demo-panel {
    position: fixed;
    inset: auto;
    left: 1rem;
    bottom: calc(var(--demo-bottom) + 2.5rem);
    margin: 0;
    border: 0;
    padding: 0;
    overflow: visible;
    background: transparent;
    color: inherit;
    opacity: 0;
    translate: 0 0.5rem;
    transition:
      opacity 150ms ease-out,
      translate 150ms cubic-bezier(0.2, 0, 0, 1),
      overlay 150ms allow-discrete,
      display 150ms allow-discrete;
  }
  .demo-panel:popover-open {
    opacity: 1;
    translate: 0 0;
  }
  @starting-style {
    .demo-panel:popover-open {
      opacity: 0;
      translate: 0 0.5rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .demo-panel {
      transition: none;
      translate: none;
    }
  }

  .demo-stripe {
    background: repeating-linear-gradient(
      -45deg,
      var(--color-destructive) 0 10px,
      var(--color-background) 10px 20px
    );
  }
</style>
```

- [ ] **Step 13: The client script**

Replace the whole of `src/components/tickets/tickets-ui.ts` with:

```ts
/**
 * Client behaviour for the ticketing page. Progressive enhancement only: every
 * form and link works without it, so this file adds feedback and never owns a
 * rule. The code URL comes from src/lib/tickets/url.ts, shared with the server
 * render.
 */
import { codeUrlFrom } from "@/lib/tickets/url";

// ── "I have a code": strip spaces, refuse empty, hand over to alf.io ────────────
for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-tickets-code]",
)) {
  const input = form.querySelector<HTMLInputElement>("[data-code-input]");
  const error = form.querySelector<HTMLElement>("[data-code-error]");
  const listing = form.dataset.listing;
  if (!input || !error || !listing) continue;
  const describedBy = input.getAttribute("aria-describedby") ?? "";

  const clearError = () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", describedBy);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = codeUrlFrom(listing, input.value);
    if (!result.ok) {
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        `${error.id} ${describedBy}`.trim(),
      );
      input.focus();
      return;
    }
    clearError();
    input.value = result.code;
    window.location.assign(result.url);
  });
  input.addEventListener("input", () => {
    if (!error.hidden) clearError();
  });
}

// ── Mobile bar: shown whenever door 1's action is off screen ───────────────────
// It watches the action column itself, not the whole door: the ladder below the
// button must not keep the bar away while the button is already out of sight,
// and a short phone that opens with the button below the fold gets the bar too.
const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
const offerAction = document.querySelector<HTMLElement>(
  "#offre [data-offer-action]",
);
if (bar && offerAction && "IntersectionObserver" in window) {
  const action = bar.querySelector<HTMLAnchorElement>("[data-sticky-action]");
  const observer = new IntersectionObserver(
    ([entry]) => {
      const show = !entry.isIntersecting;
      bar.dataset.visible = String(show);
      bar.setAttribute("aria-hidden", String(!show));
      if (action) action.tabIndex = show ? 0 : -1;
    },
    { threshold: 0.5 },
  );
  observer.observe(offerAction);
}

// ── Demo switcher: keep the reading position and the open panel across switches ─
// Each phase is its own URL, so switching reloads the page; without this the
// panel would close and the page jump back to the top on every click. The
// panel itself opens with the native popover attributes, with no JS involved.
const SCROLL_KEY = "cnd-tickets-demo-scroll";
const PANEL_KEY = "cnd-tickets-demo-panel";
const panel = document.querySelector<HTMLElement>("[data-demo-panel]");

for (const link of document.querySelectorAll<HTMLAnchorElement>(
  "[data-demo-link]",
)) {
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      sessionStorage.setItem(PANEL_KEY, "open");
    } catch {
      // Storage can be unavailable (private mode); the switch still works.
    }
  });
}

if (document.querySelector("[data-demo-bar]")) {
  try {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) {
      sessionStorage.removeItem(SCROLL_KEY);
      window.scrollTo({ top: Number(saved), behavior: "instant" });
    }
    // Consumed on arrival: the panel reopens after a switch, not on a later
    // visit where the reader closed it and navigated off the page.
    if (sessionStorage.getItem(PANEL_KEY) === "open") {
      sessionStorage.removeItem(PANEL_KEY);
      panel?.showPopover?.();
    }
  } catch {
    // Nothing to restore.
  }
}
```

- [ ] **Step 14: Icons, doc comments and i18n**

In `src/components/tickets/Icon.astro`, delete the line `  minus: ["M5 12h14"],` (only the stepper used it).

In `src/lib/tickets/mailto.ts`, replace the doc line `hand: group quotes, inclusion and students, the Strategy & Leadership` / `waiting list. …` so the first paragraph reads:

```ts
/**
 * Pre-filled `mailto:` links for the requests the ticketing team handles by
 * hand: group quotes, inclusion and students. The address comes from
 * CONTACT_EMAILS, the words from i18n.
```

In `src/lib/event.ts`, replace `  /** Group quotes, inclusion and student requests, Strategy & Leadership waiting list. */` with `  /** Group quotes, inclusion and student requests. */`.

Remove the i18n keys nothing reads any more:

```bash
node .superpowers/drop-i18n-keys.mjs \
  'tickets.purchase.qty_label' 'tickets.purchase.decrease' 'tickets.purchase.increase' \
  'tickets.purchase.total' 'tickets.purchase.reserve' 'tickets.purchase.cap' 'tickets.purchase.cap_link' \
  'tickets.purchase.group_applied' 'tickets.purchase.was' 'tickets.purchase.saving' \
  'tickets.sticky.reserve' \
  'tickets.team.apply' 'tickets.team.or' 'tickets.team.custom.lead' 'tickets.team.cta.contact' \
  'tickets.strategic.notify' 'tickets.strategic.notify_alt' 'tickets.strategic.fact.on_sale' \
  'tickets.strategic.mail.subject' 'tickets.strategic.mail.body' \
  'tickets.demo.variant' 'tickets.demo.variant.*' 'tickets.demo.strategic' 'tickets.demo.strategic.*' \
  'tickets.demo.placeholders' 'tickets.demo.placeholders.show'
```

Expected: one `removed 2` line per exact key, `tickets.demo.variant.*: removed 4`, `tickets.demo.strategic.*: removed 6`, exit 0.

- [ ] **Step 15: Check for stale references**

Run: `grep -rnE "Variant\b|StrategicState|strategicState|clampQuantity|orderSegments|reserveUrl|ALFIO_MAX_PER_ORDER|alfioCategoryCode|alfioCode|data-tbd-toggle|tickets\.demo\.(variant|strategic|placeholders)" src astro.config.mjs`
Expected: no output.

- [ ] **Step 16: Run the tests and the type check**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets tests/build/i18n-parity.test.ts`
Expected: PASS.

Run: `pnpm astro check`
Expected: `0 errors`.

- [ ] **Step 17: Commit**

```bash
git add -A src/config/tickets.ts src/lib/tickets src/lib/event.ts src/pages/billetterie astro.config.mjs \
  src/components/tickets src/i18n/ui.ts src/lib/__tests__/tickets.test.ts
git commit -m "refactor(billetterie): showcase only, Strategy & Leadership always on sale

Variant A is dropped for good (22/09/2026 meeting): bypassing the alf.io
listing was judged too risky, so every purchase now goes to the listing and
the stepper, the reserve target and the price-per-quantity table go. S&L is
always shown and on sale, so its announced/hidden states go too. The demo
collapses to its phases: 6 pages under /billetterie/demo/, kept out of the
sitemap by the updated filter.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG"
```

---

### Task 3: Remove the proof section and the inclusion footer

**Files:**

- Modify: `src/components/tickets/TicketsContent.astro`, `src/components/tickets/TicketsPage.astro`, `src/pages/billetterie/[...demo].astro`, `src/components/tickets/Icon.astro`, `src/i18n/ui.ts`
- Delete: `src/components/tickets/EditionProof.astro`, `src/components/tickets/InclusionNote.astro`, `src/lib/tickets/rex.ts`
- Test: `src/components/tickets/__tests__/TicketsPage.test.ts`, `src/lib/__tests__/tickets.test.ts`

**Interfaces:**

- Consumes: Task 2's `TicketsContent` / `TicketsPage`.
- Produces: `TicketsContent` / `TicketsPage` props `{ lang: Locale; phase: Phase; demo?: … }` (no `rex`).

- [ ] **Step 1: Write the failing test**

In `src/components/tickets/__tests__/TicketsPage.test.ts`: delete the line `const rex = { sessions: 17, organisations: ["SNCF", "Mistral AI"] };`, change the render props to `props: { lang: "fr", phase, demo: true },`, and add inside `describe.each`:

```ts
it("carries no proof section and no inclusion footer — the FAQ answers that", () => {
  expect(text).not.toContain("2026, en vrai");
  expect(main).not.toContain('id="proof-title"');
  expect(text).not.toContain("Le prix ne doit empêcher personne");
  expect(text).toContain("Existe-t-il un tarif étudiant ou solidaire");
});
```

In `src/lib/__tests__/tickets.test.ts`: delete the imports `import { rexSummary } from "@/lib/tickets/rex";` and `import type { SessionRow } from "@/lib/schedule";`, and delete the whole `describe("rexSummary", …)` block.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/tickets`
Expected: FAIL on "carries no proof section…" (`2026, en vrai` is still rendered).

- [ ] **Step 3: Remove the sections**

In `src/components/tickets/TicketsContent.astro`:

1. Delete these imports: `import type { RexSummary } from "@/lib/tickets/rex";`, `import EditionProof from "./EditionProof.astro";`, `import InclusionNote from "./InclusionNote.astro";`.
2. In `Props`, delete `  rex: RexSummary;`; change the destructuring to `const { lang, phase, demo } = Astro.props;`.
3. Delete the proof block:
   ```astro
   <div class="border-border bg-card/60 border-y py-20 md:py-24">
     <EditionProof
       lang={lang}
       rex={rex}
       programmeWhen={programmeWhen}
       programmeNote={programmeNote}
     />
   </div>
   ```
4. The manager section now follows "what the ticket includes" directly, so it takes the page's section rhythm (the previous section's bottom padding) rather than a second top padding: change its wrapper from `class="mx-auto max-w-7xl px-4 pb-20 pt-24 md:px-6 md:pb-24 md:pt-28 lg:px-8"` (the one around `<TeamOffer`) to `class="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-24 lg:px-8"`.
5. Delete the inclusion block:
   ```astro
   <div class="mx-auto max-w-7xl px-4 pb-28 md:px-6 md:pb-24 lg:px-8">
     <InclusionNote lang={lang} inclusionMailto={inclusionMailto} />
   </div>
   ```
6. The FAQ is now the last block, so it carries the clearance the mobile sticky bar needs: change the wrapper around `<TicketsFaq` from `class="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-24 lg:px-8"` to `class="mx-auto max-w-7xl px-4 pb-28 md:px-6 md:pb-24 lg:px-8"`.

In `src/components/tickets/TicketsPage.astro`: delete `import type { RexSummary } from "@/lib/tickets/rex";` and `  rex: RexSummary;`, change the destructuring to `const { lang, phase, demo } = Astro.props;` and the content line to `<TicketsContent lang={lang} phase={phase} demo={Boolean(demo)} />`.

In `src/pages/billetterie/[...demo].astro`: delete the three imports `loadSessions`, `assertEditionPublishable`, `rexSummary`, delete the block from `// The proof section quotes …` to `const rex = rexSummary(await loadSessions(PROOF_EDITION));`, and change the page line to:

```astro
<TicketsPage
  lang="fr"
  phase={phase ?? TICKETING.currentPhase}
  demo={{ fromConfig: !phase }}
/>
```

Delete the files: `git rm src/components/tickets/EditionProof.astro src/components/tickets/InclusionNote.astro src/lib/tickets/rex.ts`

In `src/components/tickets/Icon.astro`, delete the `external: [ … ],` entry (only the proof section used it).

Remove the keys:

```bash
node .superpowers/drop-i18n-keys.mjs 'tickets.proof.*' 'tickets.inclusion.text' 'tickets.inclusion.cta'
```

Expected: `tickets.proof.*: removed 12`, then `removed 2` twice.

- [ ] **Step 4: Check for stale references**

Run: `grep -rnE "EditionProof|InclusionNote|rexSummary|RexSummary|tickets\.proof|tickets\.inclusion\.(text|cta)|name=\"external\"" src`
Expected: no output.

- [ ] **Step 5: Run the tests and the type check**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets tests/build/i18n-parity.test.ts`
Expected: PASS.

Run: `pnpm astro check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/tickets src/pages/billetterie src/lib/tickets src/i18n/ui.ts src/lib/__tests__/tickets.test.ts
git commit -m "feat(billetterie): drop the proof section and the inclusion footer

Both weighed the page down (22/09/2026 meeting). The FAQ keeps the inclusion
question and its mail, and now carries the bottom clearance the mobile bar
needs. The demo route no longer reads the 2026 sessions.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG"
```

---

### Task 4: No placeholder on the page, a guard on production

**Files:**

- Modify: `src/config/tickets.ts`, `src/lib/tickets/phase.ts`, `src/components/tickets/{TicketsContent,OfferDoor,TierLadder,StrategicOffer,IncludedInTicket,TeamOffer,TicketsFaq,Icon}.astro`, `src/i18n/ui.ts`
- Delete: `src/components/tickets/Tbd.astro`
- Test: `src/components/tickets/__tests__/TicketsPage.test.ts`, create `src/components/tickets/__tests__/TicketsFaq.test.ts`, `src/lib/__tests__/tickets.test.ts`

**Interfaces:**

- Consumes: `shown`, `shippingProblems`, `assertShippable` (Task 1); `placeholdersAllowed` (`demo.ts`).
- Produces:
  - `strategicPrice(config: TicketingConfig, phase: Phase): number | undefined` in `phase.ts`
  - `StrategicOffer` props `{ lang, ticket, price?: number, teamHref? }`
  - `IncludedInTicket` props `{ lang, eveningDetails?: string }`
  - `TeamOffer` props `{ lang, programmeWhen?: string, kitUrl?: string }`
  - `TicketsFaq` props `{ lang, host, email, inclusionMailto, perOrder, programmeWhen?, vatRate?, invoice?, transfer?, termsUrl? }`
  - `OfferDoor` prop `opening: { date: string; time?: string }`, no `namesNote`; `TierLadder` without `namesNote`

- [ ] **Step 1: Write the failing unit tests**

In `src/lib/__tests__/tickets.test.ts`, add `strategicPrice` to the `@/lib/tickets/phase` import, then append inside `describe("drafts", …)`:

```ts
it("lists what still blocks a production build of the committed config", () => {
  expect(shippingProblems(TICKETING).map((p) => p.path)).toEqual([
    "opening.time",
    "tierNames",
    "strategic.name",
    "strategic.networking",
    "contents",
    "eveningIncluded",
    "managerKitUrl",
    "programmeAnnouncement",
    "strategic.price",
  ]);
});
```

and append a new block at the end of the file:

```ts
describe("strategicPrice", () => {
  const withPrice = (
    price: TicketingConfig["strategic"]["price"],
  ): TicketingConfig => ({
    ...TICKETING,
    strategic: { ...TICKETING.strategic, price },
  });

  it("shows nothing while the price is undecided", () => {
    expect(strategicPrice(withPrice(tbd("Prix")), "regular")).toBeUndefined();
  });

  it("shows a fixed price in every phase", () => {
    const fixed = withPrice({ kind: "fixed", amount: 449 });
    expect(strategicPrice(fixed, "pre_opening")).toBe(449);
    expect(strategicPrice(fixed, "last_chance")).toBe(449);
  });

  it("follows the tier on offer when priced per tier — the first one before the opening", () => {
    const perTier = withPrice({
      kind: "per_tier",
      amounts: { seb: 399, eb: 449, regular: 499, last_chance: 549 },
    });
    expect(strategicPrice(perTier, "pre_opening")).toBe(399);
    expect(strategicPrice(perTier, "eb")).toBe(449);
    expect(strategicPrice(perTier, "regular")).toBe(499);
  });
});
```

- [ ] **Step 2: Write the failing container tests**

Create `src/components/tickets/__tests__/TicketsFaq.test.ts`:

```ts
// The FAQ once the ticketing team decides what is still open: a decided value
// must show up — replacing the waiting copy where there is one — and an
// undecided one must leave no label behind.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import TicketsFaq from "../TicketsFaq.astro";

const base = {
  lang: "fr" as const,
  host: "billetterie.cloudnativedays.fr",
  email: "billetterie@cloudnativedays.fr",
  inclusionMailto: "mailto:billetterie@cloudnativedays.fr",
  perOrder: { early: 5, later: 20 },
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: Record<string, unknown>) =>
  container.renderToString(TicketsFaq, { props: { ...base, ...props } });

describe("TicketsFaq", () => {
  it("leaves an undecided answer out, or on its waiting copy", async () => {
    const html = await render({});
    expect(html).not.toContain("Taux de TVA");
    expect(html).not.toContain("Conditions générales de vente");
    expect(html).toContain("Nous le vérifions avec notre billetterie");
    expect(html).toContain("en cours de validation");
    expect(html).not.toContain("Quand le programme sera-t-il publié");
  });

  it("states a decided answer, in place of the waiting copy", async () => {
    const html = await render({
      vatRate: "10 %",
      invoice: "Oui, la facture est émise au nom de votre société.",
      transfer: "Le changement de nom est gratuit.",
      termsUrl: "https://cloudnativedays.fr/cgv",
      programmeWhen: "en mars 2027",
    });
    expect(html).toContain("Taux de TVA : 10 %.");
    expect(html).toContain(
      "Oui, la facture est émise au nom de votre société.",
    );
    expect(html).not.toContain("Nous le vérifions");
    expect(html).toContain("Le changement de nom est gratuit.");
    expect(html).not.toContain("en cours de validation");
    expect(html).toMatch(
      /<a\b[^>]*href="https:\/\/cloudnativedays\.fr\/cgv"[^>]*>\s*Conditions générales de vente/,
    );
    expect(html).toContain("Le programme 2027 sera publié en mars 2027.");
  });
});
```

In `src/components/tickets/__tests__/TicketsPage.test.ts`:

1. Delete the `withoutPlaceholders` and `endOfElement` functions (and their doc comments).
2. Replace the two tests `"marks every placeholder as such"` and `"still reads as finished copy once the placeholders are hidden"` with:

```ts
it("renders no placeholder: a draft reads as copy, an undecided line is absent", () => {
  expect(main).not.toContain("data-tbd");
  expect(main).not.toContain("tbd-chip");
  expect(text).not.toMatch(/à confirmer/i);
  // Undecided with no draft: the whole line is gone, its label included.
  for (const absent of [
    "Taux de TVA",
    "Conditions générales de vente",
    "Le détail de la soirée",
  ]) {
    expect(text).not.toContain(absent);
  }
  // No label left pointing at nothing.
  expect(main).not.toMatch(/<(dd|dt)\b[^>]*>\s*<\/\1>/);
  // Drafts show as the copy they will become (Astro escapes `&` and `'`).
  expect(main).toMatch(/Stratégie (&amp;|&) Leadership/);
  expect(text).toContain("en mars 2027");
  expect(text).toContain("soirée comprise");
  // What is left is still the page, not a shell.
  expect(text).toContain("Je prends ma place");
  expect(text).toContain("Ce que comprend votre billet");
  expect(text).toContain("Questions fréquentes");
});

it("keeps the manager kit box, linked to its draft URL", () => {
  expect(text).toContain("Un kit pour convaincre votre manager");
  expect(main).toMatch(
    /<a\b[^>]*href="#convaincre"[^>]*data-umami-event="tickets-manager-kit"/,
  );
});

it("lists only the Strategy & Leadership facts that have a value", () => {
  const start = main.indexOf('id="strategie-leadership"');
  const band = main.slice(start, main.indexOf("</section>", start));
  const terms = [...band.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/g)].map(
    (m) => m[1],
  );
  // Only the networking area has a draft today; price, contents, programme
  // and access have no row until they are decided.
  expect(terms).toHaveLength(1);
  expect(terms[0]).toMatch(/Espace d(&#39;|')échange/);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets`
Expected: FAIL — `strategicPrice` is not exported, the committed config's blocking list differs (flags are not drafts yet), chips are still rendered, the FAQ props are not read.

- [ ] **Step 4: The config — flags become drafts, the kit gets a dummy URL**

In `src/config/tickets.ts`:

1. In the file header, replace the paragraph starting ` * **Unknowns are \`tbd()\`, never a plausible guess.\*\*` with:
   ```ts
    * **Unknowns are `tbd()`, never a plausible guess.** A `tbd` renders nothing
    * of its own: the page shows its draft when it has one — as the copy it will
    * become — and leaves its line out when it has none. A production-origin
    * build refuses the page while a draft is left (`assertShippable` in
    * `src/lib/tickets/drafts.ts`). `grep -n "tbd(" src/config/tickets.ts` lists
    * everything still open.
    */
   ```
2. Replace the `Tbd` interface doc comment with `/** A value the organising team has not decided yet. \`draft\` is what the page shows until then — on staging only. \*/`.
3. In `TicketingConfig`, replace the three doc comments:
   - above `tierNames`: `/** Public tier names are still the working names of the pricing sheet: \`true\` once final. \*/`
   - above `contents`: `/** The contents list on the page, pending the evening team: \`true\` once confirmed. \*/`
   - above `eveningIncluded`: `/** "Soirée comprise" on the page — to confirm with the evening team: \`true\` once confirmed. \*/`
4. Change the values:
   ```ts
     tierNames: tbd("Noms publics des paliers en français et en anglais", true),
   ```
   ```ts
     contents: tbd("Contenu exact du billet standard", true),
     eveningIncluded: tbd("Soirée ouverte à tous les participants, sans option (pôle soirée)", true),
   ```
   ```ts
     managerKitUrl: tbd("Kit « convaincre son manager » (planifié) — URL bidon en attendant", "#convaincre"),
   ```

- [ ] **Step 5: `strategicPrice`**

In `src/lib/tickets/phase.ts`, add `import { shown } from "./drafts";` under the type import, and append:

```ts
/**
 * The Strategy & Leadership price to show in `phase`: a fixed amount, or the
 * amount of the tier on offer (the first one before the opening). Undefined
 * while the price is undecided — its row is then not rendered.
 */
export function strategicPrice(
  config: TicketingConfig,
  phase: Phase,
): number | undefined {
  const price = shown(config.strategic.price);
  if (price === undefined) return undefined;
  return price.kind === "fixed"
    ? price.amount
    : price.amounts[offerTier(config, phase).id];
}
```

- [ ] **Step 6: The components read values through `shown()`**

Replace the whole of `src/components/tickets/StrategicOffer.astro` with:

```astro
---
/**
 * The Strategy & Leadership ticket: another product, not a fifth tier. It sits
 * under the three doors in its own material (the deep brand purple) so
 * decision-makers find it without it outshining the standard ticket.
 *
 * Always displayed and always on sale: its action is the page's own — the
 * alf.io listing, or the newsletter before the opening — passed in the
 * `purchase` slot. Its quota is never shown, like every other.
 */
import type { StrategicTicket } from "@/config/tickets";
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { shown } from "@/lib/tickets/drafts";
import { formatPrice } from "@/lib/tickets/format";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  ticket: StrategicTicket;
  /** Euros, VAT included, in the phase on screen (`strategicPrice`); undefined while undecided. */
  price?: number;
  /** Door 2's anchor, set only while a group rate applies — there is nowhere
   *  else on the page to send a reader looking for one. */
  teamHref?: string;
}

const { lang, ticket, price, teamHref } = Astro.props;
const t = useTranslations(lang);

const name = shown(ticket.name)?.[lang] ?? "";

// A fact with no value yet has no row: never a label pointing at nothing.
const facts = [
  {
    label: t("tickets.strategic.fact.price"),
    value: price === undefined ? undefined : formatPrice(price, lang),
  },
  {
    label: t("tickets.strategic.fact.includes"),
    value: shown(ticket.includesStandard)?.[lang],
  },
  {
    label: t("tickets.strategic.fact.programme"),
    value: shown(ticket.programme)?.[lang],
  },
  {
    label: t("tickets.strategic.fact.networking"),
    value: shown(ticket.networking)?.[lang],
  },
  {
    label: t("tickets.strategic.fact.access"),
    value: shown(ticket.accessConditions)?.[lang],
  },
].filter(
  (fact): fact is { label: string; value: string } => fact.value !== undefined,
);

const topics = [1, 2, 3, 4, 5, 6].map((n) =>
  t(`tickets.strategic.topic.${n}` as Parameters<typeof t>[0]),
);
---

<section
  id="strategie-leadership"
  class="strategic bg-chart-5 text-primary-foreground dark:bg-secondary dark:ring-accent/30 relative overflow-hidden rounded-xl dark:ring-1"
  aria-labelledby="strategic-title"
>
  <div
    class="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14"
  >
    <div class="flex flex-col gap-5">
      <h2
        id="strategic-title"
        class="text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl"
      >
        {name}
      </h2>
      <p class="max-w-[60ch] text-lg text-pretty">
        {t("tickets.strategic.lead")}
      </p>
      <p class="text-chart-4 max-w-[60ch] text-base text-pretty">
        {t("tickets.strategic.body")}
      </p>
      <div class="flex flex-col gap-3">
        <p class="text-chart-4 text-sm font-medium">
          {t("tickets.strategic.topics")}
        </p>
        <ul class="flex flex-wrap gap-2">
          {
            topics.map((topic) => (
              <li class="border-primary-foreground/25 rounded-full border px-3 py-1 text-sm font-medium">
                {topic}
              </li>
            ))
          }
        </ul>
      </div>
      <p class="text-accent text-base font-medium">
        {t("tickets.strategic.no_pitch")}
      </p>
    </div>

    <div class="flex flex-col gap-6">
      {
        facts.length > 0 && (
          <dl class="divide-primary-foreground/15 border-primary-foreground/15 divide-y border-y">
            {facts.map((fact) => (
              <div class="flex flex-col gap-1 py-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
                <dt class="text-chart-4 text-sm">{fact.label}</dt>
                <dd class="text-base font-semibold tabular-nums sm:text-right">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )
      }

      <div class="strategic-purchase">
        <slot name="purchase" />
      </div>

      {
        teamHref && (
          <a
            href={teamHref}
            class="text-primary-foreground inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("tickets.strategic.team")}
            <Icon name="arrow-right" size={14} />
          </a>
        )
      }
    </div>
  </div>
</section>

<style>
  /* The shared purchase control is drawn for light cards; on the purple band
     its note takes the band's own ink. */
  .strategic-purchase :global(.text-muted-foreground) {
    color: var(--color-chart-4);
  }
</style>
```

Replace the whole of `src/components/tickets/IncludedInTicket.astro` with:

```astro
---
/**
 * What the standard ticket includes. A plain checklist, not a grid of feature
 * cards; the evening — new in 2027 and the launch's main argument — gets the
 * one distinct block, and what it holds once the evening team has decided it.
 */
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  /** What the evening holds; left out until decided. */
  eveningDetails?: string;
}

const { lang, eveningDetails } = Astro.props;
const t = useTranslations(lang);
const items = [
  t("tickets.included.talks"),
  t("tickets.included.village"),
  t("tickets.included.meals"),
  t("tickets.included.goodies"),
];
---

<section
  class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-16"
  aria-labelledby="included-title"
>
  <div class="flex flex-col gap-6">
    <h2
      id="included-title"
      class="text-foreground text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl"
    >
      {t("tickets.included.title")}
    </h2>
    <ul class="flex flex-col gap-3">
      {
        items.map((item) => (
          <li class="text-foreground flex items-start gap-3 text-lg">
            <span class="bg-primary/10 text-primary-strong mt-1 grid size-6 shrink-0 place-items-center rounded-full">
              <Icon name="check" size={14} stroke={2} />
            </span>
            <span class="text-pretty">{item}</span>
          </li>
        ))
      }
    </ul>
  </div>

  <div
    class="border-accent/50 bg-accent/10 dark:bg-accent/8 relative flex flex-col gap-4 rounded-xl border p-6 sm:p-8"
  >
    <span
      class="bg-accent text-accent-foreground grid size-11 place-items-center rounded-full"
    >
      <Icon name="moon" size={22} />
    </span>
    <h3
      class="text-foreground text-2xl font-semibold tracking-[-0.01em] text-balance"
    >
      {t("tickets.included.evening.title")}
    </h3>
    <p class="text-foreground text-lg text-pretty">
      {t("tickets.included.evening.body")}
    </p>
    {
      eveningDetails && (
        <p class="text-muted-foreground text-base text-pretty">
          {eveningDetails}
        </p>
      )
    }
  </div>
</section>
```

Replace the whole of `src/components/tickets/TeamOffer.astro` with:

```astro
---
/**
 * "Convaincre votre manager": the argument kit, down the page, in every phase.
 *
 * The group rates live in door 2 and nowhere else (22/09/2026): what the page
 * still owes a manager is not a second price list but something to forward —
 * when the programme lands, the 2026 replays, and the kit itself.
 *
 * The person who decides is often not the one who attends, decides on the
 * programme and the purchase process rather than on the price, and has their
 * own manager to convince.
 */
import type { Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { fill } from "@/lib/tickets/format";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  /** When the programme is announced; the sentence is left out while undecided. */
  programmeWhen?: string;
  /** The kit's link. The box stays either way; the link appears once there is one. */
  kitUrl?: string;
}

const { lang, programmeWhen, kitUrl } = Astro.props;
const t = useTranslations(lang);
---

<section
  id="convaincre"
  class="flex max-w-3xl flex-col gap-5"
  aria-labelledby="team-title"
>
  <h2
    id="team-title"
    class="text-foreground text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl"
  >
    {t("tickets.team.convince.title")}
  </h2>
  <p class="text-foreground max-w-[46ch] text-lg text-pretty">
    {t("tickets.team.convince.lead")}
  </p>
  {
    programmeWhen && (
      <p class="text-muted-foreground max-w-[52ch] text-base text-pretty">
        {fill(t("tickets.team.programme"), { when: programmeWhen })}
      </p>
    )
  }

  <div
    class="border-input mt-2 flex flex-col items-start gap-2 rounded-lg border border-dashed p-5"
  >
    <p class="text-foreground text-base font-semibold">
      {t("tickets.team.kit.title")}
    </p>
    <p class="text-muted-foreground text-sm text-pretty">
      {t("tickets.team.kit.body")}
    </p>
    {
      kitUrl && (
        <a
          href={kitUrl}
          class="text-primary-strong inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          data-umami-event="tickets-manager-kit"
        >
          {t("tickets.team.kit.cta")}
          <Icon name="arrow-right" size={14} />
        </a>
      )
    }
  </div>
</section>
```

In `src/components/tickets/TicketsFaq.astro`, replace the frontmatter (everything between the two `---`) with:

```astro
---
/**
 * Reassurance and FAQ, as native <details>: keyboard and screen readers get
 * disclosure for free, and the page works without JavaScript. An answer the
 * ticketing team has not decided keeps its waiting copy or is left out; the
 * config's answer replaces it once decided.
 */
import type { Locale } from "@/i18n/ui";
import { useTranslations, getLocalePath } from "@/i18n/utils";
import { fill } from "@/lib/tickets/format";
import Icon from "./Icon.astro";

interface Props {
  lang: Locale;
  host: string;
  email: string;
  inclusionMailto: string;
  perOrder: { early: number; later: number };
  /** When the programme is announced; its question is left out while undecided. */
  programmeWhen?: string;
  vatRate?: string;
  /** Decided answers; the waiting copy stands in until then. */
  invoice?: string;
  transfer?: string;
  termsUrl?: string;
}

const {
  lang,
  host,
  email,
  inclusionMailto,
  perOrder,
  programmeWhen,
  vatRate,
  invoice,
  transfer,
  termsUrl,
} = Astro.props;
const t = useTranslations(lang);
const practicalPath = `${getLocalePath(lang, "/informations-utiles")}#accessibilite`;
const cocPath = getLocalePath(lang, "/code-of-conduct");
const link =
  "font-medium text-primary-strong underline underline-offset-4 decoration-primary-strong/40 hover:decoration-primary-strong";
---
```

and in its markup make four replacements:

(a) VAT —

```astro
<p>
  {t("tickets.faq.ttc.a")}
  {
    notes.vat && (
      <span class="ml-1 inline-flex items-center gap-2" data-tbd-only>
        {t("tickets.faq.ttc.rate")} <Tbd note={notes.vat} lang={lang} />
      </span>
    )
  }
</p>
```

becomes

```astro
<p>
  {t("tickets.faq.ttc.a")}
  {vatRate && ` ${fill(t("tickets.faq.ttc.rate"), { rate: vatRate })}`}
</p>
```

(b) Invoice —

```astro
<p>
  {fill(t("tickets.faq.invoice.a"), { email })}
  {notes.invoice && <Tbd note={notes.invoice} lang={lang} class="ml-1" />}
</p>
```

becomes

```astro
<p>{fill(invoice ?? t("tickets.faq.invoice.a"), { email })}</p>
```

(c) Cancellation and terms —

```astro
<p>
  {t("tickets.faq.transfer.a")}
  {notes.transfer && <Tbd note={notes.transfer} lang={lang} class="ml-1" />}
</p>
<p
  class="flex flex-wrap items-center gap-2"
  data-tbd-only={notes.terms ? true : undefined}
>
  {t("tickets.faq.transfer.terms")}
  {notes.terms && <Tbd note={notes.terms} lang={lang} />}
</p>
```

becomes

```astro
<p>{transfer ?? t("tickets.faq.transfer.a")}</p>
{
  termsUrl && (
    <p>
      <a href={termsUrl} class={link}>
        {t("tickets.faq.transfer.terms")}
      </a>
    </p>
  )
}
```

(d) Programme —

```astro
<details class="faq group">
  <summary
    >{t("tickets.faq.programme.q")}<Icon
      name="plus"
      size={18}
      class="faq-icon"
    /></summary
  >
  <p>
    {fill(t("tickets.faq.programme.a"), { when: programmeWhen })}
    {notes.programme && <Tbd note={notes.programme} lang={lang} class="ml-1" />}
  </p>
</details>
```

becomes

```astro
{
  programmeWhen && (
    <details class="faq group">
      <summary>
        {t("tickets.faq.programme.q")}
        <Icon name="plus" size={18} class="faq-icon" />
      </summary>
      <p>{fill(t("tickets.faq.programme.a"), { when: programmeWhen })}</p>
    </details>
  )
}
```

In `src/components/tickets/OfferDoor.astro`:

1. Delete `import Tbd from "./Tbd.astro";`.
2. In `Props`, replace the `opening` line and its comment with:
   ```ts
     /** Opening day and, once decided, time — shown before the ticketing opens. */
     opening: { date: string; time?: string };
   ```
   and delete `  namesNote?: string;`.
3. Destructure `const { lang, phase, tier, ladder, opening } = Astro.props;`.
4. Replace
   ```astro
   <p class="text-foreground text-lg font-semibold text-pretty">
     {
       fill(t("tickets.offer.opens"), {
         date: formatDayMonth(opening.date, lang),
         time: opening.time,
       })
     }
     {
       opening.timeNote && (
         <Tbd note={opening.timeNote} lang={lang} class="ml-1.5" />
       )
     }
   </p>
   ```
   with
   ```astro
   <p class="text-foreground text-lg font-semibold text-pretty">
     {
       opening.time
         ? fill(t("tickets.offer.opens"), {
             date: formatDayMonth(opening.date, lang),
             time: opening.time,
           })
         : fill(t("tickets.offer.opens_day"), {
             date: formatDayMonth(opening.date, lang),
           })
     }
   </p>
   ```
5. Replace `<TierLadder items={ladder} phase={phase} lang={lang} namesNote={namesNote} />` with `<TierLadder items={ladder} phase={phase} lang={lang} />`.

In `src/components/tickets/TierLadder.astro`:

1. Delete `import Tbd from "./Tbd.astro";`.
2. In `Props`, delete `  /** Set while the public tier names are still working names. */` and `  namesNote?: string;`; destructure `const { items, phase, lang } = Astro.props;`.
3. Replace
   ```astro
   <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
     <h3 class="text-foreground text-lg font-semibold tracking-[-0.01em]">
       {t("tickets.ladder.title")}
     </h3>
     {
       namesNote && (
         <Tbd
           note={namesNote}
           label={t("tickets.ladder.names_tbd")}
           lang={lang}
         />
       )
     }
   </div>
   ```
   with
   ```astro
   <h3 class="text-foreground text-lg font-semibold tracking-[-0.01em]">
     {t("tickets.ladder.title")}
   </h3>
   ```

In `src/components/tickets/Icon.astro`, delete the `pencil: [ … ],` entry (three lines).

Delete the chip: `git rm src/components/tickets/Tbd.astro`

- [ ] **Step 7: The page wires `shown()` and the guard**

Replace the whole of `src/components/tickets/TicketsContent.astro` with:

```astro
---
/**
 * The ticketing page's content, composed around the three ways people arrive —
 * take my seat, come as a team, I have a code — weighted by importance.
 * `TicketsPage` wraps it in the layout; kept apart so the demo matrix test can
 * render every phase without a site origin.
 *
 * Everything is derived from `src/config/tickets.ts` and the phase, so the demo
 * routes and a future production route render the same page. Every purchase —
 * door 1, the Strategy & Leadership band, the mobile bar — goes to the alf.io
 * listing through one `purchaseTarget`. An undecided value shows its draft or
 * nothing (`shown`), and a production-origin build refuses the page while a
 * draft is left (`assertShippable`).
 */
import GeoBackground from "@/components/patterns/GeoBackground.astro";
import { TICKETING, type Phase } from "@/config/tickets";
import { useTranslations } from "@/i18n/utils";
import type { Locale } from "@/i18n/ui";
import { CONTACT_EMAILS, TARGET_DATE } from "@/lib/event";
import { buildMailto } from "@/lib/tickets/mailto";
import { placeholdersAllowed } from "@/lib/tickets/demo";
import { assertShippable, shown } from "@/lib/tickets/drafts";
import {
  fill,
  formatDayMonth,
  formatFullDate,
  formatPrice,
  formatTime,
} from "@/lib/tickets/format";
import {
  assertTicketingConfig,
  cheaperGroupRates,
  offerTier,
  strategicPrice,
  tierStates,
} from "@/lib/tickets/phase";
import {
  alfioHost,
  codeFallbackAction,
  listingUrl,
  purchaseTarget,
} from "@/lib/tickets/purchase";
import OfferDoor from "./OfferDoor.astro";
import TeamDoor from "./TeamDoor.astro";
import CodeDoor from "./CodeDoor.astro";
import PurchaseControl from "./PurchaseControl.astro";
import StrategicOffer from "./StrategicOffer.astro";
import IncludedInTicket from "./IncludedInTicket.astro";
import TeamOffer from "./TeamOffer.astro";
import TicketsFaq from "./TicketsFaq.astro";
import StickyTicketBar from "./StickyTicketBar.astro";

interface Props {
  lang: Locale;
  phase: Phase;
  /** Demo routes stripe the mobile bar so no capture passes for the real page. */
  demo?: boolean;
}

const { lang, phase, demo } = Astro.props;
const t = useTranslations(lang);
const config = TICKETING;
assertTicketingConfig(config);
// A draft is for staging eyes only: a production-origin build refuses the page
// while one is left in the config, and names them all.
if (!placeholdersAllowed()) assertShippable(config);

const tier = offerTier(config, phase);
const ladder = tierStates(config, phase);
const rates = cheaperGroupRates(config, tier);
const host = alfioHost(config);
const email = CONTACT_EMAILS.tickets;

const groupMailto = buildMailto(
  email,
  t("tickets.team.mail.subject"),
  t("tickets.team.mail.body"),
);
const inclusionMailto = buildMailto(
  email,
  t("tickets.inclusion.mail.subject"),
  t("tickets.inclusion.mail.body"),
);

// One action for the whole page: the alf.io listing, or before the opening the
// newsletter. Door 1, the Strategy & Leadership band and the mobile bar share it.
const target = purchaseTarget(config, phase);

// Door 2 is rendered only when a group rate actually beats the price of the
// moment and fits the tier's order cap; below that it had nothing to sell.
// Everything else about the first viewport follows from it.
const showTeam = rates.length > 0;
const showCode = phase !== "pre_opening";
const wideOffer = !showTeam;

const openingTime = shown(config.opening.time);
const opening = {
  date: config.opening.date,
  time: openingTime === undefined ? undefined : formatTime(openingTime, lang),
};
const programmeWhen = shown(config.programmeAnnouncement)?.[lang];

const eventDate = formatFullDate(TARGET_DATE, lang);
// Split around {venue} so the venue can be set unbreakable: "CENTQUATRE-PARIS"
// must never break at its hyphen on a narrow screen.
const [whenBefore, whenAfter = ""] = t("tickets.when").split("{venue}");
const when = {
  before: fill(whenBefore, {
    date: eventDate.charAt(0).toUpperCase() + eventDate.slice(1),
  }),
  venue: t("hero.venue"),
  after: whenAfter,
};

const sticky = {
  label:
    phase === "pre_opening"
      ? fill(t("tickets.sticky.opens"), {
          date: formatDayMonth(config.opening.date, lang),
        })
      : tier.name[lang],
  price: formatPrice(tier.price, lang),
  action:
    target.kind === "listing"
      ? { href: target.href, text: t("tickets.sticky.buy"), external: false }
      : { href: target.href, text: t("tickets.sticky.notify"), external: true },
  analytics: {
    "data-umami-event-billet": "standard",
    "data-umami-event-palier": tier.id,
    "data-umami-event-phase": phase,
  },
};

const early = config.tiers
  .filter((x) => x.closesWhenSoldOut)
  .map((x) => x.maxPerOrder);
const later = config.tiers
  .filter((x) => !x.closesWhenSoldOut)
  .map((x) => x.maxPerOrder);
const perOrder = { early: Math.max(...early), later: Math.max(...later) };
---

<main class="tickets-page" data-phase={phase}>
  <section class="relative isolate overflow-hidden">
    <GeoBackground class="tickets-mesh absolute inset-0 -z-10" />
    <div
      class="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-8 pb-16 md:px-6 md:pt-12 md:pb-20 lg:px-8"
    >
      <header class="flex max-w-4xl flex-col gap-3">
        <h1
          class="text-foreground text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance sm:text-5xl"
        >
          {t("tickets.h1")}
        </h1>
        <p class="text-foreground text-lg font-semibold text-pretty sm:text-xl">
          {when.before}<span class="whitespace-nowrap">{when.venue}</span>{
            when.after
          }, {t("tickets.when_evening")}
        </p>
        <p
          class="text-muted-foreground max-w-[58ch] text-base text-pretty sm:text-lg"
        >
          {t("tickets.lead")}
        </p>
      </header>

      {
        /* Door 1 spans the grid whenever door 2 has nothing to sell: a lone short
          card beside it would leave the right column hollow. "J'ai un code"
          then becomes a slim band underneath rather than that lone card. */
      }
      <div class="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {
          /* `flex flex-col` so door 1 inherits the row height the right column
            sets, rather than sitting short inside a stretched wrapper. */
        }
        <div
          class:list={[
            "flex flex-col",
            wideOffer ? "lg:col-span-12" : "lg:col-span-8",
          ]}
        >
          <OfferDoor
            lang={lang}
            phase={phase}
            tier={tier}
            ladder={ladder}
            opening={opening}
          >
            <PurchaseControl
              slot="purchase"
              target={target}
              lang={lang}
              phase={phase}
              analytics={{ billet: "standard", palier: tier.id }}
            />
          </OfferDoor>
        </div>
        {
          showTeam && (
            <div class="flex flex-col gap-5 lg:col-span-4 lg:gap-6">
              <TeamDoor
                lang={lang}
                tier={tier}
                rates={rates}
                groupMailto={groupMailto}
              />
              <CodeDoor
                lang={lang}
                phase={phase}
                listingUrl={listingUrl(config)}
                fallback={codeFallbackAction(config)}
                host={host}
                layout="card"
              />
            </div>
          )
        }
        {
          showCode && !showTeam && (
            <div class="lg:col-span-12">
              <CodeDoor
                lang={lang}
                phase={phase}
                listingUrl={listingUrl(config)}
                fallback={codeFallbackAction(config)}
                host={host}
                layout="band"
              />
            </div>
          )
        }
      </div>
    </div>
  </section>

  {/* Always displayed, always on sale: the same action as door 1. */}
  <div class="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
    <StrategicOffer
      lang={lang}
      ticket={config.strategic}
      price={strategicPrice(config, phase)}
      teamHref={showTeam ? "#equipe" : undefined}
    >
      <PurchaseControl
        slot="purchase"
        target={target}
        lang={lang}
        phase={phase}
        analytics={{ billet: "strategique", palier: "strategique" }}
      />
    </StrategicOffer>
  </div>

  <div
    class="mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-28 md:pb-24 lg:px-8"
  >
    <IncludedInTicket
      lang={lang}
      eveningDetails={shown(config.eveningDetails)?.[lang]}
    />
  </div>

  <div class="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-24 lg:px-8">
    <TeamOffer
      lang={lang}
      programmeWhen={programmeWhen}
      kitUrl={shown(config.managerKitUrl)}
    />
  </div>

  <div class="mx-auto max-w-7xl px-4 pb-28 md:px-6 md:pb-24 lg:px-8">
    <TicketsFaq
      lang={lang}
      host={host}
      email={email}
      inclusionMailto={inclusionMailto}
      perOrder={perOrder}
      programmeWhen={programmeWhen}
      vatRate={shown(config.vatRate)}
      invoice={shown(config.invoice)?.[lang]}
      transfer={shown(config.transferAndRefund)?.[lang]}
      termsUrl={shown(config.termsUrl)}
    />
  </div>
</main>

<StickyTicketBar
  lang={lang}
  label={sticky.label}
  price={sticky.price}
  action={sticky.action}
  analytics={sticky.analytics}
  demo={Boolean(demo)}
/>

<style>
  .tickets-page :global(::selection) {
    background: color-mix(in oklab, var(--color-primary) 28%, transparent);
    color: var(--color-foreground);
  }
  .tickets-page :global(.tickets-mesh) {
    mask-image: linear-gradient(
      to bottom,
      black 0%,
      black 35%,
      transparent 85%
    );
    opacity: 0.9;
  }

  /* One authored entrance: the three doors settle in sequence, once, from an
     already-visible default (reduced motion keeps them still, global.css). */
  @media (prefers-reduced-motion: no-preference) {
    .tickets-page :global(.door) {
      animation: door-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--door-index, 0) * 90ms + 60ms);
    }
  }
  @keyframes door-in {
    from {
      opacity: 0;
      translate: 0 14px;
      filter: blur(3px);
    }
  }
</style>
```

- [ ] **Step 8: i18n**

Remove the keys the chips used:

```bash
node .superpowers/drop-i18n-keys.mjs 'tickets.tbd' 'tickets.ladder.names_note' 'tickets.ladder.names_tbd' 'tickets.included.evening.details'
```

Expected: `removed 2` four times.

In `src/i18n/ui.ts` (French block):

- replace `    "tickets.faq.ttc.rate": "Taux de TVA",` with `    "tickets.faq.ttc.rate": "Taux de TVA : {rate}.",`
- after the line `    "tickets.offer.opens": "La billetterie ouvre le {date} à {time}.",` add `    "tickets.offer.opens_day": "La billetterie ouvre le {date}.",`

In `src/i18n/ui.ts` (English block):

- replace `    "tickets.faq.ttc.rate": "VAT rate",` with `    "tickets.faq.ttc.rate": "VAT rate: {rate}.",`
- after the line `    "tickets.offer.opens": "Ticketing opens on {date} at {time}.",` add `    "tickets.offer.opens_day": "Ticketing opens on {date}.",`

- [ ] **Step 9: Check for stale references**

Run: `grep -rnE "Tbd\.astro|<Tbd|isTbd|data-tbd|tbd-chip|namesNote|timeNote|programmeNote|kitNote|contentsNote|eveningNote|\bnotes\.|name=\"pencil\"" src/components/tickets src/pages/billetterie`
Expected: no output.

- [ ] **Step 10: Run the tests and the type check**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets tests/build/i18n-parity.test.ts`
Expected: PASS.

Run: `pnpm astro check`
Expected: `0 errors`.

- [ ] **Step 11: Commit**

```bash
git add -A src/config/tickets.ts src/lib/tickets src/components/tickets src/i18n/ui.ts src/lib/__tests__/tickets.test.ts
git commit -m "feat(billetterie): no placeholder on the page, a guard on production

The \"À confirmer\" chips go (22/09/2026 meeting): the page must read as it
will ship. tbd() stays in the config as an invisible marker — a draft shows as
its copy, an undecided line without one is left out — and a production-origin
build refuses the page while a draft is left or the S&L price is undecided.
The copy flags (evening included, contents, tier names) become drafts so the
guard sees them; the manager kit keeps its box with a dummy link.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG"
```

---

### Task 5: Every hand-off to alf.io in a new tab

**Files:**

- Modify: `src/lib/tickets/purchase.ts`, `src/lib/tickets/url.ts`, `src/components/tickets/{PurchaseControl,StickyTicketBar,CodeDoor,TicketsFaq,TicketsContent}.astro`, `src/components/tickets/tickets-ui.ts`, `src/i18n/ui.ts`
- Test: `src/lib/__tests__/tickets.test.ts`, `src/components/tickets/__tests__/TicketsPage.test.ts`, `src/components/tickets/__tests__/TicketsFaq.test.ts`

**Interfaces:**

- Consumes: Task 2's `purchaseTarget`, Task 4's `TicketsFaq` props.
- Produces:
  - `PurchaseTarget = { kind: "listing"; href: string; rel: "noopener" } | { kind: "notify"; href: string; rel: "noopener noreferrer" }`
  - `onHost(href: string, host: string): boolean` in `purchase.ts`
  - `interface TabOpener { open(url: string, target: string): { opener: unknown } | null; location: { assign(url: string): void } }` and `openInNewTab(url: string, win: TabOpener): void` in `url.ts`
  - `StickyTicketBar` prop `action: { href: string; text: string; rel: string }`

- [ ] **Step 1: Write the failing unit tests**

In `src/lib/__tests__/tickets.test.ts`, change the purchase import to `import { alfioHost, codeFallbackAction, codeUrl, listingUrl, onHost, purchaseTarget } from "@/lib/tickets/purchase";`, add `import { openInNewTab } from "@/lib/tickets/url";`, and in `describe("purchaseTarget", …)` replace the two expectations:

```ts
expect(purchaseTarget(TICKETING, id)).toEqual({
  kind: "listing",
  href: "https://billetterie.cloudnativedays.fr/event/cnd-2027",
  rel: "noopener",
});
```

```ts
expect(purchaseTarget(TICKETING, "pre_opening")).toEqual({
  kind: "notify",
  href: NEWSLETTER_URL,
  rel: "noopener noreferrer",
});
```

Append at the end of the file:

```ts
describe("onHost", () => {
  it("recognises a URL on the alf.io host, and nothing else", () => {
    expect(
      onHost(
        "https://billetterie.cloudnativedays.fr/terms",
        "billetterie.cloudnativedays.fr",
      ),
    ).toBe(true);
    expect(
      onHost(
        "https://cloudnativedays.fr/cgv",
        "billetterie.cloudnativedays.fr",
      ),
    ).toBe(false);
    expect(onHost("#convaincre", "billetterie.cloudnativedays.fr")).toBe(false);
  });
});

describe("openInNewTab", () => {
  it("opens the URL in a new tab, cut from this page", () => {
    const tab: { opener: unknown } = { opener: "this page" };
    const opened: string[] = [];
    const assigned: string[] = [];
    openInNewTab("https://x.test/code/A", {
      open: (url, target) => {
        opened.push(`${target} ${url}`);
        return tab;
      },
      location: { assign: (url) => void assigned.push(url) },
    });
    expect(opened).toEqual(["_blank https://x.test/code/A"]);
    expect(tab.opener).toBeNull();
    expect(assigned).toEqual([]);
  });

  it("goes there in this tab when the browser blocks the new one", () => {
    const assigned: string[] = [];
    openInNewTab("https://x.test/code/A", {
      open: () => null,
      location: { assign: (url) => void assigned.push(url) },
    });
    expect(assigned).toEqual(["https://x.test/code/A"]);
  });
});
```

- [ ] **Step 2: Write the failing container tests**

In `src/components/tickets/__tests__/TicketsPage.test.ts`, add inside `describe.each`:

```ts
it("opens every hand-off to alf.io in a new tab, and says so to screen readers", () => {
  const alfioLinks = [
    ...main.matchAll(
      /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr[^"]*"[^>]*>[\s\S]*?<\/a>/g,
    ),
  ].map((m) => m[0]);
  expect(alfioLinks).toHaveLength(phase === "pre_opening" ? 0 : 2);
  for (const link of alfioLinks) {
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener"');
  }
  // Every link that leaves in a new tab says so, the newsletter included.
  const newTab = [
    ...main.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g),
  ].map((m) => m[0]);
  expect(newTab.length).toBeGreaterThan(0);
  for (const link of newTab) expect(link).toContain("(nouvel onglet)");
  // The code form too, with or without JavaScript.
  const codeForm = main.match(/<form\b[^>]*data-tickets-code[^>]*>/)?.[0];
  if (phase === "pre_opening") {
    expect(codeForm).toBeUndefined();
  } else {
    expect(codeForm).toContain('target="_blank"');
    const form = main.slice(
      main.indexOf(codeForm!),
      main.indexOf("</form>", main.indexOf(codeForm!)),
    );
    expect(form).toContain("(nouvel onglet)");
  }
  // And the mobile bar, rendered after <main>.
  const sticky = html.match(
    /<a\b[^>]*data-sticky-action[^>]*>[\s\S]*?<\/a>/,
  )?.[0];
  expect(sticky).toContain('target="_blank"');
  expect(sticky).toContain("(nouvel onglet)");
});
```

In `src/components/tickets/__tests__/TicketsFaq.test.ts`, add inside `describe("TicketsFaq", …)`:

```ts
it("opens the terms of sale in a new tab when they live on alf.io", async () => {
  const onAlfio = await render({
    termsUrl: "https://billetterie.cloudnativedays.fr/terms",
  });
  expect(onAlfio).toMatch(
    /<a\b[^>]*href="https:\/\/billetterie\.cloudnativedays\.fr\/terms"[^>]*target="_blank"[^>]*rel="noopener"/,
  );
  expect(onAlfio).toContain("(nouvel onglet)");
  const onSite = await render({ termsUrl: "https://cloudnativedays.fr/cgv" });
  expect(onSite).not.toContain('target="_blank"');
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets`
Expected: FAIL — no `rel` on targets, `onHost` / `openInNewTab` not exported, no `target="_blank"` on the listing links.

- [ ] **Step 4: The purchase layer carries how a target opens**

In `src/lib/tickets/purchase.ts`, replace

```ts
export type PurchaseTarget =
  | { kind: "listing"; href: string }
  | { kind: "notify"; href: string };
```

with

```ts
/**
 * Where a purchase action sends the buyer. Both open a new tab, so the site
 * stays where the buyer left it; alf.io keeps the referrer, the newsletter
 * does not need it.
 */
export type PurchaseTarget =
  | { kind: "listing"; href: string; rel: "noopener" }
  | { kind: "notify"; href: string; rel: "noopener noreferrer" };
```

replace the body of `purchaseTarget` with

```ts
if (phase === "pre_opening")
  return { kind: "notify", href: NEWSLETTER_URL, rel: "noopener noreferrer" };
return { kind: "listing", href: listingUrl(config), rel: "noopener" };
```

and add after `alfioHost`:

```ts
/** Whether `href` points at `host` — a relative or unparseable href never does. */
export function onHost(href: string, host: string): boolean {
  try {
    return new URL(href).host === host;
  } catch {
    return false;
  }
}
```

In `src/lib/tickets/url.ts`, change the header's first sentence to `The purchase logic the browser also runs: the "I have a code" URL, and how it is opened.` and append:

```ts
/** The part of `window` that `openInNewTab` uses — a stand-in in tests. */
export interface TabOpener {
  open(url: string, target: string): { opener: unknown } | null;
  location: { assign(url: string): void };
}

/**
 * Open `url` in a new tab, cut from this page — the `rel="noopener"` of a
 * script. Called from a submit handler, so popup blockers let it through; if
 * one still blocks it, the buyer goes there in this tab rather than nothing
 * happening.
 */
export function openInNewTab(url: string, win: TabOpener): void {
  const tab = win.open(url, "_blank");
  if (tab) tab.opener = null;
  else win.location.assign(url);
}
```

In `src/components/tickets/tickets-ui.ts`, change the import to `import { codeUrlFrom, openInNewTab } from "@/lib/tickets/url";` and replace `    window.location.assign(result.url);` with `    openInNewTab(result.url, window);`.

- [ ] **Step 5: The links**

In `src/i18n/ui.ts`, after `"tickets.purchase.buy"` in each block add:

- French: `    "tickets.new_tab": "(nouvel onglet)",`
- English: `    "tickets.new_tab": "(new tab)",`

In `src/components/tickets/PurchaseControl.astro`:

- Replace the listing link with:
  ```astro
  <a
    href={target.href}
    target="_blank"
    rel={target.rel}
    class={buttonClass}
    data-umami-event="tickets-purchase"
    {...umami}
  >
    {t("tickets.purchase.buy")}
    <span class="sr-only"> {t("tickets.new_tab")}</span>
    <Icon name="arrow-right" size={20} />
  </a>
  ```
- Replace the notify link with:
  ```astro
  <a
    href={target.href}
    target="_blank"
    rel={target.rel}
    class={buttonClass}
    data-umami-event="tickets-notify"
    {...umami}
  >
    <Icon name="bell" size={20} />
    {t("tickets.offer.notify")}
    <span class="sr-only"> {t("tickets.new_tab")}</span>
  </a>
  ```
- Add to the header comment: ` * Both open a new tab, and say so to screen readers.`

In `src/components/tickets/StickyTicketBar.astro`:

- Add `import { useTranslations } from "@/i18n/utils";`.
- Change the action prop to `  action: { href: string; text: string; rel: string };` and the destructuring to `const { lang, label, price, action, analytics, demo = false } = Astro.props;` followed by `const t = useTranslations(lang);`.
- Replace the two conditional attributes
  ```astro
  target={action.external ? "_blank" : undefined}
  rel={action.external ? "noopener noreferrer" : undefined}
  ```
  with
  ```astro
  target="_blank" rel={action.rel}
  ```
- After `{action.text}` add `      <span class="sr-only"> {t("tickets.new_tab")}</span>`.

In `src/components/tickets/TicketsContent.astro`, replace the sticky `action:` value with:

```ts
  action: {
    href: target.href,
    rel: target.rel,
    text: t(target.kind === "listing" ? "tickets.sticky.buy" : "tickets.sticky.notify"),
  },
```

In `src/components/tickets/CodeDoor.astro`:

- Add `    target="_blank"` right after `    action={fallback.action}` on the `<form>`.
- After `        {t("tickets.code.submit")}` add `        <span class="sr-only"> {t("tickets.new_tab")}</span>`.
- In the header comment, replace `Without JavaScript the form is a plain GET to the listing with \`?code=\``with`Without JavaScript the form is a plain GET to the listing with \`?code=\`, in a new tab`and`upgrades it to \`/code/<CODE>\`,`with`upgrades it to \`/code/<CODE>\` (a new tab too, \`openInNewTab\`),`.

In `src/components/tickets/TicketsFaq.astro`:

- Add `import { onHost } from "@/lib/tickets/purchase";` and, after `const link = …`, add:
  ```ts
  // Terms of sale hosted on alf.io open in a new tab, like every hand-off there.
  const termsNewTab = termsUrl !== undefined && onHost(termsUrl, host);
  ```
- Replace the terms link `<a href={termsUrl} class={link}>{t("tickets.faq.transfer.terms")}</a>` with:

  ```astro
  <a
    href={termsUrl}
    target={termsNewTab ? "_blank" : undefined}
    rel={termsNewTab ? "noopener" : undefined}
    class={link}
  >
    {t("tickets.faq.transfer.terms")}
    {termsNewTab && <span class="sr-only"> {t("tickets.new_tab")}</span>}
  </a>
  ```

- [ ] **Step 6: Run the tests and the type check**

Run: `pnpm vitest run src/lib/__tests__/tickets.test.ts src/components/tickets tests/build/i18n-parity.test.ts`
Expected: PASS.

Run: `pnpm astro check`
Expected: `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/tickets src/components/tickets src/i18n/ui.ts src/lib/__tests__/tickets.test.ts
git commit -m "feat(billetterie): open every hand-off to alf.io in a new tab

Decided on 22/09/2026: the site stays where the buyer left it. Door 1, the
S&L band, the mobile bar, the code form and terms hosted on alf.io all open a
new tab and say so to screen readers. The code form falls back to this tab
when a popup blocker still refuses, so a code is never silently dropped.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Azzq3C71c3RsForMreHpyG"
```

---

### Task 6: Verification and the page's documentation

**Files:**

- Modify (git-ignored, not committed): `.claude/skills/billetterie-2027/SKILL.md`, `.claude/skills/billetterie-2027/reference/sources.md`, `.claude/skills/billetterie-2027/reference/design.md`
- Output: `.impeccable/review/v2-*.png` (git-ignored)

The Bash sandbox cannot write under `.claude/skills/`: use the Edit/Write tools for the three docs (the user may be asked to approve).

- [ ] **Step 1: Full test suite and type check**

Run: `pnpm test`
Expected: every test passes.

Run: `pnpm astro check`
Expected: `0 errors`.

- [ ] **Step 2: Production build — no demo, nothing in the sitemap**

Run: `env -u PUBLIC_SITE_URL pnpm build && ls dist/billetterie && grep -l "billetterie/demo" dist/sitemap*.xml; echo "grep exit $?"`
Expected: `ls` prints `index.html` only; `grep exit 1` (no sitemap file mentions the demo).

- [ ] **Step 3: Staging build — 6 demo pages, noindex, not in the sitemap**

Run:

```bash
PUBLIC_SITE_URL=https://staging.cloudnativedays.fr pnpm astro build --outDir dist-staging \
  && find dist-staging/billetterie -name index.html | sort \
  && grep -L 'name="robots" content="noindex' $(find dist-staging/billetterie/demo -name index.html); echo "noindex-missing exit $?" \
  ; grep -l "billetterie/demo" dist-staging/sitemap*.xml; echo "sitemap exit $?"
```

Expected: 7 `index.html` (`billetterie/`, `demo/`, `demo/avant-ouverture/`, `demo/super-early-bird/`, `demo/early-bird/`, `demo/regular/`, `demo/last-chance/`), no `demo-a` or `demo-b`; `noindex-missing exit 1`; `sitemap exit 1`. Then `rm -rf dist-staging`.

- [ ] **Step 4: Browser probes**

Start the dev server in the background: `pnpm dev` (if the sandbox refuses to bind the port, ask the user to run `! pnpm dev` or allow local binding). Then:

```bash
P=.claude/skills/billetterie-2027/shot.mjs
B=http://localhost:4321/billetterie/demo
node $P $B/avant-ouverture/ .impeccable/review/v2-avant-ouverture.png 1440
node $P $B/early-bird/ .impeccable/review/v2-early-bird.png 1440
node $P $B/regular/ .impeccable/review/v2-regular.png 1440
node $P $B/regular/ .impeccable/review/v2-regular-mobile.png 390 --mobile
node $P $B/early-bird/ .impeccable/review/v2-early-bird-mobile.png 390 --mobile
```

Read each capture and check: no chip anywhere; S&L band present with only "Espace d'échange" as a fact; no proof band; no inclusion sentence at the foot; the demo pill reads "DÉMO".

Code form probe (new tab, stripped code, opener cut):

```bash
node $P $B/regular/ - 1440 --eval "(() => { const calls = []; const tab = { opener: 'page' }; window.open = (u, t) => { calls.push([u, t]); return tab; }; const f = document.querySelector('[data-tickets-code]'); f.querySelector('[data-code-input]').value = ' part ner '; f.requestSubmit(); return { calls, opener: tab.opener, target: f.getAttribute('target') }; })()"
```

Expected: `{"calls":[["https://billetterie.cloudnativedays.fr/event/cnd-2027/code/partner","_blank"]],"opener":null,"target":"_blank"}`.

Mobile clearance probe (the last FAQ entry above the sticky bar):

```bash
node $P $B/regular/ - 390 --mobile --eval "(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise((r) => setTimeout(r, 500)); const last = [...document.querySelectorAll('details.faq > summary')].pop().getBoundingClientRect(); const bar = document.querySelector('[data-sticky-bar]'); const top = bar.dataset.visible === 'true' ? bar.getBoundingClientRect().top : innerHeight; return { lastBottom: Math.round(last.bottom), barTop: Math.round(top), clear: last.bottom <= top }; })()"
```

Expected: `"clear":true`.

Stop the dev server.

- [ ] **Step 5: Update the skill**

Replace the whole of `.claude/skills/billetterie-2027/SKILL.md` with:

````markdown
---
name: billetterie-2027
description: Use when working on the 2027 ticketing page — the /billetterie/demo staging demo, src/components/tickets/, src/config/tickets.ts or src/lib/tickets/. Carries the rules, the architecture and the open decisions of that page.
---

# Ticketing page 2027 (staging demo)

## Overview

The 2027 ticketing page is built as **a hidden demo on staging** until it replaces `/billetterie`. It is a **showcase**: every purchase action sends the buyer to the alf.io listing, in a new tab, where the quantity and the category are chosen. Variant A — quantity picked on the site, straight to alf.io's booking step — was abandoned for good at the 22/09/2026 meeting: bypassing the listing is too risky.

Owner: Thomas (lead of the ticketing "pôle"). Ticketing opens **13 October 2026**; the real page ships the evening of 12 October. The locked page structure is **"three doors"**: _je prends ma place_ (dominant, holds the price and the tier ladder), _venir en équipe_ (the group rates), _j'ai un code_ — and a door only appears when it has something to say, see rule 8. Under them: the Strategy & Leadership band, what the ticket includes, "Convaincre votre manager", the FAQ.

This skill is temporary: delete it once the page has replaced `/billetterie`.

## When to use

Any work under `src/components/tickets/`, `src/config/tickets.ts`, `src/lib/tickets/`, `src/pages/billetterie/`, or the `tickets.*` i18n keys — and any request about the demo, the tiers, the group rates, the "Stratégie & Leadership" ticket, or the code-entry path.

## Run it

```bash
pnpm dev     # then open /billetterie/demo/
```

The only visible demo mark is the striped red **"DÉMO"** pill in the bottom-left corner; clicking it opens a popover holding the phase switch (pre-opening + the 4 tiers). It is hidden by default on purpose: the page must read exactly as the future production page will. **Every phase is a pre-rendered URL** (`/billetterie/demo/early-bird/`), so the demo renders exactly what production would render for that config — there is no client-side state to trust. The 6 pages are emitted only on a non-production build.

The panel is a **native `popover`** (top layer, light-dismiss and Esc for free): it opens with `popovertarget`, no JS. `tickets-ui.ts` only keeps the scroll position _and_ the panel open across a switch, since each switch is a full page load.

## Hard rules

These come from the ticketing team's spec. Breaking one is a bug even when it looks fine.

1. **Never show a quota or a remaining stock**, for any ticket. The team adjusts quotas live in alf.io.
2. **Never show the internal abbreviations** SEB / EB / R / LC. Public names come from the config.
3. **Only the current tier shows a date.** Future tiers show their price, never a date: the team may extend a tier or raise its quota live.
4. **A past tier is "Épuisé", full stop** — one word and one icon for every closed tier, whether it sold out or ran to its date (Thomas, 20 Sept 2026: "Terminé" reads flat, and the distinction meant nothing to a visitor). There is no `endReason` any more: moving `currentPhase` is the whole ritual.
5. **Prices, dates and phase live only in `src/config/tickets.ts`.** Changing phase = changing `currentPhase` and shipping.
6. **An undecided value is `tbd("…")`, and the page never shows a placeholder.** With a draft (`tbd(note, draft)`) the page renders the draft as the copy it will become; without one its line is not rendered at all. Components read a `Maybe` only through `shown()` (`src/lib/tickets/drafts.ts`). A production-origin build refuses the page while a draft is left in the config or while the Strategy & Leadership price is undecided (`assertShippable`, which lists them all). A flag whose copy lives in i18n (evening included, ticket contents, tier names) is a draft `true`, so the guard sees it.
7. **The purchase action is built in `src/lib/tickets/purchase.ts` and nowhere else**: the alf.io listing once selling, the newsletter before the opening. Nothing may link to `/event/<slug>/code/<CODE>` — a real code creates a reservation that blocks tickets; the only code URL is the one a visitor types into door 3.
8. **Group rates are derived** (`cheaperGroupRates`: cheaper than the current tier **and** `rate.min <= tier.maxPerOrder`), never listed per phase. Today that means Regular and Last Chance only — Super Early Bird and Early Bird cap an order at 5 seats, which is how their quota is protected (decision of 22/09/2026, still to arbitrate). Door 2 — "Venir en équipe" — is rendered only when that list is non-empty, and door 1 then takes the whole grid with the code entry as a band underneath. The rates are stated **once on the page**, in that card, and are not clickable: its call to action asks for a rate by mail. The bottom of the page is "Convaincre votre manager" (the argument kit, whose box is always shown) in every phase, never a second price list. How alf.io applies the discount is still open, see `reference/sources.md`.
9. **"Stratégie & Leadership" is a separate offer, not a fifth tier** — always shown, always on sale, with the page's own purchase action. Its quota is never shown. A fact with no value has no row.
10. **Only confirmed figures** (PRODUCT.md "Evidence on Hand"). No invented testimonial, no derived number. The proof section (2026 figures, REX, replays) was removed on 22/09/2026.
11. **The demo must never reach production**: the gate is the build origin (`ticketDemosEnabled`), plus forced `noindex` and a sitemap exclusion (`/billetterie/demo…`). Do not touch `/billetterie`, `/en/tickets` or the `tickets` flag — the switch is a separate task.
12. **Bilingual**: every string is an i18n key in both `fr` and `en` (a test enforces parity). French typography: `U+00A0` before `:`, `U+202F` before `? ! ;`, no-break spaces inside `« »` and in "10 h", `U+202F` in "1 700".
13. **Inclusion and students**: in the FAQ only, never a price, kind wording, one contact address.
14. **Umami**: CTAs carry `billet`, `palier`, `phase`. Never send the value of a code.
15. **Contrast**: white on `--primary` is 3.6:1, so it is only allowed at ≥20px bold. For text or borders in brand blue on a light surface, use `--primary-strong`.
16. **Every hand-off to alf.io opens a new tab** — door 1, Strategy & Leadership, the mobile bar, the code form (`openInNewTab`, which falls back to this tab when a popup is blocked) and any config URL on the alf.io host (`onHost`). Every `target="_blank"` link carries a screen-reader-only "(nouvel onglet)".

## Architecture

| File                                          | Role                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/tickets.ts`                       | The single registry: alf.io host and event, opening, `currentPhase`, tiers, group rates, the Strategy & Leadership ticket, and every `tbd()`                                                                                                                                           |
| `src/lib/tickets/drafts.ts`                   | `shown` (value, draft or nothing) and the production guard (`shippingProblems`, `assertShippable`)                                                                                                                                                                                     |
| `src/lib/tickets/phase.ts`                    | `offerTier`, `tierStates`, `cheaperGroupRates`, `strategicPrice`, config consistency checks                                                                                                                                                                                            |
| `src/lib/tickets/purchase.ts`                 | The one place that builds a purchase action (`purchaseTarget`, `listingUrl`, `codeUrl`, `alfioHost`, `onHost`)                                                                                                                                                                         |
| `src/lib/tickets/url.ts`                      | `codeUrlFrom` and `openInNewTab` — the only logic the browser runs, kept dependency-free for the client bundle                                                                                                                                                                         |
| `src/lib/tickets/mailto.ts`, `format.ts`      | Pre-filled mailto, locale formatting (prices, dates, times)                                                                                                                                                                                                                            |
| `src/lib/tickets/demo.ts`                     | The production gate and the enumeration of the demo URLs                                                                                                                                                                                                                               |
| `src/components/tickets/TicketsPage.astro`    | Layout + demo bar + `noindex`; **the future production route mounts this**                                                                                                                                                                                                             |
| `src/components/tickets/TicketsContent.astro` | The page itself, and the call to `assertShippable`. Split from `TicketsPage` so the matrix test can render it without a site origin                                                                                                                                                    |
| `src/components/tickets/…`                    | `OfferDoor`, `TierLadder`, `PurchaseControl` (a link: listing or newsletter), `TeamDoor`, `GroupRates`, `CodeDoor`, `StrategicOffer`, `IncludedInTicket`, `TeamOffer` (the manager's argument kit), `TicketsFaq`, `StickyTicketBar`, `DemoBar` (the corner pill + its popover), `Icon` |
| `src/components/tickets/tickets-ui.ts`        | Progressive enhancement only: code form, sticky bar, demo scroll restore. Every form works without it                                                                                                                                                                                  |
| `src/pages/billetterie/[...demo].astro`       | The demo routes (FR only). `getStaticPaths` returns `[]` on a production build                                                                                                                                                                                                         |
| `src/i18n/ui.ts`                              | All copy, under `tickets.*`                                                                                                                                                                                                                                                            |

## Verify before claiming it works

```bash
pnpm test                       # unit tests, the 5-phase container matrix, the FAQ container test
pnpm astro check                # must stay at 0 errors
env -u PUBLIC_SITE_URL pnpm build   # prod: dist/billetterie/ holds index.html only, no "billetterie/demo" in the sitemap
PUBLIC_SITE_URL=https://staging.cloudnativedays.fr pnpm astro build --outDir dist-staging   # 6 demo pages, noindex
```

The matrix test (`src/components/tickets/__tests__/TicketsPage.test.ts`) is where the hard rules above are enforced; extend it rather than adding a screenshot check.

For anything visual or interactive, drive a real browser with the bundled probe — it does device emulation, full-page captures that wait for images, and DOM probes:

```bash
node .claude/skills/billetterie-2027/shot.mjs <url> <out.png|-> <width> [--mobile] [--dark] [--viewport-only] [--eval "<js>"]
```

Screenshots for review go to `.impeccable/review/`. Read `reference/design.md` before touching the look, and `reference/sources.md` before touching a number, a date or a claim.

## Working style on this page

- **No Stitch** — that workflow was dropped (the `stitch-first` skill is stale). Design in code and iterate on the dev server.
- Use `impeccable` for design work and `make-interfaces-feel-better` for detail polish.
- The locked direction lives in `.impeccable/surfaces/src-pages-billetterie-demo-astro.md` (development-only; never copy it into source or into anything the browser receives).
- Thomas iterates on the running page. Show him states by URL rather than describing them.

## More

- `reference/sources.md` — where every number comes from, the decisions already taken, the open placeholders, and what alf.io actually does.
- `reference/design.md` — the page's visual system as built, and the debts a review already logged.
````

- [ ] **Step 6: Update `reference/sources.md`**

In `.claude/skills/billetterie-2027/reference/sources.md`:

1. Insert as the first bullet under `## Decisions already taken (do not re-litigate)`:
   ```markdown
   - **Meeting of 22/09/2026, relayed 27/09/2026.** Variant A is abandoned — bypassing the
     alf.io listing is too risky; the page is the showcase, every purchase goes to the
     listing in a new tab. The proof section ("2026, en vrai", REX, replays) and the
     inclusion sentence at the foot are removed — the FAQ carries inclusion. Strategy &
     Leadership is always shown and always on sale: all its facts are due for the opening.
     The "À confirmer" chips are gone: `tbd()` stays in the config as an invisible marker,
     and `assertShippable` refuses a production build while a draft is left or the S&L
     price is undecided. More changes from that meeting come in a second session.
   ```
2. In the bullet `**The group discount applies automatically on the site**`, replace its last sentence (`Whichever lands, only \`src/lib/tickets/purchase.ts\` changes: … \`PurchaseTarget\`.`) with:
   ```markdown
   Since variant A is gone (27/09/2026) the site carries no alf.io code for the rates: the
   discount must apply on the alf.io listing, and whether door 2 then stops being a mailto
   is for the second session.
   ```
3. Replace the body of `## Open placeholders (each is a \`tbd()\` in the config)`(everything up to`## What alf.io actually does`) with:

   ```markdown
   **Blocking a production build** (a draft, or required): the opening hour; the public
   tier names; the S&L public name, price and networking area; the ticket contents; the
   evening being included for everyone; the manager kit's URL (a dummy `#convaincre` for
   now); the programme announcement date.

   **Hidden until decided:** the evening's programme; what S&L includes, its programme and
   access conditions; the VAT rate; the terms-of-sale link.

   **Waiting copy until decided:** company invoice, quote and bank transfer; cancellation and
   name change.

   **Open, not on the page:** the alf.io codes behind the two group rates (second session);
   which alf.io host is the public one after the blue/green switch.

   `grep -n "tbd(" src/config/tickets.ts` lists the config's; `shippingProblems(TICKETING)`
   lists what blocks production (a unit test pins it).
   ```

4. In `## What alf.io actually does`, prefix the `?qty=N` bullet with `(Variant A only — abandoned 22/09/2026.) `.
5. In `## To flag, not to fix`, replace the Umami bullet with `- Umami only loads on the production origin, so the staging demo measures nothing.`

- [ ] **Step 7: Update `reference/design.md`**

In `.claude/skills/billetterie-2027/reference/design.md`:

1. In `## Direction (locked)`, replace the sentence `Below: the brand band, what the ticket includes, 2026 in facts, "Convaincre votre manager" (the argument kit, in every phase), FAQ, inclusion note.` with `Below: the brand band (Strategy & Leadership, always shown), what the ticket includes, "Convaincre votre manager" (the argument kit, in every phase), FAQ.`
2. Replace the paragraph starting `**Placeholder chip** (\`Tbd.astro\`).` with:
   ```markdown
   **No placeholder on the page** (27/09/2026). An undecided value renders its draft or
   nothing; there is no visual for "to be confirmed" any more. The hatched chip and the
   demo's hide switch are gone — the team reads the page as it will ship, and
   `assertShippable` keeps a draft out of production.
   ```
3. Replace the paragraph starting `**Group rate rows** (\`GroupRates.astro\`).` with:
   ```markdown
   **Group rate rows** (`GroupRates.astro`). One row per rate: the label, the price per seat
   at `text-xl` bold tabular, and the **discount pill** — the same filled `--color-accent` /
   `--color-accent-foreground` pill as "Stock limité", `text-xs` bold tabular,
   `rounded-full`, carrying `formatDiscount` (floored, never overstating). Nothing is
   clickable: door 2's own call to action, "Demander mon tarif de groupe", is the way to
   ask. The rates are stated **once on the page**, in door 2 — titled "Venir en équipe" and
   carrying `id="equipe"`, which is what the Strategy & Leadership band links to when a rate
   exists.
   ```
4. Delete the paragraph starting `**The "ou" fork**`.
5. Replace the paragraph starting `**Purchase CTA and stepper**` (up to the next blank line) with:
   ```markdown
   **Purchase CTA** (`PurchaseControl.astro`). 52px, `text-xl` bold, 8px radius, trailing
   arrow, hover `primary/90`, press `scale(0.96)`, dark adds `--shadow-glow-primary`. One
   link to the alf.io listing in a new tab, with a screen-reader-only "(nouvel onglet)";
   before the opening, "Être prévenu(e)" to the newsletter with its note underneath. Door 1
   and the Strategy & Leadership band render the same control. The stepper, the live total
   and the group-rate swap went with variant A (27/09/2026).
   ```
6. Append to the `**Brand band**` paragraph: ` Always rendered; its facts list only the decided values (no \`<dl>\` at all when none is); its action is the shared purchase control, whose note alone takes the band's \`--chart-4\` ink.`
7. Append to the `**Sticky purchase bar**` paragraph: ` Its action opens a new tab — the listing, or the newsletter before the opening.`
8. In `## Debts a finish review already logged`, replace the first bullet (the `StrategicOffer.astro` repaint) with `- Resolved 27/09/2026: the purple band no longer repaints a stepper; only the notify note's ink is overridden.`

- [ ] **Step 8: Report**

No commit in this task (the docs are git-ignored; the captures are review material). Report to the user: the test and check results, the build checks, the probe outputs, and the capture paths.

---

## Self-review notes

- **Spec coverage:** §1 → Task 2 (routes, `demo.ts`, sitemap, `DemoBar`); §2 → Tasks 2 and 5; §3 → Tasks 2 (S&L), 3 (proof, inclusion), 4 (the `tbd()` table); §4 → Tasks 1 and 4; §5 files → Tasks 2–5; §6 tests → every task; §7 verification → Task 6; §8 docs → Task 6.
- **Deviation from the spec, deliberate:** `PurchaseTarget` carries its `rel` (Task 5) so the newsletter keeps `noreferrer` and the listing does not, from one place; `openInNewTab` falls back to the same tab when blocked (the spec was updated to match); `tickets.offer.opens_day` is added so an opening time left undecided without a draft still gives a sentence.
