/**
 * Client behaviour for the ticketing page. Progressive enhancement only: every
 * form and link works without it, so this file adds feedback and never owns a
 * rule. The code URL comes from src/lib/tickets/url.ts, shared with the server
 * render.
 */
import { codeUrlFrom, handOffOnce, openInNewTab } from "@/lib/tickets/url";

/** A double-click on "Utiliser mon code" must not open two tabs (two alf.io holds). */
const HANDOFF_COOLDOWN_MS = 3_000;

// ── "I have a code": strip spaces, refuse empty, hand over to alf.io ────────────
for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-tickets-code]",
)) {
  const input = form.querySelector<HTMLInputElement>("[data-code-input]");
  const error = form.querySelector<HTMLElement>("[data-code-error]");
  const listing = form.dataset.listing;
  if (!input || !error || !listing) continue;
  const describedBy = input.getAttribute("aria-describedby") ?? "";
  const handOff = handOffOnce(HANDOFF_COOLDOWN_MS);

  const clearError = () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    if (describedBy) input.setAttribute("aria-describedby", describedBy);
    else input.removeAttribute("aria-describedby");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = codeUrlFrom(listing, input.value);
    if (!result.ok) {
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        `${error.id} ${describedBy}`.trim(),
      );
      input.focus();
      return;
    }
    clearError();
    input.value = result.code;
    if (handOff()) openInNewTab(result.url, window);
  });
  input.addEventListener("input", () => {
    if (!error.hidden) clearError();
  });
}

// ── Mobile bar: shown whenever both tickets' actions are off screen ───────────
// It watches the action columns themselves, not the whole cards: the ladder
// below the button must not keep the bar away while the button is already out
// of sight, and a short phone that opens with the button below the fold gets
// the bar too. The Stratégie & Leadership ticket's action counts as well, so the bar never
// sits under a button for the other ticket.
const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
const offerActions = [
  ...document.querySelectorAll<HTMLElement>("[data-offer-action]"),
];
if (bar && offerActions.length > 0 && "IntersectionObserver" in window) {
  const action = bar.querySelector<HTMLAnchorElement>("[data-sticky-action]");
  const onScreen = new Set<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      const show = onScreen.size === 0;
      bar.dataset.visible = String(show);
      bar.setAttribute("aria-hidden", String(!show));
      if (action) action.tabIndex = show ? 0 : -1;
    },
    { threshold: 0.5 },
  );
  for (const offerAction of offerActions) observer.observe(offerAction);
}
