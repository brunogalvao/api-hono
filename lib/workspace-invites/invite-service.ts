// Shared server-side domain service. Kept outside api/ so Vercel does not expose it as a function.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type InviteLocale = "pt-BR" | "en";
export type InviteRole = "administrador" | "operador" | "visualizador";

export type InviteMutationResult = {
  status: string;
  error_code?: string;
  invite_id?: string;
  expires_at?: string | null;
  retry_after?: number;
  [key: string]: unknown;
};

type PreparedMutation = {
  result_status: "ready" | "rate_limited" | "already_member" | "existing_pending_invite";
  invite_id?: string | null;
  raw_token?: string | null;
  delivery_version?: number | null;
  retry_after?: number;
  email_normalized?: string;
  role?: InviteRole;
  locale?: InviteLocale;
  workspace_name?: string;
  inviter_name?: string;
};

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set<InviteRole>(["administrador", "operador", "visualizador"]);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw Object.assign(new Error(`missing_config:${name}`), { code: "server_configuration_error" });
  return value;
}

function positiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw Object.assign(new Error(`invalid_config:${name}`), { code: "server_configuration_error" });
  }
  return value;
}

export function siteUrl(): URL {
  const configuredUrl = process.env.SITE_URL?.trim() || process.env.FRONTEND_URL?.trim();
  if (!configuredUrl) throw Object.assign(new Error("missing_config:SITE_URL"), { code: "server_configuration_error" });
  const url = new URL(configuredUrl);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.username || url.password || url.search || url.hash || (!local && url.protocol !== "https:")) {
    throw Object.assign(new Error("invalid_config:SITE_URL"), { code: "server_configuration_error" });
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  return url;
}

function serviceClient(): SupabaseClient {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isOpaqueToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function isLocale(value: unknown): value is InviteLocale {
  return value === "pt-BR" || value === "en";
}

export function isRole(value: unknown): value is InviteRole {
  return typeof value === "string" && ROLES.has(value as InviteRole);
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(normalizeEmail(value));
}

export function requestSource(headers: Headers): string {
  return headers.get("cf-connecting-ip")?.trim()
    || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function databaseError(error: { message?: string; code?: string } | null): Error {
  const message = error?.message ?? "database_error";
  const known = ["forbidden", "invite_not_available", "workspace_mismatch", "invalid_operation", "invalid_locale"];
  const code = known.find((candidate) => message.includes(candidate)) ?? error?.code ?? "database_error";
  return Object.assign(new Error(code), { code });
}

export function safeErrorCode(error: unknown, fallback = "internal_error"): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || fallback;
  }
  return fallback;
}

function landingUrl(rawToken: string): URL {
  const url = new URL("/auth/workspace-invite", siteUrl());
  url.searchParams.set("token", rawToken);
  return url;
}

function callbackUrl(): URL {
  const url = new URL("/auth/callback", siteUrl());
  url.searchParams.set("flow", "workspace-invite");
  return url;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function renderEmail(input: {
  locale: InviteLocale;
  workspaceName: string;
  inviterName: string;
  role: InviteRole;
  expiresAt: Date;
  url: URL;
}) {
  const pt = input.locale === "pt-BR";
  const workspace = escapeHtml(input.workspaceName);
  const inviter = escapeHtml(input.inviterName);
  const url = escapeHtml(input.url.toString());
  const roles = pt
    ? { administrador: "Administrador", operador: "Operador", visualizador: "Visualizador" }
    : { administrador: "Administrator", operador: "Operator", visualizador: "Viewer" };
  const date = new Intl.DateTimeFormat(input.locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(input.expiresAt);
  const title = pt ? "Você recebeu um convite" : "You have received an invitation";
  const intro = pt
    ? `${inviter} convidou você para colaborar no workspace ${workspace}.`
    : `${inviter} invited you to collaborate in the ${workspace} workspace.`;
  const action = pt ? "Revisar convite" : "Review invitation";
  const security = pt
    ? "Use o mesmo e-mail que recebeu este convite. Se você não esperava esta mensagem, ignore-a."
    : "Use the same email address that received this invitation. If unexpected, ignore this message.";
  const subject = pt ? `Convite para o workspace ${input.workspaceName}` : `Invitation to the ${input.workspaceName} workspace`;
  const html = `<!doctype html><html lang="${input.locale}"><body style="margin:0;background:#f5f3ff;font-family:Arial,sans-serif;color:#1f2937"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px"><tr><td style="padding:40px"><p style="color:#7c3aed;font-weight:700">Finance</p><h1>${title}</h1><p>${intro}</p><p><strong>${pt ? "Seu perfil de acesso" : "Your access role"}:</strong> ${roles[input.role]}</p><p><a href="${url}" style="display:inline-block;padding:13px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">${action}</a></p><p style="color:#6b7280;font-size:13px">${pt ? "Este link expira em" : "This link expires on"} ${date}.</p><p style="overflow-wrap:anywhere;color:#6d28d9;font-size:12px">${url}</p><hr style="border:0;border-top:1px solid #e5e7eb"><p style="color:#6b7280;font-size:12px">${security}</p></td></tr></table></td></tr></table></body></html>`;
  const text = [title, "", intro, `${pt ? "Perfil" : "Role"}: ${roles[input.role]}`, `${pt ? "Expira em" : "Expires on"}: ${date}`, input.url.toString(), "", security].join("\n");
  return { subject, html, text };
}

async function prepareMutation(input: {
  operation: "create" | "resend";
  actorId: string;
  source: string;
  workspaceId?: string;
  inviteId?: string;
  email?: string;
  role?: InviteRole;
  locale: InviteLocale;
}): Promise<PreparedMutation> {
  const service = serviceClient();
  const { data, error } = await service.rpc("rotate_workspace_invite", {
    p_operation: input.operation,
    p_actor_id: input.actorId,
    p_workspace_id: input.workspaceId ?? null,
    p_invite_id: input.inviteId ?? null,
    p_email: input.email ?? null,
    p_role: input.role ?? null,
    p_locale: input.locale,
    p_source: input.source,
    p_actor_limit: positiveIntegerEnv("INVITE_RATE_LIMIT_ACTOR_WORKSPACE_PER_HOUR", 10),
    p_recipient_limit: positiveIntegerEnv("INVITE_RATE_LIMIT_RECIPIENT_WORKSPACE_PER_HOUR", 3),
    p_source_limit: positiveIntegerEnv("INVITE_RATE_LIMIT_SOURCE_PER_HOUR", 30),
  });
  if (error) throw databaseError(error);
  const result = (Array.isArray(data) ? data[0] : data) as PreparedMutation;
  if (!result || result.result_status !== "ready") return result;

  const { data: invite, error: inviteError } = await service.from("workspace_invites")
    .select("email_normalized, role, locale, workspace_id, invited_by").eq("id", result.invite_id).single();
  if (inviteError || !invite) throw databaseError(inviteError);
  const [{ data: workspace, error: workspaceError }, { data: inviter, error: inviterError }] = await Promise.all([
    service.from("workspaces").select("name").eq("id", invite.workspace_id).single(),
    service.from("profiles").select("full_name, email").eq("id", invite.invited_by).single(),
  ]);
  if (workspaceError || !workspace) throw databaseError(workspaceError);
  if (inviterError || !inviter) throw databaseError(inviterError);
  return {
    ...result,
    email_normalized: invite.email_normalized,
    role: invite.role,
    locale: invite.locale,
    workspace_name: workspace.name,
    inviter_name: inviter.full_name?.trim() || inviter.email,
  };
}

async function ensureRecipientIdentity(service: SupabaseClient, email: string): Promise<void> {
  const { data: profile, error: profileError } = await service.from("profiles")
    .select("id").eq("email_normalized", email).maybeSingle();
  if (profileError) throw databaseError(profileError);
  if (profile) return;
  const { error } = await service.auth.admin.createUser({ email, email_confirm: false });
  if (!error || error.status === 422 || /already|exists|registered/i.test(error.message)) return;
  throw Object.assign(new Error("identity_provision_failed"), { code: "identity_provision_failed" });
}

async function recordDelivery(service: SupabaseClient, input: {
  inviteId: string;
  deliveryVersion: number;
  succeeded: boolean;
  providerMessageId?: string;
  errorCode?: string;
}): Promise<{ expires_at: string | null }> {
  const { data, error } = await service.rpc("record_workspace_invite_delivery", {
    p_invite_id: input.inviteId,
    p_delivery_version: input.deliveryVersion,
    p_succeeded: input.succeeded,
    p_provider_message_id: input.providerMessageId ?? null,
    p_error_code: input.errorCode ?? null,
  });
  if (error) throw databaseError(error);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new Error("delivery_record_missing");
  return result as { expires_at: string | null };
}

export async function mutateInvite(input: {
  operation: "create" | "resend";
  actorId: string;
  source: string;
  workspaceId?: string;
  inviteId?: string;
  email?: string;
  role?: InviteRole;
  locale: InviteLocale;
}): Promise<InviteMutationResult> {
  const prepared = await prepareMutation(input);
  if (prepared.result_status !== "ready") {
    return {
      status: prepared.result_status,
      error_code: prepared.result_status === "existing_pending_invite" ? "existing_pending_invite" : prepared.result_status,
      ...(prepared.retry_after ? { retry_after: prepared.retry_after } : {}),
    };
  }
  const inviteId = prepared.invite_id;
  const rawToken = prepared.raw_token;
  const deliveryVersion = prepared.delivery_version;
  if (!inviteId || !rawToken || !deliveryVersion || !prepared.email_normalized || !prepared.role || !prepared.workspace_name || !prepared.inviter_name) {
    throw Object.assign(new Error("invalid_mutation_result"), { code: "invalid_mutation_result" });
  }
  const service = serviceClient();
  try {
    await ensureRecipientIdentity(service, prepared.email_normalized);
  } catch (error) {
    await recordDelivery(service, { inviteId, deliveryVersion, succeeded: false, errorCode: safeErrorCode(error, "identity_provision_failed") }).catch(() => undefined);
    return { status: "delivery_failed", error_code: "identity_provision_failed" };
  }
  const rendered = renderEmail({
    locale: prepared.locale ?? input.locale,
    workspaceName: prepared.workspace_name,
    inviterName: prepared.inviter_name,
    role: prepared.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    url: landingUrl(rawToken),
  });
  let providerMessageId: string;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `workspace-invite/${inviteId}/${deliveryVersion}`,
      },
      body: JSON.stringify({ from: process.env.FROM_EMAIL?.trim() || requiredEnv("RESEND_FROM"), to: [prepared.email_normalized], ...rendered }),
    });
    if (!response.ok) throw Object.assign(new Error("provider_error"), { code: response.status === 429 ? "provider_rate_limited" : "provider_rejected" });
    const payload = await response.json() as { id?: string };
    if (!payload.id) throw Object.assign(new Error("provider_invalid_response"), { code: "provider_invalid_response" });
    providerMessageId = payload.id;
  } catch (error) {
    await recordDelivery(service, { inviteId, deliveryVersion, succeeded: false, errorCode: safeErrorCode(error, "provider_error") }).catch(() => undefined);
    return { status: "delivery_failed", error_code: "email_delivery_failed" };
  }
  const delivery = await recordDelivery(service, { inviteId, deliveryVersion, succeeded: true, providerMessageId });
  return { status: "sent", invite_id: inviteId, expires_at: delivery.expires_at };
}

export async function cancelInvite(inviteId: string, actorId: string): Promise<InviteMutationResult> {
  const { data, error } = await serviceClient().rpc("cancel_workspace_invite", {
    p_invite_id: inviteId,
    p_actor_id: actorId,
  });
  if (error || !data) throw databaseError(error);
  return data as InviteMutationResult;
}

export async function prepareInviteAuth(token: string, source: string): Promise<InviteMutationResult> {
  const service = serviceClient();
  const { data, error } = await service.rpc("prepare_workspace_invite_auth", {
    p_token: token,
    p_source: source,
    p_recipient_limit: positiveIntegerEnv("INVITE_AUTH_RATE_LIMIT_RECIPIENT_PER_HOUR", 6),
    p_source_limit: positiveIntegerEnv("INVITE_AUTH_RATE_LIMIT_SOURCE_PER_HOUR", 30),
  });
  if (error || !data) throw databaseError(error);
  return data as InviteMutationResult;
}

export async function generateInviteMagicLink(email: string): Promise<URL> {
  const { data, error } = await serviceClient().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: callbackUrl().toString() },
  });
  if (error || !data.properties?.action_link) throw new Error("auth_link_failed");
  return new URL(data.properties.action_link);
}

export async function previewOrAcceptInvite(
  supabase: SupabaseClient,
  operation: "preview" | "accept",
  token: string,
): Promise<InviteMutationResult> {
  const { data, error } = await supabase.rpc(
    operation === "preview" ? "preview_workspace_invite" : "accept_workspace_invite",
    { p_token: token },
  );
  if (error || !data) throw databaseError(error);
  return data as InviteMutationResult;
}
