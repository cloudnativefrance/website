/**
 * One rule for "is this nav entry the page I am looking at?".
 *
 * `Navigation.astro` used to answer it two different ways in the same
 * dropdown. The featured Programme entry tested `currentPath.startsWith("/programme")`
 * and the per-edition archive entries tested `currentPath === "/programme/2026"`,
 * so on `/programme/2026/`:
 *
 *   - the featured entry claimed `current` even when it pointed at 2027, and
 *   - the archive entry never claimed it at all, because Astro serves a
 *     directory route WITH a trailing slash and the nav emits hrefs without
 *     one, so the `===` could not match anything the site actually serves.
 *
 * Two items marked current, and the right one silently unmarked — which the
 * mobile menu and the desktop dropdown both render as `aria-current="page"`.
 *
 * Pure and dependency-free so the whole truth table is testable without
 * rendering a component; `.astro` frontmatter is the one place in this codebase
 * a unit test cannot reach.
 */

/**
 * True when `currentPath` IS `href`, or a page beneath it.
 *
 * Trailing slashes are tolerated on either side, and the descendant match is
 * anchored on a `/` boundary — `/programme/2026` must not light up for
 * `/programme/2026-recap`. Descendants count on purpose:
 * `/intervenants/2026/ada-lovelace` should highlight the 2026 speakers entry
 * that led there.
 */
export function isCurrentPath(currentPath: string, href: string): boolean {
  const path = stripTrailingSlash(currentPath);
  const target = stripTrailingSlash(href);
  return path === target || path.startsWith(`${target}/`);
}

/** "/programme/2026/" -> "/programme/2026". "/" stays "/". */
function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}
