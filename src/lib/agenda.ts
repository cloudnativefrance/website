/**
 * The personal agenda's own logic: what overlaps, and how a clash reads.
 *
 * Pure, over plain data. This repo has no DOM test environment — both vitest
 * projects are `environment: "node"` — so the decisions live here and
 * `schedule-ui.ts` keeps only the plumbing that renders them.
 *
 * Carved out of the audience lens when the lens was removed. Clash detection
 * never depended on it: two bookmarked talks can collide in any schedule, and
 * with five parallel rooms on one grid they collide MORE often, not less.
 */

export interface AgendaItem { id: string; start: string; duration: number }

/**
 * Bookmarked sessions that overlap in time.
 *
 * The grid shows parallelism by column, but a visitor scrolling a five-room day
 * will not notice that the two talks they bookmarked three screens apart run at
 * the same time. The agenda holds both, so it is where the conflict can
 * surface — at the moment someone is planning their day rather than in the
 * corridor.
 *
 * Deduped by `id` on entry: every session renders twice (grid + list), so a
 * caller that ever passes `querySelectorAll(".session-card")` results directly,
 * instead of one resolved card per bookmark, must not make every session clash
 * with its own on-screen twin.
 *
 * Touching is not overlapping: 10:00-10:30 and 10:30-11:00 are a plan, not a
 * clash.
 *
 * A missing or unparseable `start` degrades safely rather than throwing:
 * `new Date("").getTime()` is `NaN`, and every comparison against `NaN` is
 * `false`, so that item simply participates in no clashes.
 */
export function findClashes(items: readonly AgendaItem[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (id: string, other: string) => {
    const list = out.get(id);
    if (list) list.push(other);
    else out.set(id, [other]);
  };
  const deduped = [...new Map(items.map((i) => [i.id, i])).values()];
  const at = deduped.map((i) => {
    const start = new Date(i.start).getTime();
    return { id: i.id, start, end: start + i.duration * 60_000 };
  });
  for (let a = 0; a < at.length; a++) {
    for (let b = a + 1; b < at.length; b++) {
      // Strict `<` on both sides: touching is not overlapping. NaN on either
      // side (an unparseable start) makes both sides false, so the item never
      // clashes rather than throwing.
      if (at[a].start < at[b].end && at[b].start < at[a].end) {
        add(at[a].id, at[b].id);
        add(at[b].id, at[a].id);
      }
    }
  }
  return out;
}

/**
 * Fill `{name}` placeholders in one pass, from untrusted values.
 *
 * Two sequential `template.replace("{a}", x).replace("{b}", y)` calls are wrong
 * twice over, and both ways bite with real Pretalx data:
 *
 * - the STRING form of `replace` treats `$&`, `$$`, `` $` ``, `$'` and
 *   `$<name>` in the REPLACEMENT as patterns, so a value containing `$&` is
 *   silently rewritten;
 * - the second call scans text the first one just inserted, so a value
 *   containing another placeholder gets substituted into.
 *
 * One global regex with a function replacement avoids both: the scan is over
 * the original template only, and function replacements disable `$` handling.
 */
export function substituteTokens(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? values[key] : match,
  );
}

/** The clash line for one overlapping session: "chevauche {title} ({room})". */
export function substituteClashLabel(template: string, title: string, room: string): string {
  return substituteTokens(template, { title, room });
}
