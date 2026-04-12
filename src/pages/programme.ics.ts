import type { APIRoute } from "astro";
import { buildIcs, loadSessions } from "@/lib/schedule";

export const GET: APIRoute = async () => {
  const all = await loadSessions();
  const sessions = all.filter((s) => s.status !== "cancelled");
  return new Response(buildIcs(sessions), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"cnd-france-2027.ics\"",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
