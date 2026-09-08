import { ZodError, type ZodType } from "zod";
import { isAdmin } from "./auth";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Wrap a handler with JSON error handling + optional admin gate. */
export function handler(
  fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
  opts: { admin?: boolean } = {},
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      if (opts.admin && !(await isAdmin())) return bad("unauthorized", 401);
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return Response.json({ error: "validation", issues: err.issues }, { status: 422 });
      }
      console.error("[api]", err);
      return bad("internal", 500);
    }
  };
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}
