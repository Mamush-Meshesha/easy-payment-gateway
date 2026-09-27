import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const RefundsList: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await apiFetch('/api/v1/dashboard/refunds?limit=50');
        setRefunds(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch refunds');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">Refunds</h1>
        <button className="dashboard-primary-btn">
          <Plus size={18} /> Issue Refund
        </button>
      </div>

      <div className="dashboard-card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 size={24} style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : refunds.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <ArrowLeftRight size={32} />
            </div>
            <h3 className="dashboard-empty-title">No refunds</h3>
            <p className="dashboard-empty-desc">Refunds issued to your customers will be listed here.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Refund ID</th>
                  <th>Payment Ref</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td style={{ fontWeight: 500 }}>{refund.id}</td>
                    <td>{refund.payment_id || refund.paymentId}</td>
                    <td style={{ fontWeight: 600 }}>{refund.currency} {(parseInt(refund.amount) / 100).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(refund.created_at || refund.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`dashboard-status-badge dashboard-status-badge--${refund.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                        {refund.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{refund.reason || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundsList;
