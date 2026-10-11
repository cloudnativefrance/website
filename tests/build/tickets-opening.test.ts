/**
 * Tickets-opening copy guards.
 *
 * Before the opening, the billetterie/tickets page announces the opening
 * date (the `pre_opening_dated` phase): the four tickets.opening.* keys
 * resolve non-empty in both locales. The vague "coming soon" copy stays for
 * the `pre_opening` phase.
 */
import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

const NEW_KEYS = [
  "tickets.opening.badge",
  "tickets.opening.title",
  "tickets.opening.date",
  "tickets.opening.body",
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
});
