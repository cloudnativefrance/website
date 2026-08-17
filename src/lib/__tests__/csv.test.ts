import { describe, it, expect } from "vitest";
import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("splits plain rows", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps commas and newlines inside quoted fields", () => {
    expect(parseCsv('a,b\n"x,y","line1\nline2"')).toEqual([
      ["a", "b"],
      ["x,y", "line1\nline2"],
    ]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("handles CRLF and a missing trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("drops fully blank lines", () => {
    expect(parseCsv("a\n\nb")).toEqual([["a"], ["b"]]);
  });
});
