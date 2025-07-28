import type { Context, Next } from "hono";

// Middleware para tratamento centralizado de erros
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error(`❌ Erro em ${c.req.method} ${c.req.url}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    
    return c.json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: c.req.url
    }, statusCode);
  }
}

// Middleware para logging de requisições
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  
  console.log(`🚀 ${method} ${url} - Iniciando`);
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.log(`✅ ${method} ${url} - ${status} (${duration}ms)`);
}

// Função para validar parâmetros obrigatórios
export function validateRequiredParams(params: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!params[field]) {
      return `Campo obrigatório ausente: ${field}`;
    }
  }
  return null;
}

// Função para validar tipos de dados
export function validateTypes(params: Record<string, any>, validations: Record<string, (value: any) => boolean>): string | null {
  for (const [field, validator] of Object.entries(validations)) {
    if (params[field] !== undefined && !validator(params[field])) {
      return `Tipo inválido para o campo: ${field}`;
    }
  }
  return null;
} 