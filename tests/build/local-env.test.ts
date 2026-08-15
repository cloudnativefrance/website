/**
 * Guards on how the Pretalx token is handled locally.
 *
 * Two failure modes, both silent:
 *
 * 1. The token gets committed. `.env*` is gitignored today; a well-meaning
 *    "let's track the example file" edit could widen that.
 * 2. The token reaches the browser. Astro ships any `PUBLIC_`-prefixed variable
 *    into the client bundle. `PRETALX_API_TOKEN` has no such prefix and must
 *    never gain one — the name alone is what keeps it server-side.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { loadLocalEnv } from "../../scripts/load-local-env.mjs";

describe("local env files stay out of git", () => {
  it("ignores .env and .env.local", () => {
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.\*$/m);
  });

  it("git itself agrees they are ignored", () => {
    // The .gitignore text could be right while a negation elsewhere re-includes
    // them, so ask git rather than trusting the pattern.
    const out = execFileSync("git", ["check-ignore", "-v", ".env.local", ".env"], {
      encoding: "utf8",
    });
    expect(out).toContain(".env.local");
    expect(out).toContain(".env");
  });

  it("ships an .env.example that carries no value", () => {
    expect(existsSync(".env.example")).toBe(true);
    const example = readFileSync(".env.example", "utf8");
    expect(example).toMatch(/^PRETALX_API_TOKEN=\s*$/m);
  });
});

describe("the token cannot reach the browser", () => {
  it("is never named with a PUBLIC_ prefix anywhere in the source", () => {
    // Astro inlines PUBLIC_* into the client bundle. This name must stay bare.
    const grep = () => {
      try {
        return execFileSync(
          "git",
          // This file is excluded: it names the forbidden prefix in order to
          // search for it, and would otherwise always match itself.
          ["grep", "-l", "PUBLIC_PRETALX", "--", ".", ":(exclude)tests/build/local-env.test.ts"],
          { encoding: "utf8" },
        );
      } catch {
        return ""; // git grep exits non-zero when there are no matches
      }
    };
    expect(grep().trim()).toBe("");
  });

  it("astro.config.mjs does not expose it through envField", () => {
    const config = readFileSync("astro.config.mjs", "utf8");
    expect(config).not.toMatch(/PRETALX_API_TOKEN[\s\S]{0,120}client/);
  });
});

describe("loadLocalEnv", () => {
  it("never clobbers a variable the shell or CI already set", () => {
    // CI passes the token by other means; a file in the workspace must not win.
    process.env.PRETALX_LOAD_TEST = "from-shell";
    loadLocalEnv();
    expect(process.env.PRETALX_LOAD_TEST).toBe("from-shell");
    delete process.env.PRETALX_LOAD_TEST;
  });

  it("is safe to call when no env file exists", () => {
    expect(() => loadLocalEnv("/nonexistent-directory-for-this-test")).not.toThrow();
  });
});
