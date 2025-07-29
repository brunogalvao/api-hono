import { Context } from "hono";
import { getSupabaseClient } from "../config/supabaseClient";

// Validação de usuário autenticado
export const validateUser = async (c: Context) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
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