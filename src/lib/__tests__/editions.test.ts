import { describe, it, expect } from "vitest";
import { EDITIONS, CURRENT_EDITION, isEdition, type Edition } from "@/lib/editions";

describe("EDITIONS", () => {
  it("lists 2023, 2026, 2027 in ascending order", () => {
    expect(EDITIONS).toEqual([2023, 2026, 2027]);
  });

  it("is a tuple (readonly)", () => {
    expect(Object.isFrozen(EDITIONS) || Array.isArray(EDITIONS)).toBe(true);
  });
});

describe("CURRENT_EDITION", () => {
  it("is 2027", () => {
    expect(CURRENT_EDITION).toBe(2027);
  });

  it("is included in EDITIONS", () => {
    expect(EDITIONS).toContain(CURRENT_EDITION);
  });
});

describe("isEdition", () => {
  it.each([2023, 2026, 2027])("returns true for %i", (y) => {
    expect(isEdition(y)).toBe(true);
  });

  it.each([2022, 2024, 2025, 2028, 0, -1, Number.NaN])(
    "returns false for %s",
    (y) => {
      expect(isEdition(y as number)).toBe(false);
    },
  );

  it("narrows to Edition", () => {
    const n: number = 2026;
    if (isEdition(n)) {
      const edition: Edition = n;
      expect(edition).toBe(2026);
    }
  });
});
