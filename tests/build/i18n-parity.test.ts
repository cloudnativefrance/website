/**
 * i18n FR/EN parity guard.
 *
 * Two invariants across src/i18n/ui.ts:
 *   1. ui.fr and ui.en have identical key sets.
 *   2. No EN value is byte-identical to its FR counterpart in narrative
 *      namespaces (editions.*) — these strings must always differ between
 *      locales. Keys outside this scope (nav, site.title, brand tier names,
 *      track names, proper nouns, etc.) are intentionally identical in FR
 *      and EN because they are loanwords or brand terms.
 *
 * Imports the ui object directly via the @/ alias; no build required.
 */

import { describe, it, expect } from "vitest";
import { ui } from "@/i18n/ui";

const NARRATIVE_NAMESPACE_PREFIXES = ["editions."] as const;

function isNarrativeKey(key: string): boolean {
  return NARRATIVE_NAMESPACE_PREFIXES.some((p) => key.startsWith(p));
}

describe("I18N-02: i18n FR/EN parity", () => {
  it("fr and en have identical key sets", () => {
    const frKeys = Object.keys(ui.fr).sort();
    const enKeys = Object.keys(ui.en).sort();
    const missingInEn = frKeys.filter((k) => !enKeys.includes(k));
    const extraInEn = enKeys.filter((k) => !frKeys.includes(k));
    expect(
      missingInEn,
      `Keys present in fr but missing in en: ${missingInEn.join(", ")}`,
    ).toEqual([]);
    expect(
      extraInEn,
      `Keys present in en but missing in fr: ${extraInEn.join(", ")}`,
    ).toEqual([]);
  });

  it("no EN value is byte-identical to its FR counterpart (editions.*)", () => {
    const identical: string[] = [];
    const frRec = ui.fr as Record<string, string>;
    const enRec = ui.en as Record<string, string>;
    for (const k of Object.keys(frRec)) {
      if (!isNarrativeKey(k)) continue;
      if (frRec[k] === enRec[k]) identical.push(k);
    }
    expect(
      identical,
      `FR value identical to EN in narrative namespace (likely accidental paste): ${identical.join(", ")}`,
    ).toEqual([]);
  });
});
