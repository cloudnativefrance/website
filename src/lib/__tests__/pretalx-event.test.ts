import { describe, it, expect } from "vitest";
import { PRETALX_EVENT, cfpEventUrl, pickCfpEvent, PRETALX_BASE } from "@/lib/pretalx";

describe("PRETALX_EVENT", () => {
  it("marks 2026 as public and as the current CFP target", () => {
    expect(PRETALX_EVENT[2026]).toEqual({
      slug: "2026",
      access: "public",
      cfpOpen: true,
    });
  });

  it("has no 2027 entry — that event does not exist yet", () => {
    expect(PRETALX_EVENT[2027]).toBeUndefined();
  });
});

describe("pickCfpEvent", () => {
  it("ignores access entirely — a preview edition can own the CFP", () => {
    expect(
      pickCfpEvent({
        2026: { slug: "2026", access: "public" },
        2027: { slug: "2027", access: "preview", cfpOpen: true },
      }),
    ).toBe("2027");
  });

  it("throws when no edition is flagged, rather than guessing", () => {
    expect(() => pickCfpEvent({ 2026: { slug: "2026", access: "public" } })).toThrow(
      /cfpOpen/,
    );
  });

  it("lets the newest win when two editions claim the CFP", () => {
    // Overlap is legitimate during a handover: the 2027 CFP can open while the
    // 2026 event is still flagged. Newest wins, deliberately, rather than being
    // an error someone has to clear before shipping.
    expect(
      pickCfpEvent({
        2026: { slug: "2026", access: "public", cfpOpen: true },
        2027: { slug: "2027", access: "preview", cfpOpen: true },
      }),
    ).toBe("2027");
  });
});

describe("cfpEventUrl", () => {
  it("builds an absolute URL with a trailing slash", () => {
    expect(cfpEventUrl()).toBe(`${PRETALX_BASE}/2026/`);
  });
});
