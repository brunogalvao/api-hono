export const BASE_URL = __ENV.API_URL || 'https://api-hono-jet.vercel.app';
export const LOAD_TEST_TOKEN = __ENV.LOAD_TEST_TOKEN || '';

// Thresholds globais aplicados em todos os cenários
export const THRESHOLDS = {
  http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  http_req_failed: ['rate<0.01'],
};

// Opções de execução por perfil
export const PROFILES = {
  smoke: {
    vus: 3,
    duration: '30s',
  },
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '60s', target: 10 },
      { duration: '30s', target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '30s', target: 20 },
      { duration: '30s', target: 30 },
      { duration: '30s', target: 0 },
    ],
  },
};
