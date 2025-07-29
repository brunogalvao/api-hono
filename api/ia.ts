import OpenAI from "openai";
import { formatToBRL, formatToUSD, convertBRLtoUSD } from "./utils/format";

export const config = { runtime: "edge" };

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const GET = async () => {
  return new Response(JSON.stringify({ 
    message: "GET da rota /api/ia funcionando ✅",
    description: "Use POST para análise de investimentos com IA"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};

export const POST = async (request: Request) => {
  try {
    // Simular dados de rendimentos para teste
    const mockIncomes = [
      { mes: "Janeiro", ano: 2025, valor: "3822.00" },
      { mes: "Abril", ano: 2025, valor: "2333.00" },
      { mes: "Julho", ano: 2025, valor: "2332.00" },
    ];

    // Calcular totais
    const totalAnual = mockIncomes.reduce((sum, income) => sum + parseFloat(income.valor), 0);
    const mediaMensal = totalAnual / 12;

    // Obter cotação do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    const cotacaoDolar = parseFloat(dolarData.USDBRL.bid);
    const valorDolarFormatado = parseFloat(dolarData.USDBRL.bid).toFixed(4);

    // Conversões de exemplo
    const exemplo100Reais = convertBRLtoUSD(100, cotacaoDolar);
    const exemplo1000Reais = convertBRLtoUSD(1000, cotacaoDolar);
    const totalAnualUSD = convertBRLtoUSD(totalAnual, cotacaoDolar);
    const mediaMensalUSD = convertBRLtoUSD(mediaMensal, cotacaoDolar);

    // Simular análise da IA
    const analysisResult = {
      analise: {
        estabilidade: "Renda variável com 3 fontes diferentes",
        tendencia: "Crescimento moderado",
        risco: "Médio - diversificação adequada"
      },
      recomendacoes: {
        dolar: {
          percentual: 25,
          justificativa: "Proteção cambial e diversificação",
          risco: "Médio",
          valorDolar: valorDolarFormatado,
          valorDolarBRL: formatToBRL(cotacaoDolar),
          valorDolarRaw: dolarData.USDBRL.bid,
          timestamp: dolarData.USDBRL.create_date
        },
        poupanca: {
          percentual: 35,
          justificativa: "Reserva de emergência e segurança",
          risco: "Baixo"
        },
        outros: {
          sugestoes: ["CDB", "Fundos de investimento", "Tesouro Direto"],
          justificativa: "Diversificação e crescimento"
        }
      },
      estrategia: {
        curtoPrazo: "Manter 6 meses de despesas em poupança",
        medioPrazo: "Diversificar em CDB e fundos",
        longoPrazo: "Investir em dólar para proteção cambial"
      },
      cotacaoDolar: cotacaoDolar,
      cotacaoDolarFormatada: valorDolarFormatado,
      cotacaoDolarBRL: formatToBRL(cotacaoDolar),
      conversoes: {
        exemplo100Reais,
        exemplo1000Reais,
        totalAnual: totalAnualUSD,
        mediaMensal: mediaMensalUSD
      },
      resumo: "Perfil conservador com boa diversificação. Recomenda-se 35% poupança, 25% dólar e 40% outros investimentos."
    };

    return new Response(JSON.stringify({
      success: true,
      data: analysisResult,
      metadata: {
        totalRendimentos: mockIncomes.length,
        totalAnual,
        totalAnualBRL: formatToBRL(totalAnual),
        totalAnualUSD: formatToUSD(totalAnual / cotacaoDolar),
        mediaMensal,
        mediaMensalBRL: formatToBRL(mediaMensal),
        mediaMensalUSD: formatToUSD(mediaMensal / cotacaoDolar),
        cotacaoDolar,
        cotacaoDolarFormatada: valorDolarFormatado,
        cotacaoDolarBRL: formatToBRL(cotacaoDolar),
        timestamp: new Date().toISOString(),
        note: "Versão de demonstração - dados simulados"
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: "Erro na análise de investimentos",
      details: error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
};

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}; 