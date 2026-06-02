// Runtime Edge/Node — sem i18n, locale fixo pt-BR.
// Duplicação intencional com front-hono/src/utils/format.ts (runtimes e requisitos de i18n distintos).
export const formatToBRL = (value: number | string) => {
  const number = typeof value === 'string' ? Number(value) : value;
  if (isNaN(number)) return 'Valor inválido';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
};

export const formatToUSD = (value: number | string) => {
  const number = typeof value === 'string' ? Number(value) : value;
  if (isNaN(number)) return 'Valor inválido';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
};

export const convertBRLtoUSD = (brlValue: number, usdRate: number) => {
  const usdValue = brlValue / usdRate;
  return {
    brl: formatToBRL(brlValue),
    usd: formatToUSD(usdValue),
    usdValue: usdValue,
    rate: usdRate
  };
}; 