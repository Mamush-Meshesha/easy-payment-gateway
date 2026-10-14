import toast from 'react-hot-toast';
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetPaymentMethodsQuery, useTogglePaymentMethodMutation, useGetGlobalProvidersQuery } from '../../../services/api/settingsApi';

const PaymentMethodsTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId || '';

  const { data: methods, isLoading: isMethodsLoading } = useGetPaymentMethodsQuery(merchantId, { skip: !merchantId });
  const { data: providers, isLoading: isProvidersLoading } = useGetGlobalProvidersQuery();
  const [toggleMethodMutation] = useTogglePaymentMethodMutation();

  const handleToggle = async (methodCode: string, currentStatus: boolean) => {
    try {
      await toggleMethodMutation({
        merchantId,
        methodCode,
        isEnabled: !currentStatus
      }).unwrap();
    } catch (err) {
      console.error('Failed to toggle method', err);
      toast.error('Failed to update payment method.');
    }
  };

  const DEFAULT_PROVIDERS = [
    { code: 'TELEBIRR', name: 'Telebirr Mobile Money', isActive: true },
    { code: 'CBEBIRR', name: 'CBE Birr', isActive: true },
    { code: 'BOA', name: 'Bank of Abyssinia', isActive: true },
    { code: 'AWASH', name: 'Awash Bank Mobile Wallet', isActive: true },
    { code: 'STRIPE', name: 'Card Payments (Visa / Mastercard)', isActive: true },
  ];

  const activeProviders = Array.isArray(providers) && providers.length > 0
    ? providers.filter((p: any) => p.isActive)
    : DEFAULT_PROVIDERS;

  if (isMethodsLoading) return <div className="p-8 text-[13px] text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Loading payment methods...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Payment Methods</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Enable or disable the payment methods you want to offer to your customers on the checkout page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeProviders.map((provider: any) => {
          const merchantConfig = methods?.find((m: any) => m.methodCode.toUpperCase() === provider.code.toUpperCase());
          // Default to true for main mobile money, or false if not yet configured
          const isEnabled = merchantConfig ? merchantConfig.isEnabled : true;
          
          return (
            <MethodToggle 
              key={provider.code}
              label={provider.name} 
              enabled={isEnabled} 
              onToggle={() => handleToggle(provider.code.toUpperCase(), isEnabled)} 
            />
          );
        })}
      </div>
    </div>
  );
};

const MethodToggle: React.FC<{ label: string, enabled: boolean, onToggle: () => void }> = ({ label, enabled, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
    <button 
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? '#16a34a' : '#cbd5e1',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        transition: 'left 0.3s ease'
      }}></div>
    </button>
  </div>
);

export default PaymentMethodsTab;
