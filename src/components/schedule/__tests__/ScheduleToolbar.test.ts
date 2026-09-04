// The toolbar's ids are a hard contract with the client island in
// schedule-ui.ts: that script binds to each id verbatim, so a renamed id is
// a silently dead control (no runtime error, no type error — the button just
// stops doing anything). Nothing else in the pipeline enforces the contract,
// so this test pins it directly against the rendered markup.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import ScheduleToolbar from "../ScheduleToolbar.astro";
import type { SessionRow } from "@/lib/schedule";

function row(over: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "AAA111",
    title: "Test session",
    speakers: [],
    track: "",
    level: "",
    room: "Monet",
    format: "talk",
    startTime: "2026-02-03T11:15:00+01:00",
    durationMin: 45,
    tags: [],
    feedbackUrl: "",
    slidesUrl: "",
    recordingUrl: "",
    coverImageUrl: "",
    language: "fr",
    status: "confirmed",
    description: "",
    ...over,
  };
}

// Three sessions spread across room/format/track so those facets render —
// none carries a `level`, so the level facet must be omitted entirely.
const sessions: SessionRow[] = [
  row({ id: "A", room: "Monet", format: "talk", track: "Cloud Native" }),
  row({ id: "B", room: "Piaf", format: "keynote", track: "" }),
  row({ id: "C", room: "Debussy", format: "workshop", track: "FinOps" }),
];

async function renderToolbar() {
  const container = await AstroContainer.create();
  return container.renderToString(ScheduleToolbar, {
    props: { sessions, lang: "fr", defaultView: "grid" },
  });
}

const CONTRACT_IDS = [
  "schedule-search",
  "schedule-search-clear",
  "schedule-view-grid",
  "schedule-view-list",
  "schedule-result-count",
  "schedule-filter-clear",
  "schedule-filter-active-count",
  "schedule-agenda-toggle",
  "schedule-agenda-count",
  "schedule-export-all",
];

describe("ScheduleToolbar — id contract with the client island", () => {
  it("renders all ten ids the island binds to", async () => {
    const html = await renderToolbar();
    for (const id of CONTRACT_IDS) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("gives every filter chip the schedule-filter class plus data-filter and data-value", async () => {
    const html = await renderToolbar();
    const chips = [...html.matchAll(/<button[^>]*class="schedule-filter"[^>]*>/g)];
    // Room (3) + format (2: talk, keynote, workshop -> 3 actually) + track (2) —
    // don't hardcode a count, just require at least one and check each one.
    expect(chips.length).toBeGreaterThan(0);
    for (const [tag] of chips) {
      expect(tag).toMatch(/data-filter="[^"]+"/);
      expect(tag).toMatch(/data-value="[^"]+"/);
    }
  });

  it("emits no <script> tag — all interactivity is deferred to the island", async () => {
    const html = await renderToolbar();
    expect(html).not.toMatch(/<script/i);
  });

  it("omits a facet entirely when none of the sessions set a value for it", async () => {
    // None of the fixture sessions has a `level`, so no level chip, and no
    // empty "Niveau" group, should be rendered — the facet list is filtered
    // before mapping, not mapped-then-hidden.
    const html = await renderToolbar();
    expect(html).not.toContain('data-filter="level"');
    // The other three facets, which do have values, must still be present.
    expect(html).toContain('data-filter="room"');
    expect(html).toContain('data-filter="format"');
    expect(html).toContain('data-filter="track"');
  });
});

describe("ScheduleToolbar — the audience control", () => {
  const renderWith = async (list: SessionRow[]) => {
    const container = await AstroContainer.create();
    return container.renderToString(ScheduleToolbar, {
      props: { sessions: list, lang: "fr", defaultView: "grid" },
    });
  };

  it("is absent — not disabled — when every session is one audience", async () => {
    const html = await renderWith([row({ track: "Cloud Native" })]);
    expect(html).not.toContain("data-audience-switch");
  });

  it("appears when an edition has sessions in both audiences", async () => {
    const html = await renderWith([
      row({ id: "A", track: "Cloud Native" }),
      row({ id: "B", track: "Strategy & Leadership", room: "Eiffel" }),
    ]);
    expect(html).toContain("data-audience-switch");
    expect(html).toContain('data-audience="leadership"');
  });
});
