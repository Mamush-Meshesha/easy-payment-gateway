import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../store/store';
import { logout, setCredentials } from '../../store/slices/authSlice';
// Base fetch query with automatic Authorization header injection
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/v1` : '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    const user = (getState() as RootState).auth.user;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (user?.merchantId) {
      headers.set('X-Merchant-Id', user.merchantId);
    }
    // Set a correlation ID if not present
    if (!headers.has('X-Request-ID')) {
      headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    }
    return headers;
  },
  timeout: 10000, // 10s default timeout
});

let refreshPromise: Promise<any> | null = null;

// Custom base query to handle 401 Unauthorized globally
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          api.dispatch(setCredentials({
            user: state.auth.user!,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken || refreshToken,
          }));
          // Retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } catch (err) {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

// Global API Slice. Feature slices will inject their endpoints here.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Payment', 'Merchant', 'Webhook', 'ApiKey', 'Refund', 'Settlement'],
  endpoints: () => ({}),
});
