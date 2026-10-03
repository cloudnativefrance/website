/**
 * Reading an undecided value, and refusing to ship one.
 *
 * A `tbd()` in the config renders nothing of its own: the page shows its draft
 * when it has one — as the copy it will become — and leaves its line out when
 * it has none. What keeps a draft from reaching production is
 * `assertShippable`, which the page calls whenever the demo is off: it
 * lists every draft still in the config, plus the values the page cannot ship
 * without.
 *
 * Pure: no environment read. The caller decides when to assert.
 */
import { isTbd, type Maybe, type Tbd, type TicketingConfig } from "@/config/tickets";

/** The decided value, else the draft, else undefined — the line is then not rendered. */
export function shown<T>(value: Maybe<T>): T | undefined {
  return isTbd(value) ? (value as Tbd<T>).draft : (value as T);
}

export interface ShippingProblem {
  /** Dotted path in the config, e.g. `opening.time` or `tiers.0.name`. */
  path: string;
  /** The `tbd()` note: what is still to decide. */
  note: string;
}

/**
 * Values an undecided `tbd()` cannot leave out: without a draft their line
 * would simply disappear, and the page is not worth shipping without them.
 */
const REQUIRED: ReadonlyArray<{ path: string; read: (config: TicketingConfig) => unknown }> = [
  { path: "standardName", read: (config) => config.standardName },
  { path: "strategic.name", read: (config) => config.strategic.name },
  { path: "strategic.price", read: (config) => config.strategic.price },
];

/** Every draft left anywhere in the config, then every required value still undecided. */
export function shippingProblems(config: TicketingConfig): ShippingProblem[] {
  const problems: ShippingProblem[] = [];
  walk(config, "", (path, value) => {
    if (value.draft !== undefined) problems.push({ path, note: value.note });
  });
  for (const { path, read } of REQUIRED) {
    const value = read(config);
    if (isTbd(value) && value.draft === undefined) problems.push({ path, note: value.note });
  }
  return problems;
}

export function assertShippable(config: TicketingConfig): void {
  const problems = shippingProblems(config);
  if (problems.length === 0) return;
  throw new Error(
    "[tickets] src/config/tickets.ts is not ready for production — decide these values " +
      "(their drafts only show on staging):\n" +
      problems.map((p) => `- ${p.path} — ${p.note}`).join("\n"),
  );
}

function walk(node: unknown, path: string, visit: (path: string, value: Tbd<unknown>) => void): void {
  if (isTbd(node)) {
    visit(path, node);
    return;
  }
  if (node === null || typeof node !== "object") return;
  for (const [key, child] of Object.entries(node)) {
    walk(child, path ? `${path}.${key}` : key, visit);
  }
}
