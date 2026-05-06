import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS, PROFILES } from '../config.js';

const PROFILE = __ENV.PROFILE || 'smoke';

export const options = {
  ...(PROFILES[PROFILE] || PROFILES.smoke),
  thresholds: {
    ...THRESHOLDS,
    'http_req_duration{endpoint:ping}': ['p(95)<500'],
    'http_req_duration{endpoint:health}': ['p(95)<1000'],
  },
};

export default function () {
  // GET /api/ping
  const ping = http.get(`${BASE_URL}/api/ping`, {
    tags: { endpoint: 'ping' },
  });
  check(ping, {
    'ping: status 200': (r) => r.status === 200,
    'ping: body contains pong': (r) => r.body.includes('pong'),
    'ping: response < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);

  // GET /api/health
  const health = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: 'health' },
  });
  check(health, {
    'health: status 200 or 503': (r) => [200, 503].includes(r.status),
    'health: has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
    'health: response < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}
