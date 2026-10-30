/**
 * Guards the Programme menu: it leads with the newest edition whether or not
 * its programme is announced, lists that edition's speakers only once it is,
 * and keeps every finished edition reachable.
 *
 * The rules live in src/lib/programme-phase.ts; the source-shape cases pin
 * Navigation.astro to them, matching the other tests/build specs — a full
 * build per case is too slow, and the property is structural.
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ARCHIVED_EDITIONS,
  LEAD_EDITION,
  programmePhase,
  speakersEdition,
} from "@/lib/programme-phase";
import { CFP } from "@/config/cfp";
import { stashEnv } from "../support/env-stash";

/**
 * Every case injects its own `now`. `programmePhase` reads the flag's date
 * without FLAG_OVERRIDES by design, but the stash keeps a developer's
 * `.env.local` from leaking into anything else these modules consult.
 */
stashEnv(["FLAG_PROGRAMME", "FLAG_OVERRIDES", "PUBLIC_SITE_URL"]);

const NAV = readFileSync(
  resolve(import.meta.dirname, "../../src/components/Navigation.astro"),
  "utf-8",
);

const BEFORE = new Date("2026-11-03T12:00:00+01:00");
const AFTER = new Date("2027-04-02T12:00:00+02:00");

describe("the Programme menu's editions", () => {
  it("leads with 2027 before its programme is announced", () => {
    expect(LEAD_EDITION).toBe(2027);
  });

  it("offers 2026 as the one finished edition, never 2023", () => {
    // 2023 has its own retrospective in the About menu.
    expect(ARCHIVED_EDITIONS).toEqual([2026]);
  });
});

describe("programmePhase", () => {
  it("follows the CFP until the programme flag's date", () => {
    expect(programmePhase(2027, BEFORE)).toBe(CFP.currentPhase);
  });

  it("is announced from the programme flag's date", () => {
    expect(programmePhase(2027, AFTER)).toBe("announced");
  });

  it("is always announced for a finished edition", () => {
    expect(programmePhase(2026, BEFORE)).toBe("announced");
  });

  describe("with staging's FLAG_OVERRIDES=programme=on", () => {
    afterEach(() => {
      delete process.env.FLAG_OVERRIDES;
    });

    it("still follows the CFP: staging loads the data, it does not announce it", () => {
      process.env.FLAG_OVERRIDES = "programme=on";
      expect(programmePhase(2027, BEFORE)).toBe(CFP.currentPhase);
    });
  });
});

describe("speakersEdition", () => {
  it("stays on 2026 while 2027 is being built", () => {
    expect(speakersEdition(BEFORE)).toBe(2026);
  });

  it("moves to 2027 once its programme is announced", () => {
    expect(speakersEdition(AFTER)).toBe(2027);
  });
});

describe("Navigation.astro", () => {
  const dd = NAV.slice(
    NAV.indexOf("const programmeDD"),
    NAV.indexOf("const aboutDD"),
  );

  it("links Programme to the lead edition, not CURRENT_EDITION", () => {
    expect(dd).toMatch(/programmeBase\}\/\$\{lead\}/);
    expect(dd).not.toMatch(/CURRENT_EDITION/);
  });

  it("lists Intervenant(e)s only once the programme is announced", () => {
    expect(dd).toMatch(/programmePhase\(lead\)\s*===\s*"announced"/);
    expect(dd).toMatch(
      /announced\s*\?\s*\[item\(`\$\{speakersBase\}\/\$\{lead\}`/,
    );
  });

  it("gives an archived edition ONE entry — its programme, not its speakers", () => {
    // Every session card on that programme links its own speakers, so they
    // stay one click from the page a visitor actually lands on.
    expect(dd).toContain("ARCHIVED_EDITIONS.map");
    expect(dd).toMatch(/programmeBase\}\/\$\{y\}/);
    expect(dd).not.toMatch(/speakersBase\}\/\$\{y\}/);
  });

  it("decides `current` the same way for every dropdown item", () => {
    // Astro serves directory URLs with a trailing slash — see nav-path.ts.
    expect(NAV).toContain("isCurrentPath");
    expect(dd).not.toMatch(/current:\s*currentPath ===/);
    expect(dd).not.toMatch(/current:\s*onProgramme/);
    expect(dd).not.toMatch(/current:\s*onSpeakers/);
  });
});
