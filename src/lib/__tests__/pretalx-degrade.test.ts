/**
 * How a build behaves when the authenticated Pretalx reads fail.
 *
 * The policy has three inputs — the failure kind, `PRETALX_TOKEN_REQUIRED` and
 * `PRETALX_ALLOW_DEGRADED` — and until now none of it was covered: the only
 * assertion anywhere was a grep for the literal flag name in the Dockerfile,
 * which passes whatever the code does with it.
 *
 * The distinction under test is the one that matters at release time. A missing
 * or rejected token is our misconfiguration and must never be degraded past. An
 * unreachable Pretalx is an outage the public half of the build already survives
 * via the committed snapshot, and treating it as fatal meant a blip blocked every
 * deploy.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadLevelAnswers } from "../pretalx-private";

const REQUIRED = "PRETALX_TOKEN_REQUIRED";
const ALLOW = "PRETALX_ALLOW_DEGRADED";
const TOKEN = "PRETALX_API_TOKEN";
const TOKEN_FILE = "PRETALX_API_TOKEN_FILE";

const saved: Record<string, string | undefined> = {};
let slugCounter = 0;

/** The answer caches are keyed by event slug, so each case needs its own. */
function freshSlug(): string {
  return `test-event-${++slugCounter}`;
}

beforeEach(() => {
  for (const k of [REQUIRED, ALLOW, TOKEN, TOKEN_FILE]) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Drive a call that has to sit through the retry backoff.
 *
 * The delays are real seconds, and four cases here exhaust them — left alone
 * this file costs more wall-clock than the rest of the suite combined. The
 * assertion is attached BEFORE the clock is advanced so an expected rejection
 * always has a handler and never surfaces as an unhandled rejection.
 */
async function settledWithBackoff(assertion: Promise<void>): Promise<void> {
  await vi.advanceTimersByTimeAsync(60_000);
  await assertion;
}

/** Stub fetch so nothing in this file touches the network. */
function stubFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

const outage = () => Promise.reject(new TypeError("fetch failed"));
const status = (code: number) => () =>
  new Response("nope", { status: code, statusText: String(code) });
const ok = () =>
  new Response(JSON.stringify({ results: [], next: null }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("a release build (PRETALX_TOKEN_REQUIRED=1)", () => {
  it("fails on a missing token — configuration, never degraded past", async () => {
    process.env[REQUIRED] = "1";
    stubFetch(ok);
    await expect(loadLevelAnswers(2026, freshSlug(), new Set())).rejects.toThrow(/No API token/);
  });

  it("fails on a missing token even when degradation is allowed", async () => {
    // The escape hatch is for outages. A token we never set is our mistake, and
    // shipping past it is exactly the silent-blank-affiliations release the
    // flag exists to prevent.
    process.env[REQUIRED] = "1";
    process.env[ALLOW] = "1";
    stubFetch(ok);
    await expect(loadLevelAnswers(2026, freshSlug(), new Set())).rejects.toThrow(/No API token/);
  });

  it("fails on a rejected token, without retrying it", async () => {
    process.env[REQUIRED] = "1";
    process.env[TOKEN] = "bad-token";
    stubFetch(status(403));
    await expect(loadLevelAnswers(2026, freshSlug(), new Set())).rejects.toThrow(/token rejected/);
    // One attempt, not four: a 403 is not going to change its mind.
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("fails on a sustained outage, and names the lever", async () => {
    process.env[REQUIRED] = "1";
    process.env[TOKEN] = "good-token";
    stubFetch(outage);
    vi.useFakeTimers();
    const call = loadLevelAnswers(2026, freshSlug(), new Set());
    await settledWithBackoff(expect(call).rejects.toThrow(/PRETALX_ALLOW_DEGRADED=1/));
  });

  it("ships degraded on an outage when explicitly allowed", async () => {
    // The regression this whole change is about: the public read falls back to
    // the committed snapshot, then this call used to kill the build anyway, so
    // a Pretalx blip blocked deploys that had nothing to do with the schedule.
    process.env[REQUIRED] = "1";
    process.env[ALLOW] = "1";
    process.env[TOKEN] = "good-token";
    stubFetch(outage);
    vi.useFakeTimers();
    const call = loadLevelAnswers(2026, freshSlug(), new Set());
    await settledWithBackoff(expect(call).resolves.toEqual(new Map()));
  });

  it("retries a 503 before giving up", async () => {
    process.env[REQUIRED] = "1";
    process.env[ALLOW] = "1";
    process.env[TOKEN] = "good-token";
    stubFetch(status(503));
    vi.useFakeTimers();
    const call = loadLevelAnswers(2026, freshSlug(), new Set());
    await settledWithBackoff(expect(call).resolves.toEqual(new Map()));
    // Four attempts: the first plus one per configured backoff delay.
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);
  });

  it("treats a 400 as configuration: no retry, and ALLOW_DEGRADED does not excuse it", async () => {
    // A 4xx is our request being wrong, not Pretalx being down. It used to be
    // classified as an outage, so the build told the operator Pretalx looked
    // unreachable and advised PRETALX_ALLOW_DEGRADED=1 — which then shipped a
    // release with every company and role blank, the exact regression the
    // required-token flag exists to prevent.
    process.env[REQUIRED] = "1";
    process.env[ALLOW] = "1";
    process.env[TOKEN] = "good-token";
    stubFetch(status(400));
    await expect(loadLevelAnswers(2026, freshSlug(), new Set())).rejects.toThrow(/HTTP 400/);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("treats a missing question-id mapping as configuration, not an outage", async () => {
    // Adding an edition without its question ids is the realistic way to hit
    // this: 2027 has no SPEAKER_QUESTIONS / LEVEL_QUESTION_ID entry.
    process.env[REQUIRED] = "1";
    process.env[ALLOW] = "1";
    process.env[TOKEN] = "good-token";
    stubFetch(ok);
    await expect(loadLevelAnswers(2027, freshSlug(), new Set())).rejects.toThrow(
      /No level question id configured/,
    );
  });

  it("recovers when a retry succeeds", async () => {
    process.env[REQUIRED] = "1";
    process.env[TOKEN] = "good-token";
    let calls = 0;
    stubFetch(() => {
      calls += 1;
      return calls === 1 ? Promise.reject(new TypeError("fetch failed")) : ok();
    });
    vi.useFakeTimers();
    const call = loadLevelAnswers(2026, freshSlug(), new Set());
    await settledWithBackoff(expect(call).resolves.toEqual(new Map()));
    expect(calls).toBe(2);
  });
});

describe("a local build (no PRETALX_TOKEN_REQUIRED)", () => {
  it("warns and carries on with no token", async () => {
    stubFetch(ok);
    await expect(loadLevelAnswers(2026, freshSlug(), new Set())).resolves.toEqual(new Map());
  });

  it("warns and carries on through an outage", async () => {
    process.env[TOKEN] = "good-token";
    stubFetch(outage);
    vi.useFakeTimers();
    const call = loadLevelAnswers(2026, freshSlug(), new Set());
    await settledWithBackoff(expect(call).resolves.toEqual(new Map()));
  });
});
