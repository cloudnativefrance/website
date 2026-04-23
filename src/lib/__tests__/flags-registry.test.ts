import { describe, it, expect } from "vitest";
import { FLAGS, type FlagDefinition, type FlagName } from "@/config/flags";
import { generateFlagEnvSchema } from "@/config/flags-env";
import { ui } from "@/i18n/ui";

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

describe("generateFlagEnvSchema", () => {
  it("emits one entry per flag in FLAGS", () => {
    const schema = generateFlagEnvSchema();
    for (const name of Object.keys(FLAGS)) {
      const key = `FLAG_${name.toUpperCase()}`;
      expect(schema[key]).toBeDefined();
    }
  });

  it("every entry has context 'server' and access 'public'", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].context).toBe("server");
      expect(schema[key].access).toBe("public");
    }
  });

  it("every entry allows values 'on', 'off', and empty string", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].values).toContain("on");
      expect(schema[key].values).toContain("off");
      expect(schema[key].values).toContain("");
    }
  });

  it("every entry is optional with empty-string default", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].optional).toBe(true);
      expect(schema[key].default).toBe("");
    }
  });
});

describe("i18n completeness (page-kind flags)", () => {
  const LOCALES = ["fr", "en"] as const;

  it("every page-kind flag has matching soon.title and soon.body in every locale", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.kind !== "page") continue;
      for (const locale of LOCALES) {
        const titleKey = `flags.${name}.soon.title`;
        const bodyKey = `flags.${name}.soon.body`;
        expect(
          ui[locale][titleKey as keyof (typeof ui)[typeof locale]],
          `Missing ${titleKey} in locale ${locale}`,
        ).toBeTruthy();
        expect(
          ui[locale][bodyKey as keyof (typeof ui)[typeof locale]],
          `Missing ${bodyKey} in locale ${locale}`,
        ).toBeTruthy();
      }
    }
  });

  it("shared coming-soon chrome keys exist in every locale", () => {
    for (const locale of LOCALES) {
      expect(ui[locale]["flags.soon.notify_cta" as keyof (typeof ui)[typeof locale]]).toBeTruthy();
      expect(ui[locale]["flags.soon.opens_on" as keyof (typeof ui)[typeof locale]]).toBeTruthy();
    }
  });
});
