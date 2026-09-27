import { baseApi } from './baseApi';
import type { PaginatedResponse } from './paymentApi';

export interface Settlement {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  destinationAccount: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSettlementsArgs {
  page?: number;
  limit?: number;
  status?: string;
}

export interface SettlementBalance {
  availableBalance: number;
  pendingSettlement: number;
  currency: string;
}

export const settlementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettlements: builder.query<PaginatedResponse<Settlement>, GetSettlementsArgs>({
      query: (args) => ({
        url: '/dashboard/settlements',
        params: args,
      }),
      providesTags: ['Settlement'],
    }),
    getSettlementById: builder.query<Settlement, string>({
      query: (id) => `/dashboard/settlements/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Settlement', id }],
    }),
    getSettlementBalance: builder.query<SettlementBalance, void>({
      query: () => '/dashboard/settlements/balance',
      providesTags: ['Settlement'],
    }),
    triggerSettlement: builder.mutation<Settlement, { amount: number }>({
      query: (body) => ({
        url: '/settlements/trigger',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Settlement'],
    }),
  }),
});

export const { 
  useGetSettlementsQuery, 
  useGetSettlementByIdQuery,
  useGetSettlementBalanceQuery,
  useTriggerSettlementMutation 
} = settlementApi;
