import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, handleResponse } from '../common/utils.js';

export function runDashboardFlow(data) {
    // Merchants constantly check their dashboard
    const url = `${BASE_URL}/api/v1/dashboard/payments`;
    const headers = getHeaders(data ? data.token : null);

    const res = http.get(url, { headers });

    check(res, {
        'dashboard loaded successfully (200)': (r) => r.status === 200
    });

    handleResponse(res, 'DashboardFlow');
    sleep(Math.random() * 3 + 1); // Users read the dashboard for a few seconds
}

export function runReportingFlow(data) {
    // Reporting is a heavier operation, simulate exporting a report
    const url = `${BASE_URL}/api/v1/reporting/payments`;
    const headers = getHeaders(data ? data.token : null);

    const res = http.get(url, { headers });

    check(res, {
        'report generated successfully (200)': (r) => r.status === 200
    });

    handleResponse(res, 'ReportingFlow');
    sleep(Math.random() * 5 + 5); // Reporting takes time to read
}
