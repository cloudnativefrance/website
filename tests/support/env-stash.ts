/**
 * Save, clear and restore a set of environment variables around every test in
 * a file.
 *
 * Several suites need `process.env` to hold a known shape — a token absent, a
 * flag override unset — and must hand the developer's real environment back
 * afterwards, or the next file inherits whatever the last one left. Each of
 * them had hand-rolled the same save/delete/restore `Map`, differing only in
 * the key list.
 *
 * Call it at file top level; it registers its own `beforeEach`/`afterEach`.
 * Vitest runs hooks in registration order, so a suite's own hooks still see a
 * cleared environment when this is called first — and are free to set the keys
 * they want, since the saved values are captured before they run.
 */
import { beforeEach, afterEach } from "vitest";

export function stashEnv(keys: readonly string[]): void {
  const saved = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of keys) {
      saved.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    saved.clear();
  });
}
