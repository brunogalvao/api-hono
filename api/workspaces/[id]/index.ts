import { z } from "zod";
import { createAuthApp } from "../../config/baseApp";
import {
  deleteOwnedWorkspace,
  workspaceManagementErrorCode,
} from "../../../lib/workspaces/workspace-service";

export const config = { runtime: "edge" };
const app = createAuthApp();
const workspaceIdSchema = z.string().uuid();

app.delete("/api/workspaces/:id", async (c) => {
  const parsedId = workspaceIdSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    return c.json({ status: "invalid", error_code: "workspace_not_found" }, 404);
  }

  try {
    const result = await deleteOwnedWorkspace(c.get("user").id, parsedId.data);
    return c.json(result, 200);
  } catch (error) {
    const code = workspaceManagementErrorCode(error);
    const status = code === "workspace_not_found"
      ? 404
      : code === "workspace_delete_forbidden"
        ? 403
        : code === "last_owned_workspace"
          ? 409
          : 500;
    return c.json({ status: "failed", error_code: code }, status);
  }
});

const handler = (request: Request) => app.fetch(request);

export const DELETE = handler;
export const OPTIONS = handler;
export default handler;
