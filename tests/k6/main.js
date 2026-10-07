import { runPaymentFlow } from './scenarios/payments.js';
import { runAuthFlow } from './scenarios/auth.js';
import { runDashboardFlow, runReportingFlow } from './scenarios/reads.js';

export const options = {
    // We set thresholds globally
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% of ALL requests must be under 1s
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

export function paymentScenario() { runPaymentFlow(); }
export function authScenario() { runAuthFlow(); }
export function dashboardScenario() { runDashboardFlow(); }
export function reportingScenario() { runReportingFlow(); }
