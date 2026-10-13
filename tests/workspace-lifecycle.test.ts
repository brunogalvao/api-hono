import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { workspaceManagementErrorCode } from "../lib/workspaces/workspace-service";

describe("workspace lifecycle", () => {
  test.each([
    "workspace_not_found",
    "workspace_delete_forbidden",
    "last_owned_workspace",
    "workspace_owner_cannot_leave",
    "workspace_membership_not_found",
  ] as const)("keeps the safe domain code %s", (code) => {
    expect(workspaceManagementErrorCode(new Error(`database: ${code}`))).toBe(code);
  });

  test("does not expose an unknown database error", () => {
    expect(workspaceManagementErrorCode(new Error("secret database detail"))).toBe(
      "workspace_management_failed",
    );
  });

  test("keeps deletion and leave operations transactional and service-role only", () => {
    const migrationPath = fileURLToPath(
      new URL(
        "../supabase/migrations/20261013211229_manage_workspace_lifecycle.sql",
        import.meta.url,
      ),
    );
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("security definer");
    expect(sql).toContain("last_owned_workspace");
    expect(sql).toContain("workspace_owner_cannot_leave");
    expect(sql).toContain("delete from public.workspace_member_permissions");
    expect(sql).toContain("delete from public.workspace_members");
    expect(sql).toContain("delete from public.workspaces");
    expect(sql).toContain(
      "revoke all on function public.delete_workspace_for_owner(uuid, uuid)",
    );
    expect(sql).toContain("to service_role");
  });
});
