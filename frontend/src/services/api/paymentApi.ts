import { baseApi } from './baseApi';

export interface Payment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  paymentMethod: string;
  providerId?: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPaymentsArgs {
  page?: number;
  limit?: number;
  status?: string;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaginatedResponse<Payment>, GetPaymentsArgs>({
      query: (args) => ({
        url: '/dashboard/payments',
        params: args,
      }),
      providesTags: ['Payment'],
    }),
    getPaymentById: builder.query<Payment, string>({
      query: (id) => `/dashboard/payments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Payment', id }],
    }),
  }),
});

export const { useGetPaymentsQuery, useGetPaymentByIdQuery } = paymentApi;
