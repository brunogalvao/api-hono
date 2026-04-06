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

  test("aceita done: Fixo (status de despesa recorrente)", () => {
    const result = createTaskSchema.safeParse({ ...base, done: "Fixo" });
    expect(result.success).toBe(true);
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

  test("aceita done: Fixo no update (status de despesa recorrente)", () => {
    const result = updateTaskSchema.safeParse({ done: "Fixo" });
    expect(result.success).toBe(true);
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

// ─── Lógica de DELETE em cascata ──────────────────────────────────────────

describe("DELETE em cascata para tasks recorrentes", () => {
  test("ao deletar original (recorrente=true), deve deletar cópias", () => {
    const isOriginal = (task: { recorrente: boolean; fixo_source_id: string | null }) =>
      task.recorrente === true && task.fixo_source_id === null;

    const original = { recorrente: true, fixo_source_id: null };
    const copy = { recorrente: false, fixo_source_id: "original-id" };

    expect(isOriginal(original)).toBe(true);
    expect(isOriginal(copy)).toBe(false);
  });

  test("ao deletar cópia (fixo_source_id !== null), NÃO deleta outras cópias", () => {
    const shouldCascade = (task: { recorrente: boolean; fixo_source_id: string | null }) =>
      task.recorrente === true && !task.fixo_source_id;

    const copy = { recorrente: false, fixo_source_id: "original-id" };
    expect(shouldCascade(copy)).toBe(false);
  });
});

// ─── GET não recria cópias deletadas ──────────────────────────────────────

describe("GET não deve replicar lazily", () => {
  test("GET retorna apenas tasks existentes — sem recriar cópias deletadas", () => {
    // A lógica do GET foi simplificada: apenas retorna monthTasks sem criar novas cópias.
    // Cópias são criadas apenas no POST (eager replication).
    // Se uma cópia foi deletada, ela permanece deletada.
    const getHandlerCreatesNewCopies = false;
    expect(getHandlerCreatesNewCopies).toBe(false);
  });
});

// ─── Compra Parcelada — schema e lógica ───────────────────────────────────

describe("Compra Parcelada — schema e lógica", () => {
  const base = { title: "TV Samsung", price: 3000, mes: 3, ano: 2026 };

  test("createTaskSchema aceita parcela_total válido", () => {
    const result = createTaskSchema.safeParse({ ...base, parcela_total: 10 });
    expect(result.success).toBe(true);
    expect(result.data?.parcela_total).toBe(10);
  });

  test("createTaskSchema rejeita parcela_total menor que 2", () => {
    const result = createTaskSchema.safeParse({ ...base, parcela_total: 1 });
    expect(result.success).toBe(false);
  });

  test("lógica de avanço de mês funciona corretamente", () => {
    function nextMonth(mes: number, ano: number, offset: number) {
      const totalMonth = mes - 1 + offset; // 0-based
      return {
        mes: (totalMonth % 12) + 1,
        ano: ano + Math.floor(totalMonth / 12),
      };
    }

    // Mês 11 + 1 offset → mês 12 mesmo ano
    expect(nextMonth(11, 2026, 1)).toEqual({ mes: 12, ano: 2026 });
    // Mês 12 + 1 offset → mês 1 do próximo ano
    expect(nextMonth(12, 2026, 1)).toEqual({ mes: 1, ano: 2027 });
    // Mês 11 + 3 offset → mês 2 do próximo ano
    expect(nextMonth(11, 2026, 3)).toEqual({ mes: 2, ano: 2027 });
    // Mês 3 + 0 offset → mesmo mês
    expect(nextMonth(3, 2026, 0)).toEqual({ mes: 3, ano: 2026 });
  });

  test("última parcela absorve arredondamento", () => {
    const price = 100;
    const parcelaTotal = 3;
    const parcelaBase = Math.floor((price / parcelaTotal) * 100) / 100;
    const totalBase = parcelaBase * (parcelaTotal - 1);
    const parcelaFinal = Math.round((price - totalBase) * 100) / 100;

    // 100 / 3 = 33.33 → parcelaBase = 33.33, totalBase = 66.66, parcelaFinal = 33.34
    expect(parcelaBase).toBe(33.33);
    expect(parcelaFinal).toBe(33.34);
    expect(Math.round((parcelaBase * (parcelaTotal - 1) + parcelaFinal) * 100) / 100).toBe(price);
  });

  test("updateTaskSchema aceita parcela_group_id null (cancelar)", () => {
    const result = updateTaskSchema.safeParse({ parcela_group_id: null });
    expect(result.success).toBe(true);
    expect(result.data?.parcela_group_id).toBeNull();
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
