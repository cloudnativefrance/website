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
    // Two call sites need this guarantee: the lens switch (setAudience) and
    // the boot sequence that resolves the server-rendered default lens.
    // Getting either backwards is silent — apply() would run once against
    // selections the new lens cannot honour, and the result count would lag
    // one switch behind.
    const setAudienceStart = src.indexOf("const setAudience = (next: Audience): void => {");
    const setAudienceEnd = src.indexOf("};", setAudienceStart);
    expect(setAudienceStart, "setAudience is declared").toBeGreaterThan(-1);
    expect(setAudienceEnd, "setAudience body closes").toBeGreaterThan(setAudienceStart);

    const setAudienceBody = src.slice(setAudienceStart, setAudienceEnd);
    const setAudiencePrune = setAudienceBody.indexOf("pruneFacetsForLens();");
    const setAudienceApply = setAudienceBody.indexOf("apply();", setAudiencePrune);
    expect(setAudiencePrune, "setAudience calls the prune").toBeGreaterThan(-1);
    expect(setAudienceApply, "setAudience: prune precedes apply()").toBeGreaterThan(setAudiencePrune);

    // The boot sequence's own prune/apply pair, searched forward from where
    // setAudience ends so this cannot re-match setAudience's own calls.
    const bootPrune = src.indexOf("pruneFacetsForLens();", setAudienceEnd);
    const bootApply = src.indexOf("apply();", bootPrune);
    expect(bootPrune, "boot calls the prune").toBeGreaterThan(setAudienceEnd);
    expect(bootApply, "boot: prune precedes apply()").toBeGreaterThan(bootPrune);
  });
});
