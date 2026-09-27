import { baseApi } from './baseApi';

export interface ApiKeyDetails {
  id: string;
  merchantId: string;
  keyPrefix: string;
  keyLast4: string;
  rawKey?: string; // Only returned on generation
  type: 'live' | 'test';
  isActive: boolean;
  createdAt: string;
}

export interface ApiKeysResponse {
  live?: ApiKeyDetails;
  test?: ApiKeyDetails;
}

export const developerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApiKeys: builder.query<ApiKeysResponse, void>({
      query: () => '/merchants/api-keys',
      providesTags: ['ApiKey'],
    }),
    generateApiKey: builder.mutation<ApiKeyDetails, { type: 'live' | 'test' }>({
      query: (body) => ({
        url: '/merchants/api-keys/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ApiKey'],
    }),
  }),
});

export const { useGetApiKeysQuery, useGenerateApiKeyMutation } = developerApi;
