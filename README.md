# 💰 API Financeira - Hono + Supabase + Google Gemini

Uma API completa para gerenciamento financeiro pessoal com análise inteligente de investimentos usando Google Gemini AI.

## 🚀 Funcionalidades

### 📊 Gestão de Rendimentos
- **CRUD completo** de rendimentos
- **Agrupamento por mês/ano** com totais automáticos
- **Validação de autenticação** via Supabase
- **Formatação monetária** em Real (BRL)

### 📋 Gestão de Tarefas/Despesas
- **Listagem de tarefas** por usuário
- **Cálculo de totais** (geral, pagas, pendentes)
- **Filtros por período** (mês/ano)

### 🤖 Análise Inteligente de Investimentos
- **Google Gemini AI** para análise financeira
- **Cálculo automático** de investimento (30% do salário)
- **Conversão BRL ↔ USD** em tempo real
- **Recomendações personalizadas** de economia
- **Estratégia de investimento** baseada no perfil
- **Distribuição de investimentos** (dólar, poupança, outros)
- **Status da situação financeira** (bom/regular/crítico)

### 🔐 Autenticação e Segurança
- **Autenticação JWT** via Supabase
- **Validação de usuário** em todas as rotas
- **CORS configurado** para frontend
- **Edge Runtime** para performance

## 🛠️ Stack Tecnológico

- **Hono** - Framework web para APIs
- **Supabase** - Banco de dados e autenticação
- **Google Gemini** - IA para análise financeira
- **TypeScript** - Tipagem estática
- **Vercel** - Deploy e hospedagem
- **Edge Runtime** - Execução serverless

## 📡 Endpoints da API

### 🔐 Autenticação
- `GET /api/user` - Informações do usuário autenticado

### 💰 Gestão de Rendimentos
- `GET /api/incomes` - Listar rendimentos
- `POST /api/incomes` - Criar rendimento
- `PATCH /api/incomes` - Atualizar rendimento
- `GET /api/incomes/total-por-mes` - Totais agrupados por mês

### 📋 Gestão de Tarefas
- `GET /api/tasks` - Listar tarefas
- `GET /api/tasks/total` - Total de tarefas
- `GET /api/tasks/total-paid` - Total de tarefas pagas
- `GET /api/tasks/total-price` - Total de tarefas pendentes

### 🤖 Inteligência Artificial
- `POST /api/ia/analise-investimento` - Análise financeira com Gemini

### 🔧 Utilitários
- `GET /api/ping` - Teste de conectividade
- `GET /api/health` - Status da API
- `GET /api/supabase-test` - Teste do Supabase
- `GET /api/docs` - Documentação interativa

## 🚀 Deploy

### Pré-requisitos
- Node.js 18+
- pnpm (recomendado)
- Conta no Supabase
- Conta no Vercel
- Chave da API do Google Gemini

### Variáveis de Ambiente
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
GEMINI_API_KEY=sua_chave_do_google_gemini
```

### Instalação Local
```bash
# Clonar repositório
git clone https://github.com/brunogalvao/api-hono.git
cd api-hono

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves

# Executar em desenvolvimento
pnpm dev
```

### Deploy no Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## 📊 Exemplo de Uso

### Análise de Investimento
```bash
curl -X POST https://api-hono-5zlrze1e5-bruno-galvos-projects.vercel.app/api/ia/analise-investimento
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "rendimentoMes": 2332.00,
      "rendimentoDisponivel": 2009.00,
      "percentualGasto": 13.9
    },
    "investimento": {
      "recomendado": 699.60,
      "recomendadoUSD": "$125.73"
    },
    "analise": {
      "statusEconomia": "bom",
      "estrategiaInvestimento": {
        "tipo": "baseada na disponibilidade",
        "valorDisponivel": 602.7,
        "valorRecomendado": 699.6
      },
      "dicasEconomia": [],
      "distribuicaoInvestimento": {
        "dolares": 108.32,
        "reais": 494.38
      },
      "resumo": "Situação financeira boa. Há disponibilidade para investimento..."
    }
  }
}
```

### Listar Rendimentos
```bash
curl -H "Authorization: Bearer seu_token" \
     https://api-hono-5zlrze1e5-bruno-galvos-projects.vercel.app/api/incomes
```

### Totais por Mês
```bash
curl -H "Authorization: Bearer seu_token" \
     https://api-hono-5zlrze1e5-bruno-galvos-projects.vercel.app/api/incomes/total-por-mes
```

## 🎯 Funcionalidades da IA

### Análise Automática
- **Cálculo de disponibilidade** (rendimento - despesas)
- **Percentual de gastos** vs rendimento
- **Recomendação de investimento** (30% do salário)
- **Conversão automática** BRL ↔ USD

### Recomendações Personalizadas
- **Status da economia** (bom/regular/crítico)
- **Dicas de economia** baseadas no perfil
- **Estratégia de investimento** (curto/médio/longo prazo)
- **Distribuição de investimentos** (dólar, poupança, outros)

### Dados em Tempo Real
- **Cotação do dólar** via API externa
- **Timestamp** de todas as análises
- **Metadados** da análise da IA

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
api-hono/
├── api/
│   ├── config/          # Configurações (Supabase, headers)
│   ├── incomes/         # Gestão de rendimentos
│   ├── tasks/           # Gestão de tarefas
│   ├── ia/              # Análise inteligente
│   ├── utils/           # Utilitários (formatação, validação)
│   └── docs-ui.ts       # Documentação interativa
├── dev.ts               # Servidor de desenvolvimento
├── app.ts               # Configuração principal
└── package.json
```

### Scripts Disponíveis
```bash
pnpm dev          # Desenvolvimento local
pnpm build         # Build para produção
pnpm start         # Executar build
```

### Testes
```bash
# Testar endpoints localmente
curl http://localhost:3000/api/ping
curl http://localhost:3000/api/health
curl http://localhost:3000/api/docs
```

## 📈 Roadmap

- [x] CRUD de rendimentos
- [x] CRUD de tarefas
- [x] Análise com IA (Gemini)
- [x] Conversão BRL ↔ USD
- [x] Documentação interativa
- [x] Deploy automático
- [ ] Integração com dados reais do frontend
- [ ] Mais métricas de análise
- [ ] Histórico de análises
- [ ] Notificações de investimento

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Bruno Galvão**
- GitHub: [@brunogalvao](https://github.com/brunogalvao)
- LinkedIn: [Bruno Galvão](https://linkedin.com/in/brunogalvao)

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**


**Supabase**

Nome do projeto no supabase

```
omega-project-v2
```
