import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { workspaceCreationErrorCode } from "../lib/workspaces/workspace-service";

describe("workspace creation error handling", () => {
  test.each([
    "workspace_creation_forbidden",
    "workspace_limit_reached",
    "workspace_name_taken",
    "invalid_workspace_name",
  ] as const)("keeps the safe domain code %s", (code) => {
    expect(workspaceCreationErrorCode(new Error(`database: ${code}`))).toBe(code);
  });

  test("does not expose an unknown database error", () => {
    expect(workspaceCreationErrorCode(new Error("secret database detail"))).toBe(
      "workspace_creation_failed",
    );
  });

  test("keeps workspace bootstrap transactional and service-role only", () => {
    const migrationPath = fileURLToPath(
      new URL(
        "../supabase/migrations/20261013165552_create_workspace_transaction.sql",
        import.meta.url,
      ),
    );
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("security definer");
    expect(sql).toContain("insert into public.workspaces");
    expect(sql).toContain("insert into public.workspace_members");
    expect(sql).toContain("insert into public.categories");
    expect(sql).toContain(
      "revoke all on function public.create_workspace_for_owner(uuid, text, integer)",
    );
    expect(sql).toContain("to service_role");
  });
});
