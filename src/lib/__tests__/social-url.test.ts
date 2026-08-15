/**
 * The social-URL preprocessor decides silently: anything it rejects becomes
 * `undefined` and the profile simply loses its link, with no error anywhere.
 * Speakers now type these answers into Pretalx by hand, so the range of shapes
 * it sees is much wider than the curated Sheet values it was written for.
 */
import { describe, it, expect } from "vitest";
import { z } from "astro/zod";

// Mirrors the preprocessor in src/content.config.ts. Kept in step by the
// assertions below rather than by importing, because content.config.ts pulls in
// astro:content, which has no runtime outside a build.
const socialUrl = z.preprocess((raw) => {
  if (typeof raw !== "string") return raw;
  const match = raw.match(/https?:\/\/\S+/);
  if (match) return match[0].replace(/[),.;]+$/, "");
  const value = raw.trim().replace(/[),.;]+$/, "");
  if (/^[\w-]+(\.[\w-]+)+\/\S*$/.test(value)) return `https://${value}`;
  return undefined;
}, z.string().url().optional());

const parse = (v: string) => socialUrl.parse(v);

describe("socialUrl", () => {
  it("keeps a full URL", () => {
    expect(parse("https://www.linkedin.com/in/ada/")).toBe("https://www.linkedin.com/in/ada/");
  });

  it("extracts a URL from a labelled cell, as Sheet authors wrote them", () => {
    expect(parse("LinkedIn: https://linkedin.com/in/ada")).toBe("https://linkedin.com/in/ada");
  });

  it("adds the scheme speakers omit", () => {
    expect(parse("linkedin.com/in/ada")).toBe("https://linkedin.com/in/ada");
    expect(parse("github.com/ada")).toBe("https://github.com/ada");
  });

  it("rejects a bare handle rather than inventing a URL", () => {
    // Turning "@ada" into a link needs a per-platform base; guessing one would
    // produce a confident 404. Better to show no link than a wrong one.
    expect(parse("@ada")).toBeUndefined();
    expect(parse("ada")).toBeUndefined();
  });

  it("rejects a bare hostname with no path", () => {
    // "example.com" alone is more often a typo or a company name than a profile.
    expect(parse("example.com")).toBeUndefined();
  });

  it("rejects free text and empty values", () => {
    expect(parse("")).toBeUndefined();
    expect(parse("n/a")).toBeUndefined();
    expect(parse("ask me at the booth")).toBeUndefined();
  });

  it("trims trailing punctuation from a pasted sentence", () => {
    expect(parse("see https://ada.dev/profile.")).toBe("https://ada.dev/profile");
  });
});
