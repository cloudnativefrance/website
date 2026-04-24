/**
 * Theme CSS shape guard.
 *
 * Asserts that src/styles/global.css has the post-rebrand structure:
 *   1. A top-level `.dark { … }` block exists (holds dark token overrides).
 *   2. Brand hue tokens (--primary, --accent, --destructive) live in :root,
 *      not inside .dark — they must NOT change between modes.
 *   3. The `:root` block defines --background as a light value (lightness >= 90%).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(import.meta.dirname, "../../src/styles/global.css");

function readCss(): string {
  return readFileSync(CSS_PATH, "utf-8");
}

/** Extract the contents of the first matching top-level block: `selector { … }`. */
function extractBlock(css: string, selectorPattern: string): string | null {
  const re = new RegExp(`(?:^|\\n)\\s*${selectorPattern}\\s*\\{`, "g");
  const m = re.exec(css);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  return css.slice(m.index + m[0].length, i - 1);
}

describe("theme CSS shape (light default + .dark override)", () => {
  it("contains a top-level .dark { … } block", () => {
    const css = readCss();
    const dark = extractBlock(css, "\\.dark");
    expect(dark, "missing top-level .dark block").not.toBeNull();
    expect(dark!.length, ".dark block is empty").toBeGreaterThan(0);
  });

  it("brand hue tokens live in :root, not in .dark", () => {
    const css = readCss();
    const root = extractBlock(css, ":root");
    const dark = extractBlock(css, "\\.dark");
    expect(root, "missing :root block").not.toBeNull();
    expect(dark, "missing .dark block").not.toBeNull();
    for (const token of ["--primary:", "--accent:", "--destructive:"]) {
      expect(root!.includes(token), `${token} must be defined in :root`).toBe(true);
      expect(dark!.includes(token), `${token} must NOT be redefined in .dark`).toBe(false);
    }
  });

  it("--background in :root is a light OKLCH value (lightness >= 90%)", () => {
    const css = readCss();
    const root = extractBlock(css, ":root")!;
    const m = root.match(/--background:\s*oklch\(\s*([\d.]+)%/);
    expect(m, ":root must define --background as oklch(...)").not.toBeNull();
    const lightness = Number(m![1]);
    expect(lightness, `--background lightness ${lightness}% should be >= 90% for light mode`).toBeGreaterThanOrEqual(90);
  });
});
