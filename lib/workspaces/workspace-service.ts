import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CreatedWorkspace = {
  id: string;
  name: string;
  superuser_id: string;
  role: "administrador";
  created_at: string;
};

const KNOWN_CODES = [
  "workspace_creation_forbidden",
  "workspace_limit_reached",
  "workspace_name_taken",
  "invalid_workspace_name",
] as const;

export type WorkspaceCreationErrorCode = (typeof KNOWN_CODES)[number] | "workspace_creation_failed";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw Object.assign(new Error(`missing_config:${name}`), {
      code: "server_configuration_error",
    });
  }
  return value;
}

function maximumWorkspaces(): number {
  const configured = Number(process.env.MAX_WORKSPACES_PER_OWNER?.trim() || "20");
  return Number.isSafeInteger(configured) && configured >= 1 && configured <= 100
    ? configured
    : 20;
}

function serviceClient(): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function workspaceCreationErrorCode(error: unknown): WorkspaceCreationErrorCode {
  const message = error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "";
  return KNOWN_CODES.find((code) => message.includes(code)) ?? "workspace_creation_failed";
}

export async function createWorkspace(
  actorId: string,
  name: string,
): Promise<CreatedWorkspace> {
  const { data, error } = await serviceClient().rpc("create_workspace_for_owner", {
    p_actor_id: actorId,
    p_name: name.trim(),
    p_max_workspaces: maximumWorkspaces(),
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("invalid_workspace_response");
  }
  return data as CreatedWorkspace;
}
