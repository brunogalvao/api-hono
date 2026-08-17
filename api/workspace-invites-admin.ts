// Consolidated administrative invite routes selected by explicit Vercel rewrites.
import { z } from "zod";
import { createAuthApp } from "./config/baseApp";
import {
  cancelInvite,
  isEmail,
  isLocale,
  isRole,
  isUuid,
  mutateInvite,
  normalizeEmail,
  requestSource,
  safeErrorCode,
} from "../lib/workspace-invites/invite-service";

export const config = { runtime: "edge" };
const app = createAuthApp();

const createSchema = z.object({
  email: z.string(),
  role: z.string(),
  locale: z.string().optional().default("pt-BR"),
});

app.post("/api/workspaces/:id/invites", async (c) => {
  c.header("Cache-Control", "no-store");
  const workspaceId = c.req.param("id");
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!isUuid(workspaceId) || !parsed.success || !isEmail(parsed.data.email)
    || !isRole(parsed.data.role) || !isLocale(parsed.data.locale)) {
    return c.json({ status: "invalid", error_code: "invalid_request" }, 400);
  }
  try {
    const result = await mutateInvite({
      operation: "create",
      actorId: c.get("user").id,
      source: requestSource(c.req.raw.headers),
      workspaceId,
      email: normalizeEmail(parsed.data.email),
      role: parsed.data.role,
      locale: parsed.data.locale,
    });
    if (result.retry_after) c.header("Retry-After", String(result.retry_after));
    const status = result.status === "sent" ? 201
      : result.status === "rate_limited" ? 429
      : result.status === "delivery_failed" ? 502
      : 409;
    return c.json(result, status);
  } catch (error) {
    const code = safeErrorCode(error);
    const status = code === "forbidden" ? 403 : code === "invite_not_available" ? 409 : 500;
    return c.json({ status: "failed", error_code: code === "forbidden" ? code : code === "invite_not_available" ? code : "mutation_failed" }, status);
  }
});

app.post("/api/workspaces/:id/invites/:inviteId/resend", async (c) => {
  c.header("Cache-Control", "no-store");
  const workspaceId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const body = await c.req.json().catch(() => ({})) as { locale?: unknown };
  const locale = body.locale ?? "pt-BR";
  if (!isUuid(workspaceId) || !isUuid(inviteId) || !isLocale(locale)) {
    return c.json({ status: "invalid", error_code: "invalid_request" }, 400);
  }
  try {
    const result = await mutateInvite({
      operation: "resend",
      actorId: c.get("user").id,
      source: requestSource(c.req.raw.headers),
      workspaceId,
      inviteId,
      locale,
    });
    if (result.retry_after) c.header("Retry-After", String(result.retry_after));
    const status = result.status === "sent" ? 200
      : result.status === "rate_limited" ? 429
      : result.status === "delivery_failed" ? 502
      : 409;
    return c.json(result, status);
  } catch (error) {
    const code = safeErrorCode(error);
    const status = code === "forbidden" ? 403 : code === "invite_not_available" ? 409 : 500;
    return c.json({ status: "failed", error_code: code === "forbidden" ? code : code === "invite_not_available" ? code : "mutation_failed" }, status);
  }
});

app.delete("/api/workspaces/:id/invites/:inviteId", async (c) => {
  c.header("Cache-Control", "no-store");
  const workspaceId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  if (!isUuid(workspaceId) || !isUuid(inviteId)) {
    return c.json({ status: "invalid", error_code: "invalid_request" }, 400);
  }
  try {
    const result = await cancelInvite(inviteId, c.get("user").id);
    const status = result.status === "forbidden" ? 403
      : result.status === "not_found" ? 404
      : result.status === "not_available" ? 409
      : 200;
    return c.json(result, status);
  } catch {
    return c.json({ status: "failed", error_code: "cancel_failed" }, 500);
  }
});

function routedRequest(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname !== "/api/workspace-invites-admin") return request;
  const operation = url.searchParams.get("operation");
  const workspaceId = url.searchParams.get("workspaceId");
  const inviteId = url.searchParams.get("inviteId");
  if (!workspaceId) return request;
  url.pathname = operation === "create"
    ? `/api/workspaces/${workspaceId}/invites`
    : operation === "resend" && inviteId
      ? `/api/workspaces/${workspaceId}/invites/${inviteId}/resend`
      : inviteId
        ? `/api/workspaces/${workspaceId}/invites/${inviteId}`
        : url.pathname;
  return new Request(url, request);
}

const handler = (request: Request) => app.fetch(routedRequest(request));

export const POST = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export default handler;
