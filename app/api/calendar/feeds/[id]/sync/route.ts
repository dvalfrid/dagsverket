import { handler, ok, bad } from "@/lib/http";
import { syncFeed } from "@/lib/calendar";

export const POST = handler(
  async (_req, { params }) => {
    const { id } = await params;
    try {
      const { count } = await syncFeed(id);
      return ok({ ok: true, count });
    } catch (err) {
      return bad(err instanceof Error ? err.message : "sync-failed", 502);
    }
  },
  { admin: true },
);
