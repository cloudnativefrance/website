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
    expect(html).toMatch(/data-view="grid"/);
    expect(html).toMatch(/data-view="list"/);
  });

  it("renders every session in both views", () => {
    const ids = [...html.matchAll(/data-session-id="([A-Z0-9]{6})"/g)].map((m) => m[1]);
    // 51 sessions, once per view.
    expect(new Set(ids).size).toBe(51);
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
