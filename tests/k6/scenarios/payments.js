import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';
import { generatePaymentPayload } from '../common/payloads.js';

export function runPaymentFlow(data) {
    const url = `${BASE_URL}/api/v1/payments`;
    const payload = generatePaymentPayload();
    const headers = getHeaders();
    if (data && data.apiKey) {
        headers['X-API-Key'] = data.apiKey;
    }
    // Add unique idempotency key for this virtual user and iteration
    headers['Idempotency-Key'] = `idem_${__VU}_${__ITER}_${Date.now()}`;

    const res = http.post(url, payload, { headers });

    // Validate the response
    check(res, {
        'payment created successfully (200 or 201 or 202)': (r) => r.status === 200 || r.status === 201 || r.status === 202,
        'payment has valid ID': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body && body.id !== undefined;
            } catch (e) {
                return false;
            }
        }
    });

    handleResponse(res, 'PaymentFlow');

    // Simulate user wait time before next action (1-3 seconds)
    sleep(Math.random() * 2 + 1);
}
