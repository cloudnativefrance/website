/**
 * Asserts the redesign's load-bearing decisions survive into the built HTML.
 * These are the things a refactor could silently undo.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const html = readFileSync("dist/programme/2026/index.html", "utf8");

describe("programme page", () => {
  it("ships a search field", () => {
    expect(html).toMatch(/id="schedule-search"/);
  });

  it("offers both views", () => {
    // Assert the view CONTAINERS, not `data-view="…"` — that attribute is on the
    // toolbar's toggle buttons, which render whether or not the view they switch
    // to still exists.
    expect(html).toMatch(/class="grid-view"/);
    expect(html).toMatch(/class="list-view"/);
  });

  it("renders every session in both views", () => {
    const gridAt = html.indexOf('class="grid-view"');
    const listAt = html.indexOf('class="list-view"');
    expect(gridAt).toBeGreaterThan(-1);
    // Grid is emitted first; the slice below depends on it.
    expect(listAt).toBeGreaterThan(gridAt);

    const idsIn = (s: string) =>
      new Set(
        [...s.matchAll(/data-session-id="([A-Z0-9]{6})"/g)].map((m) => m[1]),
      );

    // Counted PER VIEW. A single `new Set` over the whole page cannot tell 51
    // sessions rendered twice from 51 rendered once, so it stayed green with an
    // entire view deleted.
    expect(idsIn(html.slice(gridAt, listAt)).size).toBe(51);
    expect(idsIn(html.slice(listAt)).size).toBe(51);
  });

  it("labels the breaks instead of leaving empty gaps", () => {
    expect(html).toMatch(/Pause/);
  });

  it("puts no coloured stripe on a card edge", () => {
    // The design decision: track colour lives in the pill, never as an edge.
    expect(html).not.toMatch(/border-left:\s*4px/);
    expect(html).not.toMatch(/border-l-4/);
  });

  it("announces the result count politely", () => {
    expect(html).toMatch(/id="schedule-result-count"[^>]*aria-live="polite"/);
  });
});

/**
 * The focus behaviour itself needs a browser and this repo has no browser test
 * runner, but it rests on markup that CAN be checked here — and every one of
 * these attributes fails silently when removed. Dropping `tabindex="-1"` makes
 * `.focus()` on the dialog a no-op, so the modal opens with focus still on the
 * card behind it and Tab walks into the page, with no error anywhere.
 */
describe("overlay focus contract", () => {
  const tagFor = (id: string) => {
    const at = html.indexOf(`id="${id}"`);
    expect(at, `${id} missing from the page`).toBeGreaterThan(-1);
    return html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1);
  };

  it("opens the modal through a native dialog, not a hand-rolled overlay", () => {
    const at = html.indexOf('id="schedule-session-modal"');
    expect(at, "modal missing from the page").toBeGreaterThan(-1);
    // The element itself must be a <dialog>: showModal() places it in the top
    // layer, which no layout-viewport quirk (mobile zoom, transformed
    // ancestor) can pull out of the visual viewport. A div overlay — however
    // positioned — regresses the Chrome Android bug this replaced.
    const tag = html.slice(
      html.lastIndexOf("<", at),
      html.indexOf(">", at) + 1,
    );
    expect(tag.startsWith("<dialog")).toBe(true);
    expect(tag).toContain('tabindex="-1"');
    // aria-labelledby is the announcement contract: focusing the dialog reads
    // the session title and the implicit dialog role.
    expect(tag).toContain('aria-labelledby="schedule-session-modal-title"');
  });

  it("ships the drawer inert, so a closed drawer is not two phantom tab stops", () => {
    // It is only slid off-screen by a transform, so without `inert` its Close
    // and Export buttons stay focusable at the end of every page.
    const tag = tagFor("schedule-agenda-drawer");
    expect(tag).toMatch(/\sinert(\s|>|=)/);
    expect(tag).toContain('tabindex="-1"');
  });
});
