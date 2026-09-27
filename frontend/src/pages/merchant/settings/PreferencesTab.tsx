import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '../../../services/api/settingsApi';

const PreferencesTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId || '';

  const { data: prefs, isLoading } = useGetPreferencesQuery(merchantId, { skip: !merchantId });
  const [updatePrefs, { isLoading: isUpdating }] = useUpdatePreferencesMutation();

  const [currency, setCurrency] = useState('ETB');
  const [feePayer, setFeePayer] = useState('MERCHANT');

  useEffect(() => {
    if (prefs) {
      setCurrency(prefs.defaultCurrency || 'ETB');
      setFeePayer(prefs.transactionFeePayer || 'MERCHANT');
    }
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updatePrefs({
        merchantId,
        data: {
          defaultCurrency: currency,
          transactionFeePayer: feePayer,
        }
      }).unwrap();
      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Failed to save preferences', err);
      alert('Failed to save preferences.');
    }
  };

  if (isLoading) return <div>Loading preferences...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Preferences</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Default Currency</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>The default currency used for your dashboard display.</p>
        </div>
        <div>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '1rem', background: 'white' }}
          >
            <option value="ETB">ETB - Ethiopian Birr</option>
            <option value="USD">USD - US Dollar</option>
          </select>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2rem 0' }}></div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Fee Routing</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Transaction Fees</p>
        </div>
        <div>
          <select 
            value={feePayer}
            onChange={(e) => setFeePayer(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '1rem', background: 'white' }}
          >
            <option value="MERCHANT">Charge me for the transaction fees</option>
            <option value="CUSTOMER">Charge customer for the transaction fees</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={isUpdating}
        style={{ background: '#16a34a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: isUpdating ? 0.7 : 1 }}
      >
        {isUpdating ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default PreferencesTab;
