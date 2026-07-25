/**
 * CLO-52: asserts /decouvrir and /en/discover render key sections.
 * Reads built dist/ HTML. Skips if dist is missing (run `pnpm build` first).
 *
 * Three assertions were rewritten after they went stale behind deliberate
 * product changes, each verified against the commit that made it:
 *   - `3c4a084` replaced the eager <iframe> with a click-to-load facade, so no
 *     embed URL is in the static HTML any more. The video assertion now checks
 *     the facade contract instead: the id is wired up, and the script that
 *     builds the player still targets the privacy-preserving domain.
 *   - the same work moved thumbnails from img.youtube.com to i.ytimg.com.
 *   - `aa34afe` ("retrait replays") removed ReplayGrid from this page. Its
 *     anchor assertion was dropped; the component still exists but is no
 *     longer rendered here, so do not re-add it.
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
      it.skipIf(!distExists)("wires the behind-the-scenes video (A51PGVvrt_8) into a facade", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/data-video-id="A51PGVvrt_8"/);
      });

      it.skipIf(!distExists)("builds the player from the privacy-preserving domain", () => {
        // The facade constructs the iframe on click, so the id and the origin
        // live in separate places. Asserting the origin here keeps the
        // youtube-nocookie guarantee from silently regressing to youtube.com.
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/youtube-nocookie\.com\/embed\//);
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

      it.skipIf(!distExists)("renders YouTube thumbnail images", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/i\.ytimg\.com\/vi\//);
      });

      it.skipIf(!distExists)("links to the replays page", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/href="[^"]*\/replays/);
      });
    });
  }
});
