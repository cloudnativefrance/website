/**
 * Client behaviour for the ticketing page. Progressive enhancement only: every
 * form and link works without it, so this file adds feedback and never owns a
 * rule. The code URL comes from src/lib/tickets/url.ts, shared with the server
 * render.
 */
import { codeUrlFrom } from "@/lib/tickets/url";

// ── "I have a code": strip spaces, refuse empty, hand over to alf.io ────────────
for (const form of document.querySelectorAll<HTMLFormElement>("[data-tickets-code]")) {
  const input = form.querySelector<HTMLInputElement>("[data-code-input]");
  const error = form.querySelector<HTMLElement>("[data-code-error]");
  const listing = form.dataset.listing;
  if (!input || !error || !listing) continue;
  const describedBy = input.getAttribute("aria-describedby") ?? "";

  const clearError = () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", describedBy);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = codeUrlFrom(listing, input.value);
    if (!result.ok) {
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", `${error.id} ${describedBy}`.trim());
      input.focus();
      return;
    }
    clearError();
    input.value = result.code;
    window.location.assign(result.url);
  });
  input.addEventListener("input", () => {
    if (!error.hidden) clearError();
  });
}

// ── Mobile bar: shown whenever door 1's action is off screen ───────────────────
// It watches the action column itself, not the whole door: the ladder below the
// button must not keep the bar away while the button is already out of sight,
// and a short phone that opens with the button below the fold gets the bar too.
const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
const offerAction = document.querySelector<HTMLElement>("#offre [data-offer-action]");
if (bar && offerAction && "IntersectionObserver" in window) {
  const action = bar.querySelector<HTMLAnchorElement>("[data-sticky-action]");
  const observer = new IntersectionObserver(
    ([entry]) => {
      const show = !entry.isIntersecting;
      bar.dataset.visible = String(show);
      bar.setAttribute("aria-hidden", String(!show));
      if (action) action.tabIndex = show ? 0 : -1;
    },
    { threshold: 0.5 },
  );
  observer.observe(offerAction);
}

// ── Demo switcher: keep the reading position and the open panel across switches ─
// Each phase is its own URL, so switching reloads the page; without this the
// panel would close and the page jump back to the top on every click. The
// panel itself opens with the native popover attributes, with no JS involved.
const SCROLL_KEY = "cnd-tickets-demo-scroll";
const PANEL_KEY = "cnd-tickets-demo-panel";
const panel = document.querySelector<HTMLElement>("[data-demo-panel]");

for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-demo-link]")) {
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      sessionStorage.setItem(PANEL_KEY, "open");
    } catch {
      // Storage can be unavailable (private mode); the switch still works.
    }
  });
}

if (document.querySelector("[data-demo-bar]")) {
  try {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) {
      sessionStorage.removeItem(SCROLL_KEY);
      window.scrollTo({ top: Number(saved), behavior: "instant" });
    }
    // Consumed on arrival: the panel reopens after a switch, not on a later
    // visit where the reader closed it and navigated off the page.
    if (sessionStorage.getItem(PANEL_KEY) === "open") {
      sessionStorage.removeItem(PANEL_KEY);
      panel?.showPopover?.();
    }
  } catch {
    // Nothing to restore.
  }
}
