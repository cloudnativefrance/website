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
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    //
    // One path per call, and the matched RULE is checked — not just that the
    // path appears somewhere in the output. `check-ignore` exits 0 when ANY
    // argument matches, so passing both at once meant a re-included `.env`
    // still gave exit 0 plus output containing the string ".env" (as a
    // substring of the ".env.local" line). Adding `!.env` to .gitignore left
    // this green.
    for (const path of [".env", ".env.local"]) {
      const out = execFileSync("git", ["check-ignore", "-v", path], { encoding: "utf8" });
      // Format: <source>:<line>:<pattern>\t<path>. A leading "!" is a negation,
      // which means the file is re-included, i.e. NOT ignored.
      const [, , pattern] = out.split("\t")[0].split(":");
      expect(pattern.startsWith("!"), `${path} is re-included by ${pattern}`).toBe(false);
      expect(out.split("\t")[1].trim()).toBe(path);
    }
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
  // The fixture is written to a temp dir rather than committed: `.env` and
  // `.env.*` are gitignored at every depth, so a checked-in fixture would
  // vanish on a fresh clone and take the test's meaning with it.
  function fixtureDir(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), "cnd-env-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  }

  it("never clobbers a variable the shell or CI already set", () => {
    // CI passes the token by other means; a file in the workspace must not win.
    // The env file MUST actually contain the key — with a key absent from every
    // file, loadLocalEnv never reaches its precedence check and the test passes
    // no matter what that check says.
    const dir = fixtureDir({ ".env": "PRETALX_LOAD_TEST=from-file\n" });
    process.env.PRETALX_LOAD_TEST = "from-shell";
    try {
      loadLocalEnv(dir);
      expect(process.env.PRETALX_LOAD_TEST).toBe("from-shell");
    } finally {
      delete process.env.PRETALX_LOAD_TEST;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does load a variable the shell has not set", () => {
    // The other half of the contract — without this, a loadLocalEnv that loaded
    // nothing at all would satisfy the precedence test above.
    const dir = fixtureDir({ ".env": "PRETALX_LOAD_TEST=from-file\n" });
    try {
      loadLocalEnv(dir);
      expect(process.env.PRETALX_LOAD_TEST).toBe("from-file");
    } finally {
      delete process.env.PRETALX_LOAD_TEST;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("lets .env.local win over .env", () => {
    const dir = fixtureDir({
      ".env": "PRETALX_LOAD_TEST=from-env\n",
      ".env.local": "PRETALX_LOAD_TEST=from-env-local\n",
    });
    try {
      loadLocalEnv(dir);
      expect(process.env.PRETALX_LOAD_TEST).toBe("from-env-local");
    } finally {
      delete process.env.PRETALX_LOAD_TEST;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is safe to call when no env file exists", () => {
    expect(() => loadLocalEnv("/nonexistent-directory-for-this-test")).not.toThrow();
  });
});
