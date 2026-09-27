import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import MerchantLayout from '../layouts/MerchantLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Lazy load pages for performance
const Login = React.lazy(() => import('../pages/auth/Login'));
const LandingPage = React.lazy(() => import('../pages/public/LandingPage'));
const PricingPage = React.lazy(() => import('../pages/public/PricingPage'));
const DashboardOverview = React.lazy(() => import('../pages/merchant/DashboardOverview'));
const CheckoutPage = React.lazy(() => import('../pages/public/CheckoutPage'));
const PaymentsList = React.lazy(() => import('../pages/merchant/PaymentsList'));
const PaymentDetails = React.lazy(() => import('../pages/merchant/PaymentDetails'));
const TransactionsList = React.lazy(() => import('../pages/merchant/TransactionsList'));
const RefundsList = React.lazy(() => import('../pages/merchant/RefundsList'));
const SettlementsList = React.lazy(() => import('../pages/merchant/SettlementsList'));
const ApiKeys = React.lazy(() => import('../pages/merchant/ApiKeys'));
const WebhooksList = React.lazy(() => import('../pages/merchant/WebhooksList'));
const NotificationsList = React.lazy(() => import('../pages/merchant/NotificationsList'));
const SettingsLayout = React.lazy(() => import('../pages/merchant/settings/SettingsLayout'));
const GeneralTab = React.lazy(() => import('../pages/merchant/settings/GeneralTab'));
const PreferencesTab = React.lazy(() => import('../pages/merchant/settings/PreferencesTab'));
const PaymentMethodsTab = React.lazy(() => import('../pages/merchant/settings/PaymentMethodsTab'));
const DeveloperDocs = React.lazy(() => import('../pages/merchant/DeveloperDocs'));
const AdminLayout = React.lazy(() => import('../layouts/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const MerchantsManagement = React.lazy(() => import('../pages/admin/MerchantsManagement'));
const ProvidersManagement = React.lazy(() => import('../pages/admin/ProvidersManagement'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'checkout/:paymentId', element: <CheckoutPage /> },
    ],
  },
  { path: '/login', element: <Login /> },
  
  // Super Admin Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'merchants', element: <MerchantsManagement /> },
      { path: 'providers', element: <ProvidersManagement /> },
    ],
  },

  // Merchant / Developer Routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_DEV']}>
        <MerchantLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: 'payments', element: <PaymentsList /> },
      { path: 'payments/:id', element: <PaymentDetails /> },
      { path: 'transactions', element: <TransactionsList /> },
      { path: 'refunds', element: <RefundsList /> },
      { path: 'settlements', element: <SettlementsList /> },
      { path: 'api-keys', element: <ApiKeys /> },
      { path: 'webhooks', element: <WebhooksList /> },
      { path: 'developers', element: <DeveloperDocs /> },
      { path: 'notifications', element: <NotificationsList /> },
      { 
        path: 'settings', 
        element: <SettingsLayout />,
        children: [
          { index: true, element: <GeneralTab /> }, // Default to general if just /settings
          { path: 'general', element: <GeneralTab /> },
          { path: 'preferences', element: <PreferencesTab /> },
          { path: 'payment-methods', element: <PaymentMethodsTab /> }
        ]
      },    ],
  },
  // Catch-all
  { path: '*', element: <div>404 Not Found</div> },
]);
