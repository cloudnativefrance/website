/**
 * TEST-03 (Phase 20, D-01/D-02/D-03).
 *
 * Typed placeholder testimonials. Copy (quote bodies + attributions) lives in
 * src/i18n/ui.ts under testimonials.*; this file holds shape only (id + i18n
 * key refs) to stay aligned with D-06 Phase 16.
 *
 * TODO(testimonials-real-quotes): Attributions below are fabricated
 * (single-letter first names + "fictive/placeholder" org labels). Replace
 * with organizer-validated real quotes + attributions before v1.2 ships.
 * Tracker: testimonials-real-quotes.
 */

export interface Testimonial {
  readonly id: string;
  readonly quoteKey: `testimonials.${number}.quote`;
  readonly attributionKey: `testimonials.${number}.attribution`;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: "t0",
    quoteKey: "testimonials.0.quote",
    attributionKey: "testimonials.0.attribution",
  },
  {
    id: "t1",
    quoteKey: "testimonials.1.quote",
    attributionKey: "testimonials.1.attribution",
  },
  {
    id: "t2",
    quoteKey: "testimonials.2.quote",
    attributionKey: "testimonials.2.attribution",
  },
] as const;
