import { describe, it, expect } from "vitest";
import { findClashes, substituteClashLabel, substituteTokens } from "@/lib/agenda";

const s = (id: string, start: string, duration: number) => ({ id, start, duration });

describe("findClashes", () => {
  it("finds an overlap", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 45),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.get("A")).toEqual(["B"]);
    expect(c.get("B")).toEqual(["A"]);
  });

  it("does not flag back-to-back sessions — touching is not overlapping", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 30),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.size).toBe(0);
  });

  it("handles three-way overlaps", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 60),
      s("B", "2027-06-03T10:15:00+02:00", 15),
      s("C", "2027-06-03T10:30:00+02:00", 15),
    ]);
    expect(c.get("A")!.sort()).toEqual(["B", "C"]);
  });

  it("is empty for a single session", () => {
    expect(findClashes([s("A", "2027-06-03T10:00:00+02:00", 30)]).size).toBe(0);
  });

  it("dedupes by id, so a session cannot clash with its own on-screen twin", () => {
    // Every session renders twice — once in the grid, once in the list. A
    // caller passing raw `.session-card` results would otherwise report every
    // bookmark as clashing with itself.
    const twin = s("A", "2027-06-03T10:00:00+02:00", 45);
    expect(findClashes([twin, { ...twin }]).size).toBe(0);
  });

  it("reports no clash for an unparseable start rather than throwing", () => {
    // `new Date("").getTime()` is NaN and every NaN comparison is false, so the
    // item drops out of the pairing instead of taking the drawer down.
    const c = findClashes([
      s("A", "", 45),
      s("B", "2027-06-03T10:00:00+02:00", 45),
    ]);
    expect(c.size).toBe(0);
  });
});

describe("substituteClashLabel", () => {
  it("substitutes both tokens", () => {
    expect(substituteClashLabel("chevauche {title} ({room})", "Scaling eBPF", "Piaf")).toBe(
      "chevauche Scaling eBPF (Piaf)",
    );
  });

  it("does not substitute into text it just inserted", () => {
    // Two sequential `.replace` calls would put the room inside the title.
    expect(
      substituteClashLabel("chevauche {title} ({room})", "Scheduling {room} at scale", "Piaf"),
    ).toBe("chevauche Scheduling {room} at scale (Piaf)");
  });

  it("does not treat $& in a title as a replacement pattern", () => {
    expect(
      substituteClashLabel("chevauche {title} ({room})", "Rust & $& Friends", "Eiffel"),
    ).toBe("chevauche Rust & $& Friends (Eiffel)");
  });

  it("leaves a token the caller did not supply untouched", () => {
    expect(substituteTokens("chevauche {title} ({speaker})", { title: "eBPF" })).toBe(
      "chevauche eBPF ({speaker})",
    );
  });
});
