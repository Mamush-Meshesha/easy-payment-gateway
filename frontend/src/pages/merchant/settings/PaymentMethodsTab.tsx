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
      alert('Failed to update payment method.');
    }
  };

  if (isMethodsLoading || isProvidersLoading) return <div>Loading payment methods...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Payment Methods</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Enable or disable the payment methods you want to offer to your customers on the checkout page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {providers?.filter((p: any) => p.isActive).map((provider: any) => {
          const merchantConfig = methods?.find((m: any) => m.methodCode.toUpperCase() === provider.code.toUpperCase());
          // Default to false if not configured by merchant yet
          const isEnabled = merchantConfig ? merchantConfig.isEnabled : false;
          
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
