import { z } from "zod";
import { createAuthApp } from "../config/baseApp";
import {
  createWorkspace,
  workspaceCreationErrorCode,
} from "../../lib/workspaces/workspace-service";

export const config = { runtime: "edge" };
const app = createAuthApp();

const createSchema = z.object({
  name: z.string().trim().min(3).max(60),
});

app.post("/api/workspaces", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ status: "invalid", error_code: "invalid_workspace_name" }, 400);
  }

  try {
    const workspace = await createWorkspace(c.get("user").id, parsed.data.name);
    return c.json({ status: "created", workspace }, 201);
  } catch (error) {
    const code = workspaceCreationErrorCode(error);
    const status = code === "workspace_creation_forbidden"
      ? 403
      : code === "workspace_limit_reached" || code === "workspace_name_taken"
        ? 409
        : 500;
    return c.json({ status: "failed", error_code: code }, status);
  }
});

const handler = (request: Request) => app.fetch(request);

export const POST = handler;
export const OPTIONS = handler;
export default handler;
