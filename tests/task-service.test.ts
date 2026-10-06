import { describe, expect, test } from "vitest";
import { createTaskSchema } from "../api/model/task.schema";
import {
  buildInstallmentCopies,
  buildRecurringCopies,
  splitInstallmentAmounts,
} from "../lib/tasks/task-service";

const original = {
  id: "task-1",
  user_id: "user-1",
  group_id: "group-1",
  title: "Notebook",
  price: 100,
  done: "Pendente" as const,
  type: "Compras",
  mes: 12,
  ano: 2026,
  recorrente: false,
};

describe("task business rules", () => {
  test("rejects a task that is recurring and installment-based", () => {
    const result = createTaskSchema.safeParse({
      title: "Assinatura parcelada",
      price: 120,
      mes: 1,
      ano: 2026,
      recorrente: true,
      parcela_total: 12,
    });

    expect(result.success).toBe(false);
  });

  test("creates recurring copies for the other eleven months", () => {
    const copies = buildRecurringCopies(
      { ...original, recorrente: true },
      original.user_id,
      original.group_id,
    );

    expect(copies).toHaveLength(11);
    expect(copies.some((copy) => copy.mes === original.mes)).toBe(false);
    expect(copies.every((copy) => copy.fixo_source_id === original.id)).toBe(true);
  });

  test("splits installments without losing cents and crosses the year", () => {
    const installmentGroupId = "installment-group-1";
    const copies = buildInstallmentCopies(
      original,
      original.user_id,
      original.group_id,
      3,
      installmentGroupId,
    );

    expect(copies).toHaveLength(2);
    expect(copies.map(({ mes, ano }) => ({ mes, ano }))).toEqual([
      { mes: 1, ano: 2027 },
      { mes: 2, ano: 2027 },
    ]);
    expect(copies.map((copy) => copy.price)).toEqual([33.33, 33.34]);
    expect(splitInstallmentAmounts(original.price, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(splitInstallmentAmounts(original.price, 3).reduce((sum, price) => sum + price, 0)).toBe(100);
    expect(copies.every((copy) => copy.parcela_group_id === installmentGroupId)).toBe(true);
  });
});
