/**
 * Guards the Sheet -> Pretalx migration: the normalized output must match the
 * live Sheet field-by-field on everything the Sheet actually carried.
 *
 * Network-dependent on purpose. Skipped (not passed) when the Sheet is
 * unreachable, so CI in a sandbox reports SKIPPED rather than a false green.
 *
 * The Sheet fetch happens at module top level (not in beforeAll) so its
 * result is known before `it.skipIf(...)` evaluates its condition —
 * `skipIf` takes a plain value, evaluated at collection time, which runs
 * before any `beforeAll` hook would.
 */
import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv";
import { loadSessions } from "@/lib/schedule";

// getCsvUrl("sessions", ...) no longer exists — the sessions entries were
// removed from CSV_URLS when Pretalx became the source. This is the same
// published Sheet tab the pipeline used to read, kept here only as the
// parity baseline this test measures the new pipeline against.
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=178765557&single=true&output=csv";

async function fetchSheet(): Promise<Record<string, string>[] | null> {
  try {
    const res = await fetch(SHEET_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const [header, ...body] = parseCsv(await res.text());
    return body
      .map((row) => Object.fromEntries(header.map((h, i) => [h.trim(), (row[i] ?? "").trim()])))
      .filter((r) => r.id);
  } catch {
    return null;
  }
}

const sheet = await fetchSheet();

// Talks where Pretalx and the Sheet agree on the set of speakers but not their
// order. Pretalx's order is the organisers' own and is authoritative going
// forward, so this is an accepted divergence, not a defect — see the
// dedicated ordering test below, which pins this list down so a fourth talk
// drifting would be caught instead of silently swallowed by a set comparison.
const SPEAKER_ORDER_EXCEPTIONS = new Set(["DHAXQN", "V7UJ7V", "8HZM98"]);

// The Pretalx event's only content locale is French (content_locales: ["fr"]),
// so there's no structured field to mark a talk as English-spoken. The
// organiser flagged talk ADHUPC by typing a "(Talk EN)" prefix into the title
// itself; the Sheet's copy was hand-cleaned to drop it. Pretalx is now the
// source of truth, so the prefix stays and the site displays it — see the
// dedicated title test below, which pins this exact exception down so a
// second title drifting wouldn't be swallowed by excluding titles wholesale.
const TITLE_EXCEPTION_ID = "ADHUPC";
const TITLE_EXCEPTION_PREFIX = "(Talk EN) ";

describe("Pretalx output matches the Sheet it replaced", () => {
  it.skipIf(!sheet)("has the same talks", async () => {
    const rows = await loadSessions(2026);
    expect(new Set(rows.map((r) => r.id))).toEqual(new Set(sheet!.map((r) => r.id)));
  });

  it.skipIf(!sheet)("agrees on every field the Sheet carried", async () => {
    const rows = await loadSessions(2026);
    const bySheetId = new Map(sheet!.map((r) => [r.id, r]));
    const mismatches: string[] = [];

    for (const row of rows) {
      const s = bySheetId.get(row.id);
      if (!s) continue;
      const check = (field: string, mine: unknown, theirs: unknown) => {
        if (String(mine) !== String(theirs)) {
          mismatches.push(`${row.id} ${field}: pretalx=${JSON.stringify(mine)} sheet=${JSON.stringify(theirs)}`);
        }
      };
      // Title is checked for every talk except the known "(Talk EN)" prefix
      // exception — see TITLE_EXCEPTION_ID and the dedicated title test below.
      if (row.id !== TITLE_EXCEPTION_ID) {
        check("title", row.title, s.title);
      }
      check("room", row.room, s.room);
      check("start", row.startTime, s.start_time);
      check("duration", row.durationMin, Number(s.duration_min));
      check("format", row.format, s.format);
      check("language", row.language, s.language);
      check("track", row.track, s.track);
      // Order-insensitive: same people, order ignored. Pretalx reorders 3 of
      // the 51 talks relative to the Sheet — see SPEAKER_ORDER_EXCEPTIONS and
      // the dedicated ordering test below for that accepted divergence.
      const mineSpeakers = new Set(row.speakers);
      const theirSpeakers = new Set(
        s.speakers.split(",").map((sp) => sp.trim()).filter(Boolean),
      );
      check(
        "speakers (set)",
        [...mineSpeakers].sort().join(","),
        [...theirSpeakers].sort().join(","),
      );
    }

    expect(mismatches).toEqual([]);
  });

  // Pretalx's speaker order authoritatively diverges from the Sheet's on exactly
  // 3 of the 51 talks (same people, different sequence — verified against live
  // data on 2026-08-14). Pretalx wins because its order is the organisers' own,
  // set directly in the tool speakers now come from. This test documents the
  // known exceptions explicitly so the set-based field check above can't quietly
  // absorb a real ordering regression on a talk that isn't supposed to have one.
  it.skipIf(!sheet)("speaker order diverges from the Sheet only on the known exceptions", async () => {
    const rows = await loadSessions(2026);
    const bySheetId = new Map(sheet!.map((r) => [r.id, r]));
    const reordered: string[] = [];

    for (const row of rows) {
      const s = bySheetId.get(row.id);
      if (!s) continue;
      const theirSpeakers = s.speakers.split(",").map((sp) => sp.trim()).filter(Boolean);
      if (row.speakers.join(",") !== theirSpeakers.join(",")) {
        reordered.push(row.id);
      }
    }

    expect(new Set(reordered)).toEqual(SPEAKER_ORDER_EXCEPTIONS);
  });

  // Pretalx's only content locale is French, so there's no structured field to
  // mark a talk as English-spoken — the organiser typed a "(Talk EN)" prefix
  // into ADHUPC's title instead, and the Sheet's copy was hand-cleaned to drop
  // it. Pretalx is authoritative going forward, so the prefix is expected and
  // pinned exactly here, rather than excluded wholesale, so a second title
  // drifting between the two sources would still be caught.
  it.skipIf(!sheet)("title diverges from the Sheet only on the known (Talk EN) exception", async () => {
    const rows = await loadSessions(2026);
    const bySheetId = new Map(sheet!.map((r) => [r.id, r]));
    const diverged: string[] = [];

    for (const row of rows) {
      const s = bySheetId.get(row.id);
      if (!s) continue;
      if (row.title !== s.title) {
        diverged.push(row.id);
      }
    }

    expect(diverged).toEqual([TITLE_EXCEPTION_ID]);

    const exceptionRow = rows.find((r) => r.id === TITLE_EXCEPTION_ID);
    const exceptionSheetRow = bySheetId.get(TITLE_EXCEPTION_ID);
    expect(exceptionRow?.title).toBe(TITLE_EXCEPTION_PREFIX + exceptionSheetRow?.title);
  });

  it.skipIf(!sheet)("does not lose recordings", async () => {
    const rows = await loadSessions(2026);
    const sheetCount = sheet!.filter((r) => r.recording_url).length;
    expect(rows.filter((r) => r.recordingUrl).length).toBeGreaterThanOrEqual(sheetCount);
  });
});
