import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../supabase/migrations/20261013141457_allow_members_to_read_own_workspace_membership.sql",
  import.meta.url,
);

describe("workspace_members RLS", () => {
  it("permite que o usuário autenticado leia o próprio vínculo", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    expect(sql).toContain("to authenticated");
    expect(sql).toContain("user_id = (select auth.uid())");
    expect(sql).toContain(
      "private.has_workspace_permission(workspace_id, 'members', 'read')",
    );
  });
});
