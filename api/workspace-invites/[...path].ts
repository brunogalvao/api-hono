import { createAuthApp, createBaseApp } from "../config/baseApp";
import {
  generateInviteMagicLink,
  isOpaqueToken,
  prepareInviteAuth,
  previewOrAcceptInvite,
  requestSource,
} from "../../lib/workspace-invites/invite-service";

export const config = { runtime: "edge" };
const publicApp = createBaseApp();
const authApp = createAuthApp();

async function requestToken(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    return (await request.formData()).get("token");
  }
  return (await request.json() as { token?: unknown }).token;
}

publicApp.post("/api/workspace-invites/prepare-auth", async (c) => {
  c.header("Cache-Control", "no-store");
  const token = await requestToken(c.req.raw).catch(() => null);
  if (!isOpaqueToken(token)) return c.json({ status: "invalid", error_code: "invalid_invite" }, 400);
  try {
    const result = await prepareInviteAuth(token, requestSource(c.req.raw.headers));
    if (result.status !== "ready" || typeof result.email_normalized !== "string") {
      if (result.retry_after) c.header("Retry-After", String(result.retry_after));
      const status = result.status === "rate_limited" ? 429
        : ["expired", "cancelled", "already_accepted"].includes(result.status) ? 410
        : 400;
      return c.json(result, status);
    }
    const magicLink = await generateInviteMagicLink(result.email_normalized);
    const local = magicLink.hostname === "localhost" || magicLink.hostname === "127.0.0.1";
    if (magicLink.protocol !== "https:" && !local) throw new Error("invalid_auth_link");
    c.header("Location", magicLink.toString());
    return c.body(null, 303);
  } catch {
    return c.json({ status: "failed", error_code: "prepare_failed" }, 500);
  }
});

authApp.post("/api/workspace-invites/operation", async (c) => {
  c.header("Cache-Control", "no-store");
  const body = await c.req.json().catch(() => null) as { operation?: unknown; token?: unknown } | null;
  const operation = body?.operation;
  if ((operation !== "preview" && operation !== "accept") || !isOpaqueToken(body?.token)) {
    return c.json({ status: "invalid", error_code: "invalid_request" }, 400);
  }
  try {
    const result = await previewOrAcceptInvite(c.get("supabase"), operation, body.token);
    const status = result.status === "email_mismatch" ? 403
      : result.status === "invalid" ? 404
      : ["expired", "cancelled", "already_accepted"].includes(result.status) ? 410
      : result.status === "failed" ? 409
      : 200;
    return c.json(result, status);
  } catch {
    return c.json({ status: "failed", error_code: "invite_operation_failed" }, 500);
  }
});

const handler = (request: Request) => {
  const path = new URL(request.url).pathname;
  return path.endsWith("/prepare-auth")
    ? publicApp.fetch(request)
    : authApp.fetch(request);
};

export const POST = handler;
export const OPTIONS = handler;
export default handler;
