/**
 * Client behaviour for the programme page.
 *
 * The filtering semantics live in src/lib/schedule-filter.ts and are shared with
 * the server render, so the two cannot disagree about what "matches" means.
 * Everything here is DOM plumbing around that: filtering/search/view-toggle,
 * the session detail modal, the personal agenda (bookmarks + drawer), and the
 * .ics export. Nothing here fetches or mutates server state — the only
 * persistence is `localStorage`, for the view choice and the agenda.
 */
import {
  activeFilterCount,
  emptyFilterState,
  facetMatches,
  normalise,
  type FilterState,
} from "@/lib/schedule-filter";
import type { Audience } from "@/lib/audience";
import {
  countMatchesOutsideLens,
  facetValuesInLens,
  findClashes,
  lensTotal,
  type FacetValues,
} from "@/lib/lens";
import { applyAudience } from "./schedule-ui-audience";

const VIEW_KEY = "cnd-schedule-view";
/**
 * Session ids are Pretalx codes, unchanged by this redesign, so anyone who
 * bookmarked a talk before keeps their agenda. Do not change this key or its
 * stored shape (a JSON array of ids) — that would silently discard every
 * agenda already saved in a visitor's browser.
 */
const BOOKMARKS_KEY = "cnd-agenda-bookmarks-v1";

const state: FilterState = emptyFilterState();

const root = document.querySelector<HTMLElement>("[data-schedule-root]");
if (root) {
  const gridView = root.querySelector<HTMLElement>(".grid-view");
  const listView = root.querySelector<HTMLElement>(".list-view");
  const countEl = document.getElementById("schedule-result-count");
  const searchEl = document.getElementById("schedule-search") as HTMLInputElement | null;
  const clearSearchEl = document.getElementById("schedule-search-clear");
  const total = Number(countEl?.getAttribute("data-total") ?? "0");
  const countTemplate = root.getAttribute("data-count-template") ?? "{n}/{total}";
  const noneLabel = root.getAttribute("data-none-label") ?? "";
  // Server-rendered: true only for an edition with both audiences, i.e. one
  // that actually shows the lens switch. `total` (the whole edition) stays
  // the right denominator for every other edition.
  const hasAudiences = root.getAttribute("data-has-audiences") === "true";
  const moreResultsLabel = root.getAttribute("data-schedule-more-results") || "{n} more in {lens}";

  function apply() {
    const query = normalise(state.query.trim());
    const visible = new Set<string>();

    for (const card of document.querySelectorAll<HTMLElement>(".session-card")) {
      const room = card.getAttribute("data-room") ?? "";
      const format = card.getAttribute("data-format") ?? "";
      const track = card.getAttribute("data-track") ?? "";
      const level = card.getAttribute("data-level") ?? "";
      // Same predicate the server render uses, imported rather than restated —
      // a keynote spans every room, so a room filter must never hide it.
      const facetOk =
        (format === "keynote" || facetMatches(state.room, room)) &&
        facetMatches(state.format, format) &&
        facetMatches(state.track, track) &&
        facetMatches(state.level, level);
      const searchOk = !query || normalise(card.getAttribute("data-search") ?? "").includes(query);
      const show = facetOk && searchOk;
      card.classList.toggle("is-hidden", !show);
      // The lens is a second, independent axis (`is-audience-hidden`, applied
      // by schedule-ui-audience.ts) — a card counts as visible only when it
      // also passes the filters, so switching the lens can never clear a
      // filter and clearing filters can never touch the lens.
      const inLens = !card.classList.contains("is-audience-hidden");
      if (show && inLens) visible.add(card.getAttribute("data-session-id") ?? "");
    }

    // Hide a slot or group whose cards are all filtered out, so the page does
    // not fill with empty time headings. Checked against both axes: a row
    // whose only survivor is lens-hidden must not render as a labelled empty
    // band either.
    for (const container of document.querySelectorAll<HTMLElement>(".grid-view-row, .list-view-group")) {
      const any = container.querySelector(".session-card:not(.is-hidden):not(.is-audience-hidden)");
      container.classList.toggle("is-hidden", !any);
    }
    // A non-empty query already counts as one active filter, so this single
    // number covers both. Break bands describe the unfiltered day, so any
    // narrowing at all hides them.
    const active = activeFilterCount(state);
    // Hiding every row leaves the explicit row tracks and their gaps behind —
    // 360px of void under a "no results" message, where the list view collapses
    // to nothing. Collapse the whole body instead.
    gridView?.classList.toggle("is-empty", visible.size === 0);
    for (const band of document.querySelectorAll<HTMLElement>(".grid-view-break")) {
      band.classList.toggle("is-hidden", active > 0);
    }

    if (countEl) {
      const cards = lensCards();
      // The server's `data-total` counts the whole edition — right for a page
      // with one lens, wrong for a page with two, where it must count only
      // this lens's own sessions (its cards plus every keynote).
      const scopedTotal = hasAudiences ? lensTotal(cards, audience) : total;
      countEl.textContent =
        visible.size === 0
          ? noneLabel
          : countTemplate.replace("{n}", String(visible.size)).replace("{total}", String(scopedTotal));

      // A search can match sessions the lens is hiding. Silently reporting
      // "no results" would be true and useless, so name the remainder and
      // offer the one click that resolves it: switch lens, keep the query.
      const outside = countMatchesOutsideLens(cards, audience, state.query);
      if (outside > 0) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toolbar-cross-lens";
        btn.textContent = moreResultsLabel
          .replace("{n}", String(outside))
          .replace("{lens}", lensLabel(otherAudience(audience)));
        btn.addEventListener("click", () => setAudience(otherAudience(audience)));
        // `textContent =` above wiped any previous button, so it is rebuilt
        // fresh on every apply() rather than toggled.
        countEl.append(" · ", btn);
      }
    }

    for (const btn of document.querySelectorAll<HTMLElement>(".schedule-filter")) {
      const f = btn.getAttribute("data-filter") as keyof FilterState | null;
      const v = btn.getAttribute("data-value");
      if (!f || !v || f === "query") continue;
      const on = (state[f] as Set<string>).has(v);
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    const badge = document.getElementById("schedule-filter-active-count");
    if (badge) {
      badge.textContent = active ? String(active) : "";
      badge.toggleAttribute("hidden", active === 0);
    }
    clearSearchEl?.toggleAttribute("hidden", !state.query);
  }

  // Grid view is `display: none` below md — the room columns are unusable at
  // that width. The stylesheet hiding it does not tell this island anything, so
  // rendering the user's stored "grid" preference on a phone put `[hidden]` on
  // the list while CSS hid the grid, and the programme came out BLANK with the
  // result count still claiming "51 sessions". Reachable three ways: tapping
  // the toggle on a phone, opening a shared `?view=grid` link on a phone, or
  // choosing grid on a desktop and later narrowing the window.
  //
  // The preference and what is on screen are therefore two different things:
  // `preferredView` is what the visitor chose and what persists, `renderedView`
  // is what the viewport can actually display.
  const narrow = window.matchMedia("(max-width: 767px)");
  /** The server's edition-aware default: the lowest-priority of the three. */
  const serverDefaultView = (root.getAttribute("data-default-view") as "grid" | "list") ?? "grid";
  // Placeholder until the stored/URL preference is resolved below; the
  // `setView(initial, false)` call there is what actually settles it.
  let preferredView: "grid" | "list" = serverDefaultView;

  /** A lens showing one room has no grid to draw. Like `narrow`, this
   *  constrains what is RENDERED without touching what the visitor chose. */
  let lensForcesList = false;

  // Hiding relies on Tailwind v4's preflight, which declares
  // `[hidden] { display: none !important }`. Without that `!important` the
  // views' own `.grid-view { display: grid }` / `.list-view { display: flex }`
  // would win — author rules outrank the UA sheet — and both views would render
  // at once with no error anywhere. Disabling preflight breaks this toggle.
  function renderView() {
    const renderedView = narrow.matches || lensForcesList ? "list" : preferredView;
    gridView?.toggleAttribute("hidden", renderedView !== "grid");
    listView?.toggleAttribute("hidden", renderedView !== "list");
    for (const btn of document.querySelectorAll<HTMLElement>("[data-view]")) {
      const pressed = btn.getAttribute("data-view") === preferredView;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    }
  }

  function setView(view: "grid" | "list", persist = true) {
    preferredView = view;
    renderView();
    if (persist) {
      try {
        localStorage.setItem(VIEW_KEY, view);
      } catch {
        /* private mode */
      }
      const url = new URL(window.location.href);
      url.searchParams.set("view", view);
      history.replaceState(null, "", url);
    }
  }

  // Rotating a phone or dragging a desktop window across the breakpoint has to
  // re-evaluate, or the same blank page appears after the fact.
  narrow.addEventListener("change", renderView);

  // -----------------------------------------------------------------------
  // Audience lens — a VIEW over the shared agenda, not a filter. Held outside
  // `FilterState` so it cannot reach `activeFilterCount` or "Clear filters",
  // and so switching it cannot trigger the break-band hiding `apply()` does
  // when a filter is active.
  // -----------------------------------------------------------------------
  let audience: Audience = "tech";

  const otherAudience = (a: Audience): Audience => (a === "tech" ? "leadership" : "tech");

  const lensLabel = (a: Audience) =>
    a === "leadership"
      ? root.getAttribute("data-schedule-audience-leadership") || "Strategy & Leadership"
      : root.getAttribute("data-schedule-audience-tech") || "Technical";

  /** Every card's lens-relevant attributes, read once per call. Cards are static
   *  after render, so there is nothing to cache and nothing to invalidate. */
  function lensCards() {
    return [...document.querySelectorAll<HTMLElement>(".session-card")].map((el) => ({
      id: el.getAttribute("data-session-id") ?? "",
      room: el.getAttribute("data-room") ?? "",
      format: el.getAttribute("data-format") ?? "",
      track: el.getAttribute("data-track") ?? "",
      level: el.getAttribute("data-level") ?? "",
      search: el.getAttribute("data-search") ?? "",
      audience: (el.getAttribute("data-audience") as Audience) ?? "tech",
    }));
  }

  /**
   * Hides the filter chips (and whole facet groups) the current lens has
   * emptied, and drops any selection in `state` the lens can no longer
   * honour. Runs once per LENS — the initial render and every switch — never
   * inside apply(), since the reachable values change with the lens, not
   * with the filters.
   *
   * Its only call site is inside `setAudience` — the boot sequence resolves
   * the initial lens through `setAudience` too (Task 6), so there is no
   * separate boot-time call left to keep in sync with this one.
   *
   * A no-op for a single-audience edition: `hasAudiences` is false there, no
   * `[data-audience-switch]` is even rendered, and a facet with only one
   * value across the WHOLE edition is not this task's concern — hiding it
   * would be a new, unrelated behaviour change for 2023/2026.
   */
  function pruneFacetsForLens(): void {
    if (!hasAudiences) return;
    const reachable = facetValuesInLens(lensCards(), audience);
    for (const group of document.querySelectorAll<HTMLElement>(".toolbar-facet")) {
      let live = 0;
      for (const btn of group.querySelectorAll<HTMLElement>(".schedule-filter")) {
        const facet = btn.getAttribute("data-filter") as keyof FacetValues | null;
        const value = btn.getAttribute("data-value") ?? "";
        const on = !!facet && reachable[facet]?.has(value);
        btn.toggleAttribute("hidden", !on);
        if (on) live += 1;
      }
      // Fewer than two options is a control that cannot change anything (spec D-4).
      group.toggleAttribute("hidden", live < 2);
    }
    // Any selection the current lens cannot honour must leave `state` before
    // the next apply(), or a room filter for a room this lens has hidden
    // produces zero results with no visible cause — the chip that would
    // explain it was just hidden above. Level and format normally survive:
    // filtering for `beginner` keeps that filter across a lens switch.
    for (const facet of ["room", "format", "track", "level"] as const) {
      for (const value of [...state[facet]]) {
        if (!reachable[facet].has(value)) state[facet].delete(value);
      }
    }
  }

  // A `const` arrow, not a `function` declaration: TypeScript only carries the
  // `if (root)` null-narrowing into a nested closure defined directly in this
  // block (an arrow assigned here), not into a hoisted function declaration —
  // the same reason `rootStyle` was captured out of `root.style` above for
  // `syncStickyOffsets`. This one reads `root` directly instead.
  /** The single entry point for changing lens. Everything that reacts to a switch
   *  hangs off this, so a new caller cannot forget half the sequence. */
  const setAudience = (next: Audience): void => {
    audience = next;
    lensForcesList = applyAudience(root, audience) <= 1;
    pruneFacetsForLens();
    renderView();
    apply();
    for (const btn of document.querySelectorAll<HTMLElement>("[data-audience-switch] [data-audience]")) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-audience") === audience ? "true" : "false");
    }
    // `replaceState`, not `pushState`: the lens is a view of one page, so
    // toggling it four times must not cost four Back presses. The technical
    // lens deletes the parameter rather than writing `?audience=tech`, so the
    // default state keeps the canonical bare path (spec D-8).
    const url = new URL(window.location.href);
    if (hasLens && audience === "leadership") url.searchParams.set("audience", "leadership");
    else url.searchParams.delete("audience");
    history.replaceState(null, "", url);
  };

  // Both sticky offsets were hardcoded to `top: 64px`. The site header is
  // sticky and its logo is `h-10 md:h-14`, so it measures 85px on a phone but
  // 105px from md up — which hid the search field completely behind it on
  // desktop, and the search field is the whole navigation story of this page.
  // The grid's room-label row used the same 64px at a LOWER z-index than the
  // toolbar, so it parked itself underneath and the column-to-room mapping was
  // invisible below the fold. Measure both and publish them as custom
  // properties; they inherit to the toolbar and grid head from here.
  const toolbarEl = document.querySelector<HTMLElement>(".toolbar");
  // Captured out here rather than reaching through `root` inside the closure:
  // the null-narrowing from the enclosing `if (root)` does not survive into a
  // deferred callback, and this is the reference the callback actually needs.
  const rootStyle = root.style;
  function syncStickyOffsets() {
    const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    rootStyle.setProperty("--schedule-header-h", `${Math.round(headerH)}px`);
    rootStyle.setProperty(
      "--schedule-toolbar-h",
      `${Math.round(toolbarEl?.getBoundingClientRect().height ?? 0)}px`,
    );
  }
  syncStickyOffsets();
  window.addEventListener("resize", syncStickyOffsets);
  // The filter panel is a <details>; opening it changes the toolbar's height,
  // and with it where the grid head must sit.
  if (toolbarEl && "ResizeObserver" in window) {
    new ResizeObserver(syncStickyOffsets).observe(toolbarEl);
  }

  for (const btn of document.querySelectorAll<HTMLElement>("[data-view]")) {
    btn.addEventListener("click", () => setView(btn.getAttribute("data-view") as "grid" | "list"));
  }

  for (const btn of document.querySelectorAll<HTMLElement>("[data-audience-switch] [data-audience]")) {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-audience") as Audience | null;
      if (next) setAudience(next);
    });
  }

  for (const btn of document.querySelectorAll<HTMLElement>(".schedule-filter")) {
    btn.addEventListener("click", () => {
      const f = btn.getAttribute("data-filter") as Exclude<keyof FilterState, "query"> | null;
      const v = btn.getAttribute("data-value");
      if (!f || !v) return;
      const set = state[f] as Set<string>;
      if (set.has(v)) set.delete(v);
      else set.add(v);
      apply();
    });
  }

  document.getElementById("schedule-filter-clear")?.addEventListener("click", () => {
    state.room.clear();
    state.format.clear();
    state.track.clear();
    state.level.clear();
    // The search query counts towards the active-filter badge, so leaving it
    // set meant "clear all" left the badge showing 1 and the results still
    // narrowed, with nothing in this panel able to explain why.
    state.query = "";
    if (searchEl) searchEl.value = "";
    apply();
  });

  let debounce: ReturnType<typeof setTimeout> | undefined;
  searchEl?.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = searchEl.value;
      apply();
    }, 150);
  });
  clearSearchEl?.addEventListener("click", () => {
    if (!searchEl) return;
    searchEl.value = "";
    state.query = "";
    apply();
    searchEl.focus();
  });

  // Resolve the initial view: an explicit ?view= wins, then a remembered
  // choice, then the server's edition-aware default.
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("view");
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(VIEW_KEY);
  } catch {
    /* private mode */
  }
  /** A candidate is only a view if it names one — anything else falls through. */
  function asView(value: string | null): "grid" | "list" | null {
    return value === "grid" || value === "list" ? value : null;
  }
  /** A candidate is only a lens if it names one — anything else falls through. */
  const asAudience = (v: string | null): Audience | null =>
    v === "tech" || v === "leadership" ? v : null;

  // An edition with one audience has no lens to select. Ignoring the
  // parameter rather than 404-ing or rendering an empty grid is what makes a
  // stale link to ?audience=leadership harmless on 2026.
  const hasLens = hasAudiences;
  // The `if` is load-bearing, not a ternary: `setAudience` hides every card
  // whose audience is not the current one, and a single-audience edition
  // renders no control to switch back with. Applying no lens is what leaves
  // every card visible there and lets `apply()` alone decide what shows.
  //
  // Placed before `setView` so its `renderView()` call already sees a
  // correct `lensForcesList`, and before the trailing `apply()` below so the
  // initial result count and row-emptiness already reflect the resolved
  // lens — `setAudience` runs its own `apply()` internally, so running the
  // one below first would render the page once against the wrong lens.
  if (hasLens) setAudience(asAudience(params.get("audience")) ?? "tech");
  setView(asView(fromUrl) ?? asView(stored) ?? serverDefaultView, false);
  // Redundant with the `apply()` inside `setAudience` when `hasLens` is true
  // (harmless: synchronous, no paint between, idempotent) but load-bearing
  // when it is false — that branch never calls `setAudience`, so this is the
  // ONLY apply() a single-audience edition gets. Do not remove it as a
  // de-duplication.
  apply();

  // -----------------------------------------------------------------------
  // Untrusted-input helpers — Sheet/Pretalx authors control session title,
  // room, track, level, language, description, recording_url, slides_url,
  // feedback_url, cover image. These values land in innerHTML and href sinks
  // below, so escape/allowlist them before they reach the DOM. javascript:/
  // data: URIs are blocked.
  // -----------------------------------------------------------------------
  function escHtml(v: unknown): string {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(raw: unknown): string {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    if (s.startsWith("/") && !s.startsWith("//")) return s;
    try {
      const u = new URL(s);
      if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    } catch {
      /* fallthrough */
    }
    return "";
  }

  function icsSafeUid(v: unknown): string {
    return String(v ?? "").replace(/[^A-Za-z0-9_.-]/g, "_");
  }

  /**
   * Any one card carrying this session id. A session renders once per view, so
   * two elements can match; every caller here only wants the data attributes,
   * which are identical on both, so the first in document order will do.
   */
  function findCard(id: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(
      `.session-card[data-session-id="${CSS.escape(id)}"]`,
    );
  }

  // -----------------------------------------------------------------------
  // Bookmarks (the personal agenda), persisted to localStorage.
  // -----------------------------------------------------------------------
  function getBookmarks(): Set<string> {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  }
  function setBookmarks(set: Set<string>): void {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
    } catch {
      // Storage can be denied outright (Safari with cookies blocked, some
      // enterprise policies). The read side already tolerates that; this side
      // did not, so the click handler threw midway and left the badge, the
      // bookmark icon and the drawer disagreeing with each other. Losing
      // persistence is acceptable; losing the rest of the handler is not.
    }
  }

  const bookmarks = getBookmarks();
  const agendaCountEl = document.getElementById("schedule-agenda-count");
  function updateCount(): void {
    if (agendaCountEl) agendaCountEl.textContent = String(bookmarks.size);
  }
  updateCount();

  /**
   * A session renders once per view (grid + list), so a bookmark toggle must
   * update every `[data-bookmark]` element sharing this id, not just the one
   * that was clicked — otherwise the two views disagree about which talks are
   * bookmarked.
   */
  function syncBookmarkButtons(id: string): void {
    document.querySelectorAll<HTMLElement>(`[data-bookmark="${id}"]`).forEach((btn) => {
      btn.classList.toggle("is-on", bookmarks.has(id));
    });
  }

  // Apply initial state + hook bookmark buttons
  document.querySelectorAll<HTMLElement>("[data-bookmark]").forEach((btn) => {
    const id = btn.getAttribute("data-bookmark");
    if (id && bookmarks.has(id)) btn.classList.add("is-on");
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!id) return;
      if (bookmarks.has(id)) bookmarks.delete(id);
      else bookmarks.add(id);
      setBookmarks(bookmarks);
      updateCount();
      syncBookmarkButtons(id);
      refreshAgenda();
    });
  });

  /**
   * Minimal Markdown → HTML renderer for the session description.
   * - HTML-escapes first so admin-authored content can't inject tags.
   * - Supports **bold**, __bold__, *italic*, _italic_, `code`, [text](url),
   *   paragraphs (blank line), and single newlines (<br>).
   * - Links must start with http(s):// or / to render — prevents javascript:
   *   or data: URIs from being rewritten into <a href>.
   */
  function mdToHtml(src: string): string {
    const esc = (x: string) =>
      String(x)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    let h = esc(src);
    h = h.replace(/`([^`\n]+)`/g, '<code class="rounded bg-background/60 px-1 py-0.5 text-[0.95em]">$1</code>');
    h = h.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    h = h.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    h = h.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
    h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match: string, label: string, url: string) => {
      if (!/^(https?:\/\/|\/)/.test(url)) return `[${label}](${url})`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${label}</a>`;
    });
    return h
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  // -----------------------------------------------------------------------
  // Session detail modal
  // -----------------------------------------------------------------------
  interface ModalSpeaker {
    label: string;
    company?: string;
    href: string | null;
  }

  const modal = document.getElementById("schedule-session-modal");
  const modalTitle = document.getElementById("schedule-session-modal-title");
  const modalMetaTop = document.getElementById("schedule-session-modal-meta-top");
  const modalSpeakers = document.getElementById("schedule-session-modal-speakers");
  const modalTags = document.getElementById("schedule-session-modal-tags");
  const modalDescription = document.getElementById("schedule-session-modal-description");
  const modalBookmarkBtn = document.getElementById("schedule-session-modal-bookmark");
  const modalFeedback = document.getElementById("schedule-session-modal-feedback") as HTMLAnchorElement | null;
  const modalSlides = document.getElementById("schedule-session-modal-slides") as HTMLAnchorElement | null;
  const modalRecording = document.getElementById("schedule-session-modal-recording") as HTMLAnchorElement | null;
  const modalCover = document.getElementById("schedule-session-modal-cover") as HTMLImageElement | null;
  let modalSessionId: string | null = null;

  // ---- Focus management for the two overlays ------------------------------
  //
  // The modal already declared `role="dialog" aria-modal="true"`, which tells a
  // screen reader the rest of the page is unavailable — but nothing made that
  // true for the keyboard. Opening a session left focus on the card behind the
  // backdrop, Tab walked out into the ~200 background stops, and Escape dropped
  // focus on whatever link happened to follow. WCAG 2.4.3.
  //
  // The drawer is deliberately treated more lightly: it has no backdrop and the
  // page behind it stays interactive, so it is not modal and trapping the
  // keyboard inside it would be wrong. It gets focus-in, focus-restore and
  // Escape, but no trap.

  const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  /** Openers, per overlay, so a drawer and a modal cannot clobber each other. */
  const overlayOpeners = new WeakMap<HTMLElement, HTMLElement>();

  function focusableWithin(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      // The selector matches controls that are hidden (a link toggled off, the
      // export button in a closed drawer). They cannot take focus, and including
      // them makes Tab appear to do nothing when it wraps onto one.
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
    );
  }

  /** Remember what had focus, then move it into the overlay. */
  function captureFocus(overlay: HTMLElement, initial: HTMLElement | null): void {
    const opener = document.activeElement;
    if (opener instanceof HTMLElement) overlayOpeners.set(overlay, opener);
    (initial ?? focusableWithin(overlay)[0] ?? overlay).focus();
  }

  /** Put focus back where it was, so the keyboard resumes rather than restarts. */
  function restoreFocus(overlay: HTMLElement): void {
    const opener = overlayOpeners.get(overlay);
    overlayOpeners.delete(overlay);
    // Skip an opener that has since been filtered out of the DOM or hidden —
    // focusing it would silently drop focus to <body>.
    if (opener?.isConnected && (opener.offsetWidth > 0 || opener.offsetHeight > 0)) opener.focus();
  }

  /** Cycle Tab within the modal. Called only while it is open. */
  function trapTab(container: HTMLElement, ev: KeyboardEvent): void {
    const items = focusableWithin(container);
    if (items.length === 0) {
      ev.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const leavingBackwards = ev.shiftKey && (active === first || active === container);
    const leavingForwards = !ev.shiftKey && active === last;
    if (leavingBackwards) {
      ev.preventDefault();
      last.focus();
    } else if (leavingForwards || !container.contains(active)) {
      ev.preventDefault();
      first.focus();
    }
  }

  const formatPalette: Record<string, { label: string; cls: string }> = {
    keynote: {
      label: root.getAttribute("data-schedule-format-keynote") || "Keynote",
      cls: "bg-accent/15 text-accent",
    },
    talk: {
      label: root.getAttribute("data-schedule-format-talk") || "Talk",
      cls: "bg-primary/15 text-primary",
    },
    lightning: {
      label: root.getAttribute("data-schedule-format-lightning") || "Lightning",
      cls: "bg-[color:var(--color-tertiary)]/15 text-[color:var(--color-tertiary)]",
    },
    workshop: {
      label: root.getAttribute("data-schedule-format-workshop") || "Workshop",
      cls: "bg-secondary text-foreground",
    },
  };
  // The facet buttons translate the level; this path was emitting the raw enum,
  // so the modal read "beginner" in both locales where the chip beside it read
  // "Tout public".
  const levelLabels: Record<string, string> = {
    beginner: root.getAttribute("data-schedule-level-beginner") || "beginner",
    intermediate: root.getAttribute("data-schedule-level-intermediate") || "intermediate",
    advanced: root.getAttribute("data-schedule-level-advanced") || "advanced",
  };
  const agendaRemoveLabel = root.getAttribute("data-schedule-agenda-remove") || "Remove";

  function openModal(card: HTMLElement): void {
    if (!modal) return;
    const id = card.getAttribute("data-session-id") || "";
    const title = card.getAttribute("data-title") || "";
    const format = card.getAttribute("data-format") || "talk";
    const start = card.getAttribute("data-start") || "";
    const duration = Number(card.getAttribute("data-duration") || 0);
    const room = card.getAttribute("data-room") || "";
    const track = card.getAttribute("data-track") || "";
    const level = card.getAttribute("data-level") || "";
    const description = card.getAttribute("data-description") || "";
    const feedbackUrl = card.getAttribute("data-feedback-url") || "";
    const slidesUrl = card.getAttribute("data-slides-url") || "";
    const recordingUrl = card.getAttribute("data-recording-url") || "";
    const coverImage = card.getAttribute("data-cover-image") || "";
    const language = card.getAttribute("data-language") || "";
    let speakers: ModalSpeaker[] = [];
    try {
      speakers = JSON.parse(card.getAttribute("data-speakers") || "[]") as ModalSpeaker[];
    } catch {
      /* malformed payload — render with no speakers rather than throw */
    }

    modalSessionId = id;
    if (modalTitle) modalTitle.textContent = title;

    // Top meta row: format chip + time + room + track + level
    if (modalMetaTop) {
      const fmt = formatPalette[format] || formatPalette.talk;
      const startHm = start.slice(11, 16);
      const [sH, sM] = startHm.split(":").map(Number);
      const endTotal = sH * 60 + sM + duration;
      const endHm =
        String(Math.floor(endTotal / 60) % 24).padStart(2, "0") + ":" + String(endTotal % 60).padStart(2, "0");
      const timeRange = startHm + " — " + endHm;
      const parts: string[] = [];
      parts.push(
        `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-widest uppercase ${fmt.cls}">${escHtml(fmt.label)}</span>`,
      );
      parts.push(
        `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-foreground">${escHtml(timeRange)} · ${duration} min</span>`,
      );
      if (room)
        parts.push(
          `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-foreground">${escHtml(room)}</span>`,
        );
      if (track)
        parts.push(
          `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-foreground">${escHtml(track)}</span>`,
        );
      if (level)
        parts.push(
          `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-muted-foreground uppercase tracking-widest">${escHtml(levelLabels[level] ?? level)}</span>`,
        );
      if (language)
        parts.push(
          `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-muted-foreground uppercase tracking-widest">${escHtml(language)}</span>`,
        );
      modalMetaTop.innerHTML = parts.join("");
    }

    // Cover image — optional hero at the top of the modal
    if (modalCover) {
      const safeCover = safeHref(coverImage);
      if (safeCover) {
        modalCover.setAttribute("src", safeCover);
        modalCover.setAttribute("alt", title);
        modalCover.style.display = "";
        modalCover.classList.remove("hidden");
      } else {
        modalCover.style.display = "none";
        modalCover.removeAttribute("src");
      }
    }

    // Speakers — render as clickable pills when we have a href, else plain pills
    if (modalSpeakers) {
      modalSpeakers.innerHTML =
        speakers.length === 0
          ? ""
          : speakers
              .map((sp) => {
                const safeLabel = escHtml(sp.label);
                const href = safeHref(sp.href);
                const cls =
                  "inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-sm text-foreground hover:border-primary/60";
                return href
                  ? `<a href="${href}" class="${cls} text-primary">${safeLabel} <span aria-hidden="true">→</span></a>`
                  : `<span class="${cls} text-muted-foreground">${safeLabel}</span>`;
              })
              .join("");
    }

    // Tags (not in data-* currently — skip)
    if (modalTags) modalTags.innerHTML = "";

    // Description — render Markdown → safe HTML (admins edit in Sheets/Pretalx; escape first).
    if (modalDescription) {
      modalDescription.innerHTML = description ? mdToHtml(description) : "";
      modalDescription.classList.toggle("hidden", !description);
    }

    // Bookmark toggle reflects current state
    if (modalBookmarkBtn) {
      modalBookmarkBtn.classList.toggle("is-on", bookmarks.has(id));
    }

    // Use inline style.display toggles — Tailwind's .hidden utility
    // can lose to .inline-flex depending on CSS source order.
    const toggleLink = (el: HTMLAnchorElement | null, url: string) => {
      if (!el) return;
      const safe = safeHref(url);
      if (safe) {
        el.setAttribute("href", safe);
        el.style.display = "";
        el.classList.remove("hidden");
      } else {
        el.style.display = "none";
        el.removeAttribute("href");
      }
    };
    toggleLink(modalFeedback, feedbackUrl);
    toggleLink(modalSlides, slidesUrl);
    toggleLink(modalRecording, recordingUrl);

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    // Focus the dialog itself rather than its first control: aria-labelledby
    // points at the title, so this announces the session name and the dialog
    // role, where focusing the X would announce only "Close, button".
    captureFocus(modal, modal);
  }

  function closeModal(): void {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    modalSessionId = null;
    restoreFocus(modal);
  }

  // Open modal on card click (but not when clicking the inline bookmark icon)
  document.querySelectorAll<HTMLElement>(".session-card").forEach((card) => {
    card.addEventListener("click", (ev) => {
      const target = ev.target;
      if (target instanceof Element) {
        if (target.closest("[data-bookmark]")) return;
        if (target.closest("a")) return;
      }
      openModal(card);
    });
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        openModal(card);
      }
    });
  });

  // Close on backdrop / X click, Escape key
  modal?.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (ev) => {
    const modalOpen = !!modal && !modal.classList.contains("hidden");
    if (ev.key === "Escape") {
      if (modalOpen) {
        closeModal();
      } else if (drawer && drawer.getAttribute("aria-hidden") === "false") {
        // The drawer had no Escape at all: once open, the only way out was to
        // find and click its X.
        closeDrawer();
      }
      return;
    }
    // Bound at document level rather than on the modal, so a Tab pressed while
    // focus has somehow landed outside is still pulled back in.
    if (ev.key === "Tab" && modalOpen && modal) trapTab(modal, ev);
  });

  // Auto-open a session modal when the URL hash matches #session-{id}
  // (deep-links from the /speakers/{slug} page "Ses talks" cards)
  function openFromHash(): void {
    const hash = window.location.hash || "";
    const m = hash.match(/^#session-([^/?&#]+)/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const matches = Array.from(
      document.querySelectorAll<HTMLElement>(`.session-card[data-session-id="${CSS.escape(id)}"]`),
    );
    // Two duplicates can match (grid + list) — prefer whichever one is
    // actually visible in the current view, so the scroll lands somewhere
    // the visitor can see.
    const card = matches.find((c) => !c.closest("[hidden]")) ?? matches[0];
    if (card) {
      // Scroll the card into view first so the page is anchored correctly when modal closes
      card.scrollIntoView({ block: "center", behavior: "instant" });
      openModal(card);
    }
  }
  // Run on initial load and when hash changes (in-page navigation)
  if (window.location.hash.startsWith("#session-")) {
    // Defer so the rest of this script finishes wiring first
    setTimeout(openFromHash, 0);
  }
  window.addEventListener("hashchange", openFromHash);

  // Bookmark button inside modal
  modalBookmarkBtn?.addEventListener("click", () => {
    if (!modalSessionId) return;
    const id = modalSessionId;
    if (bookmarks.has(id)) {
      bookmarks.delete(id);
      modalBookmarkBtn.classList.remove("is-on");
    } else {
      bookmarks.add(id);
      modalBookmarkBtn.classList.add("is-on");
    }
    setBookmarks(bookmarks);
    updateCount();
    // Sync every card's inline bookmark icon too (both views)
    syncBookmarkButtons(id);
    refreshAgenda();
  });

  // -----------------------------------------------------------------------
  // Agenda drawer
  // -----------------------------------------------------------------------
  const drawer = document.getElementById("schedule-agenda-drawer");
  const agendaList = document.getElementById("schedule-agenda-list");
  const emptyLabel = root.getAttribute("data-schedule-empty") || "";
  const clashLabel = root.getAttribute("data-schedule-agenda-clash") || "overlaps with {title} ({room})";

  function openDrawer(): void {
    if (!drawer) return;
    drawer.classList.remove("translate-x-full");
    drawer.setAttribute("aria-hidden", "false");
    drawer.removeAttribute("inert");
    captureFocus(drawer, drawer);
  }
  function closeDrawer(): void {
    if (!drawer) return;
    drawer.classList.add("translate-x-full");
    drawer.setAttribute("aria-hidden", "true");
    // A closed drawer is only slid off-screen by a transform, so its Close and
    // Export buttons stayed in the tab order — two phantom stops at the end of
    // every page, inside an element already marked aria-hidden. `inert` removes
    // it from both the tab order and the accessibility tree, which is the pair
    // aria-hidden alone cannot deliver.
    drawer.setAttribute("inert", "");
    restoreFocus(drawer);
  }
  document.getElementById("schedule-agenda-toggle")?.addEventListener("click", () => {
    refreshAgenda();
    openDrawer();
  });
  document.getElementById("schedule-agenda-close")?.addEventListener("click", closeDrawer);

  function refreshAgenda(): void {
    if (!agendaList) return;
    agendaList.innerHTML = "";
    if (bookmarks.size === 0) {
      const p = document.createElement("p");
      p.className = "text-sm text-muted-foreground";
      p.textContent = emptyLabel;
      agendaList.appendChild(p);
      return;
    }
    const picked: HTMLElement[] = [];
    bookmarks.forEach((id) => {
      const card = findCard(id);
      if (card) picked.push(card);
    });
    picked.sort((a, b) => (a.getAttribute("data-start") || "").localeCompare(b.getAttribute("data-start") || ""));

    // The grid can only show parallelism within one lens; a clash between a
    // leadership session and a technical one is invisible there by
    // construction. The agenda holds both bookmarks regardless of lens, so
    // it is the only surface that can name the conflict.
    const clashes = findClashes(
      picked.map((c) => ({
        id: c.getAttribute("data-session-id") ?? "",
        start: c.getAttribute("data-start") ?? "",
        duration: Number(c.getAttribute("data-duration") ?? "0"),
      })),
    );
    const byId = new Map(picked.map((c) => [c.getAttribute("data-session-id") ?? "", c]));

    picked.forEach((card) => {
      const id = card.getAttribute("data-session-id");
      const title = card.getAttribute("data-title") || "";
      const start = card.getAttribute("data-start") || "";
      const timeLabel = start.slice(11, 16);
      const room = card.getAttribute("data-room") || "";
      const item = document.createElement("div");
      item.className = "flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 p-3";
      const clashHtml = (clashes.get(id ?? "") ?? [])
        .map((otherId) => byId.get(otherId))
        .filter((other): other is HTMLElement => !!other)
        .map((other) => {
          // A function replacement, not a string one: `String.prototype.replace`
          // treats `$&`, `$$`, `` $` ``, `$'` and `$<name>` as special patterns in
          // a STRING replacement argument, so a Pretalx title containing `$&`
          // would render as the literal `{title}` token instead of the title
          // itself. A function replacement disables that handling. escHtml still
          // runs on the result, so this is a correctness fix, not a security one.
          const label = clashLabel
            .replace("{title}", () => other.getAttribute("data-title") || "")
            .replace("{room}", () => other.getAttribute("data-room") || "");
          return `<div class="text-xs text-destructive-strong">${escHtml(label)}</div>`;
        })
        .join("");
      item.innerHTML = `
        <div class="min-w-0">
          <div class="text-xs text-muted-foreground">${escHtml(timeLabel)} · ${escHtml(room)}</div>
          <div class="text-sm font-semibold text-foreground truncate">${escHtml(title)}</div>
          ${clashHtml}
        </div>
        <button type="button" class="agenda-remove shrink-0 text-muted-foreground hover:text-foreground" aria-label="${escHtml(agendaRemoveLabel)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      `;
      item.querySelector(".agenda-remove")?.addEventListener("click", () => {
        if (!id) return;
        bookmarks.delete(id);
        setBookmarks(bookmarks);
        updateCount();
        syncBookmarkButtons(id);
        refreshAgenda();
      });
      agendaList.appendChild(item);
    });
  }

  // -----------------------------------------------------------------------
  // iCal export
  // -----------------------------------------------------------------------
  function pad(n: number): string {
    return String(n).padStart(2, "0");
  }
  function icsDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }
  function icsEscape(s: string): string {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  /**
   * The edition an agenda export belongs to, read from the sessions being
   * exported rather than hardcoded — a card's `data-start` already carries
   * its year. Falls back to the current calendar year only if no bookmarked
   * card can be found (defensive; the caller already checks the list isn't
   * empty).
   */
  function icsYear(ids: string[]): number {
    for (const id of ids) {
      const start = findCard(id)?.getAttribute("data-start");
      if (start) {
        const year = new Date(start).getUTCFullYear();
        if (!Number.isNaN(year)) return year;
      }
    }
    return new Date().getUTCFullYear();
  }
  function buildIcs(ids: string[]): string {
    const year = icsYear(ids);
    const events: string[] = [];
    ids.forEach((id) => {
      const card = findCard(id);
      if (!card) return;
      const start = card.getAttribute("data-start") || "";
      const duration = Number(card.getAttribute("data-duration") || 0);
      const end = new Date(new Date(start).getTime() + duration * 60000).toISOString();
      const title = card.getAttribute("data-title") || "";
      const room = card.getAttribute("data-room") || "";
      events.push(
        [
          "BEGIN:VEVENT",
          `UID:${icsSafeUid(id)}@cloudnativedays.fr`,
          `DTSTAMP:${icsDate(new Date().toISOString())}`,
          `DTSTART:${icsDate(start)}`,
          `DTEND:${icsDate(end)}`,
          `SUMMARY:${icsEscape(title)}`,
          `LOCATION:${icsEscape(room + " / CENTQUATRE-PARIS")}`,
          "END:VEVENT",
        ].join("\r\n"),
      );
    });
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//Cloud Native Days France ${year}//Schedule//FR`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");
  }
  function download(filename: string, contents: string): void {
    const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("schedule-export-all")?.addEventListener("click", () => {
    // Link straight to the static /programme.ics build endpoint
    window.location.href = "/programme.ics";
  });
  document.getElementById("schedule-export-agenda")?.addEventListener("click", () => {
    if (bookmarks.size === 0) return;
    const ids = [...bookmarks];
    download(`cnd-france-${icsYear(ids)}-agenda.ics`, buildIcs(ids));
  });
}
