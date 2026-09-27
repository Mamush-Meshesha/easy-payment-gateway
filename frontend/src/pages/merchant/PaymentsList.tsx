import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, ArrowLeftRight, X, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiFetchBlob } from '../../lib/api';
import './DashboardShared.css';

const PaymentsList: React.FC = () => {
  const navigate = useNavigate();
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await apiFetch('/api/v1/dashboard/payments');
        // gRPC response usually has { payments: [...] }
        setPayments(response.payments || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPayments();
  }, []);

  const handleRefundClick = (e: React.MouseEvent, payment: any) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setIsRefundModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiFetchBlob('/api/v1/reporting/payments/export.csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="dashboard-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-page-title">Payments</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="dashboard-btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            className="dashboard-primary-btn" 
            onClick={() => setIsCreatePaymentModalOpen(true)}
          >
            Create Payment Link
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by Payment ID or Customer Email..." 
            className="dashboard-form-input"
            style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}
          />
        </div>
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select className="dashboard-form-input" style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}>
            <option>All Statuses</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
          </select>
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={24} className="dashboard-spinner" style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    {error}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                <tr 
                  key={payment.payment_id || payment.paymentId || payment.id} 
                  onClick={() => navigate(`/dashboard/payments/${payment.payment_id || payment.paymentId || payment.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 500, color: 'var(--brand-primary)' }}>{payment.paymentId || payment.id}</td>
                  <td style={{ fontWeight: 600 }}>{payment.currency || 'ETB'} {(Number(payment.amount) / 100).toFixed(2)}</td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${
                      payment.status === 'SUCCEEDED' || payment.status === 'COMPLETED' ? 'success' : 
                      payment.status === 'PENDING' ? 'pending' : 'failed'
                    }`}>
                      {payment.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>{payment.customerId || payment.customer || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={14} color="var(--text-secondary)" />
                      </div>
                      {payment.provider || payment.method || 'Unknown'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : (payment.date || 'N/A')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="dashboard-table-action" 
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/payments/${payment.payment_id || payment.paymentId || payment.id}`); }}
                      >
                        <Eye size={16} />
                      </button>
                      {(payment.status === 'SUCCEEDED' || payment.status === 'COMPLETED') && (
                        <button 
                          className="dashboard-table-action" 
                          style={{ color: '#d97706', background: '#fef3c7', borderColor: '#fde68a' }} 
                          title="Initiate Refund"
                          onClick={(e) => handleRefundClick(e, payment)}
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {isRefundModalOpen && selectedPayment && (
        <RefundModal 
          payment={selectedPayment} 
          onClose={() => setIsRefundModalOpen(false)} 
          onSuccess={() => {
            setIsRefundModalOpen(false);
            // Optionally reload payments list here by refreshing state
            window.location.reload(); 
          }} 
        />
      )}
      {isCreatePaymentModalOpen && (
        <CreatePaymentModal 
          onClose={() => setIsCreatePaymentModalOpen(false)}
          onSuccess={() => {
            setIsCreatePaymentModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

const RefundModal: React.FC<{ payment: any, onClose: () => void, onSuccess: () => void }> = ({ payment, onClose, onSuccess }) => {
  const maxAmount = (Number(payment.amount) - Number(payment.refundedAmount || 0)) / 100;
  const [amount, setAmount] = useState<string>(maxAmount.toFixed(2));
  const [reason, setReason] = useState('Customer requested refund');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleRefundSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > maxAmount) {
      setError('Invalid refund amount');
      return;
    }
    
    if (!apiKey.trim()) {
      setError('API Key is required to process refunds');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/payments/${payment.payment_id || payment.paymentId || payment.id}/refund`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
          'X-API-Key': apiKey.trim()
        },
        body: JSON.stringify({ 
          amount: Math.round(parsedAmount * 100), 
          reason 
        })
      });
      alert('Refund initiated successfully');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dashboard-modal">
        <div className="dashboard-modal-header">
          <h2 className="dashboard-modal-title">Initiate Refund</h2>
          <button className="dashboard-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dashboard-modal-body">
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment ID</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{payment.payment_id || payment.paymentId || payment.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Available to Refund</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{payment.currency || 'ETB'} {maxAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <div className="dashboard-form-group">
            <label>Refund Amount ({payment.currency || 'ETB'})</label>
            <input 
              type="number" 
              step="0.01"
              max={maxAmount}
              className="dashboard-form-input" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Leave as is for a full refund, or enter a smaller amount for a partial refund.
            </div>
          </div>
          <div className="dashboard-form-group">
            <label>Reason for Refund</label>
            <select 
              className="dashboard-form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            >
              <option>Customer requested refund</option>
              <option>Fraudulent transaction</option>
              <option>Item out of stock</option>
              <option>Other</option>
            </select>
          </div>
          <div className="dashboard-form-group">
            <label>API Key <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="password" 
              className="dashboard-form-input" 
              placeholder="Required to authorize refund"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isSubmitting}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Your secret API Key is required to authorize refunds via the public API.
            </p>
          </div>
        </div>
        <div className="dashboard-modal-footer">
          <button className="dashboard-btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="dashboard-btn-danger" onClick={handleRefundSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Submit Refund Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreatePaymentModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState('0.00');
  const [currency, setCurrency] = useState('ETB');
  const [customerEmail, setCustomerEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Invalid amount');
      return;
    }
    if (!apiKey.trim()) {
      setError('API Key is required to create a payment link');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Direct call to gateway, requires API key and Idempotency-Key
      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          merchantReference: `LINK-${Date.now()}`,
          amount: Math.round(parsedAmount * 100),
          currency,
          customerId: customerEmail,
          paymentMethod: 'TELEBIRR',
          providerId: 'be9d2613-eab7-4164-8b23-00a3f1ae494b', // Telebirr Provider ID
          returnUrl: `${window.location.origin}/dashboard/payments`
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to create payment');
      }

      const data = await response.json();
      setPaymentLink(`${window.location.origin}/checkout/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    alert('Copied to clipboard');
  };

  return (
    <div className="dashboard-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dashboard-modal">
        <div className="dashboard-modal-header">
          <h2 className="dashboard-modal-title">Create Payment Link</h2>
          <button className="dashboard-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dashboard-modal-body">
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {paymentLink ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h3 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Payment Link Generated!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Share this link with your customer.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="dashboard-form-input" value={paymentLink} readOnly />
                <button className="dashboard-primary-btn" onClick={copyToClipboard}>Copy</button>
              </div>
            </div>
          ) : (
            <>
              <div className="dashboard-form-group">
                <label>Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="dashboard-form-input" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="dashboard-form-group">
                <label>Currency</label>
                <select 
                  className="dashboard-form-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="ETB">ETB - Ethiopian Birr</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
              <div className="dashboard-form-group">
                <label>Customer Email (Optional)</label>
                <input 
                  type="email" 
                  className="dashboard-form-input" 
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="dashboard-form-group">
                <label>API Key (Required)</label>
                <input 
                  type="password" 
                  className="dashboard-form-input" 
                  placeholder="Enter your active API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSubmitting}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  A valid API key is required to authorize the creation of a payment link.
                </div>
              </div>
            </>
          )}
        </div>
        <div className="dashboard-modal-footer">
          {paymentLink ? (
            <button className="dashboard-primary-btn" onClick={onSuccess}>Done</button>
          ) : (
            <>
              <button className="dashboard-btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={handleSubmit} disabled={isSubmitting || !amount || !apiKey}>
                {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Generate Link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;
