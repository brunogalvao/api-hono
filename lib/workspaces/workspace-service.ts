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

const MANAGEMENT_CODES = [
  "workspace_not_found",
  "workspace_delete_forbidden",
  "last_owned_workspace",
  "workspace_owner_cannot_leave",
  "workspace_membership_not_found",
] as const;

export type WorkspaceCreationErrorCode = (typeof KNOWN_CODES)[number] | "workspace_creation_failed";
export type WorkspaceManagementErrorCode =
  | (typeof MANAGEMENT_CODES)[number]
  | "workspace_management_failed";

export type WorkspaceLifecycleResult = {
  status: "deleted" | "left";
  workspace_id: string;
  workspace_name: string;
};

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

export function workspaceManagementErrorCode(
  error: unknown,
): WorkspaceManagementErrorCode {
  const message = error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "";
  return MANAGEMENT_CODES.find((code) => message.includes(code)) ??
    "workspace_management_failed";
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

async function runLifecycleMutation(
  operation: "delete_workspace_for_owner" | "leave_workspace",
  actorId: string,
  workspaceId: string,
): Promise<WorkspaceLifecycleResult> {
  const { data, error } = await serviceClient().rpc(operation, {
    p_actor_id: actorId,
    p_workspace_id: workspaceId,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("invalid_workspace_lifecycle_response");
  }
  return data as WorkspaceLifecycleResult;
}

export function deleteOwnedWorkspace(
  actorId: string,
  workspaceId: string,
): Promise<WorkspaceLifecycleResult> {
  return runLifecycleMutation("delete_workspace_for_owner", actorId, workspaceId);
}

export function leaveWorkspace(
  actorId: string,
  workspaceId: string,
): Promise<WorkspaceLifecycleResult> {
  return runLifecycleMutation("leave_workspace", actorId, workspaceId);
}
