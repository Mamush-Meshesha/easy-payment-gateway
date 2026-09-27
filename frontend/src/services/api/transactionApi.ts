import { baseApi } from './baseApi';
import type { PaginatedResponse } from './paymentApi';

export interface Transaction {
  id: string;
  paymentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  type: 'PAYMENT' | 'REFUND' | 'PAYOUT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  createdAt: string;
  updatedAt: string;
}

export interface GetTransactionsArgs {
  page?: number;
  limit?: number;
  type?: string;
}

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<PaginatedResponse<Transaction>, GetTransactionsArgs>({
      query: (args) => ({
        url: '/dashboard/transactions',
        params: args,
      }),
      providesTags: ['Payment'], // For simplicity, tag it with Payment to refresh when payments change
    }),
  }),
});

export const { useGetTransactionsQuery } = transactionApi;
