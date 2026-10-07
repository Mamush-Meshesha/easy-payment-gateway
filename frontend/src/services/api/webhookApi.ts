import { baseApi } from './baseApi';
import type { PaginatedResponse } from './paymentApi';

export interface WebhookEndpoint {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  merchantId: string;
  eventId: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';
  attemptCount: number;
  responseStatusCode: number;
  responseBody: string;
  createdAt: string;
  nextRetryAt?: string;
  lastError?: string;
  payload: string;
}

export const webhookApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWebhookEndpoints: builder.query<WebhookEndpoint[], void>({
      query: () => '/merchants/webhooks',
      providesTags: ['Webhook'],
    }),
    createWebhookEndpoint: builder.mutation<WebhookEndpoint, Partial<WebhookEndpoint>>({
      query: (body) => ({
        url: '/merchants/webhooks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Webhook'],
    }),
    deleteWebhookEndpoint: builder.mutation<void, string>({
      query: (id) => ({
        url: `/merchants/webhooks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Webhook'],
    }),
    getWebhookDeliveries: builder.query<PaginatedResponse<WebhookDelivery>, { page?: number; limit?: number }>({
      query: (args) => ({
        url: '/dashboard/webhooks/deliveries',
        params: args,
      }),
      providesTags: ['Webhook'],
    }),
    replayWebhookDelivery: builder.mutation<{ success: boolean, message: string }, string>({
      query: (deliveryId) => ({
        url: `/dashboard/webhooks/deliveries/${deliveryId}/replay`,
        method: 'POST',
      }),
      invalidatesTags: ['Webhook'],
    }),
  }),
});

export const { 
  useGetWebhookEndpointsQuery, 
  useCreateWebhookEndpointMutation, 
  useDeleteWebhookEndpointMutation,
  useGetWebhookDeliveriesQuery,
  useReplayWebhookDeliveryMutation
} = webhookApi;
