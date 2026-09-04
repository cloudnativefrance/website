import { describe, it, expect } from "vitest";
import { isCurrentPath } from "@/lib/nav-path";

/**
 * The two bugs this replaced, both live on `/programme/2026/`.
 *
 * The archive entry compared `currentPath === "/programme/2026"` — an exact
 * match against an href with no trailing slash, while Astro serves the
 * directory route WITH one, so it could never match anything the site actually
 * emits. The featured entry compared `currentPath.startsWith("/programme")`,
 * which was true for every edition at once. Two entries claiming to be current,
 * and the correct one never highlighting.
 */
describe("isCurrentPath", () => {
  it("matches the href itself", () => {
    expect(isCurrentPath("/programme/2026", "/programme/2026")).toBe(true);
  });

  it("matches the trailing-slash form Astro actually serves", () => {
    expect(isCurrentPath("/programme/2026/", "/programme/2026")).toBe(true);
  });

  it("matches when the href carries the slash instead", () => {
    expect(isCurrentPath("/programme/2026", "/programme/2026/")).toBe(true);
  });

  it("does NOT match a sibling edition", () => {
    // The whole point: on /programme/2026/ the featured 2027 entry must not
    // also claim to be the current page.
    expect(isCurrentPath("/programme/2026/", "/programme/2027")).toBe(false);
  });

  it("does NOT match the section root against an edition href", () => {
    expect(isCurrentPath("/programme/", "/programme/2026")).toBe(false);
  });

  it("matches a descendant page", () => {
    // A speaker detail page should highlight the speakers entry that led there.
    expect(
      isCurrentPath("/intervenants/2026/ada-lovelace", "/intervenants/2026"),
    ).toBe(true);
  });

  it("anchors the descendant match on a slash boundary", () => {
    expect(isCurrentPath("/programme/2026-recap", "/programme/2026")).toBe(false);
  });

  it("handles the English mirror the same way", () => {
    expect(isCurrentPath("/en/speakers/2026/", "/en/speakers/2026")).toBe(true);
    expect(isCurrentPath("/en/speakers/2026/", "/en/speakers/2027")).toBe(false);
  });

  it("treats the site root as itself, not as a prefix of everything", () => {
    // No dropdown item points at "/" today; pinned so that if one ever does it
    // cannot light up on every page of the site.
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/programme/2026", "/")).toBe(false);
  });
});
