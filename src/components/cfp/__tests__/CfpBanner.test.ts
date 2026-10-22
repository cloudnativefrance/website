// The homepage's top CFP band ("remonter le CFP"): the highest possible CFP
// spot, gated by the same commit-flipped phase registry as /cfp itself —
// hidden until the Nov 3 flip, gone again once the CFP closes.
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";

const state = vi.hoisted(() => ({
  phase: "coming_soon" as "coming_soon" | "open" | "closed",
}));
vi.mock("@/config/cfp", () => ({
  CFP: {
    get currentPhase() {
      return state.phase;
    },
  },
}));

import CfpBanner from "../CfpBanner.astro";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

beforeEach(() => {
  state.phase = "coming_soon";
});

const render = async (lang: "fr" | "en" = "fr") =>
  container.renderToString(CfpBanner, { props: { lang } });

describe("CfpBanner", () => {
  it("renders nothing before the CFP opens or after it closes", async () => {
    state.phase = "coming_soon";
    expect(await render()).not.toContain("<a ");
    state.phase = "closed";
    expect(await render()).not.toContain("<a ");
  });

  it("open: announcement with the deadline and a link to /cfp", async () => {
    state.phase = "open";
    const html = await render();
    expect(html).toContain("Le CFP 2027 est ouvert");
    expect(html).toContain("21 janvier");
    expect(html).toContain('href="/cfp"');
  });

  it("open, en mirror", async () => {
    state.phase = "open";
    const html = await render("en");
    expect(html).toContain("The 2027 CFP is open");
    expect(html).toContain('href="/en/cfp"');
  });
});
