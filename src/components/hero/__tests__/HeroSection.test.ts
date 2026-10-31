// The Nov-3 reveal on the homepage hero: the third CTA swaps "Voir le
// programme" for "Postuler au CFP" and the Strategy & Leadership pill
// appears — all driven by the CFP phase registry (src/config/cfp.ts),
// mocked here so every phase is testable without a rebuild.
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
// The LOADED renderer shape (ssr.check / renderToStaticMarkup), not the
// integration factory — the container expects the former.
import ReactRenderer from "@astrojs/react/server.js";

const state = vi.hoisted(() => ({
  phase: "coming_soon" as "coming_soon" | "open" | "closed",
  lang: "fr" as "fr" | "en",
}));
vi.mock("@/config/cfp", () => ({
  CFP: {
    get currentPhase() {
      return state.phase;
    },
  },
}));
// HeroSection derives its locale from Astro.url (no props) — pin it per test.
vi.mock("@/i18n/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/i18n/utils")>();
  return {
    ...actual,
    getLangFromUrl: () => state.lang,
  };
});

import HeroSection from "../HeroSection.astro";

let container: AstroContainer;

beforeAll(async () => {
  // The hero mounts the CountdownTimer React island — the container needs
  // the React renderer to resolve it (no other test here renders islands).
  // Shape: the container nests what it receives under `.ssr` (r.ssr.check).
  container = await AstroContainer.create({
    renderers: [{ name: "react", ssr: ReactRenderer }],
  });
});

beforeEach(() => {
  state.phase = "coming_soon";
  state.lang = "fr";
});

const render = async (lang: "fr" | "en") =>
  container.renderToString(HeroSection, { props: { lang } });

// Same normalization as Cfp.test.ts: the container escapes entities and
// injects dev-mode attributes; assert on text, not raw markup.
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/[ \t\n\r]+/g, " ");

const mainText = async (lang: "fr" | "en") => text(await render(lang));

describe("HeroSection — CFP phase CTAs", () => {
  it("before the reveal (coming_soon): programme CTA, no CFP artefacts", async () => {
    const m = await mainText("fr");
    expect(m).toContain("Voir le programme");
    expect(m).not.toContain("Postuler au CFP");
    expect(m).not.toContain("Strategy & Leadership");
  });

  it("open: the third CTA becomes Postuler au CFP, pointing at /cfp", async () => {
    state.phase = "open";
    const m = await mainText("fr");
    expect(m).toContain("Postuler au CFP");
    expect(m).not.toContain("Voir le programme");
    const html = await render("fr");
    expect(html).toContain('href="/cfp"');
  });

  it("open: the Strategy & Leadership pill links the dedicated page", async () => {
    state.phase = "open";
    expect(await mainText("fr")).toContain(
      "Découvrir le nouveau track : Strategy & Leadership",
    );
    const html = await render("fr");
    expect(html).toContain('href="/parcours-strategie-leadership"');
  });

  it("open, en mirror", async () => {
    state.phase = "open";
    state.lang = "en";
    const m = await mainText("en");
    expect(m).toContain("Submit to the CFP");
    expect(m).not.toContain("View schedule");
    expect(m).toContain("Discover the new track: Strategy & Leadership");
    const html = await render("en");
    expect(html).toContain('href="/en/track-strategy-leadership"');
  });

  it("closed: the programme CTA returns, pill gone", async () => {
    state.phase = "closed";
    const m = await mainText("fr");
    expect(m).toContain("Voir le programme");
    expect(m).not.toContain("Postuler au CFP");
    expect(m).not.toContain("Strategy & Leadership");
  });
});
