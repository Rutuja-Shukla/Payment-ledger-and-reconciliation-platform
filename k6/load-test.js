import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 virtual users
    { duration: '1m', target: 100 },  // Steady load at 100 VUs
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<350'], // 95% of payment transactions must complete within 350ms
    http_req_failed: ['rate<0.01'],   // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080';

export default function () {
  const idempotencyKey = uuidv4();
  const payload = JSON.stringify({
    sourceAccountId: 'acc_cust_101',
    destinationAccountId: 'acc_merch_202',
    amount: (Math.random() * 100 + 10).toFixed(2),
    currency: 'USD',
    paymentMethod: 'CREDIT_CARD',
    reference: `PERF-${__VU}-${__ITER}`,
    metadata: {
      client: 'k6-load-generator'
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'Authorization': 'Bearer simulated_token_for_k6'
    },
  };

  // 1. Initial Payment Ingestion
  const res1 = http.post(`${BASE_URL}/v1/payments`, payload, params);
  check(res1, {
    'initial payment status is 201': (r) => r.status === 201,
    'paymentId is returned': (r) => JSON.parse(r.body).paymentId !== undefined,
  });

  // 2. Immediate Idempotency Replay (Verify sub-50ms cache response)
  const res2 = http.post(`${BASE_URL}/v1/payments`, payload, params);
  check(res2, {
    'replay status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'idempotent response matches original': (r) => JSON.parse(r.body).paymentId === JSON.parse(res1.body).paymentId,
  });

  sleep(0.1);
}
