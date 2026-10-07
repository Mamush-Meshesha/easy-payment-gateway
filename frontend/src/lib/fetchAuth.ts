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

  return fetch(url, { ...options, headers });
};
