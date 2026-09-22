/**
 * Client behaviour for the ticketing page. Progressive enhancement only: every
 * form works without it (native number bounds, native GET), so this file adds
 * feedback and never owns a rule. The rules — quantity bounds and the code URL
 * — come from src/lib/tickets/url.ts, shared with the server render, and the
 * price of a seat at each quantity is a table the server rendered
 * (`orderSegments`), which this file only walks.
 */
import { clampQuantity, codeUrlFrom } from "@/lib/tickets/url";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A stretch of quantities sold at one price, as `PurchaseControl` wrote it. */
interface PriceSegment {
  min: number;
  max: number;
  price: number;
  action: string;
  rate?: string;
}

/** Set a reserve form's quantity from elsewhere on the page. */
type ApplyQuantity = (quantity: number) => void;
const setQuantity = new WeakMap<HTMLFormElement, ApplyQuantity>();

// ── Variant A: quantity stepper, live total, group rate applied on its own ─────
for (const form of document.querySelectorAll<HTMLFormElement>("[data-tickets-reserve]")) {
  const input = form.querySelector<HTMLInputElement>("[data-qty-input]");
  if (!input) continue;
  const max = Number(form.dataset.max);
  const price = form.dataset.price ? Number(form.dataset.price) : undefined;
  const template = form.dataset.totalTemplate ?? "{total}";
  const wasTemplate = form.dataset.wasTemplate ?? "{total}";
  const savingTemplate = form.dataset.savingTemplate ?? "{amount}";
  const money = new Intl.NumberFormat(form.dataset.lang === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  // One stretch covering everything when there is no group rate on this tier,
  // so the render below has a single shape to read.
  const segments: PriceSegment[] = form.dataset.segments
    ? JSON.parse(form.dataset.segments)
    : [{ min: 1, max, price: price ?? 0, action: form.action }];
  const total = form.querySelector<HTMLElement>("[data-qty-total]");
  const was = form.querySelector<HTMLElement>("[data-qty-was]");
  const saving = form.querySelector<HTMLElement>("[data-qty-saving]");
  const cap = form.querySelector<HTMLElement>("[data-qty-cap]");
  const applied = form.querySelectorAll<HTMLElement>("[data-group-applied]");
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const decrease = form.querySelector<HTMLButtonElement>('[data-qty-step="-1"]');
  const increase = form.querySelector<HTMLButtonElement>('[data-qty-step="1"]');
  // Only door 1 drives the mobile bar; the Strategy & Leadership control does not.
  const stickyPrice = form.closest("#offre")
    ? document.querySelector<HTMLElement>("[data-sticky-bar] [data-sticky-price]")
    : null;

  const render = (quantity: number, { syncInput = true } = {}) => {
    if (syncInput) input.value = String(quantity);
    const segment = segments.find((s) => quantity >= s.min && quantity <= s.max) ?? segments[0];
    // The action carries the alf.io code of the price actually being paid.
    form.action = segment.action;

    if (decrease) decrease.disabled = quantity <= 1;
    if (increase) increase.disabled = quantity >= max;

    if (total && price !== undefined) {
      total.textContent = template.replace("{total}", money.format(quantity * segment.price));
      const discounted = segment.price < price;
      if (was) {
        was.hidden = !discounted;
        was.textContent = discounted ? wasTemplate.replace("{total}", money.format(quantity * price)) : "";
      }
      if (saving) {
        saving.hidden = !discounted;
        saving.textContent = discounted
          ? savingTemplate.replace("{amount}", money.format(quantity * (price - segment.price)))
          : "";
      }
      if (stickyPrice) stickyPrice.textContent = money.format(segment.price);
    }

    if (cap) cap.hidden = quantity < max;
    applied.forEach((el) => (el.hidden = el.dataset.groupApplied !== segment.rate));

    submit?.setAttribute("data-umami-event-quantite", String(quantity));
    submit?.setAttribute("data-umami-event-tarif", segment.rate ?? "unitaire");
  };

  decrease?.addEventListener("click", () => render(clampQuantity(Number(input.value) - 1, max)));
  increase?.addEventListener("click", () => render(clampQuantity(Number(input.value) + 1, max)));
  // While typing, reflect the value without rewriting the field under the caret;
  // normalise it once the buyer leaves it or submits.
  input.addEventListener("input", () => {
    if (input.value !== "") render(clampQuantity(input.value, max), { syncInput: false });
  });
  input.addEventListener("change", () => render(clampQuantity(input.value, max)));
  form.addEventListener("submit", () => render(clampQuantity(input.value, max)));
  render(clampQuantity(input.value, max));
  setQuantity.set(form, (quantity) => render(clampQuantity(quantity, max)));
}

// ── A group rate, chosen from door 2 or from the team section ──────────────────
// The row is a plain link to door 1, so without this it still lands on the
// stepper. With it, the quantity jumps to the rate's minimum and the discount
// follows from the table above — the page never applies a price of its own.
const offerForm = document.querySelector<HTMLFormElement>("#offre [data-tickets-reserve]");
if (offerForm) {
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-group-apply]")) {
    link.addEventListener("click", (event) => {
      const quantity = Number(link.dataset.qty);
      const apply = setQuantity.get(offerForm);
      if (!apply || !Number.isFinite(quantity)) return;
      event.preventDefault();
      apply(quantity);
      const stepper = offerForm.querySelector<HTMLInputElement>("[data-qty-input]");
      stepper?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      stepper?.focus({ preventScroll: true });
    });
  }
}

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
const offer = document.getElementById("offre");
const offerAction = offer?.querySelector<HTMLElement>("[data-offer-action]");
if (bar && offer && offerAction && "IntersectionObserver" in window) {
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

  // Variant A: the quantity is chosen in door 1, so the bar takes the buyer
  // back to the stepper rather than skipping it.
  if (action?.dataset.stickyAction === "scroll") {
    action.addEventListener("click", (event) => {
      const stepper = offer.querySelector<HTMLInputElement>("[data-qty-input]");
      if (!stepper) return;
      event.preventDefault();
      stepper.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      stepper.focus({ preventScroll: true });
    });
  }
}

// ── Demo switcher: keep the reading position and the open panel across switches ─
// Each state is its own URL, so switching reloads the page; without this the
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
