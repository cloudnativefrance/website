/**
 * Progressive enhancement for the ticketing page: every form and link works
 * without it.
 */
import { codeUrl, handOffOnce, openInNewTab } from "@/lib/tickets/alfio";

// "J'ai un code": strip whitespace, refuse an empty code, hand it to alf.io.
for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-tickets-code]",
)) {
  const input = form.querySelector<HTMLInputElement>("[data-code-input]");
  const error = form.querySelector<HTMLElement>("[data-code-error]");
  if (!input || !error) continue;
  const handOff = handOffOnce(3_000);

  const showError = (show: boolean) => {
    error.hidden = !show;
    if (show) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", error.id);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = codeUrl(form.action, input.value);
    showError(!result.ok);
    if (!result.ok) {
      input.focus();
      return;
    }
    input.value = result.code;
    if (handOff()) openInNewTab(result.url, window);
  });
  input.addEventListener("input", () => showError(false));
}

// Mobile bar: shown while both tickets' buttons are off screen. It watches the
// buttons, not the cards, so the ladder under a button does not keep it away.
const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
const buttons = document.querySelectorAll<HTMLElement>("[data-offer-action]");
if (bar && buttons.length > 0 && "IntersectionObserver" in window) {
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
  for (const button of buttons) observer.observe(button);
}
