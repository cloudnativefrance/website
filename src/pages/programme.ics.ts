import type { APIRoute } from "astro";
import { buildIcs, loadSessions } from "@/lib/schedule";
import { CURRENT_EDITION } from "@/lib/editions";
import { isEditionLoadable } from "@/lib/edition-visibility";

/**
 * The calendar feed serves one edition: the current one.
 *
 * It has no flag gate of its own — a static build cannot serve a 404, so there
 * is no "coming soon" state to fall back to. Instead it asserts that the
 * edition it serves may be published at all, and fails the build if not. That
 * turns a future edit ("point the feed at next year") from a silent leak of an
 * unannounced schedule into a red build.
 */
export const GET: APIRoute = async () => {
  const year = CURRENT_EDITION;
  if (!isEditionLoadable(year)) {
    throw new Error(
      `[programme.ics] refusing to serve edition ${year}: it is not publicly ` +
        `loadable. This feed has no coming-soon state — pin it to a public edition.`,
    );
  }

  const all = await loadSessions(year);
  const sessions = all.filter((s) => s.status !== "cancelled");
  return new Response(buildIcs(sessions, year), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="cnd-france-${year}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
