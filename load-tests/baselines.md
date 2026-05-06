# Performance Baselines — api-hono

Medições de referência contra `https://api-hono-jet.vercel.app` (Vercel Edge, região iad1).

## Como executar

```bash
# Endpoints públicos (smoke — sem token)
pnpm load:public

# Endpoints autenticados
LOAD_TEST_TOKEN=<seu-jwt> pnpm load:auth

# Endpoint de IA (baixa carga)
LOAD_TEST_TOKEN=<seu-jwt> pnpm load:ia
```

## Thresholds (SLA mínimo aceitável)

| Endpoint | p95 | p99 | Error rate |
|---|---|---|---|
| `GET /api/ping` | < 500ms | — | < 1% |
| `GET /api/health` | < 1000ms | — | < 1% |
| `GET /api/user` | < 1500ms | < 3000ms | < 1% |
| `GET /api/tasks` | < 2000ms | < 3000ms | < 1% |
| `GET /api/incomes` | < 2000ms | < 3000ms | < 1% |
| `GET /api/incomes/total-por-mes` | < 2000ms | < 3000ms | < 1% |
| `POST /api/ia/analise-investimento` | < 5000ms | < 8000ms | < 5% |

## Baselines medidas

> Preencher após primeira execução com `pnpm load:public` e `pnpm load:auth`.

| Endpoint | p50 | p95 | p99 | Data |
|---|---|---|---|---|
| `GET /api/ping` | 54ms | 121ms | ~2.95s | 2026-05-06 |
| `GET /api/health` | 58ms | 105ms | ~3.18s | 2026-05-06 |
| `GET /api/user` | — | — | — | — |
| `GET /api/tasks` | — | — | — | — |
| `GET /api/incomes` | — | — | — | — |
| `POST /api/ia/analise-investimento` | — | — | — | — |

## Notas sobre o ambiente

- **Vercel Edge Runtime** — funções stateless, sem estado entre invocações
- **Cold start** — primeira requisição após inatividade pode ter +200-500ms
- **Supabase free tier** — connection pool limitado; stress test com >20 VUs pode degradar
- **Currency API** — `open.er-api.com` com cache de 5min; carga simultânea atingirá o cache
