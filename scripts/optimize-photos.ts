#!/usr/bin/env tsx
/**
 * Phase 16 / EDIT-04: KCD 2023 photo optimization pipeline.
 *
 * Inputs:  ./_photo-drop/kcd2023/*.{jpg,jpeg,png,webp,heic} (git-ignored)
 * Outputs: ./src/assets/photos/kcd2023/01.jpg..10.jpg (committed, ≤1 MB each, ≤7 MB total)
 *
 * Idempotent: skips outputs that already exist (re-run is a no-op).
 * Source: sharp 0.34 docs https://sharp.pixelplumbing.com/api-output#jpeg
 */
import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const SRC_DIR = process.env.KCD2023_SRC ?? "./_photo-drop/kcd2023";
const OUT_DIR = "./src/assets/photos/kcd2023";
const MAX_W = 2400;
const QUALITY_START = 80;
const QUALITY_FLOOR = 50;
const QUALITY_STEP = 5;
const SIZE_CEIL = 1_024 * 1_024;
const TOTAL_CEIL = 7 * 1_024 * 1_024;
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"]);
const TARGET_COUNT = 10;

async function optimize(input: string, outPath: string): Promise<number> {
  if (existsSync(outPath)) {
    const s = await stat(outPath);
    console.log(`[skip] ${outPath} (${(s.size / 1024).toFixed(0)} KB)`);
    return s.size;
  }
  let quality = QUALITY_START;
  while (quality >= QUALITY_FLOOR) {
    const buf = await sharp(input)
      .rotate()
      .resize({ width: MAX_W, height: MAX_W, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0", progressive: true })
      .toBuffer();
    if (buf.byteLength <= SIZE_CEIL) {
      await sharp(buf).toFile(outPath);
      console.log(`[write] ${outPath} @ q${quality} → ${(buf.byteLength / 1024).toFixed(0)} KB`);
      return buf.byteLength;
    }
    console.log(`[retry] ${outPath} @ q${quality} → ${(buf.byteLength / 1024).toFixed(0)} KB > 1 MB, dropping quality`);
    quality -= QUALITY_STEP;
  }
  throw new Error(`[FAIL] ${input}: could not get under 1 MB even at quality ${QUALITY_FLOOR}`);
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source directory ${SRC_DIR} does not exist. Drop originals there first.`);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const entries = (await readdir(SRC_DIR))
    .filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
    .sort();
  if (entries.length < TARGET_COUNT) {
    throw new Error(`Need ${TARGET_COUNT} originals in ${SRC_DIR}, found ${entries.length}`);
  }
  const picked = entries.slice(0, TARGET_COUNT);
  let total = 0;
  for (let i = 0; i < picked.length; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const out = join(OUT_DIR, `${idx}.jpg`);
    const bytes = await optimize(join(SRC_DIR, picked[i]), out);
    total += bytes;
  }
  console.log(`\n[total] ${(total / 1024 / 1024).toFixed(2)} MB / ${(TOTAL_CEIL / 1024 / 1024).toFixed(0)} MB budget`);
  if (total > TOTAL_CEIL) {
    throw new Error(`[FAIL] Total ${(total / 1024 / 1024).toFixed(2)} MB exceeds 7 MB ceiling`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
