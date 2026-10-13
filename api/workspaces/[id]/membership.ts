import { z } from "zod";
import { createAuthApp } from "../../config/baseApp";
import {
  leaveWorkspace,
  workspaceManagementErrorCode,
} from "../../../lib/workspaces/workspace-service";

export const config = { runtime: "edge" };
const app = createAuthApp();
const workspaceIdSchema = z.string().uuid();

app.delete("/api/workspaces/:id/membership", async (c) => {
  const parsedId = workspaceIdSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    return c.json({ status: "invalid", error_code: "workspace_not_found" }, 404);
  }

  try {
    const result = await leaveWorkspace(c.get("user").id, parsedId.data);
    return c.json(result, 200);
  } catch (error) {
    const code = workspaceManagementErrorCode(error);
    const status = code === "workspace_not_found" ||
        code === "workspace_membership_not_found"
      ? 404
      : code === "workspace_owner_cannot_leave"
        ? 409
        : 500;
    return c.json({ status: "failed", error_code: code }, status);
  }
});

const handler = (request: Request) => app.fetch(request);

export const DELETE = handler;
export const OPTIONS = handler;
export default handler;
