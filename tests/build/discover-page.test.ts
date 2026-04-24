/**
 * CLO-52: asserts /decouvrir and /en/discover render key sections.
 * Reads built dist/ HTML. Skips if dist is missing (run `pnpm build` first).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/decouvrir/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/discover/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages: Array<{ label: string; path: string }> = [
  { label: "FR (/decouvrir/)", path: DIST_FR },
  { label: "EN (/en/discover/)", path: DIST_EN },
];

describe("CLO-52: discover page", () => {
  for (const { label, path } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("embeds the behind-the-scenes video (A51PGVvrt_8)", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/youtube-nocookie\.com\/embed\/A51PGVvrt_8/);
      });

      it.skipIf(!distExists)("has photos section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="photos"/);
      });

      it.skipIf(!distExists)("has values section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="values"/);
      });

      it.skipIf(!distExists)("has audience section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="audience"/);
      });

      it.skipIf(!distExists)("has replays section anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="replays"/);
      });

      it.skipIf(!distExists)("renders YouTube thumbnail images", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/img\.youtube\.com\/vi\//);
      });

      it.skipIf(!distExists)("links to the replays page", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/href="[^"]*\/replays/);
      });
    });
  }
});
