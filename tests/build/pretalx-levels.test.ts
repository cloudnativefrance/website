/**
 * Guards the talk-level pipeline, which is the one field that reaches the site
 * through an authenticated read.
 *
 * Two things are worth guarding and neither is obvious from the code:
 *
 * 1. **The right question.** Pretalx question 4 is "Niveau de la présentation"
 *    (how demanding the talk is). Question 1 is "Quel est votre niveau en tant
 *    qu'intervenant(e) ?" (how experienced the speaker is). They read almost
 *    identically, their option sets overlap, and only one belongs on a schedule.
 *    Reading the wrong one would produce plausible, entirely wrong levels.
 *
 * 2. **The allowlist.** Levels are fetched from the authenticated answers
 *    endpoint, which can see submissions that are not in any released schedule.
 *    Only talks present in the public export may come back.
 *
 * Needs a token, so it skips (never silently passes) without one.
 */
import { describe, it, expect } from "vitest";
import { loadSessions } from "@/lib/schedule";
import { toLevel } from "@/lib/pretalx";
import {
  LEVEL_QUESTION_ID,
  assertLevelQuestionText,
  loadLevelAnswers,
  reanchor,
  SPEAKER_QUESTIONS,
} from "@/lib/pretalx-private";

const hasToken = Boolean(
  process.env.PRETALX_API_TOKEN?.trim() || process.env.PRETALX_API_TOKEN_FILE?.trim(),
);

describe("toLevel", () => {
  it("maps the three Pretalx options onto the site's union", () => {
    expect(toLevel("Tout public")).toBe("beginner");
    expect(toLevel("Intermédiaire")).toBe("intermediate");
    expect(toLevel("Confirmé")).toBe("advanced");
  });

  it("tolerates unaccented and differently-cased answers", () => {
    expect(toLevel("intermediaire")).toBe("intermediate");
    expect(toLevel("  CONFIRMÉ ")).toBe("advanced");
  });

  it("returns empty for anything it does not recognise, rather than guessing", () => {
    // "Débutant" belongs to question 1 (speaker experience). If it ever shows up
    // here, we are reading the wrong question — better to render no chip than to
    // silently relabel every talk.
    expect(toLevel("Débutant")).toBe("");
    expect(toLevel(undefined)).toBe("");
    expect(toLevel("")).toBe("");
  });
});

describe("level question wiring", () => {
  it("pins the level question id away from the speaker-experience one", () => {
    expect(LEVEL_QUESTION_ID[2026]).toBe(4);
    // The speaker questions this project created start at 15; if they ever
    // collide with the level id, the enrichment and level reads would cross.
    expect(Object.values(SPEAKER_QUESTIONS[2026]!)).not.toContain(LEVEL_QUESTION_ID[2026]);
  });

  it("keys question ids per edition, so 2027 does not silently reuse 2026's", () => {
    // Pretalx ids belong to the question object, not to a per-event slot —
    // 2027's own ids (read from its /questions/ list once the event existed)
    // are a completely different set of numbers from 2026's, and the level id
    // stays clear of the speaker-question ids on 2027 too.
    expect(LEVEL_QUESTION_ID[2027]).toBe(22);
    expect(SPEAKER_QUESTIONS[2027]).toEqual({
      company: 32,
      role: 33,
      linkedin: 34,
      github: 35,
      bluesky: 36,
      website: 37,
    });
    expect(Object.values(SPEAKER_QUESTIONS[2027]!)).not.toContain(LEVEL_QUESTION_ID[2027]);
  });

  it("has no mapping at all for 2023, which predates the Pretalx instance", () => {
    // The "missing mapping surfaces rather than querying ids that don't
    // exist" behaviour (see MissingQuestionIdError) still needs an edition
    // with no entry to exercise it — 2023 is that edition now that both 2026
    // and 2027 are mapped.
    expect(SPEAKER_QUESTIONS[2023]).toBeUndefined();
    expect(LEVEL_QUESTION_ID[2023]).toBeUndefined();
  });

  it.skipIf(!hasToken)("returns levels only for talks in the released schedule", async () => {
    const rows = await loadSessions(2026);
    const scheduled = new Set(rows.map((r) => r.id));
    const answers = await loadLevelAnswers(2026, "2026", scheduled);

    expect(answers.size).toBeGreaterThan(0);
    for (const code of answers.keys()) {
      expect(scheduled.has(code)).toBe(true);
    }
  });

  it.skipIf(!hasToken)("gives every scheduled talk a level", async () => {
    const rows = await loadSessions(2026);
    const missing = rows.filter((r) => !r.level).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it.skipIf(!hasToken)("produces only values the UI can render", async () => {
    const rows = await loadSessions(2026);
    const seen = new Set(rows.map((r) => r.level));
    for (const level of seen) {
      expect(["beginner", "intermediate", "advanced"]).toContain(level);
    }
  });
});

/**
 * The hardening this whole file's docstring warns about: an id alone proves
 * nothing, because a check that only tests for the word "niveau" passes on
 * BOTH the talk-level question and its speaker-experience sibling. See
 * `assertLevelQuestionText`'s own docstring in pretalx-private.ts for the
 * two-sided rule this pins.
 */
describe("assertLevelQuestionText", () => {
  it("passes the real 2027 talk-level question", () => {
    expect(() =>
      assertLevelQuestionText(2027, "2027", 22, "Niveau de la présentation"),
    ).not.toThrow();
  });

  it("REJECTS question 23's real text, even though it also contains \"niveau\"", () => {
    // This is the exact case the design spec's first draft ("contains niveau")
    // got wrong: both questions contain the word, so that check alone cannot
    // tell them apart.
    expect(() =>
      assertLevelQuestionText(
        2027,
        "2027",
        23,
        "Quel est votre niveau en tant qu'intervenant(e) ?",
      ),
    ).toThrow(/does not look like the talk-level question/);
  });

  it("rejects a missing or renamed question, rather than reading an empty string as valid", () => {
    expect(() => assertLevelQuestionText(2027, "2027", 22, undefined)).toThrow(
      /no question with that id/,
    );
  });

  it("names the configured question id and the event in the failure", () => {
    // Whoever is debugging this at 2am needs to see which id they pointed at
    // and which event it was fetched from, not just "something is wrong".
    expect(() => assertLevelQuestionText(2027, "2027", 23, "unrelated text")).toThrow(
      /LEVEL_QUESTION_ID\[2027\] = 23 on event "2027"/,
    );
  });

  it("rejects empty text the same way as a missing question", () => {
    expect(() => assertLevelQuestionText(2027, "2027", 22, "")).toThrow(
      /does not look like the talk-level question/,
    );
  });
});

describe("paginated reads stay on the authenticated origin", () => {
  it("rewrites Pretalx's http:// next links back to https", () => {
    // Pretalx emits `next` as http:// even when served over https. Following it
    // verbatim is a cross-origin hop, which drops the Authorization header and
    // 401s on page two — so a 297-answer question silently returned only its
    // first 50 before this was fixed.
    expect(reanchor("http://cfp.cloudnativedays.fr/api/events/2026/answers/?page=2")).toBe(
      "https://cfp.cloudnativedays.fr/api/events/2026/answers/?page=2",
    );
  });

  it("preserves the cursor query string", () => {
    expect(
      reanchor("http://cfp.cloudnativedays.fr/api/events/2026/answers/?question=4&limit=50&page=3"),
    ).toContain("question=4&limit=50&page=3");
  });
});
