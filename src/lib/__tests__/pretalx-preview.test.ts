import { describe, it, expect } from "vitest";
import { toPreviewSessions, toPreviewSpeakers } from "@/lib/pretalx-preview";

const rooms = new Map([
  [1, "Monet"],
  [2, "Piaf"],
]);

const submission = {
  code: "ABC123",
  title: "Scaling etcd",
  description: "How we did it",
  duration: 30,
  content_locale: "fr",
  tags: ["ops"],
  state: "confirmed",
  track: { name: { fr: "Infrastructure" }, color: "#edbb45" },
  submission_type: { name: { fr: "Talk" } },
  speakers: [{ code: "S1", name: "Ada Lovelace", biography: "bio" }],
  answers: [{ question: { id: 4 }, answer: "Intermédiaire" }],
};

const slot = {
  id: 1,
  submission: "ABC123",
  room: 1,
  start: "2027-06-03T10:30:00+02:00",
  end: "2027-06-03T11:00:00+02:00",
  duration: 30,
  is_visible: true,
  schedule: 12,
};

const resolve = () => "ada-lovelace";

describe("toPreviewSessions", () => {
  it("joins a slot to its submission", () => {
    const [row] = toPreviewSessions([slot], [submission], rooms, resolve, 4);
    expect(row).toMatchObject({
      id: "ABC123",
      title: "Scaling etcd",
      speakers: ["ada-lovelace"],
      track: "Infrastructure",
      trackColor: "#edbb45",
      level: "intermediate",
      room: "Monet",
      startTime: "2027-06-03T10:30:00+02:00",
      durationMin: 30,
      language: "fr",
      status: "confirmed",
    });
  });

  it("marks an invisible slot hidden so the shared exit filter drops it", () => {
    const [row] = toPreviewSessions(
      [{ ...slot, is_visible: false }],
      [submission],
      rooms,
      resolve,
      4,
    );
    expect(row.status).toBe("hidden");
  });

  it("leaves level empty when no question id is configured", () => {
    const [row] = toPreviewSessions(
      [slot],
      [submission],
      rooms,
      resolve,
      undefined,
    );
    expect(row.level).toBe("");
  });

  it("drops a slot whose submission is absent rather than emitting a blank row", () => {
    expect(
      toPreviewSessions(
        [{ ...slot, submission: "GONE" }],
        [submission],
        rooms,
        resolve,
        4,
      ),
    ).toEqual([]);
  });

  it("orders by start time, then room", () => {
    const later = {
      ...slot,
      id: 2,
      submission: "ABC123",
      start: "2027-06-03T14:00:00+02:00",
    };
    const rows = toPreviewSessions(
      [later, slot],
      [submission],
      rooms,
      resolve,
      4,
    );
    expect(rows.map((r) => r.startTime)).toEqual([
      "2027-06-03T10:30:00+02:00",
      "2027-06-03T14:00:00+02:00",
    ]);
  });

  it("never emits a submission that has no slot in the wip schedule", () => {
    const extra = { ...submission, code: "NOTSCHEDULED" };
    const rows = toPreviewSessions(
      [slot],
      [submission, extra],
      rooms,
      resolve,
      4,
    );
    expect(rows.map((r) => r.id)).toEqual(["ABC123"]);
  });

  it("does not route duration through the HH:MM parser", () => {
    // submission.duration is minutes already (30), not "HH:MM" — a value that
    // would throw if it were ever passed to durationToMinutes.
    const [row] = toPreviewSessions([slot], [submission], rooms, resolve, 4);
    expect(row.durationMin).toBe(30);
  });

  it("falls back to the submission's abstract when description is null", () => {
    const noDescription = {
      ...submission,
      description: null,
      abstract: "short version",
    };
    const [row] = toPreviewSessions([slot], [noDescription], rooms, resolve, 4);
    expect(row.description).toBe("short version");
  });

  it("leaves format/track/room empty rather than throwing when nested fields are null", () => {
    const bare = { ...submission, track: null, submission_type: null };
    const bareRoomSlot = { ...slot, room: 99 };
    const [row] = toPreviewSessions([bareRoomSlot], [bare], rooms, resolve, 4);
    expect(row.track).toBe("");
    expect(row.trackColor).toBeUndefined();
    expect(row.room).toBe("");
    expect(row.format).toBe("talk");
  });
});

const speaker = {
  code: "S1",
  name: "Ada Lovelace",
  biography: "Computing pioneer.",
  avatar_url: "https://cfp.cloudnativedays.fr/media/avatars/s1.jpg",
  answers: [
    { question: { id: 15 }, answer: "Analytical Engines Ltd" },
    { question: { id: 16 }, answer: "Mathematician" },
  ],
};

const fieldQuestionIds = {
  company: 15,
  role: 16,
  linkedin: 17,
  github: 18,
  bluesky: 19,
  website: 20,
};

describe("toPreviewSpeakers", () => {
  it("maps a scheduled speaker's answers to the SpeakerRecord fields", () => {
    const [record] = toPreviewSpeakers(
      [speaker],
      new Set(["S1"]),
      resolve,
      fieldQuestionIds,
      2027,
    );
    expect(record).toMatchObject({
      slug: "ada-lovelace",
      name: "Ada Lovelace",
      photo_url: "https://cfp.cloudnativedays.fr/media/avatars/s1.jpg",
      photo_fallback: "",
      company: "Analytical Engines Ltd",
      role: "Mathematician",
      bio: "Computing pioneer.",
      linkedin: "",
      keynote: false,
      keynote_size: undefined,
    });
  });

  it("drops a speaker whose code has no scheduled slot", () => {
    // /speakers/ returns everyone who ever submitted, rejected and pending
    // included — allowedCodes is the allowlist, same rule as sessions.
    expect(
      toPreviewSpeakers([speaker], new Set(), resolve, fieldQuestionIds, 2027),
    ).toEqual([]);
  });

  it("leaves company/role/socials empty when no question ids are configured", () => {
    const [record] = toPreviewSpeakers(
      [speaker],
      new Set(["S1"]),
      resolve,
      undefined,
      2027,
    );
    expect(record).toMatchObject({
      company: "",
      role: "",
      linkedin: "",
      github: "",
      bluesky: "",
      website: "",
    });
  });

  it("never emits avatar_url null as a literal string", () => {
    const noAvatar = { ...speaker, avatar_url: null };
    const [record] = toPreviewSpeakers(
      [noAvatar],
      new Set(["S1"]),
      resolve,
      fieldQuestionIds,
      2027,
    );
    expect(record.photo_url).toBe("");
  });
});
