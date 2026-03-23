import { Context } from "hono";
import { getSupabaseClient, getAuthenticatedUser } from "../config/supabaseClient";

// Validação de usuário autenticado
export const validateUser = async (c: Context) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
  
  if (userError || !user) {
    return { error: "Usuário não autenticado", status: 401 };
  }
  
  return { user, supabase };
};

// Validação de campos obrigatórios
export const validateRequiredFields = (data: any, fields: string[]) => {
  const missingFields = fields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      error: `Campos obrigatórios ausentes: ${missingFields.join(", ")}`,
      status: 400
    };
  }
  
  return { success: true };
};

// Validação de ID
export const validateId = (id: any) => {
  if (!id) {
    return {
      error: "ID é obrigatório",
      status: 400
    };
  }
  
  return { success: true };
};

// Tratamento de erro do Supabase
export const handleSupabaseError = (error: any, defaultMessage = "Erro interno do servidor") => {
  if (error) {
    return {
      error: error.message || defaultMessage,
      status: 500
    };
  }
  
  return { success: true };
};

// Validação de dados de rendimento
export const validateIncomeData = (data: any) => {
  return validateRequiredFields(data, ["valor", "mes", "ano"]);
};

// Validação de dados de tarefa
export const validateTaskData = (data: any) => {
  return validateRequiredFields(data, ["descricao", "preco"]);
};

// Validação de parâmetros com retorno string (compatível com uso em query params)
export function validateRequiredParams(params: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!params[field]) {
      return `Campo obrigatório ausente: ${field}`;
    }
  }
  return null;
}

// Validação de tipos de dados com retorno string
export function validateTypes(
  params: Record<string, any>,
  validations: Record<string, (value: any) => boolean>
): string | null {
  for (const [field, validator] of Object.entries(validations)) {
    if (params[field] !== undefined && !validator(params[field])) {
      return `Tipo inválido para o campo: ${field}`;
    }
  }
  return null;
}