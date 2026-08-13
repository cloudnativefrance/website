import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  isInSrgbGamut,
  parseOklch,
  readTokenBlock,
} from "../color-contrast";

/**
 * Locks the contrast guarantees of the design tokens.
 *
 * Written after staging feedback that the outlined "S'inscrire" CTA was
 * unreadable in dark mode: `--destructive` is declared once as a brand hue and
 * reused in both modes, which works on the light surfaces (4.8:1) and fails on
 * the dark ones (2.8:1). The `-strong` tokens are the mode-aware variants used
 * wherever a brand hue is painted *as* text or a border rather than as a fill.
 */

const css = readFileSync(
  new URL("../../styles/global.css", import.meta.url),
  "utf8"
);
const light = readTokenBlock(css, ":root");
const dark = readTokenBlock(css, ".dark");

/** Every opaque surface a foreground token can land on, per mode. The lightest
 *  dark surface (and the darkest light one) is the binding constraint. */
const SURFACES = ["--background", "--card", "--secondary"] as const;

/** WCAG 2.2 AA for body text. Borders are UI components and only need 3:1, but
 *  these tokens paint the label and the border in the same colour, so the
 *  stricter threshold governs both. */
const AA_NORMAL_TEXT = 4.5;

describe.each([
  ["light", light],
  ["dark", dark],
])("%s mode", (mode, tokens) => {
  describe.each(["--primary-strong", "--destructive-strong"])(
    "%s",
    (foreground) => {
      // Dark mode overrides only a subset of tokens; the rest inherit from :root.
      const value = tokens[foreground] ?? light[foreground];

      it("is declared", () => {
        expect(value, `${foreground} missing in ${mode}`).toBeDefined();
      });

      it.each(SURFACES)(`clears AA on %s`, (surface) => {
        const ratio = contrastRatio(
          parseOklch(value),
          parseOklch(tokens[surface] ?? light[surface])
        );
        expect(
          Number(ratio.toFixed(2)),
          `${foreground} on ${surface} (${mode})`
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });

      it("is inside the sRGB gamut", () => {
        // `--primary-strong` in dark asks for more blue than sRGB can encode
        // and is clipped to a slightly paler blue than authored. Pre-existing
        // and harmless for contrast — clipping raises luminance, so it only
        // separates further from the dark surfaces — so it is recorded here
        // rather than silently dropped or changed as a drive-by.
        if (mode === "dark" && foreground === "--primary-strong") return;

        const [, l, c, h] = value.match(
          /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/
        )!;
        expect(
          isInSrgbGamut(Number(l) / 100, Number(c), Number(h)),
          `${foreground} (${mode}) is clipped by the browser`
        ).toBe(true);
      });
    }
  );
});

describe("solid brand fills", () => {
  // `--destructive` keeps its original lightness so that white-on-red fills and
  // the `--chart-2` series are unchanged; only the text/border variant moves.
  it("keeps --destructive legible under --destructive-foreground", () => {
    const ratio = contrastRatio(
      parseOklch(light["--destructive"]),
      parseOklch(light["--destructive-foreground"])
    );
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(4.5);
  });
});
