import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  freezeRefusal,
  snapshotFloors,
  shrinkViolations,
  enrichmentViolations,
  planPhotos,
  serializeArchive,
  type FloorCounts,
} from "../freeze-edition";
import type { PretalxScheduleExport } from "../../../src/lib/pretalx";

describe("freezeRefusal", () => {
  it("accepts a public edition — the freeze's last live read requires it", () => {
    expect(freezeRefusal(2026, "public")).toBeUndefined();
  });

  it("refuses an edition with no registry entry", () => {
    expect(freezeRefusal(2023, undefined)).toMatch(/no PRETALX_EVENT entry/);
  });

  it("refuses a preview edition", () => {
    expect(freezeRefusal(2027, "preview")).toMatch(/access: "preview"/);
  });

  it("refuses an already-frozen edition", () => {
    expect(freezeRefusal(2026, "frozen")).toMatch(/already frozen/);
  });
});

describe("snapshotFloors", () => {
  const doc: PretalxScheduleExport = {
    schedule: {
      version: "v1",
      conference: {
        title: "CND 2026",
        tracks: [],
        days: [
          {
            date: "2026-02-03",
            rooms: {
              Monet: [talk("A1", ["p1", "p2"]), talk("A2", ["p2"])],
              Piaf: [talk("B1", ["p3", "p1"])],
            },
          },
        ],
      },
    },
  } as unknown as PretalxScheduleExport;

  function talk(code: string, personCodes: string[]): unknown {
    return {
      code,
      title: code,
      date: "2026-02-03T10:00:00+01:00",
      duration: "00:20",
      room: "Monet",
      track: null,
      type: "Éclair",
      language: "fr",
      persons: personCodes.map((c) => ({ code: c, name: c })),
    };
  }

  it("counts talks across days and rooms, and distinct persons by code", () => {
    expect(snapshotFloors(doc)).toEqual({ talks: 3, persons: 3 });
  });

  it("derives the committed 2026 snapshot floors: 51 talks, 67 distinct persons", () => {
    const snapshot = JSON.parse(
      readFileSync("src/content/schedule/pretalx-2026.json", "utf8"),
    ) as PretalxScheduleExport;
    expect(snapshotFloors(snapshot)).toEqual({ talks: 51, persons: 67 });
  });
});

describe("enrichmentViolations", () => {
  const rec = (company: string) => ({
    slug: "s",
    name: "n",
    photo_url: "",
    company,
  });

  it("flags an archive where every affiliation is blank — the token was missing and enrichment degraded", () => {
    expect(enrichmentViolations([rec(""), rec("")])).toEqual([
      expect.stringMatching(/no speaker has a company/),
    ]);
  });

  it("says nothing when at least one affiliation came back", () => {
    expect(enrichmentViolations([rec(""), rec("Scaleway")])).toEqual([]);
  });
});

describe("shrinkViolations", () => {
  const floors: FloorCounts = { talks: 51, persons: 67 };

  it("returns nothing when the fetched counts meet the floors", () => {
    expect(shrinkViolations(floors, 51, 77)).toEqual([]);
  });

  it("refuses fewer sessions than the snapshot's talk count", () => {
    expect(shrinkViolations(floors, 50, 77)).toEqual([
      expect.stringMatching(/50 sessions.*51 talks/s),
    ]);
  });

  it("refuses fewer speakers than the snapshot's distinct-person count", () => {
    const violations = shrinkViolations(floors, 51, 66);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/66 speakers.*67 distinct persons/s);
  });
});

describe("planPhotos", () => {
  const rec = (slug: string, photo_url: string) => ({
    slug,
    name: slug,
    photo_url,
  });
  const has = (slugs: string[]) => (slug: string) => slugs.includes(slug);

  it("a committed file wins over any Pretalx URL — the archive must be 100% local", () => {
    const plan = planPhotos(
      [rec("alice", "https://cfp.example.org/media/avatars/alice.jpg")],
      has(["alice"]),
    );
    expect(plan.entries[0]).toMatchObject({
      slug: "alice",
      photo_url: "/speakers/alice.jpg",
      source: "committed",
    });
    expect(plan.downloads).toEqual([]);
  });

  it("keeps an already-local path when the record was built on a committed file", () => {
    const plan = planPhotos([rec("bob", "/speakers/bob.jpg")], has(["bob"]));
    expect(plan.entries[0]).toMatchObject({
      photo_url: "/speakers/bob.jpg",
      source: "committed",
    });
  });

  it("an absolute Pretalx URL with no committed file schedules a one-time download", () => {
    const plan = planPhotos(
      [rec("carol", "https://cfp.example.org/media/avatars/carol.png")],
      has([]),
    );
    expect(plan.entries[0]).toMatchObject({
      photo_url: "/speakers/carol.jpg",
      source: "download",
      downloadUrl: "https://cfp.example.org/media/avatars/carol.png",
    });
    expect(plan.downloads).toHaveLength(1);
  });

  it("no file and no Pretalx URL → empty photo_url, reported as missing (initials)", () => {
    const plan = planPhotos([rec("dave", "")], has([]));
    expect(plan.entries[0]).toMatchObject({ photo_url: "", source: "missing" });
    expect(plan.missing).toEqual(["dave"]);
  });

  it("records when the committed file replaces a Pretalx URL, so the summary can report it", () => {
    const plan = planPhotos(
      [
        rec("alice", "https://cfp.example.org/media/avatars/alice.jpg"),
        rec("bob", "/speakers/bob.jpg"),
      ],
      has(["alice", "bob"]),
    );
    // `over: <url>` is set only when the live build would have served a Pretalx
    // URL and the freeze replaces it with the committed file — the case a
    // visitor could notice, so the summary must print it.
    expect(plan.entries[0].over).toBe(
      "https://cfp.example.org/media/avatars/alice.jpg",
    );
    expect(plan.entries[1].over).toBeUndefined();
  });

  it("a non-absolute, non-committed photo_url cannot be served → missing, loudly", () => {
    // Defensive: photoFor only emits absolute Pretalx URLs, /speakers paths of
    // existing files, or "" — but if an upstream change ever emitted something
    // else for a slug with no committed file, freezing it would ship a broken
    // img src. Treat it as no photo instead.
    const plan = planPhotos([rec("eve", "media/avatars/eve.jpg")], has([]));
    expect(plan.entries[0]).toMatchObject({ photo_url: "", source: "missing" });
    expect(plan.missing).toEqual(["eve"]);
  });
});

describe("serializeArchive", () => {
  it("2-space indent and trailing newline, matching sync-pretalx's snapshot writes", () => {
    expect(serializeArchive([{ a: 1 }])).toBe('[\n  {\n    "a": 1\n  }\n]\n');
  });
});
