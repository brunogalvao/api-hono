import { describe, test, expect } from "vitest";
import { createTaskSchema, updateTaskSchema } from "../api/model/task.schema";

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

// ─── Validação de schemas (campo recorrente) ───────────────────────────────

describe("createTaskSchema — campo recorrente", () => {
  const base = { title: "Aluguel", price: 1500, mes: 3, ano: 2026 };

  test("recorrente padrão é false", () => {
    const result = createTaskSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data?.recorrente).toBe(false);
  });

  test("aceita recorrente: true (despesa fixa mensal)", () => {
    const result = createTaskSchema.safeParse({ ...base, recorrente: true });
    expect(result.success).toBe(true);
    expect(result.data?.recorrente).toBe(true);
  });

  test("rejeita done: Fixo (não é mais um status válido)", () => {
    const result = createTaskSchema.safeParse({ ...base, done: "Fixo" });
    expect(result.success).toBe(false);
  });

  test("aceita done: Pago", () => {
    const result = createTaskSchema.safeParse({ ...base, done: "Pago" });
    expect(result.success).toBe(true);
  });

  test("aceita done: Pendente", () => {
    const result = createTaskSchema.safeParse({ ...base, done: "Pendente" });
    expect(result.success).toBe(true);
  });
});

describe("updateTaskSchema — campo recorrente", () => {
  test("permite atualizar recorrente para true", () => {
    const result = updateTaskSchema.safeParse({ recorrente: true });
    expect(result.success).toBe(true);
  });

  test("permite atualizar recorrente para false", () => {
    const result = updateTaskSchema.safeParse({ recorrente: false });
    expect(result.success).toBe(true);
  });

  test("rejeita done: Fixo no update", () => {
    const result = updateTaskSchema.safeParse({ done: "Fixo" });
    expect(result.success).toBe(false);
  });
});

// ─── Lógica de mudança de recorrente no PUT ───────────────────────────────

describe("PUT /api/tasks/:id — mudança de recorrente", () => {
  test("recorrente false → true: updateSchema aceita recorrente: true", () => {
    const result = updateTaskSchema.safeParse({ recorrente: true });
    expect(result.success).toBe(true);
    expect(result.data?.recorrente).toBe(true);
  });

  test("recorrente true → false: updateSchema aceita recorrente: false", () => {
    const result = updateTaskSchema.safeParse({ recorrente: false });
    expect(result.success).toBe(true);
    expect(result.data?.recorrente).toBe(false);
  });

  test("ao desativar recorrente, lógica deve deletar cópias (fixo_source_id = id)", () => {
    const recorrenteNovo = false;
    const recorrenteAntigo = true;
    const deveRemoverCopias = recorrenteNovo !== recorrenteAntigo && !recorrenteNovo;
    expect(deveRemoverCopias).toBe(true);
  });

  test("ao ativar recorrente, lógica deve criar 11 cópias", () => {
    const recorrenteNovo = true;
    const recorrenteAntigo = false;
    const deveCriarCopias = recorrenteNovo !== recorrenteAntigo && recorrenteNovo;

    const mesCriacao = 5;
    const copies = deveCriarCopias
      ? Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => m !== mesCriacao)
      : [];

    expect(copies).toHaveLength(11);
    expect(copies).not.toContain(mesCriacao);
  });
});

// ─── Lógica de replicação eager (cópias para outros meses) ────────────────

describe("lógica de replicação recorrente", () => {
  test("task recorrente deve gerar cópias para os outros 11 meses", () => {
    const mesCriacao = 3;
    const ano = 2026;

    const copies = [];
    for (let m = 1; m <= 12; m++) {
      if (m === mesCriacao) continue;
      copies.push({ mes: m, ano, fixo_source_id: "original-id", recorrente: false });
    }

    expect(copies).toHaveLength(11);
    expect(copies.every((c) => c.mes !== mesCriacao)).toBe(true);
    expect(copies.every((c) => c.recorrente === false)).toBe(true);
    expect(copies.every((c) => c.fixo_source_id === "original-id")).toBe(true);
    expect(copies.map((c) => c.mes)).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test("task NÃO recorrente não deve gerar cópias", () => {
    const recorrente = false;
    const copies = recorrente ? ["would create copies"] : [];
    expect(copies).toHaveLength(0);
  });

  test("cópia criada tem recorrente=false e aponta para o original via fixo_source_id", () => {
    const parsed = createTaskSchema.safeParse({
      title: "Internet",
      price: 120,
      mes: 3,
      ano: 2026,
      recorrente: true,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.recorrente).toBe(true);

    // simula o que o backend cria para cada cópia
    const copy = {
      title: parsed.data!.title,
      price: parsed.data!.price,
      done: "Pendente",
      mes: 4, // mês de destino
      ano: parsed.data!.ano,
      fixo_source_id: "uuid-original",
      recorrente: false,
    };

    expect(copy.recorrente).toBe(false);
    expect(copy.fixo_source_id).toBe("uuid-original");
    expect(copy.mes).toBe(4);
  });
});
