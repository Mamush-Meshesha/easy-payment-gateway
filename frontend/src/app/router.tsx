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
const WebhookDeliveryLogs = React.lazy(() => import('../pages/merchant/WebhookDeliveryLogs'));
const NotificationsList = React.lazy(() => import('../pages/merchant/NotificationsList'));
const RadarRules = React.lazy(() => import('../pages/merchant/RadarRules'));
const RiskAnalytics = React.lazy(() => import('../pages/merchant/RiskAnalytics'));
const KycOnboarding = React.lazy(() => import('../pages/merchant/KycOnboarding'));
const DisputesList = React.lazy(() => import('../pages/merchant/DisputesList'));
const SubscriptionsList = React.lazy(() => import('../pages/merchant/SubscriptionsList'));
const SettingsLayout = React.lazy(() => import('../pages/merchant/settings/SettingsLayout'));
const GeneralTab = React.lazy(() => import('../pages/merchant/settings/GeneralTab'));
const PreferencesTab = React.lazy(() => import('../pages/merchant/settings/PreferencesTab'));
const PaymentMethodsTab = React.lazy(() => import('../pages/merchant/settings/PaymentMethodsTab'));
const DeveloperDocs = React.lazy(() => import('../pages/merchant/DeveloperDocs'));
const AdminLayout = React.lazy(() => import('../layouts/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const MerchantsManagement = React.lazy(() => import('../pages/admin/MerchantsManagement'));
const MerchantDetailsAdmin = React.lazy(() => import('../pages/admin/MerchantDetailsAdmin'));
const ProvidersManagement = React.lazy(() => import('../pages/admin/ProvidersManagement'));
const ReconciliationUpload = React.lazy(() => import('../pages/admin/ReconciliationUpload'));
const SystemHealth = React.lazy(() => import('../pages/admin/SystemHealth'));
const AdminKycReview = React.lazy(() => import('../pages/admin/AdminKycReview'));

const OnlineCheckout = React.lazy(() => import('../pages/public/products/OnlineCheckout'));
const PaymentLinks = React.lazy(() => import('../pages/public/products/PaymentLinks'));
const QrPayments = React.lazy(() => import('../pages/public/products/QrPayments'));
const FraudRadar = React.lazy(() => import('../pages/public/products/FraudRadar'));
const CoreLedger = React.lazy(() => import('../pages/public/products/CoreLedger'));
const Settlements = React.lazy(() => import('../pages/public/products/Settlements'));

const Enterprise = React.lazy(() => import('../pages/public/solutions/Enterprise'));
const Ecommerce = React.lazy(() => import('../pages/public/solutions/Ecommerce'));
const Saas = React.lazy(() => import('../pages/public/solutions/Saas'));
const Startups = React.lazy(() => import('../pages/public/solutions/Startups'));

const About = React.lazy(() => import('../pages/public/company/About'));
const Careers = React.lazy(() => import('../pages/public/company/Careers'));

const ApiReference = React.lazy(() => import('../pages/public/docs/ApiReference'));
const Quickstart = React.lazy(() => import('../pages/public/docs/Quickstart'));
const Sdks = React.lazy(() => import('../pages/public/docs/Sdks'));
const Sandbox = React.lazy(() => import('../pages/public/docs/Sandbox'));
const Webhooks = React.lazy(() => import('../pages/public/docs/Webhooks'));
const DocsLanding = React.lazy(() => import('../pages/public/docs/DocsLanding'));

const Blog = React.lazy(() => import('../pages/public/Blog'));
const Contact = React.lazy(() => import('../pages/public/Contact'));
const Community = React.lazy(() => import('../pages/public/Community'));

const Mock3dsChallenge = React.lazy(() => import('../pages/public/Mock3dsChallenge'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'checkout/:paymentId', element: <CheckoutPage /> },
      { path: 'mock-issuer/3ds2/challenge', element: <Mock3dsChallenge /> },
      
      { path: 'products/checkout', element: <OnlineCheckout /> },
      { path: 'products/payment-links', element: <PaymentLinks /> },
      { path: 'products/qr-payments', element: <QrPayments /> },
      { path: 'products/radar', element: <FraudRadar /> },
      { path: 'products/ledger', element: <CoreLedger /> },
      { path: 'products/settlements', element: <Settlements /> },
      
      { path: 'solutions/enterprise', element: <Enterprise /> },
      { path: 'solutions/ecommerce', element: <Ecommerce /> },
      { path: 'solutions/saas', element: <Saas /> },
      { path: 'solutions/startups', element: <Startups /> },
      
      { path: 'company/about', element: <About /> },
      { path: 'company/careers', element: <Careers /> },
      
      { path: 'docs', element: <DocsLanding /> },
      { path: 'docs/api', element: <ApiReference /> },
      { path: 'docs/quickstart', element: <Quickstart /> },
      { path: 'docs/sdks', element: <Sdks /> },
      { path: 'docs/sandbox', element: <Sandbox /> },
      { path: 'docs/webhooks', element: <Webhooks /> },
      
      { path: 'blog', element: <Blog /> },
      { path: 'contact', element: <Contact /> },
      { path: 'community', element: <Community /> },
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
      { path: 'merchants/:id', element: <MerchantDetailsAdmin /> },
      { path: 'providers', element: <ProvidersManagement /> },
      { path: 'reconciliation', element: <ReconciliationUpload /> },
      { path: 'health', element: <SystemHealth /> },
      { path: 'kyc', element: <AdminKycReview /> },
      
      // Global Ledger reused views
      { path: 'payments', element: <PaymentsList /> },
      { path: 'transactions', element: <TransactionsList /> },
      { path: 'subscriptions', element: <SubscriptionsList /> },
      { path: 'refunds', element: <RefundsList /> },
      { path: 'disputes', element: <DisputesList /> },
      { path: 'settlements', element: <SettlementsList /> },
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
      { path: 'webhooks/deliveries', element: <WebhookDeliveryLogs /> },
      { path: 'developers', element: <DeveloperDocs /> },
      { path: 'notifications', element: <NotificationsList /> },
      { path: 'radar', element: <RadarRules /> },
      { path: 'risk-analytics', element: <RiskAnalytics /> },
      { path: 'kyc', element: <KycOnboarding /> },
      { path: 'disputes', element: <DisputesList /> },
      { path: 'subscriptions', element: <SubscriptionsList /> },
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
