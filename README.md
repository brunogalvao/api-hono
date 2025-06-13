# 🧠 API Financeira – Hono + Supabase

API de controle financeiro pessoal com autenticação via Supabase, desenvolvida com [Hono](https://hono.dev/), hospedada na [Vercel](https://vercel.com).

## 🚀 Tecnologias

- [Hono](https://hono.dev/) — Framework leve e rápido para APIs
- [Supabase](https://supabase.com/) — Auth + banco PostgreSQL + RLS
- [Zod](https://github.com/colinhacks/zod) — Validações e schemas
- [OpenAPI](https://hono.dev/extensions/openapi) — Documentação automática (Swagger)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) — Deploy serverless global

## 📂 Estrutura

```
api/
  ├─ incomes/
  │   └─ index.ts     # Rota: /api/incomes
  ├─ tasks/
  │   └─ index.ts     # Rota: /api/tasks
```

## 🔐 Autenticação

Todas as rotas protegidas utilizam token JWT do Supabase (access_token).

Você deve enviar no header:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

---


## 🛠️ Rodando localmente

```bash
pnpm install
pnpm dev
```

### Requisitos

- Node 18+
- Variáveis `.env`:

```env
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🌐 Deploy

Este projeto está publicado automaticamente via [Vercel](https://vercel.com):

📡 Produção:
- [https://api-hono-jet.vercel.app/api/incomes](https://api-hono-jet.vercel.app/api/incomes)
- [https://api-hono-jet.vercel.app/api/tasks](https://api-hono-jet.vercel.app/api/tasks)

---

## 🧪 Swagger / OpenAPI

Se quiser ativar a documentação Swagger com Hono + OpenAPI:

```bash
# exemplo de rota
GET /api/docs
```

> (⚠️ precisa configurar `@hono/swagger-ui` e os schemas via `zod`)

---

## 📄 Licença

MIT — Bruno Galvão
