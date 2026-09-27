import { baseApi } from './baseApi';
import type { PaginatedResponse } from './paymentApi';

export interface NotificationLog {
  id: string;
  merchantId: string;
  type: 'EMAIL' | 'SMS';
  recipient: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  errorDetails?: string;
  createdAt: string;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<NotificationLog>, { page?: number; limit?: number }>({
      query: (args) => ({
        url: '/dashboard/notifications',
        params: args,
      }),
      providesTags: ['Webhook'], // reusing webhook tag or create separate Notification tag
    }),
  }),
});

export const { useGetNotificationsQuery } = notificationApi;
