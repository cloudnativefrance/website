import { describe, it, expect, vi, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fetchTextOrFallback, __clearCacheForTests } from "../remote-fetch";

const DIR = "src/lib/__tests__/tmp-remote-fetch";
const REL = `${DIR}/fallback.txt`;

function withFallback(body: string) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(REL, body, "utf8");
}

afterEach(() => {
  __clearCacheForTests();
  vi.unstubAllGlobals();
  rmSync(DIR, { recursive: true, force: true });
});

describe("fetchTextOrFallback", () => {
  it("reads the local file when no URL is configured", async () => {
    withFallback("local body");
    const out = await fetchTextOrFallback({ url: undefined, fallbackRelPath: REL });
    expect(out).toBe("local body");
  });

  it("returns the remote body on success", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("remote body", { status: 200 }));
    const out = await fetchTextOrFallback({ url: "https://example.test/a", fallbackRelPath: REL });
    expect(out).toBe("remote body");
  });

  it("falls back on a non-2xx response", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 503 }));
    const out = await fetchTextOrFallback({ url: "https://example.test/b", fallbackRelPath: REL });
    expect(out).toBe("local body");
  });

  it("falls back when validate throws", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("<html>login</html>", { status: 200 }));
    const out = await fetchTextOrFallback({
      url: "https://example.test/c",
      fallbackRelPath: REL,
      validate: (body) => {
        if (!body.startsWith("{")) throw new Error("not JSON");
      },
    });
    expect(out).toBe("local body");
  });

  it("memoises by URL so one build fetches once", async () => {
    withFallback("local body");
    let calls = 0;
    vi.stubGlobal("fetch", async () => {
      calls++;
      return new Response("remote body", { status: 200 });
    });
    const url = "https://example.test/d";
    await fetchTextOrFallback({ url, fallbackRelPath: REL });
    await fetchTextOrFallback({ url, fallbackRelPath: REL });
    expect(calls).toBe(1);
  });
});
