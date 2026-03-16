/**
 * k6 load test for critical read endpoints (health, etc.).
 * Run: k6 run scripts/load/k6-health.js
 * Install k6: https://k6.io/docs/getting-started/installation/
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { 'health status 200': (r) => r.status === 200 });
  sleep(0.5);
}
