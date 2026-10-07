import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';
import { generateLoginPayload } from '../common/more_payloads.js';

export function runAuthFlow() {
    const url = `${BASE_URL}/api/v1/auth/login`;
    const payload = generateLoginPayload();
    const headers = getHeaders();

    const res = http.post(url, payload, { headers });

    check(res, {
        'login successful (200)': (r) => r.status === 200,
        'has auth token': (r) => r.body.includes('token')
    });

    handleResponse(res, 'AuthFlow');
    sleep(1);
}
