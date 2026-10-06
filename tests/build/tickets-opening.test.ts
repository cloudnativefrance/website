/**
 * Tickets-opening copy guards.
 *
 * The billetterie/tickets page is a dated announcement, not a vague
 * "coming soon". Two invariants, mirroring the NEW_KEYS/REMOVED_KEYS
 * pattern of newsletter-callout.test.ts:
 *   1. The four tickets.opening.* keys resolve non-empty in both locales.
 *   2. The tickets.coming_soon.* family is gone (.cta is already guarded by
 *      the newsletter spec; .title and .body are guarded here so no member
 *      of the family can be resurrected).
 */
import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

const NEW_KEYS = [
  "tickets.opening.badge",
  "tickets.opening.title",
  "tickets.opening.date",
  "tickets.opening.body",
] as const;

const REMOVED_KEYS = [
  "tickets.coming_soon.title",
  "tickets.coming_soon.body",
] as const;

describe("tickets opening i18n keys", () => {
  for (const key of NEW_KEYS) {
    it(`${key} resolves in both locales`, () => {
      expect(ui.fr).toHaveProperty(key);
      expect(ui.en).toHaveProperty(key);
      expect((ui.fr as Record<string, string>)[key].length).toBeGreaterThan(0);
      expect((ui.en as Record<string, string>)[key].length).toBeGreaterThan(0);
    });
  }

  for (const key of REMOVED_KEYS) {
    it(`${key} is gone from both locales`, () => {
      expect(ui.fr).not.toHaveProperty(key);
      expect(ui.en).not.toHaveProperty(key);
    });
  }
});
