import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, LOAD_TEST_TOKEN, THRESHOLDS, PROFILES } from '../config.js';

const PROFILE = __ENV.PROFILE || 'smoke';

export const options = {
  ...(PROFILES[PROFILE] || PROFILES.smoke),
  thresholds: {
    ...THRESHOLDS,
    'http_req_duration{endpoint:tasks}': ['p(95)<2000'],
    'http_req_duration{endpoint:incomes}': ['p(95)<2000'],
    'http_req_duration{endpoint:incomes-by-month}': ['p(95)<2000'],
    'http_req_duration{endpoint:user}': ['p(95)<1500'],
  },
};

const headers = () => ({
  Authorization: `Bearer ${LOAD_TEST_TOKEN}`,
  'Content-Type': 'application/json',
});

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

export default function () {
  if (!LOAD_TEST_TOKEN) {
    console.warn('LOAD_TEST_TOKEN não definido — endpoints autenticados serão pulados');
    return;
  }

  // GET /api/user
  const user = http.get(`${BASE_URL}/api/user`, {
    headers: headers(),
    tags: { endpoint: 'user' },
  });
  check(user, {
    'user: status 200': (r) => r.status === 200,
    'user: response < 1500ms': (r) => r.timings.duration < 1500,
  });

  sleep(0.3);

  // GET /api/tasks
  const tasks = http.get(
    `${BASE_URL}/api/tasks?month=${MONTH}&year=${YEAR}`,
    { headers: headers(), tags: { endpoint: 'tasks' } }
  );
  check(tasks, {
    'tasks: status 200': (r) => r.status === 200,
    'tasks: response is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
    'tasks: response < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.3);

  // GET /api/incomes
  const incomes = http.get(`${BASE_URL}/api/incomes`, {
    headers: headers(),
    tags: { endpoint: 'incomes' },
  });
  check(incomes, {
    'incomes: status 200': (r) => r.status === 200,
    'incomes: response < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.3);

  // GET /api/incomes/total-por-mes
  const totalByMonth = http.get(`${BASE_URL}/api/incomes/total-por-mes`, {
    headers: headers(),
    tags: { endpoint: 'incomes-by-month' },
  });
  check(totalByMonth, {
    'incomes-by-month: status 200': (r) => r.status === 200,
    'incomes-by-month: response < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}
