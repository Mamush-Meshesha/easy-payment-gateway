import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';

export function runDashboardFlow() {
    // Merchants constantly check their dashboard
    const url = `${BASE_URL}/api/v1/dashboard/metrics`;
    const headers = getHeaders('mock_auth_token_for_dashboard');

    const res = http.get(url, { headers });

    check(res, {
        'dashboard loaded successfully (200)': (r) => r.status === 200
    });

    handleResponse(res, 'DashboardFlow');
    sleep(Math.random() * 3 + 1); // Users read the dashboard for a few seconds
}

export function runReportingFlow() {
    // Reporting is a heavier operation, simulate exporting a report
    const url = `${BASE_URL}/api/v1/reporting/summary?timeframe=30d`;
    const headers = getHeaders('mock_auth_token_for_reporting');

    const res = http.get(url, { headers });

    check(res, {
        'report generated successfully (200)': (r) => r.status === 200
    });

    handleResponse(res, 'ReportingFlow');
    sleep(Math.random() * 5 + 5); // Reporting takes time to read
}
