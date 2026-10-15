import { store } from '../store/store';
import { setCredentials, logout } from '../store/slices/authSlice';
interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  _retry?: boolean;
}

let refreshPromise: Promise<any> | null = null;

/**
 * A wrapper around the native fetch API that automatically injects
 * the Redux access token as a Bearer header if requireAuth is true (default).
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<any> {
  const { requireAuth = true, headers = {}, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (requireAuth) {
    const state = store.getState();
    let token = state.auth.accessToken;
    if (!token) {
      token = localStorage.getItem('token');
      if (!token) {
        try {
          const authState = JSON.parse(localStorage.getItem('authState') || '{}');
          token = authState?.accessToken;
        } catch {}
      }
    }

    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('apiFetch: requireAuth is true but no accessToken found in Redux state or localStorage.');
    }

    const merchantId = state.auth.user?.merchantId || localStorage.getItem('merchantId');
    if (merchantId && merchantId !== 'undefined' && merchantId !== 'null' && !requestHeaders.has('X-Merchant-Id')) {
      requestHeaders.set('X-Merchant-Id', merchantId);
    }
  }

  // Automatically set Content-Type to JSON if sending a body and not already set
  // Do NOT set it for FormData as the browser needs to set the multipart boundary
  if (rest.body && !(rest.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  let response = await fetch(fullUrl, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401 with refresh logic
  if (response.status === 401 && !options._retry) {
    const state = store.getState();
    let refreshToken = state.auth.refreshToken;
    if (!refreshToken) {
      try {
        const authState = JSON.parse(localStorage.getItem('authState') || '{}');
        refreshToken = authState?.refreshToken;
      } catch {}
    }
    
    if (refreshToken) {
      if (!refreshPromise) {
        const refreshUrl = '/api/v1/auth/refresh'.startsWith('http') ? '/api/v1/auth/refresh' : `${baseUrl}/api/v1/auth/refresh`;
        refreshPromise = fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).then(res => {
          if (!res.ok) throw new Error('Refresh failed');
          return res.json();
        }).finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const refreshResult = await refreshPromise;
        if (refreshResult && refreshResult.accessToken) {
          store.dispatch(setCredentials({
            user: state.auth.user!,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken || refreshToken,
          }));
          
          // Retry original request with new token
          requestHeaders.set('Authorization', `Bearer ${refreshResult.accessToken}`);
          response = await fetch(fullUrl, {
            ...rest,
            headers: requestHeaders,
          });
        } else {
          store.dispatch(logout());
        }
      } catch (err) {
        store.dispatch(logout());
      }
    } else {
      store.dispatch(logout());
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Parse JSON response if present
  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = (typeof data === 'object' && (data?.message || data?.error)) 
      ? (data.message || data.error) 
      : `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Similar to apiFetch, but returns the raw Blob for downloading files (like CSVs).
 */
export async function apiFetchBlob(url: string, options: FetchOptions = {}): Promise<Blob> {
  const { requireAuth = true, headers = {}, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (requireAuth) {
    const state = store.getState();
    let token = state.auth.accessToken;
    if (!token) {
      token = localStorage.getItem('token');
      if (!token) {
        try {
          const authState = JSON.parse(localStorage.getItem('authState') || '{}');
          token = authState?.accessToken;
        } catch {}
      }
    }
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  let response = await fetch(fullUrl, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401 with refresh logic
  if (response.status === 401 && !options._retry) {
    const state = store.getState();
    let refreshToken = state.auth.refreshToken;
    if (!refreshToken) {
      try {
        const authState = JSON.parse(localStorage.getItem('authState') || '{}');
        refreshToken = authState?.refreshToken;
      } catch {}
    }
    
    if (refreshToken) {
      if (!refreshPromise) {
        const refreshUrl = '/api/v1/auth/refresh'.startsWith('http') ? '/api/v1/auth/refresh' : `${baseUrl}/api/v1/auth/refresh`;
        refreshPromise = fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).then(res => {
          if (!res.ok) throw new Error('Refresh failed');
          return res.json();
        }).finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const refreshResult = await refreshPromise;
        if (refreshResult && refreshResult.accessToken) {
          store.dispatch(setCredentials({
            user: state.auth.user!,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken || refreshToken,
          }));
          
          // Retry original request with new token
          requestHeaders.set('Authorization', `Bearer ${refreshResult.accessToken}`);
          response = await fetch(fullUrl, {
            ...rest,
            headers: requestHeaders,
          });
        } else {
          store.dispatch(logout());
        }
      } catch (err) {
        store.dispatch(logout());
      }
    } else {
      store.dispatch(logout());
    }
  }

  if (!response.ok) {
    let errorMsg = 'Failed to download file';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return await response.blob();
}
