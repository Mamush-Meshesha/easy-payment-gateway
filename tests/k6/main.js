import http from 'k6/http';
import { runPaymentFlow } from './scenarios/payments.js';
import { runAuthFlow } from './scenarios/auth.js';
import { runDashboardFlow, runReportingFlow } from './scenarios/reads.js';

export const options = {
    // We set thresholds globally
    thresholds: {
        http_req_duration: ['p(95)<5000'], // 95% of ALL requests must be under 5s
        http_req_failed: ['rate<0.05'],   // Max 5% error rate allowed under load
    },
    
    scenarios: {
        // Core functionality: 50% of traffic
        core_payments: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 }, 
                { duration: '2m', target: 50 },
                { duration: '30s', target: 0 },
            ],
            exec: 'paymentScenario',
        },
        
        // Auth traffic: 10% of traffic
        authentication: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 }, 
                { duration: '2m', target: 10 },
                { duration: '30s', target: 0 },
            ],
            exec: 'authScenario',
        },

        // Merchant Dashboard traffic: 30% of traffic
        merchant_dashboard: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 30 }, 
                { duration: '2m', target: 30 },
                { duration: '30s', target: 0 },
            ],
            exec: 'dashboardScenario',
        },

        // Heavy Reporting Queries: 10% of traffic (fewer users, bigger impact)
        heavy_reporting: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 }, 
                { duration: '2m', target: 10 },
                { duration: '30s', target: 0 },
            ],
            exec: 'reportingScenario',
        },
    },
};

export function setup() {
    const BASE = 'http://192.168.122.127:8080';
    const email = `test.k6.${Date.now()}@example.com`;
    const password = "securepassword123";

    // 1. Register Merchant
    const regRes = http.post(`${BASE}/api/v1/auth/register-merchant`, JSON.stringify({
        email: email, password: password, businessName: "K6 Load Test Inc", country: "US", firstName: "K6", lastName: "Test"
    }), { headers: { 'Content-Type': 'application/json' } });

    let merchantId = "";
    if (regRes.status === 201 || regRes.status === 200) {
        merchantId = regRes.json('user.roles.0.merchantId');
    } else {
        console.warn(`[setup] Failed to register: ${regRes.body}`);
    }

    // 2. Login to get Token
    const loginRes = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({
        email: email, password: password
    }), { headers: { 'Content-Type': 'application/json' } });

    const token = loginRes.json('accessToken');
    if (!merchantId) { merchantId = loginRes.json('user.roles.0.merchantId'); }

    // 3. Generate API Key
    let apiKey = "";
    if (merchantId && token) {
        const keyRes = http.post(`${BASE}/api/v1/merchants/${merchantId}/apikeys`, JSON.stringify({
            name: "k6_test_key", environment: "TEST", keyType: "SECRET"
        }), { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
        apiKey = keyRes.json('rawKey') || "";
    } else {
        console.warn(`[setup] Missing merchantId or token for API key generation`);
    }

    return { token: token, apiKey: apiKey, email: email, password: password };
}

export function paymentScenario(data) { runPaymentFlow(data); }
export function authScenario(data) { runAuthFlow(data); }
export function dashboardScenario(data) { runDashboardFlow(data); }
export function reportingScenario(data) { runReportingFlow(data); }
