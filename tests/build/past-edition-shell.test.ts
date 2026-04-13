/**
 * EDIT-04 + D-09 safeguard (Phase 16).
 *
 * Three invariants:
 *   1. PastEditionSection.astro exists on disk
 *   2. Its text contains the D-08 Props interface with all 8 prop names
 *   3. No src/pages/** file imports PastEditionSection (renders nowhere in Phase 16)
 *
 * NOTE: We DO NOT `import` the .astro file — Vitest cannot parse Astro SFCs
 * without extra config (RESEARCH.md Pitfall 2). Read as text instead.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const SHELL_PATH = resolve(
  import.meta.dirname,
  "../../src/components/past-editions/PastEditionSection.astro",
);
const PAGES_DIR = resolve(import.meta.dirname, "../../src/pages");

const REQUIRED_PROP_NAMES = [
  "rail",
  "heading",
  "stats",
  "photos",
  "video",
  "brandCallout",
  "galleryCta",
  "placeholder",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe("EDIT-04: PastEditionSection shell", () => {
  it("exists at src/components/past-editions/PastEditionSection.astro", () => {
    expect(existsSync(SHELL_PATH), `Missing ${SHELL_PATH}`).toBe(true);
  });

  it("declares the locked D-08 Props interface with all 8 prop names", () => {
    const text = readFileSync(SHELL_PATH, "utf-8");
    expect(text, "Props interface missing").toContain("interface Props");
    const missing = REQUIRED_PROP_NAMES.filter(
      (p) => !new RegExp(`\\b${p}\\??:`).test(text),
    );
    expect(
      missing,
      `D-08 Props missing these names: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("has no client:* directive (D-08: pure Astro, no hydration)", () => {
    const text = readFileSync(SHELL_PATH, "utf-8");
    const offenders = text.match(/client:(load|idle|visible|media|only)/g) ?? [];
    expect(
      offenders,
      `Found client:* directive(s) in shell: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});

describe("D-09: shell is rendered nowhere in Phase 16", () => {
  it("no src/pages/** file imports PastEditionSection", () => {
    const importers: string[] = [];
    for (const file of walk(PAGES_DIR)) {
      if (!/\.(astro|tsx?|jsx?|mjs|mts)$/.test(file)) continue;
      const text = readFileSync(file, "utf-8");
      if (/PastEditionSection/.test(text)) importers.push(file);
    }
    expect(
      importers,
      `PastEditionSection referenced in pages (must be zero in Phase 16): ${importers.join(", ")}`,
    ).toEqual([]);
  });
});
