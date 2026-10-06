# API endpoints

## Tasks

Authenticated endpoints use the caller's Supabase JWT and preserve RLS.

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/tasks?month=:month&year=:year` | Required | List the user's tasks for a month. |
| `POST` | `/api/tasks` | Required | Create a task and its recurring or installment schedule. Recurrence and installments are mutually exclusive. |
| `PUT` | `/api/tasks/:id` | Required | Update a task and synchronize recurring copies. |
| `DELETE` | `/api/tasks/:id` | Required | Delete a task. `cancel_all=true` removes its installment group. |

Installment values are split in cents so the sum of all installments is exactly the submitted total. Multi-write failures trigger compensating cleanup; a database transaction/RPC remains the preferred future hardening for strict atomicity.

## Secure workspace invitations

All responses are JSON with `Cache-Control: no-store` semantics at the application boundary. Authenticated endpoints require `Authorization: Bearer <Supabase access token>`.

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/workspaces/:id/invites` | Required | Create, rotate and deliver an invitation. Body: `email`, `role`, `locale`. |
| `POST` | `/api/workspaces/:id/invites/:inviteId/resend` | Required | Rotate the token and resend a pending or expired invitation. Body: `locale`. |
| `DELETE` | `/api/workspaces/:id/invites/:inviteId` | Required | Cancel a pending or expired invitation. |
| `POST` | `/api/workspace-invites/prepare-auth` | Public | Validate an opaque token and redirect to a Supabase magic link. Accepts form or JSON body with `token`. |
| `POST` | `/api/workspace-invites/operation` | Required | Preview or accept an invitation. Body: `operation` (`preview` or `accept`) and `token`. |

The API stores only a SHA-256 token hash in the database. Token rotation, rate limiting, delivery recording, cancellation and acceptance are implemented by the migrations `20260817120453_secure_workspace_invites.sql` and `20260818213724_allow_expired_workspace_invite_actions.sql` and their transactional RPCs.

Required runtime variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, plus `SITE_URL` (or legacy `FRONTEND_URL`) and `FROM_EMAIL` (or legacy `RESEND_FROM`). Optional rate-limit variables are prefixed with `INVITE_RATE_LIMIT_` and `INVITE_AUTH_RATE_LIMIT_`.
