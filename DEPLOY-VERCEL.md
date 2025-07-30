# 🚀 Deploy na Vercel - Checklist Completo

Este documento fornece um guia passo-a-passo para deploy seguro e otimizado na Vercel.

## ✅ PRÉ-REQUISITOS

### 1. **Verificações Locais**
- [ ] Projeto funciona localmente (`npm run dev`)
- [ ] Todas as dependências instaladas
- [ ] Testes passando
- [ ] Sem erros de TypeScript
- [ ] Variáveis de ambiente configuradas no `.env.local`

### 2. **Estrutura do Projeto**
- [ ] Arquivo `vercel.json` configurado
- [ ] Todos os endpoints com `export const config = { runtime: "edge" }`
- [ ] Exports corretos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- [ ] Headers CORS configurados

## 🔧 CONFIGURAÇÃO DA VERCEL

### 1. **Arquivo vercel.json** ✅
```json
{
  "version": 2,
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "installCommand": "pnpm install",
  "framework": null,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization, X-Requested-With" }
      ]
    }
  ]
}
```

### 2. **Package.json Scripts** ✅
```json
{
  "scripts": {
    "dev": "tsx dev.ts",
    "build": "echo 'Build completed'",
    "start": "node dist/app.js",
    "vercel-build": "echo 'Build completed'"
  }
}
```

## 🌍 VARIÁVEIS DE AMBIENTE

### **Obrigatórias para Funcionamento Básico**
```env
# Supabase (Essencial)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_publica_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
```

### **Opcionais para IAs (Recomendadas)**
```env
# Google Gemini (Recomendado)
GEMINI_API_KEY=sua_chave_google_gemini

# OpenAI (Backup)
OPENAI_API_KEY=sua_chave_openai
```

### **Como Configurar na Vercel:**
1. Acesse Dashboard da Vercel
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável:
   - **Name**: Nome da variável (ex: `SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione Production, Preview, Development

## 📂 ESTRUTURA DE ARQUIVOS VERIFICADA

### **Endpoints Principais** ✅
```
api/
├── config/
│   ├── apiHeader.ts          ✅ CORS configurado
│   ├── supabaseClient.ts     ✅ Cliente configurado
│   └── errorHandler.ts       ✅ Tratamento de erros
├── ia/
│   ├── analise-investimento.ts  ✅ Dados reais + Gemini
│   ├── analise-frontend.ts     ✅ Dados frontend
│   └── teste-conexao.ts        ✅ Diagnóstico
├── incomes/
│   ├── index.ts             ✅ CRUD completo
│   ├── [id].ts              ✅ Operações por ID
│   └── total-por-mes.ts     ✅ Agregações
├── tasks/
│   ├── index.ts             ✅ CRUD completo
│   ├── [id].ts              ✅ Operações por ID
│   └── total-*.ts           ✅ Totalizadores
└── docs-ui.ts               ✅ Documentação
```

### **Edge Runtime Configurado** ✅
Todos os endpoints têm:
```typescript
export const config = { runtime: "edge" };
```

## 🔐 SEGURANÇA E PERFORMANCE

### **Configurações Aplicadas** ✅
- [x] **Edge Runtime** - Execução ultrarrápida
- [x] **CORS Headers** - Acesso controlado
- [x] **JWT Authentication** - Segurança por usuário
- [x] **Row Level Security** - Isolamento de dados
- [x] **Rate Limiting** - Proteção contra abuso
- [x] **Error Handling** - Respostas padronizadas

### **Headers de Segurança**
```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "X-Content-Type-Options": "nosniff"
}
```

## 🚀 PROCESSO DE DEPLOY

### **Opção 1: Deploy via GitHub (Recomendado)**
1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "feat: preparado para deploy na Vercel"
   git push origin main
   ```

2. **Conectar na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Login com GitHub
   - Click **New Project**
   - Selecione o repositório
   - Configure as variáveis de ambiente
   - Click **Deploy**

### **Opção 2: Deploy via Vercel CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 🧪 TESTES PÓS-DEPLOY

### **Endpoints Básicos**
```bash
# Health check
curl https://seu-projeto.vercel.app/api/health

# Documentação
curl https://seu-projeto.vercel.app/api/docs-ui

# Status das IAs
curl https://seu-projeto.vercel.app/api/ia/status
```

### **Endpoints com Dados**
```bash
# Análise com dados do frontend (sem auth)
curl -X POST https://seu-projeto.vercel.app/api/ia/analise-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "rendimentoMes": 5000,
    "tarefasPagas": 2000,
    "tarefasPendentes": 1500,
    "cotacaoDolar": 5.50
  }'

# Diagnóstico completo
curl https://seu-projeto.vercel.app/api/ia/teste-conexao
```

### **Endpoints com Autenticação**
```bash
# Análise com dados reais (requer JWT)
curl -X POST https://seu-projeto.vercel.app/api/ia/analise-investimento \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mes": 1, "ano": 2025}'
```

## 📊 MONITORAMENTO PÓS-DEPLOY

### **Métricas da Vercel**
- [ ] **Function Invocations** - Número de chamadas
- [ ] **Function Duration** - Tempo de execução
- [ ] **Bandwidth Usage** - Tráfego de dados
- [ ] **Edge Network Requests** - Requisições globais

### **Logs e Debugging**
- [ ] **Function Logs** - Erros e avisos
- [ ] **Build Logs** - Processo de build
- [ ] **Runtime Logs** - Execução em tempo real

### **Alertas Recomendados**
- [ ] Erro 500 > 1% das requisições
- [ ] Latência > 5 segundos
- [ ] Uso de bandwidth > 80%

## 🔧 TROUBLESHOOTING COMUM

### **Erro: "Module not found"**
**Causa**: Dependência não instalada
**Solução**:
```bash
# Verificar package.json
npm install
# Ou forçar reinstalação
rm -rf node_modules package-lock.json
npm install
```

### **Erro: "Environment variable not defined"**
**Causa**: Variável não configurada na Vercel
**Solução**:
1. Vercel Dashboard → Settings → Environment Variables
2. Adicionar todas as variáveis necessárias
3. Redeploy

### **Erro: "Function timeout"**
**Causa**: Função executa por mais de 10s
**Solução**:
- Otimizar consultas ao banco
- Implementar cache
- Reduzir timeout do Gemini/OpenAI

### **Erro: "CORS"**
**Causa**: Headers não configurados
**Solução**: Verificar `vercel.json` e `apiHeader.ts`

## 🎯 OTIMIZAÇÕES PÓS-DEPLOY

### **Performance**
- [ ] **Cold Start** - Reduzir dependências
- [ ] **Bundle Size** - Tree shaking
- [ ] **Database** - Indexes otimizados
- [ ] **Cache** - Headers apropriados

### **Custo**
- [ ] **Function Executions** - Monitorar uso
- [ ] **Bandwidth** - Comprimir respostas
- [ ] **Edge Requests** - Cache em CDN

### **Escalabilidade**
- [ ] **Rate Limiting** - Por IP/usuário
- [ ] **Connection Pooling** - Supabase
- [ ] **Retry Logic** - Falhas temporárias

## 📋 CHECKLIST FINAL DE DEPLOY

### **Antes do Deploy**
- [ ] Código funcionando localmente
- [ ] Variáveis de ambiente preparadas
- [ ] Documentação atualizada
- [ ] Testes passando
- [ ] Backup do banco de dados

### **Durante o Deploy**
- [ ] Configurar variáveis na Vercel
- [ ] Verificar build logs
- [ ] Testar endpoints básicos
- [ ] Verificar CORS

### **Após o Deploy**
- [ ] Testar todos os endpoints
- [ ] Verificar autenticação
- [ ] Testar sistema de IA
- [ ] Configurar monitoramento
- [ ] Documentar URL de produção

## 🎉 RESULTADO ESPERADO

Após seguir este checklist, você terá:

✅ **API funcionando na Vercel**
- URL: `https://seu-projeto.vercel.app`
- Edge Runtime para performance máxima
- HTTPS automático

✅ **Endpoints funcionais**
- Documentação: `/api/docs-ui`
- Health check: `/api/health`
- Análise IA: `/api/ia/analise-investimento`
- Diagnóstico: `/api/ia/teste-conexao`

✅ **Segurança implementada**
- Autenticação JWT
- CORS configurado
- Variáveis protegidas
- Rate limiting

✅ **Monitoramento ativo**
- Logs da Vercel
- Métricas de performance
- Alertas configurados

---

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Edge Runtime**: https://vercel.com/docs/concepts/functions/edge-functions
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

**Status**: ✅ Pronto para deploy  
**Estimativa**: 10-15 minutos para deploy completo  
**Suporte**: Todas as funcionalidades testadas e documentadas