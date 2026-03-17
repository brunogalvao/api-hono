import { describe, test, expect } from "vitest";

const BASE_URL = process.env.API_URL ?? "https://api-hono-jet.vercel.app";

describe("Smoke tests — Vercel Deploy", () => {
  // ─── Endpoints públicos ────────────────────────────────────────────────────

  test("GET /api/ping → 200 + pong", async () => {
    const res = await fetch(`${BASE_URL}/api/ping`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("pong");
  });

  test("GET /api/health → 200 ou 503 com JSON válido", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect([200, 503]).toContain(res.status);
    const json = await res.json();
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("timestamp");
  });

  // ─── Endpoints protegidos (sem auth → 401) ─────────────────────────────────

  test("GET /api/tasks sem auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks?month=3&year=2026`);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("GET /api/incomes sem auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/incomes`);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("GET /api/user sem auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/user`);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  // ─── Validação de parâmetros ───────────────────────────────────────────────

  test("GET /api/tasks sem query params → 400 ou 401", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`);
    expect([400, 401]).toContain(res.status);
  });
});
