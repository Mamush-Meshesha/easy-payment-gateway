import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetMerchantDetailsQuery } from '../../../services/api/settingsApi';

const GeneralTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId || '';

  const { data: merchant, isLoading } = useGetMerchantDetailsQuery(merchantId, { skip: !merchantId });

  if (isLoading) return <div>Loading business profile...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Business Profile</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Business Name</p>
        </div>
        <div>
          <input type="text" value={merchant?.legalName || ''} readOnly style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '1rem', background: '#f8fafc', color: '#64748b' }} />
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contact support to change your legal business name.</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Support Email</p>
        </div>
        <div>
          <input type="email" value={user?.email || ''} readOnly style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '1rem', background: '#f8fafc', color: '#64748b' }} />
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
