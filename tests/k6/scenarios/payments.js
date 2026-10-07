import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';
import { generatePaymentPayload } from '../common/payloads.js';

export function runPaymentFlow() {
    const url = `${BASE_URL}/api/v1/payments`;
    const payload = generatePaymentPayload();
    const headers = getHeaders(); // If auth is needed, pass token here

    const res = http.post(url, payload, { headers });

    // Validate the response
    check(res, {
        'payment created successfully (200 or 201)': (r) => r.status === 200 || r.status === 201,
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
