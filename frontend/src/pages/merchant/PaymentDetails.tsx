import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const PaymentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer request');
  const [refundApiKey, setRefundApiKey] = useState('');

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid payment ID');
      setIsLoading(false);
      return;
    }

    const fetchPayment = async () => {
      try {
        const data = await apiFetch(`/api/v1/payments/${id}`);
        setPayment(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayment();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--brand-primary)' }} />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/dashboard/payments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            <ArrowLeft size={16} /> Back to Payments
          </Link>
        </div>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
          {error || 'Payment not found'}
        </div>
      </div>
    );
  }

  const isSuccess = payment.status === 'SUCCEEDED' || payment.status === 'COMPLETED';
  const isPending = payment.status === 'PENDING' || payment.status === 'CREATED';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard/payments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
          <ArrowLeft size={16} /> Back to Payments
        </Link>
      </div>

      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          Payment {id}
          <span className={`dashboard-status-badge dashboard-status-badge--${isSuccess ? 'success' : isPending ? 'pending' : 'failed'}`} style={{ fontSize: '0.85rem' }}>
            {payment.status}
          </span>
        </h1>
        {isSuccess && (
          <button 
            className="dashboard-primary-btn" 
            style={{ background: 'var(--surface-default)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            onClick={() => {
              setRefundAmount((Number(payment.amount) / 100).toFixed(2));
              setShowRefundModal(true);
            }}
          >
            Issue Refund
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Payment Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{payment.currency || 'ETB'} {(Number(payment.amount) / 100).toFixed(2)}</p>
                {payment.refunded_amount > 0 && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#ef4444' }}>
                    Refunded: {payment.currency || 'ETB'} {(Number(payment.refunded_amount) / 100).toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Payment Method</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                  <div style={{ width: '24px', height: '24px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {(payment.payment_method || 'U')[0].toUpperCase()}
                  </div>
                  {payment.payment_method || 'Unknown'}
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Customer / Reference</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{payment.customer_id || payment.merchant_reference || 'Not Available'}</p>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}></div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isSuccess ? '#10b981' : isPending ? '#fbbf24' : '#ef4444', marginTop: '4px' }}></div>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>Status: {payment.status}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{payment.updated_at ? new Date(payment.updated_at).toLocaleString() : (payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Raw Data</h3>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all', overflow: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(payment, null, 2)}
          </div>
        </div>
      </div>

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-base font-bold text-slate-900">Issue Refund</h2>
              <button 
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setShowRefundModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Refund Amount (ETB) <span className="text-rose-500">*</span></label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-sm"
                  value={refundAmount} 
                  onChange={e => setRefundAmount(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Reason <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-sm"
                  value={refundReason} 
                  onChange={e => setRefundReason(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Secret API Key (Authorization) <span className="text-rose-500">*</span></label>
                <input 
                  type="password"
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-sm font-mono"
                  value={refundApiKey} 
                  onChange={e => setRefundApiKey(e.target.value)} 
                  placeholder="sk_..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
                onClick={() => setShowRefundModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                onClick={async () => {
                  if (!refundAmount || !refundReason || !refundApiKey) {
                    toast.error("Please fill all required fields");
                    return;
                  }
                  try {
                    await apiFetch(`/api/v1/payments/${payment.payment_id || payment.paymentId || payment.id}/refund`, {
                      method: 'POST',
                      headers: { 
                        'Idempotency-Key': crypto.randomUUID(),
                        'X-API-Key': refundApiKey.trim()
                      },
                      body: JSON.stringify({ amount: Math.round(parseFloat(refundAmount) * 100), reason: refundReason })
                    });
                    toast.success('Refund initiated successfully');
                    setShowRefundModal(false);
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (err: any) {
                    toast.error('Failed to process refund: ' + err.message);
                  }
                }}
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
