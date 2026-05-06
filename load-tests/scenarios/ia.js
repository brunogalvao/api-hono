import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, LOAD_TEST_TOKEN, THRESHOLDS } from '../config.js';

// IA tem custo por chamada (Supabase + currency API) — cargas menores
export const options = {
  stages: [
    { duration: '20s', target: 3 },
    { duration: '40s', target: 5 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    ...THRESHOLDS,
    'http_req_duration{endpoint:ia}': ['p(95)<5000', 'p(99)<8000'],
    'http_req_failed{endpoint:ia}': ['rate<0.05'],
  },
};

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

export default function () {
  if (!LOAD_TEST_TOKEN) {
    console.warn('LOAD_TEST_TOKEN não definido — teste de IA será pulado');
    return;
  }

  const payload = JSON.stringify({ mes: MONTH, ano: YEAR });

  const res = http.post(
    `${BASE_URL}/api/ia/analise-investimento`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${LOAD_TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'ia' },
      timeout: '10s',
    }
  );

  check(res, {
    'ia: status 200': (r) => r.status === 200,
    'ia: has cotacaoDolar': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.cotacaoDolar > 0;
      } catch {
        return false;
      }
    },
    'ia: response < 5000ms': (r) => r.timings.duration < 5000,
  });

  // Pausa maior entre chamadas de IA para não sobrecarregar Supabase
  sleep(2);
}
