import { describe, it, expect } from "vitest";
import { FLAGS, type FlagDefinition, type FlagName } from "@/config/flags";

describe("flag registry", () => {
  it("exports FLAGS as a non-empty record", () => {
    expect(typeof FLAGS).toBe("object");
    expect(Object.keys(FLAGS).length).toBeGreaterThan(0);
  });

  it("includes the four spec-required flags", () => {
    const names = Object.keys(FLAGS) as FlagName[];
    expect(names).toContain("cfp");
    expect(names).toContain("tickets");
    expect(names).toContain("programme");
    expect(names).toContain("homepage_countdown");
  });

  it("every flag has a kind of 'page' or 'element'", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      expect(["page", "element"]).toContain(flag.kind);
    }
  });

  it("date strings parse to valid dates", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.opens) {
        expect(new Date(flag.opens).toString()).not.toBe("Invalid Date");
      }
      if (flag.closes) {
        expect(new Date(flag.closes).toString()).not.toBe("Invalid Date");
      }
    }
  });

  it("when both opens and closes are set, opens < closes", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.opens && flag.closes) {
        expect(new Date(flag.opens).getTime()).toBeLessThan(
          new Date(flag.closes).getTime(),
        );
      }
    }
  });
});
