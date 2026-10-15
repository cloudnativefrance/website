/**
 * Editorial pass (2026-10): while the call for proposals is open, the CFP
 * leads the Programme dropdown and renders bold — visibility first.
 *
 * Build-output guard, matching newsletter-callout.test.ts: the property is
 * about what ships in the HTML (order AND styling as rendered by both the
 * desktop dropdown and the mobile panel), so it reads dist/ and skips when
 * the dist is missing — run `pnpm build` first.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getLocalePath } from "@/i18n/utils";

const DIST = resolve(import.meta.dirname, "../../dist");
const distExists = existsSync(resolve(DIST, "index.html"));

function readPage(relative: string): string {
  return readFileSync(resolve(DIST, relative), "utf-8");
}

const CFP_MENU_ID = "nav-dd-menu-nav-programme-label";

/** The desktop dropdown is the <ul> that follows its menu id. */
function desktopProgrammeMenu(html: string): string {
  const start = html.indexOf(`id="${CFP_MENU_ID}"`);
  expect(start, "programme dropdown present").toBeGreaterThan(-1);
  return html.slice(start, html.indexOf("</ul>", start));
}

/** The mobile panel is everything from its container to </header>. */
function mobilePanel(html: string): string {
  const start = html.indexOf('id="mobile-menu"');
  expect(start, "mobile menu present").toBeGreaterThan(-1);
  return html.slice(start, html.indexOf("</header>", start));
}

function anchorHrefs(segment: string): string[] {
  return [...segment.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]);
}

function anchorTag(segment: string, href: string): string {
  const match = segment.match(new RegExp(`<a\\b[^>]*href="${href}"[^>]*>`));
  expect(match, `anchor for ${href} present`).not.toBeNull();
  return match![0];
}

for (const [page, lang] of [
  ["index.html", "fr"],
  ["en/index.html", "en"],
] as const) {
  describe(`programme dropdown on /${page} (phase: CFP leads)`, () => {
    const cfpHref = getLocalePath(lang, "/cfp");
    const programmeHref = getLocalePath(lang, "/programme") + "/";
    const speakersHref = getLocalePath(lang, "/speakers") + "/";

    it.skipIf(!distExists)(
      `${page}: the CFP is the first dropdown item, before programme and speakers`,
      () => {
        const html = readPage(page);
        const menu = desktopProgrammeMenu(html);
        const hrefs = anchorHrefs(menu);
        expect(hrefs[0]).toBe(cfpHref);
        const programmeIdx = hrefs.findIndex((h) =>
          h.startsWith(programmeHref),
        );
        const speakersIdx = hrefs.findIndex((h) => h.startsWith(speakersHref));
        expect(programmeIdx).toBeGreaterThan(0);
        expect(speakersIdx).toBeGreaterThan(0);
      },
    );

    it.skipIf(!distExists)(
      `${page}: the CFP renders bold in the desktop dropdown, its siblings do not`,
      () => {
        const menu = desktopProgrammeMenu(readPage(page));
        expect(anchorTag(menu, cfpHref)).toContain("font-bold");
        const others = anchorHrefs(menu).filter((h) => h !== cfpHref);
        for (const href of others) {
          expect(anchorTag(menu, href), href).not.toContain("font-bold");
        }
      },
    );

    it.skipIf(!distExists)(
      `${page}: the mobile panel matches — CFP first and bold`,
      () => {
        const panel = mobilePanel(readPage(page));
        const hrefs = anchorHrefs(panel);
        // The mobile menu is a flat list of sections; the CFP line must precede
        // the first programme/speakers line, which is the same section's next item.
        expect(hrefs.indexOf(cfpHref)).toBeGreaterThan(-1);
        expect(hrefs.indexOf(cfpHref)).toBeLessThan(
          hrefs.findIndex((h) => h.startsWith(programmeHref)),
        );
        expect(hrefs.indexOf(cfpHref)).toBeLessThan(
          hrefs.findIndex((h) => h.startsWith(speakersHref)),
        );
        expect(anchorTag(panel, cfpHref)).toContain("font-bold");
      },
    );
  });
}
