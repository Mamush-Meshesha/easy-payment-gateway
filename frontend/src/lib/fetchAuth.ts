export const fetchAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const authStateStr = localStorage.getItem('authState');
  const authState = authStateStr ? JSON.parse(authStateStr) : null;
  const merchantId = authState?.user?.merchantId;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (merchantId) {
    headers.set('X-Merchant-Id', merchantId);
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://payment-gateway-monolith.onrender.com';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  return fetch(fullUrl, { ...options, headers });
};
