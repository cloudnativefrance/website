/**
 * EDIT-04 asset budget guard (Phase 16, success criterion 1, D-01/D-02/D-03).
 *
 * Asserts the committed KCD 2023 asset bundle stays within budget:
 *   - exactly 10 JPG photo masters
 *   - each ≤ 1 MB
 *   - total ≤ 7 MB
 *   - logo.svg + logo-dark.svg present
 *
 * Photo tests skip (do not fail) if the photos directory does not exist yet —
 * this lets the test land before the human photo-drop gate closes without
 * blocking CI. Once the directory exists, the assertions become live.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const PHOTOS_DIR = resolve(
  import.meta.dirname,
  "../../src/assets/photos/kcd2023",
);
const LOGO_LIGHT = resolve(
  import.meta.dirname,
  "../../src/assets/logos/kcd2023/logo.svg",
);
const LOGO_DARK = resolve(
  import.meta.dirname,
  "../../src/assets/logos/kcd2023/logo-dark.svg",
);

const SIZE_CEIL = 1024 * 1024;
const TOTAL_CEIL = 7 * 1024 * 1024;
const TARGET_COUNT = 10;

const photosExist = existsSync(PHOTOS_DIR);

describe("EDIT-04: KCD 2023 photo budget", () => {
  it.skipIf(!photosExist)(
    `contains exactly ${TARGET_COUNT} JPG masters`,
    () => {
      const jpgs = readdirSync(PHOTOS_DIR).filter((f) => f.endsWith(".jpg"));
      expect(
        jpgs.length,
        `Expected ${TARGET_COUNT} JPG files, found ${jpgs.length}: ${jpgs.join(", ")}`,
      ).toBe(TARGET_COUNT);
    },
  );

  it.skipIf(!photosExist)("every JPG master is ≤ 1 MB", () => {
    const offenders: Array<{ file: string; bytes: number }> = [];
    for (const f of readdirSync(PHOTOS_DIR).filter((x) => x.endsWith(".jpg"))) {
      const bytes = statSync(join(PHOTOS_DIR, f)).size;
      if (bytes > SIZE_CEIL) offenders.push({ file: f, bytes });
    }
    expect(
      offenders,
      `Files exceeding 1 MB ceiling: ${offenders
        .map((o) => `${o.file}=${(o.bytes / 1024).toFixed(0)}KB`)
        .join(", ")}`,
    ).toEqual([]);
  });

  it.skipIf(!photosExist)("total JPG size ≤ 7 MB", () => {
    let total = 0;
    for (const f of readdirSync(PHOTOS_DIR).filter((x) => x.endsWith(".jpg"))) {
      total += statSync(join(PHOTOS_DIR, f)).size;
    }
    expect(
      total,
      `Total ${(total / 1024 / 1024).toFixed(2)} MB exceeds 7 MB ceiling`,
    ).toBeLessThanOrEqual(TOTAL_CEIL);
  });
});

describe("D-03: KCD 2023 logo assets", () => {
  it("logo.svg exists", () => {
    expect(existsSync(LOGO_LIGHT), `Missing ${LOGO_LIGHT}`).toBe(true);
  });

  it("logo-dark.svg exists", () => {
    expect(existsSync(LOGO_DARK), `Missing ${LOGO_DARK}`).toBe(true);
  });
});
