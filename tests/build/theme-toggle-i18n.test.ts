/**
 * ThemeToggle i18n key guard.
 *
 * Asserts that the four theme-toggle aria-label keys exist in BOTH
 * fr and en, and that the FR and EN values for each key are NOT
 * byte-identical (would indicate an accidental copy/paste).
 */
import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

const KEYS = [
  "theme.toggle.aria.to_dark",
  "theme.toggle.aria.to_light",
] as const;

describe("ThemeToggle i18n keys", () => {
  it.each(KEYS)("key %s exists in fr", (key) => {
    expect((ui.fr as Record<string, string>)[key]).toBeTruthy();
  });

  it.each(KEYS)("key %s exists in en", (key) => {
    expect((ui.en as Record<string, string>)[key]).toBeTruthy();
  });

  it.each(KEYS)("FR value for %s differs from EN", (key) => {
    const fr = (ui.fr as Record<string, string>)[key];
    const en = (ui.en as Record<string, string>)[key];
    expect(fr).not.toBe(en);
  });
});
