import { z } from "zod";

export const createIncomeSchema = z.object({
  descricao: z.string().optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  mes: z
    .number()
    .int()
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12"),
  ano: z.number().int().min(2000, "Ano deve ser maior que 2000"),
});

export const updateIncomeSchema = z.object({
  id: z.string().uuid("ID inválido"),
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  ano: z.number().int().min(2000).optional(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
