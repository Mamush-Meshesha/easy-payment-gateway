import { baseApi } from './baseApi';
import type { PaginatedResponse } from './paymentApi';

export interface Refund {
  id: string;
  paymentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  createdAt: string;
  updatedAt: string;
}

export interface GetRefundsArgs {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

export const refundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRefunds: builder.query<PaginatedResponse<Refund>, GetRefundsArgs>({
      query: (args) => ({
        url: '/dashboard/refunds',
        params: args,
      }),
      providesTags: ['Refund'],
    }),
    getRefundById: builder.query<Refund, string>({
      query: (id) => `/dashboard/refunds/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Refund', id }],
    }),
    createRefund: builder.mutation<Refund, CreateRefundRequest>({
      query: (body) => ({
        url: `/payments/${body.paymentId}/refund`,
        method: 'POST',
        body: { amount: body.amount, reason: body.reason },
      }),
      invalidatesTags: ['Refund', 'Payment'],
    }),
  }),
});

export const { useGetRefundsQuery, useGetRefundByIdQuery, useCreateRefundMutation } = refundApi;
