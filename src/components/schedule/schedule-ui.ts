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
  type FilterState,
} from "@/lib/schedule-filter";

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

  /** Cards appear once per view, so a session id can match two elements. */
  const cards = () => Array.from(document.querySelectorAll<HTMLElement>(".session-card"));

  function normalise(v: string): string {
    return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function apply() {
    const query = normalise(state.query.trim());
    const visible = new Set<string>();

    for (const card of cards()) {
      const room = card.getAttribute("data-room") ?? "";
      const format = card.getAttribute("data-format") ?? "";
      const track = card.getAttribute("data-track") ?? "";
      const level = card.getAttribute("data-level") ?? "";
      const facetOk =
        (format === "keynote" || state.room.size === 0 || state.room.has(room)) &&
        (state.format.size === 0 || state.format.has(format)) &&
        (state.track.size === 0 || state.track.has(track)) &&
        (state.level.size === 0 || state.level.has(level));
      const searchOk = !query || normalise(card.getAttribute("data-search") ?? "").includes(query);
      const show = facetOk && searchOk;
      card.classList.toggle("is-hidden", !show);
      if (show) visible.add(card.getAttribute("data-session-id") ?? "");
    }

    // Hide a slot or group whose cards are all filtered out, so the page does
    // not fill with empty time headings.
    for (const container of document.querySelectorAll<HTMLElement>(".grid-view-row, .list-view-group")) {
      const any = container.querySelector(".session-card:not(.is-hidden)");
      container.classList.toggle("is-hidden", !any);
    }
    for (const band of document.querySelectorAll<HTMLElement>(".grid-view-break")) {
      band.classList.toggle("is-hidden", Boolean(state.query.trim()) || activeFilterCount(state) > 0);
    }

    if (countEl) {
      countEl.textContent =
        visible.size === 0
          ? noneLabel
          : countTemplate.replace("{n}", String(visible.size)).replace("{total}", String(total));
    }

    for (const btn of document.querySelectorAll<HTMLElement>(".schedule-filter")) {
      const f = btn.getAttribute("data-filter") as keyof FilterState | null;
      const v = btn.getAttribute("data-value");
      if (!f || !v || f === "query") continue;
      const on = (state[f] as Set<string>).has(v);
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    const active = activeFilterCount(state);
    const badge = document.getElementById("schedule-filter-active-count");
    if (badge) {
      badge.textContent = active ? String(active) : "";
      badge.toggleAttribute("hidden", active === 0);
    }
    clearSearchEl?.toggleAttribute("hidden", !state.query);
  }

  // Hiding relies on Tailwind v4's preflight, which declares
  // `[hidden] { display: none !important }`. Without that `!important` the
  // views' own `.grid-view { display: grid }` / `.list-view { display: flex }`
  // would win — author rules outrank the UA sheet — and both views would render
  // at once with no error anywhere. Disabling preflight breaks this toggle.
  function setView(view: "grid" | "list", persist = true) {
    gridView?.toggleAttribute("hidden", view !== "grid");
    listView?.toggleAttribute("hidden", view !== "list");
    for (const btn of document.querySelectorAll<HTMLElement>("[data-view]")) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-view") === view ? "true" : "false");
    }
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

  for (const btn of document.querySelectorAll<HTMLElement>("[data-view]")) {
    btn.addEventListener("click", () => setView(btn.getAttribute("data-view") as "grid" | "list"));
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
  const initial =
    fromUrl === "grid" || fromUrl === "list"
      ? fromUrl
      : stored === "grid" || stored === "list"
        ? stored
        : ((root.getAttribute("data-default-view") as "grid" | "list") ?? "grid");
  setView(initial, false);
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

  /** Any one card carrying this session id, regardless of which view it lives in. */
  function findCard(id: string): HTMLElement | undefined {
    return cards().find((c) => c.getAttribute("data-session-id") === id);
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
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
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
          `<span class="inline-flex items-center rounded-full bg-background/40 border border-border px-2.5 py-0.5 text-xs text-muted-foreground uppercase tracking-widest">${escHtml(level)}</span>`,
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
  }

  function closeModal(): void {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    modalSessionId = null;
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
    if (ev.key === "Escape" && modal && !modal.classList.contains("hidden")) closeModal();
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

  function openDrawer(): void {
    if (!drawer) return;
    drawer.classList.remove("translate-x-full");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer(): void {
    if (!drawer) return;
    drawer.classList.add("translate-x-full");
    drawer.setAttribute("aria-hidden", "true");
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
    picked.forEach((card) => {
      const id = card.getAttribute("data-session-id");
      const title = card.getAttribute("data-title") || "";
      const start = card.getAttribute("data-start") || "";
      const timeLabel = start.slice(11, 16);
      const room = card.getAttribute("data-room") || "";
      const item = document.createElement("div");
      item.className = "flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 p-3";
      item.innerHTML = `
        <div class="min-w-0">
          <div class="text-xs text-muted-foreground">${escHtml(timeLabel)} · ${escHtml(room)}</div>
          <div class="text-sm font-semibold text-foreground truncate">${escHtml(title)}</div>
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
  function buildIcs(ids: string[]): string {
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
      "PRODID:-//Cloud Native Days France 2027//Schedule//FR",
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
    download("cnd-france-2027-agenda.ics", buildIcs([...bookmarks]));
  });
}
