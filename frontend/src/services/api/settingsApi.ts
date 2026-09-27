import { baseApi } from './baseApi';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMerchantDetails: builder.query<any, string>({
      query: (merchantId) => `/merchants/${merchantId}`,
      providesTags: ['Merchant'],
    }),
    getPreferences: builder.query<any, string>({
      query: (merchantId) => `/merchants/${merchantId}/preferences`,
      providesTags: ['Merchant'],
    }),
    updatePreferences: builder.mutation<any, { merchantId: string; data: any }>({
      query: ({ merchantId, data }) => ({
        url: `/merchants/${merchantId}/preferences`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Merchant'],
    }),
    getPaymentMethods: builder.query<any[], string>({
      query: (merchantId) => `/merchants/${merchantId}/payment-methods`,
      providesTags: ['Merchant'],
    }),
    togglePaymentMethod: builder.mutation<any, { merchantId: string; methodCode: string; isEnabled: boolean }>({
      query: ({ merchantId, methodCode, isEnabled }) => ({
        url: `/merchants/${merchantId}/payment-methods/${methodCode}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: ['Merchant'],
    }),
    getGlobalProviders: builder.query<any[], void>({
      query: () => `/admin/providers`,
      providesTags: ['Providers'] as any,
    }),
    createGlobalProvider: builder.mutation<any, { code: string; name: string }>({
      query: (data) => ({
        url: `/providers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Providers'] as any,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMerchantDetailsQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetPaymentMethodsQuery,
  useTogglePaymentMethodMutation,
  useGetGlobalProvidersQuery,
  useCreateGlobalProviderMutation,
} = settingsApi;
