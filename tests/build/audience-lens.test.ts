/**
 * Source-shape guards for the audience lens.
 *
 * The lens is a VIEW, not a filter. The distinction is not cosmetic:
 * schedule-ui.ts hides the break bands whenever a filter is active, so a lens
 * implemented as a filter makes lunch and the coffee breaks vanish on switch —
 * which reads as a styling glitch, not a logic error.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

/**
 * Slice from `anchor` through the balanced closing `}` of the block that
 * follows it (its own opening `{`, matched by brace depth) — never a magic
 * character count, and never a naive `indexOf("}", start)`. Both of those
 * silently under-cover the moment the block grows: a fixed-length window
 * stops covering a handler that gets longer (the `Clear filters` guard
 * below used to slice a fixed 400 characters, three lines short of the
 * handler's actual end), and `indexOf("}", start)` matches the first `{...}`
 * to close — a nested `if`/loop/object literal, not necessarily the block's
 * own end.
 */
function sliceBalancedBlock(src: string, anchor: string): string {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`sliceBalancedBlock: anchor not found: ${anchor}`);
  const bodyOpen = src.indexOf("{", start);
  if (bodyOpen === -1) throw new Error(`sliceBalancedBlock: no "{" after anchor: ${anchor}`);
  let depth = 0;
  for (let i = bodyOpen; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`sliceBalancedBlock: unbalanced braces from anchor: ${anchor}`);
}

describe("audience lens markup", () => {
  it("both halves of the lens's hiding rule exist, in the component that renders the elements", () => {
    // The ENTIRE visual effect of the lens is these two declarations. The
    // class is applied by JS; if the rule is dropped or fails to match, every
    // count, the column renumber, the facet prune and the URL all keep
    // reporting a working lens while both views show every session.
    //
    // Each lives with the elements it governs — the card rule in the component
    // that renders cards, so no view can lose it — which is also why neither
    // needs a `:global` escape.
    expect(read("src/components/schedule/SessionCard.astro"))
      .toMatch(/\.session-card\.is-audience-hidden\s*\{[^}]*display:\s*none/);
    const grid = read("src/components/schedule/ScheduleGridView.astro");
    expect(grid).toMatch(/\.grid-view-room\.is-audience-hidden/);
    expect(grid).toMatch(/\.grid-view-cell\.is-audience-hidden[\s\S]{0,40}\{[^}]*display:\s*none/);
  });

  it("cards carry their audience", () => {
    expect(read("src/components/schedule/SessionCard.astro")).toMatch(/data-audience=/);
  });

  it("grid header cells carry their room, so a column can be hidden", () => {
    const src = read("src/components/schedule/ScheduleGridView.astro");
    const head = src.slice(src.indexOf("grid-view-head"), src.indexOf("grid-view-body"));
    expect(head).toMatch(/data-room=/);
  });

  it("the control sits with the view toggle, not among the filters", () => {
    const src = read("src/components/schedule/ScheduleToolbar.astro");
    const switchAt = src.indexOf("data-audience-switch");
    const filtersAt = src.indexOf("schedule-filter-clear");
    expect(switchAt).toBeGreaterThan(-1);
    expect(switchAt).toBeLessThan(filtersAt);
  });

  it("a lens with one room opens in the list view", () => {
    expect(read("src/components/schedule/schedule-ui.ts")).toMatch(/roomCount|applyAudience\([^)]*\)\s*===?\s*1|<=\s*1/);
  });

  it("hides the grid/list toggle while a lens forces the list view — a visible control that cannot be honoured", () => {
    // Important-1 regression: the toggle used to stay visible and clickable
    // in a one-room lens, report success (aria-pressed="true", a written
    // localStorage/URL) and do nothing. There is no DOM test environment
    // here, so this pins the SOURCE MECHANISM the fix relies on: renderView()
    // itself toggles `.toolbar-views`'s `hidden` attribute off `lensForcesList`
    // — not some other function, and not a CSS-only fix that this file
    // can't see. It cannot prove the browser actually hides the element.
    const src = read("src/components/schedule/schedule-ui.ts");
    const renderView = sliceBalancedBlock(src, "function renderView() {");
    expect(renderView).toMatch(
      /toolbarViewsEl\?\.toggleAttribute\(\s*["']hidden["']\s*,\s*lensForcesList\s*\)/,
    );
  });

  it("prunes the lens's dead filter values before re-applying the filters", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    // Match the CALL — `pruneFacetsForLens();` / `apply();`, semicolon and
    // all — never a declaration: `function pruneFacetsForLens(): void {` and
    // `function apply() {` both contain the bare `name()` substring with no
    // trailing semicolon, so a semicolon-less match would pass on the
    // declaration alone, regardless of call order.
    //
    // `pruneFacetsForLens()` has exactly one call site: inside `setAudience`.
    // An earlier version needed a second, standalone boot-time call because
    // no lens was resolved at boot yet; boot now resolves the initial lens
    // through `setAudience` too (gated by `hasAudiences`), so that second
    // call site is gone — a reader must not find two places claiming to be
    // authoritative.
    const setAudienceStart = src.indexOf("const setAudience = (next: Audience): void => {");
    const setAudienceEnd = src.indexOf("};", setAudienceStart);
    expect(setAudienceStart, "setAudience is declared").toBeGreaterThan(-1);
    expect(setAudienceEnd, "setAudience body closes").toBeGreaterThan(setAudienceStart);

    const setAudienceBody = src.slice(setAudienceStart, setAudienceEnd);
    // `pruneFacetsForLens(` with its opening paren, not the whole `();`: the
    // call now threads the already-read card array through
    // (`pruneFacetsForLens(cards)`), so a literal `();` match would silently
    // stop finding it — as it did the moment that argument was added. The
    // declaration cannot be matched by accident here: this slice is the body
    // of `setAudience`, which does not contain it.
    const setAudiencePrune = setAudienceBody.indexOf("pruneFacetsForLens(");
    const setAudienceApply = setAudienceBody.indexOf("apply();", setAudiencePrune);
    expect(setAudiencePrune, "setAudience calls the prune").toBeGreaterThan(-1);
    expect(setAudienceApply, "setAudience: prune precedes apply()").toBeGreaterThan(setAudiencePrune);

    // No second call site anywhere else in the file — in particular not a
    // standalone one reinstated at boot.
    // One CALL, plus the one declaration. Counting `pruneFacetsForLens(`
    // catches both, so the expected total is 2 — anything higher means a
    // second call site was reinstated.
    const mentions = src.split("pruneFacetsForLens(").length - 1;
    expect(mentions, "pruneFacetsForLens has one declaration and one call site").toBe(2);
  });

  it("moves focus off the cross-lens button after it switches lens, before apply() destroys the node it sits in", () => {
    // Important-2 regression: this button lives inside #schedule-result-count,
    // and apply()'s first line is `countEl.textContent = …`, which removes the
    // button a keyboard user is standing on. There is no DOM test environment
    // here, so this pins the SOURCE MECHANISM: within the cross-lens button's
    // own click handler, a call to setAudience(...) precedes a `.focus()` call
    // that targets the now-pressed button in the lens switch. It cannot prove
    // the browser actually keeps focus visible or reachable.
    const src = read("src/components/schedule/schedule-ui.ts");
    const start = src.indexOf("toolbar-cross-lens");
    const end = src.indexOf("countEl.append(", start);
    expect(start, "the cross-lens button is built").toBeGreaterThan(-1);
    expect(end, "the button's wiring ends where it is appended").toBeGreaterThan(start);

    const block = src.slice(start, end);
    const setAudienceAt = block.indexOf("setAudience(");
    const focusAt = block.indexOf(".focus()");
    expect(setAudienceAt, "the click handler switches the lens").toBeGreaterThan(-1);
    expect(focusAt, "focus is moved only after the lens has switched").toBeGreaterThan(setAudienceAt);
    expect(
      block,
      "focus lands on the lens switch button, not wherever the destroyed button used to be",
    ).toMatch(/\[data-audience-switch\]\s*\[data-audience=/);
  });

  it("the cross-lens remainder is gated on hasAudiences, like scopedTotal two lines above it", () => {
    // Minor-4: on a single-audience edition `audience` never leaves "tech",
    // so every non-keynote card would count as "outside" the lens and offer a
    // switch to a control ScheduleToolbar.astro never rendered.
    const src = read("src/components/schedule/schedule-ui.ts");
    expect(src).toMatch(
      /const outside = hasAudiences \? countMatchesOutsideLens\([^)]*\) : 0;/,
    );
  });
});

describe("audience lens: other editions and the URL", () => {
  it("2023 and 2026 render no control — absent, not disabled", () => {
    for (const page of ["dist/programme/2023/index.html", "dist/programme/2026/index.html"]) {
      const html = read(page);
      expect(html, page).not.toContain("data-audience-switch");
      expect(html, page).toContain('data-has-audiences="false"');
    }
  });

  it("the lens is read from the URL and defaults to tech", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    expect(src).toContain("audience");
    expect(src).toMatch(/searchParams/);
    // The two assertions above are already satisfied by unrelated code (the
    // `Audience` type is used throughout the file; `?view=` already reads
    // `searchParams`), so on their own they would pass even without this
    // feature. Pin the actual behaviour: the URL is read for `audience`.
    expect(src).toMatch(/params\.get\(\s*["']audience["']\s*\)/);
  });

  it("the lens is NOT counted as an active filter", () => {
    // `activeFilterCount` reads FilterState wholesale, so the guard is that the
    // lens never enters FilterState — assert on the file that DEFINES both.
    // (Slicing schedule-ui.ts for "function activeFilterCount" finds nothing
    //  there: it is imported, so indexOf returns -1, slice(-1) yields one
    //  character, and the assertion passes without testing anything.)
    //
    // Scoped to the FilterState interface and the activeFilterCount function
    // bodies specifically, not the whole file: schedule-filter.ts also has an
    // unrelated comment about a keynote's "entire audience", which would trip
    // a whole-file, case-insensitive `audience` match regardless of whether
    // the lens actually leaked into FilterState. Case-insensitive within the
    // narrowed window, not `toContain`, for the same reason as the
    // Clear-filters guard below: a capitalised `Audience` reference (the
    // imported type, or a field typo) would slip past a lowercase-only check.
    const filter = read("src/lib/schedule-filter.ts");
    expect(filter).toContain("function activeFilterCount");

    // Balanced-brace bound, not `indexOf("}", start)`: neither body has a
    // nested `{...}` today, so the naive bound happens to land correctly —
    // but that is an assumption about today's code, not a guarantee. The
    // moment either grows an `if`/loop/object literal before its own close,
    // `indexOf("}", start)` would match that nested brace and silently stop
    // covering the rest of the body. sliceBalancedBlock cannot make that
    // mistake: it tracks depth, so it always finds the block's OWN close.
    expect(sliceBalancedBlock(filter, "export interface FilterState")).not.toMatch(/audience/i);
    expect(sliceBalancedBlock(filter, "export function activeFilterCount")).not.toMatch(/audience/i);

    const ui = read("src/components/schedule/schedule-ui.ts");
    expect(ui).not.toMatch(/state\.audience|audience:\s*(new Set|")/);
  });

  it("Clear filters does not reset the lens", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    // Balanced-brace bound, not a fixed character count: a fixed `slice(0,
    // 400)` stopped covering the handler's own last three lines — including
    // its trailing `apply();`, the single most natural place to insert
    // "reset the lens, then apply" — the moment the handler grew past 400
    // characters. sliceBalancedBlock always runs to the handler's own
    // closing `}`, however long the handler is.
    //
    // Case-insensitive, and not just a literal-assignment check: the file's
    // own documented entry point for changing lens is `setAudience(...)` —
    // capital A — so a maintainer wiring a lens reset into this handler would
    // call that, not assign `audience` directly. A case-sensitive
    // `toContain("audience")` lets `setAudience("tech");` straight through.
    expect(sliceBalancedBlock(src, "schedule-filter-clear")).not.toMatch(/audience/i);
  });

  it("an edition with one audience never applies a lens", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    // The boot call must be gated, not ternary'd — a ternary still calls
    // setAudience, which still hides every card of the other audience.
    expect(src).toMatch(/if\s*\(\s*hasAudiences\s*\)\s*setAudience/);
  });
});
