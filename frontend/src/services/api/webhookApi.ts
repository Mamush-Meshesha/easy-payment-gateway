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
  webhookEndpointId: string;
  eventType: string;
  payload: any;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  statusCode?: number;
  responseBody?: string;
  createdAt: string;
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
  }),
});

export const { 
  useGetWebhookEndpointsQuery, 
  useCreateWebhookEndpointMutation, 
  useDeleteWebhookEndpointMutation,
  useGetWebhookDeliveriesQuery 
} = webhookApi;
