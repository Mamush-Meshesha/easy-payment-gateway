import React, { useState, useEffect } from 'react';
import { Key, Copy, Plus, X, Trash2, Edit, Loader2, Eye, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { apiFetch } from '../../lib/api';
import { useGetMerchantDetailsQuery } from '../../services/api/settingsApi';
import './DashboardShared.css';

const ApiKeys: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [environment, setEnvironment] = useState('TEST');

  const { data: merchantDetails } = useGetMerchantDetailsQuery(merchantId || '', { skip: !merchantId });
  const isVerified = merchantDetails?.status === 'ACTIVE';
  
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/v1/merchants/api-keys');
      // Backend now returns an array directly
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) {
      fetchApiKeys();
    }
  }, [merchantId]);

  const handleGenerateKey = async () => {
    if (!merchantId || !newKeyName.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await apiFetch(`/api/v1/merchants/${merchantId}/apikeys`, {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName, environment })
      });
      setNewlyGeneratedKey(data.rawKey || data.key || data.apiKey || data.token); // Adjust based on actual backend response
      fetchApiKeys(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to generate API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!merchantId) return;
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await apiFetch(`/api/v1/merchants/${merchantId}/apikeys/${keyId}`, {
        method: 'DELETE'
      });
      fetchApiKeys(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">API Keys</h1>
        <button className="dashboard-primary-btn" onClick={() => { setIsCreateModalOpen(true); setNewlyGeneratedKey(null); }}>
          <Plus size={18} /> Generate New Key
        </button>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>API Key Prefix</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={24} style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    {error}
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No API keys found. Generate one to get started.
                  </td>
                </tr>
              ) : (
                apiKeys.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        <Key size={16} color="var(--text-secondary)" />
                      </div>
                      {item.name}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{item.keyPrefix ? `${item.keyPrefix}****${item.keyLast4}` : 'pk_...'}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontWeight: 600 }}>
                      {item.environment || 'TEST'}
                    </span>
                  </td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${item.status === 'ACTIVE' ? 'success' : 'neutral'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="dashboard-table-action" style={{ color: 'var(--brand-primary)' }} title="Reveal Key" onClick={() => { setRevealKeyId(item.id); setIsRevealModalOpen(true); setTwoFaCode(''); }}>
                        <Eye size={16} />
                      </button>
                      <button className="dashboard-table-action" style={{ color: '#ef4444' }} title="Revoke Key" onClick={() => handleRevokeKey(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Generate API Key</h2>
              <button className="dashboard-modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Key Name</label>
                <input 
                  type="text" 
                  className="dashboard-form-input" 
                  placeholder="e.g. Production Mobile App" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={isSubmitting || !!newlyGeneratedKey}
                />
              </div>
              
              {!newlyGeneratedKey && (
                <div className="dashboard-form-group">
                  <label>Environment</label>
                  <select 
                    className="dashboard-form-input"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="TEST">Test</option>
                    {isVerified ? (
                      <option value="LIVE">Live / Production</option>
                    ) : (
                      <option value="LIVE" disabled>Live / Production (Requires Verification)</option>
                    )}
                  </select>
                  {!isVerified && (
                    <p style={{ fontSize: '0.8rem', color: '#eab308', marginTop: '0.5rem' }}>
                      ⚠️ Your business account is still pending verification. You can only generate TEST keys for now.
                    </p>
                  )}
                </div>
              )}

              {newlyGeneratedKey ? (
                <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h3 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>API Key Generated Successfully!</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Please copy this key now. For security reasons, you will <strong>never</strong> be able to view it again.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="dashboard-form-input" value={newlyGeneratedKey} readOnly style={{ fontFamily: 'monospace' }} />
                    <button className="dashboard-primary-btn" onClick={() => copyToClipboard(newlyGeneratedKey)}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Your secret key will only be shown once after generation. Make sure to copy it to a secure location.
                </p>
              )}
            </div>
            <div className="dashboard-modal-footer">
              {newlyGeneratedKey ? (
                <button className="dashboard-primary-btn" onClick={() => setIsCreateModalOpen(false)}>Done</button>
              ) : (
                <>
                  <button className="dashboard-btn-secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                  <button className="dashboard-primary-btn" onClick={handleGenerateKey} disabled={isSubmitting || !newKeyName.trim()}>
                    {isSubmitting ? <Loader2 size={18} className="spin" /> : 'Generate Key'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reveal Modal (Mock for future 2FA) */}
      {isRevealModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Security Verification</h2>
              <button className="dashboard-modal-close" onClick={() => setIsRevealModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <ShieldCheck size={48} color="var(--brand-primary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  To reveal this API key, please enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <div className="dashboard-form-group">
                <label>2FA Code</label>
                <input 
                  type="text" 
                  className="dashboard-form-input" 
                  placeholder="e.g. 123456" 
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', textAlign: 'center', marginTop: '1rem' }}>
                Note: This is a UI placeholder. 2FA verification will be fully implemented in a future phase.
              </p>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsRevealModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={() => {
                if (twoFaCode.length === 6) {
                  const keyToReveal = apiKeys.find(k => k.id === revealKeyId);
                  if (keyToReveal && keyToReveal.rawKey) {
                    setNewlyGeneratedKey(keyToReveal.rawKey);
                    setIsCreateModalOpen(true); // Open the generate modal to reuse its success state UI to display the key
                  } else {
                    alert('Raw key is not available for this key. It was generated before the reveal feature was added.');
                  }
                  setIsRevealModalOpen(false);
                } else {
                  alert('Please enter a valid 6-digit code');
                }
              }}>
                Verify & Reveal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
