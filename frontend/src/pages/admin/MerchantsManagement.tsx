import React, { useState, useEffect } from 'react';
import { MoreVertical, CheckCircle2, Ban, X, AlertTriangle, Plus, UserPlus, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import '../merchant/DashboardShared.css';

const MerchantsManagement: React.FC = () => {
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMerchants = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/v1/admin/merchants');
      setMerchants(data.merchants || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load merchants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const handleSuspendClick = (merchant: any) => {
    setSelectedMerchant(merchant);
    setIsSuspendModalOpen(true);
  };

  const handleApproveClick = (merchant: any) => {
    setSelectedMerchant(merchant);
    setIsApproveModalOpen(true);
  };

  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">Merchants (Tenants)</h1>
        <button className="dashboard-primary-btn" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Add Merchant
        </button>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tenant ID</th>
                <th>Business Name</th>
                <th>Owner Email</th>
                <th>Total Volume</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={24} style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    {error}
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No merchants found.
                  </td>
                </tr>
              ) : (
                merchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{merchant.id}</td>
                  <td style={{ fontWeight: 600 }}>{merchant.businessName || merchant.name || 'N/A'}</td>
                  <td>{merchant.owner?.email || merchant.email || 'N/A'}</td>
                  <td style={{ fontWeight: 600 }}>ETB {(merchant.monthlyVolume || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : (merchant.joined || 'N/A')}</td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${
                      merchant.status === 'ACTIVE' ? 'success' :
                      merchant.status === 'SUSPENDED' ? 'failed' : 'pending'
                    }`}>
                      {merchant.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {merchant.status === 'PENDING' && (
                        <button className="dashboard-table-action" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} title="Approve Merchant" onClick={() => handleApproveClick(merchant)}>
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {merchant.status === 'ACTIVE' && (
                        <button className="dashboard-table-action" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} title="Suspend" onClick={() => handleSuspendClick(merchant)}>
                          <Ban size={16} />
                        </button>
                      )}
                      {merchant.status === 'SUSPENDED' && (
                        <button className="dashboard-table-action" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} title="Re-activate">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button className="dashboard-table-action" title="More Options">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Merchant Modal */}
      {isAddModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Onboard New Merchant</h2>
              <button className="dashboard-modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Business Name</label>
                <input type="text" className="dashboard-form-input" placeholder="e.g. Acme Corporation" />
              </div>
              <div className="dashboard-form-group">
                <label>Owner Email</label>
                <input type="email" className="dashboard-form-input" placeholder="owner@acmecorp.com" />
              </div>
              <div className="dashboard-form-group">
                <label>Temporary Password</label>
                <input type="text" className="dashboard-form-input" defaultValue="TempPass123!" />
              </div>
              <div className="dashboard-form-group">
                <label>Initial Status</label>
                <select className="dashboard-form-input">
                  <option>PENDING (Requires KYC Approval)</option>
                  <option>ACTIVE (Auto-Approve)</option>
                </select>
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={() => setIsAddModalOpen(false)}>
                <UserPlus size={18} /> Create Merchant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Merchant Modal */}
      {isApproveModalOpen && selectedMerchant && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <button className="dashboard-modal-close" onClick={() => setIsApproveModalOpen(false)} style={{ marginLeft: 'auto' }}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body" style={{ textAlign: 'center', paddingTop: 0 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 className="dashboard-modal-title" style={{ marginBottom: '0.5rem' }}>Approve Merchant?</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You are about to approve <strong>{selectedMerchant.name}</strong> for live transaction processing. Have you verified their KYC documents?
              </p>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsApproveModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" style={{ background: '#10b981' }} onClick={() => setIsApproveModalOpen(false)}>Confirm Approval</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Merchant Modal */}
      {isSuspendModalOpen && selectedMerchant && (
        <SuspendModal 
          merchant={selectedMerchant}
          onClose={() => setIsSuspendModalOpen(false)}
          onSuccess={() => {
            setIsSuspendModalOpen(false);
            loadMerchants();
          }}
        />
      )}
    </div>
  );
};

const SuspendModal: React.FC<{ merchant: any, onClose: () => void, onSuccess: () => void }> = ({ merchant, onClose, onSuccess }) => {
  const [reason, setReason] = useState('Suspicious Activity / High Fraud Rate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSuspendSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/admin/merchants/${merchant.id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend merchant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal">
        <div className="dashboard-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <button className="dashboard-modal-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={20} />
          </button>
        </div>
        <div className="dashboard-modal-body" style={{ textAlign: 'center', paddingTop: 0 }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 className="dashboard-modal-title" style={{ marginBottom: '0.5rem' }}>Suspend Merchant?</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to suspend <strong>{merchant.businessName || merchant.name || merchant.id}</strong>? They will immediately lose access to the platform and all API requests will be blocked.
          </p>
          
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <div className="dashboard-form-group" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
            <label>Reason for suspension</label>
            <select 
              className="dashboard-form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            >
              <option>Suspicious Activity / High Fraud Rate</option>
              <option>Terms of Service Violation</option>
              <option>Non-payment of fees</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="dashboard-modal-footer">
          <button className="dashboard-btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="dashboard-btn-danger" onClick={handleSuspendSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Suspend Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantsManagement;
