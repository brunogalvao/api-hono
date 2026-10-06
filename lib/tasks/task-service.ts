import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../../api/model/task.schema";
import { ApiError } from "../../api/config/errorHandler";

type TaskRecord = CreateTaskInput & {
  id: string;
  user_id: string;
  group_id: string;
  price?: number | null;
  fixo_source_id?: string | null;
  parcela_numero?: number | null;
  parcela_group_id?: string | null;
};

type TaskCopy = Omit<TaskRecord, "id" | "parcela_total"> & {
  parcela_total?: number | null;
};

function databaseFailure(operation: string, error: PostgrestError): never {
  console.error(JSON.stringify({
    level: "error",
    event: "database_operation_failed",
    operation,
    code: error.code,
    message: error.message,
  }));
  throw new ApiError("Não foi possível concluir a operação.", 500, "database_error");
}

async function rollbackCreatedTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .or(`id.eq.${taskId},fixo_source_id.eq.${taskId}`)
    .eq("user_id", userId);

  if (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "task_compensation_failed",
      taskId,
      code: error.code,
    }));
  }
}

export function buildRecurringCopies(
  original: TaskRecord,
  userId: string,
  groupId: string,
): TaskCopy[] {
  return Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((month) => month !== original.mes)
    .map((month) => ({
      user_id: userId,
      group_id: groupId,
      title: original.title,
      price: original.price,
      done: "Pendente" as const,
      type: original.type,
      mes: month,
      ano: original.ano,
      fixo_source_id: original.id,
      recorrente: false,
    }));
}

export function buildInstallmentCopies(
  original: TaskRecord,
  userId: string,
  groupId: string,
  installmentTotal: number,
  installmentGroupId: string,
): TaskCopy[] {
  const [basePrice, ...remainingPrices] = splitInstallmentAmounts(
    original.price ?? 0,
    installmentTotal,
  );

  return Array.from({ length: installmentTotal - 1 }, (_, index) => {
    const installmentNumber = index + 2;
    const totalMonth = original.mes - 1 + installmentNumber - 1;
    return {
      user_id: userId,
      group_id: groupId,
      title: original.title,
      price: remainingPrices[index] ?? basePrice,
      done: "Pendente" as const,
      type: original.type,
      mes: (totalMonth % 12) + 1,
      ano: original.ano + Math.floor(totalMonth / 12),
      recorrente: false,
      fixo_source_id: null,
      parcela_numero: installmentNumber,
      parcela_total: installmentTotal,
      parcela_group_id: installmentGroupId,
    };
  });
}

export function splitInstallmentAmounts(
  totalPrice: number,
  installmentTotal: number,
): number[] {
  const basePrice = Math.floor((totalPrice / installmentTotal) * 100) / 100;
  const lastPrice = Math.round(
    (totalPrice - basePrice * (installmentTotal - 1)) * 100,
  ) / 100;
  return Array.from(
    { length: installmentTotal },
    (_, index) => index === installmentTotal - 1 ? lastPrice : basePrice,
  );
}

async function getOrCreatePersonalGroup(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: existingGroup, error: findError } = await supabase
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .eq("type", "personal")
    .maybeSingle();

  if (findError) databaseFailure("find_personal_group", findError);
  if (existingGroup?.id) return existingGroup.id as string;

  const { data: newGroup, error: createError } = await supabase
    .from("groups")
    .insert({ owner_id: userId, type: "personal", name: "Pessoal" })
    .select("id")
    .single();

  if (createError) databaseFailure("create_personal_group", createError);
  if (!newGroup?.id) {
    throw new ApiError(
      "Não foi possível localizar o grupo pessoal.",
      500,
      "personal_group_unavailable",
    );
  }
  return newGroup.id as string;
}

export async function listTasks(
  supabase: SupabaseClient,
  userId: string,
  month: number,
  year: number,
) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("mes", month)
    .eq("ano", year)
    .order("created_at", { ascending: false });

  if (error) databaseFailure("list_tasks", error);
  return data ?? [];
}

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTaskInput,
) {
  const groupId = await getOrCreatePersonalGroup(supabase, userId);
  const { data: original, error: insertError } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: userId, group_id: groupId })
    .select()
    .single();

  if (insertError) databaseFailure("create_task", insertError);
  if (!original) {
    throw new ApiError("Não foi possível criar a tarefa.", 500, "task_not_created");
  }

  const task = original as TaskRecord;

  if (input.recorrente) {
    const { error } = await supabase
      .from("tasks")
      .insert(buildRecurringCopies(task, userId, groupId));
    if (error) {
      await rollbackCreatedTask(supabase, task.id, userId);
      databaseFailure("create_recurring_tasks", error);
    }
  }

  if (!input.parcela_total) return task;

  const installmentGroupId = crypto.randomUUID();
  const [firstInstallmentPrice] = splitInstallmentAmounts(
    task.price ?? 0,
    input.parcela_total,
  );
  const { data: updatedOriginal, error: updateError } = await supabase
    .from("tasks")
    .update({
      parcela_numero: 1,
      parcela_group_id: installmentGroupId,
      parcela_total: input.parcela_total,
      price: firstInstallmentPrice,
    })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    await rollbackCreatedTask(supabase, task.id, userId);
    databaseFailure("initialize_installments", updateError);
  }

  const { error: copiesError } = await supabase.from("tasks").insert(
    buildInstallmentCopies(
      task,
      userId,
      groupId,
      input.parcela_total,
      installmentGroupId,
    ),
  );

  if (copiesError) {
    await supabase
      .from("tasks")
      .delete()
      .eq("parcela_group_id", installmentGroupId)
      .eq("user_id", userId);
    await rollbackCreatedTask(supabase, task.id, userId);
    databaseFailure("create_installments", copiesError);
  }

  return updatedOriginal ?? task;
}

export async function updateTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const { data: current, error: currentError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (currentError) databaseFailure("find_task_for_update", currentError);
  if (!current) throw new ApiError("Tarefa não encontrada.", 404, "task_not_found");

  const willBeRecurring = input.recorrente ?? current.recorrente;
  const installmentTotal = input.parcela_total ?? current.parcela_total;
  if (willBeRecurring && installmentTotal) {
    throw new ApiError(
      "Uma despesa não pode ser recorrente e parcelada ao mesmo tempo.",
      400,
      "invalid_task_schedule",
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("tasks")
    .update(input)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) databaseFailure("update_task", updateError);

  if (input.recorrente === undefined || input.recorrente === current.recorrente) {
    return updated;
  }

  const rollback = async () => {
    const { id: _id, created_at: _createdAt, ...previous } = current;
    await supabase.from("tasks").update(previous).eq("id", taskId).eq("user_id", userId);
  };

  if (!input.recorrente) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("fixo_source_id", taskId)
      .eq("user_id", userId);
    if (error) {
      await rollback();
      databaseFailure("remove_recurring_tasks", error);
    }
    return updated;
  }

  const recurringSource = updated as TaskRecord;
  const { error } = await supabase.from("tasks").insert(
    buildRecurringCopies(recurringSource, userId, recurringSource.group_id),
  );
  if (error) {
    await rollback();
    databaseFailure("enable_recurring_task", error);
  }
  return updated;
}

export async function deleteTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  cancelAll: boolean,
) {
  const { data: target, error: targetError } = await supabase
    .from("tasks")
    .select("recorrente, fixo_source_id, parcela_group_id")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (targetError) databaseFailure("find_task_for_delete", targetError);
  if (!target) throw new ApiError("Tarefa não encontrada ou acesso negado.", 404, "task_not_found");

  if (cancelAll && target.parcela_group_id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("parcela_group_id", target.parcela_group_id)
      .eq("user_id", userId);
    if (error) databaseFailure("delete_installment_group", error);
    return { message: "Todas as parcelas foram deletadas com sucesso." };
  }

  if (target.recorrente && !target.fixo_source_id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("fixo_source_id", taskId)
      .eq("user_id", userId);
    if (error) databaseFailure("delete_recurring_copies", error);
  }

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id");

  if (error) databaseFailure("delete_task", error);
  if (!data?.length) throw new ApiError("Tarefa não encontrada ou acesso negado.", 404, "task_not_found");
  return { message: "Tarefa deletada com sucesso." };
}
