import { env } from 'k6';

export const BASE_URL = __ENV.API_URL || 'http://192.168.122.127:8080';

export function getHeaders(token = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

export function handleResponse(res, scenarioName) {
    // We can add custom metrics or logging here in the future
    if (res.status >= 400) {
        console.warn(`[${scenarioName}] Request failed with status ${res.status}: ${res.body}`);
    }
}
