import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';
import { generateLoginPayload } from '../common/more_payloads.js';

export function runAuthFlow(data) {
    const url = `${BASE_URL}/api/v1/auth/login`;
    const payload = JSON.stringify({
        email: data ? data.email : "test.merchant@example.com",
        password: data ? data.password : "securepassword123"
    });
    const headers = getHeaders();

    const res = http.post(url, payload, { headers });

    check(res, {
        'login successful (200)': (r) => r.status === 200,
        'has auth token': (r) => r.body && r.body.indexOf('accessToken') !== -1
    });

    handleResponse(res, 'AuthFlow');
    sleep(1);
}
