import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Shield, CreditCard, Activity } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import '../merchant/DashboardShared.css';

const MerchantDetailsAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Limits form state
  const [isUpdatingLimits, setIsUpdatingLimits] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [limitSuccess, setLimitSuccess] = useState('');
  const [limits, setLimits] = useState({
    currency: 'ETB',
    minAmount: 100,
    maxAmount: 100000
  });

  useEffect(() => {
    const loadMerchant = async () => {
      try {
        const data = await apiFetch(`/api/v1/admin/merchants/${id}`);
        setMerchant(data);
        // In a real app we'd fetch limits here too, using default for now
      } catch (err: any) {
        setError(err.message || 'Failed to load merchant details');
      } finally {
        setIsLoading(false);
      }
    };
    loadMerchant();
  }, [id]);

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingLimits(true);
    setLimitError('');
    setLimitSuccess('');
    try {
      await apiFetch(`/api/v1/admin/merchants/${id}/limit`, {
        method: 'PUT',
        body: JSON.stringify({
          currency: limits.currency,
          minAmount: Number(limits.minAmount),
          maxAmount: Number(limits.maxAmount)
        })
      });
      setLimitSuccess('Transaction limits updated successfully');
      setTimeout(() => setLimitSuccess(''), 3000);
    } catch (err: any) {
      setLimitError(err.message || 'Failed to update limits');
    } finally {
      setIsUpdatingLimits(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
        <h2>Error Loading Merchant</h2>
        <p>{error}</p>
        <Link to="/admin/merchants" className="dashboard-btn-secondary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Back to Merchants
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin/merchants" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Merchant Details</h1>
        <span className={`dashboard-status-badge dashboard-status-badge--${
          merchant.status === 'ACTIVE' ? 'success' :
          merchant.status === 'SUSPENDED' ? 'failed' : 'pending'
        }`} style={{ marginLeft: 'auto' }}>
          {merchant.status || 'UNKNOWN'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Profile Card */}
        <div className="dashboard-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
            Profile Information
          </h2>
          
          <div className="dashboard-form-group">
            <label>Tenant ID</label>
            <input type="text" className="dashboard-form-input" value={merchant.id} readOnly style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
          </div>
          <div className="dashboard-form-group">
            <label>Legal Business Name</label>
            <input type="text" className="dashboard-form-input" value={merchant.legal_name || merchant.legalName || merchant.businessName || 'N/A'} readOnly style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
          </div>
          <div className="dashboard-form-group">
            <label>Current Status</label>
            <input type="text" className="dashboard-form-input" value={merchant.status || 'UNKNOWN'} readOnly style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Limits & Compliance */}
        <div className="dashboard-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} style={{ color: '#f59e0b' }} />
            Risk & Limits
          </h2>
          
          <form onSubmit={handleUpdateLimits}>
            <div className="dashboard-form-group">
              <label>Currency</label>
              <select className="dashboard-form-input" value={limits.currency} onChange={(e) => setLimits({...limits, currency: e.target.value})}>
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="dashboard-form-group">
                <label>Min Transaction</label>
                <input type="number" className="dashboard-form-input" value={limits.minAmount} onChange={(e) => setLimits({...limits, minAmount: e.target.value as any})} />
              </div>
              <div className="dashboard-form-group">
                <label>Max Transaction</label>
                <input type="number" className="dashboard-form-input" value={limits.maxAmount} onChange={(e) => setLimits({...limits, maxAmount: e.target.value as any})} />
              </div>
            </div>

            {limitError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{limitError}</div>}
            {limitSuccess && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>{limitSuccess}</div>}

            <button type="submit" className="dashboard-primary-btn" disabled={isUpdatingLimits} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {isUpdatingLimits ? <Loader2 size={18} className="spin" /> : <><Save size={18} /> Update Limits</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MerchantDetailsAdmin;
