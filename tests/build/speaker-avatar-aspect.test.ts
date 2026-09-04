/**
 * Guards the shape of the optimised speaker portraits.
 *
 * The bug this exists to prevent: `getImage({ src, inferSize: true, width })`
 * on a REMOTE source emitted `height` unchanged from the original, so a
 * 1024x1058 Pretalx portrait came back as 128x1058 — squashed 8x horizontally.
 * `object-cover` then cropped the middle of that sliver, and every speaker
 * rendered as a close-up of a nose or an eye. The build was green throughout:
 * nothing errors, the file exists, the page renders. Only a human looking at
 * the page could see it, which is exactly why it needs a test.
 *
 * Reads the built output rather than the source, because the defect was in
 * what the image service PRODUCED, not in what the component asked for — a
 * source-shape assertion would have passed against the broken build.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const PAGE = resolve(ROOT, "dist/intervenants/2026/index.html");

/** Width and height from a WebP (VP8/VP8L/VP8X) header. */
function webpSize(file: string): { w: number; h: number } | null {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const fourcc = b.toString("ascii", 12, 16);
  if (fourcc === "VP8 ") return { w: (b.readUInt16LE(26) & 0x3fff) , h: (b.readUInt16LE(28) & 0x3fff) };
  if (fourcc === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  return null;
}

describe("optimised speaker portraits", () => {
  if (!existsSync(PAGE)) {
    it.skip("needs a build — run `pnpm build` first", () => {});
    return;
  }

  const html = readFileSync(PAGE, "utf-8");
  // Only the <img> tags this component emits: an /_astro/ webp with an alt.
  const srcs = [
    ...new Set(
      [...html.matchAll(/<img\s+src="(\/_astro\/[^"]+\.webp)"[^>]*alt="[^"]*"/g)].map((m) => m[1]),
    ),
  ];

  it("the page actually renders optimised portraits", () => {
    expect(srcs.length).toBeGreaterThan(10);
  });

  it.each(srcs)("%s is square", (src) => {
    const size = webpSize(resolve(ROOT, "dist", src.replace(/^\//, "")));
    expect(size, `could not read ${src}`).not.toBeNull();
    // Square, because the component clips to a circle at w-16 h-16 / w-32 h-32.
    // The broken build produced 128x1058 here.
    expect(`${size!.w}x${size!.h}`).toBe(`${size!.w}x${size!.w}`);
  });
});
