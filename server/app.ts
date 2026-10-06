import { Hono } from "hono";
import expenseTypesHandler from "../api/expense-types/index";
import groupInviteHandler from "../api/groups/[id]/invite";
import groupInvitesHandler from "../api/groups/[id]/invites";
import groupInviteHandlerById from "../api/groups/[id]/invites/[inviteId]";
import groupMembersHandler from "../api/groups/[id]/members";
import groupMemberHandler from "../api/groups/[id]/members/[userId]";
import groupsHandler from "../api/groups/index";
import healthHandler from "../api/health";
import investmentAnalysisHandler from "../api/ia/analise-investimento";
import iaHandler from "../api/ia/index";
import iaConnectionHandler from "../api/ia/teste-conexao";
import incomeHandlerById from "../api/incomes/[id]";
import incomesHandler from "../api/incomes/index";
import totalIncomesHandler from "../api/incomes/total-incomes";
import monthlyIncomesHandler from "../api/incomes/total-por-mes";
import acceptInviteHandler from "../api/invite/[token]/accept";
import inviteHandler from "../api/invite/[token]/index";
import parcelasHandlerById from "../api/parcelas/[id]/index";
import parcelasHandler from "../api/parcelas/index";
import supabaseTestHandler from "../api/supabase-test";
import taskHandlerById from "../api/tasks/[id]";
import tasksHandler from "../api/tasks/index";
import totalPaidHandler from "../api/tasks/total-paid";
import totalPriceHandler from "../api/tasks/total-price";
import totalTasksHandler from "../api/tasks/total";
import userHandler from "../api/user/index";
import workspaceInviteAdminHandler from "../api/workspace-invites-admin";
import workspaceInviteAuthHandler from "../api/workspace-invites/[...path]";
import docsHandler from "../api/docs-ui";
import { GET as getApiHome } from "../api/index";
import { GET as getOpenApi } from "../api/openapi";
import pingHandler from "../api/ping";
import { GET as getTest } from "../api/test";

type FetchHandler = (request: Request) => Response | Promise<Response>;

function withPath(handler: FetchHandler, pathname: string) {
  return (request: Request) => {
    const url = new URL(request.url);
    url.pathname = pathname;
    return handler(new Request(url, request));
  };
}

export function createLocalApp() {
  const app = new Hono();

  app.get("/", () => getApiHome());
  app.all("/api/ping", (c) => pingHandler(c.req.raw));
  app.get("/api/test", () => getTest());
  app.get("/api/openapi", () => getOpenApi());
  app.all("/api/docs", (c) => docsHandler(c.req.raw));
  app.all("/api/health", (c) => healthHandler(c.req.raw));
  app.all("/api/supabase-test", (c) => supabaseTestHandler(c.req.raw));

  app.all("/api/tasks/total", (c) => totalTasksHandler(c.req.raw));
  app.all("/api/tasks/total-price", (c) => totalPriceHandler(c.req.raw));
  app.all("/api/tasks/total-paid", (c) => totalPaidHandler(c.req.raw));
  app.all("/api/tasks/:id", (c) => taskHandlerById(c.req.raw));
  app.all("/api/tasks", (c) => tasksHandler(c.req.raw));

  app.all("/api/incomes/total-incomes", (c) => totalIncomesHandler(c.req.raw));
  app.all("/api/incomes/total-por-mes", (c) => monthlyIncomesHandler(c.req.raw));
  app.all("/api/incomes/:id", (c) => incomeHandlerById(c.req.raw));
  app.all("/api/incomes", (c) => incomesHandler(c.req.raw));
  app.all("/api/expense-types", (c) => expenseTypesHandler(c.req.raw));
  app.all("/api/user", (c) => userHandler(c.req.raw));

  app.all("/api/ia/analise-investimento", (c) => investmentAnalysisHandler(c.req.raw));
  app.all("/api/ia/teste-conexao", (c) => iaConnectionHandler(c.req.raw));
  app.all("/api/ia/status", (c) => iaConnectionHandler(c.req.raw));
  app.all("/api/ia", (c) => withPath(iaHandler, "/")(c.req.raw));

  app.all("/api/parcelas/:id", (c) => parcelasHandlerById(c.req.raw));
  app.all("/api/parcelas", (c) => parcelasHandler(c.req.raw));

  app.all("/api/groups/:id/invites/:inviteId", (c) => groupInviteHandlerById(c.req.raw));
  app.all("/api/groups/:id/invites", (c) => groupInvitesHandler(c.req.raw));
  app.all("/api/groups/:id/invite", (c) => groupInviteHandler(c.req.raw));
  app.all("/api/groups/:id/members/:userId", (c) => groupMemberHandler(c.req.raw));
  app.all("/api/groups/:id/members", (c) => groupMembersHandler(c.req.raw));
  app.all("/api/groups", (c) => groupsHandler(c.req.raw));

  app.all("/api/invite/:token/accept", (c) => acceptInviteHandler(c.req.raw));
  app.all("/api/invite/:token", (c) => inviteHandler(c.req.raw));
  app.all("/api/workspaces/:id/invites/:inviteId/resend", (c) => workspaceInviteAdminHandler(c.req.raw));
  app.all("/api/workspaces/:id/invites/:inviteId", (c) => workspaceInviteAdminHandler(c.req.raw));
  app.all("/api/workspaces/:id/invites", (c) => workspaceInviteAdminHandler(c.req.raw));
  app.all("/api/workspace-invites/prepare-auth", (c) => workspaceInviteAuthHandler(c.req.raw));
  app.all("/api/workspace-invites/operation", (c) => workspaceInviteAuthHandler(c.req.raw));

  app.notFound((c) => c.json({ error: "Endpoint não encontrado", error_code: "not_found" }, 404));
  return app;
}
