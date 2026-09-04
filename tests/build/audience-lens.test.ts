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

describe("audience lens markup", () => {
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

  it("prunes the lens's dead filter values before re-applying the filters", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    // Match the CALL — `pruneFacetsForLens();` / `apply();`, semicolon and
    // all — never a declaration: `function pruneFacetsForLens(): void {` and
    // `function apply() {` both contain the bare `name()` substring with no
    // trailing semicolon, so a semicolon-less match would pass on the
    // declaration alone, regardless of call order.
    //
    // `pruneFacetsForLens()` has exactly one call site: inside `setAudience`.
    // Task 5 needed a second, standalone boot-time call because no lens was
    // resolved at boot yet; Task 6 makes boot resolve the lens through
    // `setAudience` too (gated by `hasLens`), so that second call site is
    // gone — a reader must not find two places claiming to be authoritative.
    const setAudienceStart = src.indexOf("const setAudience = (next: Audience): void => {");
    const setAudienceEnd = src.indexOf("};", setAudienceStart);
    expect(setAudienceStart, "setAudience is declared").toBeGreaterThan(-1);
    expect(setAudienceEnd, "setAudience body closes").toBeGreaterThan(setAudienceStart);

    const setAudienceBody = src.slice(setAudienceStart, setAudienceEnd);
    const setAudiencePrune = setAudienceBody.indexOf("pruneFacetsForLens();");
    const setAudienceApply = setAudienceBody.indexOf("apply();", setAudiencePrune);
    expect(setAudiencePrune, "setAudience calls the prune").toBeGreaterThan(-1);
    expect(setAudienceApply, "setAudience: prune precedes apply()").toBeGreaterThan(setAudiencePrune);

    // No second call site anywhere else in the file — in particular not a
    // standalone one reinstated at boot.
    const callSites = src.split("pruneFacetsForLens();").length - 1;
    expect(callSites, "pruneFacetsForLens() has exactly one call site").toBe(1);
  });
});

describe("audience lens: other editions and the URL", () => {
  it("2023 and 2026 render no control — absent, not disabled", () => {
    for (const page of ["dist/programme/2023/index.html", "dist/programme/2026/index.html"]) {
      const html = readFileSync(resolve(import.meta.dirname, "../../", page), "utf-8");
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
    // a whole-file `not.toContain("audience")` regardless of whether the lens
    // actually leaked into FilterState.
    const filter = read("src/lib/schedule-filter.ts");
    expect(filter).toContain("function activeFilterCount");

    const interfaceStart = filter.indexOf("export interface FilterState");
    const interfaceEnd = filter.indexOf("}", interfaceStart);
    expect(interfaceStart, "FilterState is declared").toBeGreaterThan(-1);
    expect(filter.slice(interfaceStart, interfaceEnd)).not.toContain("audience");

    const fnStart = filter.indexOf("export function activeFilterCount");
    const fnEnd = filter.indexOf("}", fnStart);
    expect(fnStart, "activeFilterCount is declared").toBeGreaterThan(-1);
    expect(filter.slice(fnStart, fnEnd)).not.toContain("audience");

    const ui = read("src/components/schedule/schedule-ui.ts");
    expect(ui).not.toMatch(/state\.audience|audience:\s*(new Set|")/);
  });

  it("Clear filters does not reset the lens", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    const clear = src.slice(src.indexOf("schedule-filter-clear"));
    expect(clear.slice(0, 400)).not.toContain("audience");
  });

  it("an edition with one audience never applies a lens", () => {
    const src = read("src/components/schedule/schedule-ui.ts");
    // The boot call must be gated, not ternary'd — a ternary still calls
    // setAudience, which still hides every card of the other audience.
    expect(src).toMatch(/if\s*\(\s*hasLens\s*\)\s*setAudience/);
  });
});
