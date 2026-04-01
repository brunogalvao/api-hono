import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  price: z.number().nonnegative("Preço deve ser positivo").optional(),
  done: z.enum(["Pago", "Pendente", "Fixo"]).optional(),
  type: z.string().optional(),
  mes: z
    .number()
    .int()
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12"),
  ano: z.number().int().min(2000, "Ano deve ser maior que 2000"),
  recorrente: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  done: z.enum(["Pago", "Pendente", "Fixo"]).optional(),
  type: z.string().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  ano: z.number().int().min(2000).optional(),
  recorrente: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
