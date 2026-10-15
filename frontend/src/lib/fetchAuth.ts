export const fetchAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const authStateStr = localStorage.getItem('authState');
  const authState = authStateStr ? JSON.parse(authStateStr) : null;
  const merchantId = authState?.user?.merchantId || authState?.user?.merchant_id || localStorage.getItem('merchantId');

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (merchantId && merchantId !== 'undefined' && merchantId !== 'null') {
    headers.set('X-Merchant-Id', merchantId);
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  return fetch(fullUrl, { ...options, headers });
};
