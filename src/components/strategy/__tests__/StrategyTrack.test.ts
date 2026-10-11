// The Stratégie & Leadership page through the real component: what it must
// keep true whatever its wording. Its facts come from `TICKETING.strategic`,
// it has one action, and it never names a price it does not sell at.
import { describe, it, expect, beforeAll } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import StrategyTrackContent from "../StrategyTrackContent.astro";
import { TICKETING } from "@/config/tickets";
import { getLocalePath } from "@/i18n/utils";
import { formatPrice } from "@/lib/tickets/format";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const reserveHrefs = (html: string) =>
  [...html.matchAll(/<a\b[^>]*data-reserve[^>]*>/g)].map(
    (m) => m[0].match(/href="([^"]+)"/)?.[1],
  );

describe.each(["fr", "en"] as const)("%s", (lang) => {
  const { name, price, seats, lounge, room } = TICKETING.strategic;

  describe("ticketing open", () => {
    let html: string;
    let text: string;

    beforeAll(async () => {
      html = await container.renderToString(StrategyTrackContent, {
        props: { lang, phase: "seb" },
      });
      text = visibleText(html);
    });

    it("sends both buttons to the alf.io listing, in a new tab", () => {
      expect(reserveHrefs(html)).toEqual([
        TICKETING.listingUrl,
        TICKETING.listingUrl,
      ]);
      expect(html.match(/<a\b[^>]*data-reserve[^>]*>/g)?.join("")).toMatch(
        /target="_blank"/,
      );
    });

    it("shows the configured price, seats, room and lounge", () => {
      expect(html).toContain(`data-price="${price}"`);
      // Intl sets a narrow no-break space in "399 €"; visibleText flattens it.
      expect(text).toContain(formatPrice(price, lang).replace(/\s+/g, " "));
      expect(text).toContain(String(seats));
      expect(text).toContain(lounge[lang]);
      expect(text).toContain(room);
      expect(text).toContain(name[lang]);
    });

    it("names no price other than the one on sale", () => {
      const prices = [...text.matchAll(/€\s?(\d+)|(\d+)\s?€/g)].map(
        (m) => m[1] ?? m[2],
      );
      expect(new Set(prices)).toEqual(new Set([String(price)]));
    });

    it("says nothing of the opening date once tickets are on sale", () => {
      expect(html).not.toMatch(/13 octobre|13 October/);
    });
  });

  describe("before the opening", () => {
    let html: string;

    beforeAll(async () => {
      html = await container.renderToString(StrategyTrackContent, {
        props: { lang, phase: "pre_opening_dated" },
      });
    });

    it("still sends both buttons to the alf.io listing", () => {
      expect(reserveHrefs(html)).toEqual([
        TICKETING.listingUrl,
        TICKETING.listingUrl,
      ]);
    });

    it("says when ticketing opens", () => {
      expect(html).toMatch(/13 octobre|13 October/);
    });
  });
});

describe("routes", () => {
  it("maps the track's French and English URLs onto each other", () => {
    expect(getLocalePath("en", TICKETING.strategic.trackUrl.fr)).toBe(
      TICKETING.strategic.trackUrl.en,
    );
    expect(getLocalePath("fr", TICKETING.strategic.trackUrl.en)).toBe(
      TICKETING.strategic.trackUrl.fr,
    );
  });
});
