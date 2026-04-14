/**
 * TEST-02 + A11Y-01 + A11Y-02 (Phase 20).
 *
 * Byte-level contract on the component source file. We read as text rather
 * than importing because Vitest cannot parse .astro SFCs without extra config
 * (same pattern as past-edition-shell.test.ts).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMPONENT_PATH = resolve(
  import.meta.dirname,
  "../../src/components/testimonials/TestimonialsStrip.astro",
);

const src = readFileSync(COMPONENT_PATH, "utf-8");

describe("TEST-02 marquee animation contract", () => {
  it("defines @keyframes scroll-x from 0 to -50%", () => {
    expect(src).toMatch(/@keyframes\s+scroll-x/);
    expect(src).toContain("translateX(-50%)");
  });

  it("applies the animation to .marquee-track with 40s linear infinite", () => {
    expect(src).toMatch(/animation:\s*scroll-x\s+40s\s+linear\s+infinite/);
  });

  it("pauses the animation on :hover AND :focus-within", () => {
    expect(src).toMatch(/\.marquee:hover\s+\.marquee-track/);
    expect(src).toMatch(/\.marquee:focus-within\s+\.marquee-track/);
    expect(src).toContain("animation-play-state: paused");
  });
});

describe("A11Y-01 reduced-motion fallback", () => {
  it("contains a prefers-reduced-motion media query that disables animation", () => {
    expect(src).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const idx = src.search(/@media\s*\(prefers-reduced-motion/);
    expect(idx).toBeGreaterThan(-1);
    const block = src.slice(idx, idx + 800);
    expect(block).toContain("animation: none");
  });

  it("enables an overflow-x: auto horizontal-scroll fallback under reduced motion", () => {
    const idx = src.search(/@media\s*\(prefers-reduced-motion/);
    expect(idx).toBeGreaterThan(-1);
    const block = src.slice(idx, idx + 800);
    expect(block).toContain("overflow-x: auto");
    expect(block).toContain("scroll-snap-type: x mandatory");
  });
});

describe("A11Y-02 duplicate-track hidden from assistive tech", () => {
  it("renders exactly two <ul> elements with class marquee-track", () => {
    const matches = src.match(/class="marquee-track"/g) ?? [];
    expect(matches.length, `Expected 2 marquee-track lists, got ${matches.length}`).toBe(2);
  });

  it("marks the duplicate track with aria-hidden=\"true\" AND inert", () => {
    const dupMatch = src.match(/<ul[^>]*data-track="duplicate"[^>]*>/);
    expect(dupMatch, "Duplicate track tag not found").toBeTruthy();
    expect(dupMatch![0]).toContain('aria-hidden="true"');
    expect(dupMatch![0]).toContain("inert");
  });

  it("canonical track does NOT carry aria-hidden or inert", () => {
    const canonMatch = src.match(/<ul[^>]*data-track="canonical"[^>]*>/);
    expect(canonMatch, "Canonical track tag not found").toBeTruthy();
    expect(canonMatch![0]).not.toContain("aria-hidden");
    expect(canonMatch![0]).not.toMatch(/\binert\b/);
  });
});
