import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, Eye, Code2, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const TransactionsList: React.FC = () => {
  const [isRawJsonModalOpen, setIsRawJsonModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch('/api/v1/dashboard/transactions');
        setTransactions(data.entries || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const formatAmount = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: curr || 'ETB' }).format(amount / 100);
  };

  const rawJsonData = {
    provider: "N/A",
    endpoint: "N/A",
    statusCode: 200,
    timestamp: new Date().toISOString(),
    response: {
      "message": "Raw JSON view not available for ledger entries"
    }
  };

  const handleViewRaw = (tx: any) => {
    setSelectedTx(tx);
    setIsRawJsonModalOpen(true);
  };

  return (
    <div>
      <div className="dashboard-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-page-title">Ledger & Transactions</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="dashboard-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by Transaction ID or Ref..." 
            className="dashboard-form-input"
            style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}
          />
        </div>
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select className="dashboard-form-input" style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}>
            <option>All Types</option>
            <option>Payment</option>
            <option>Refund</option>
            <option>Fee</option>
            <option>Settlement</option>
          </select>
        </div>
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select className="dashboard-form-input" style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}>
            <option>All Methods</option>
            <option>Telebirr</option>
            <option>CBE Birr</option>
            <option>M-Pesa</option>
          </select>
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th>Txn ID</th>
                <th>Type</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Provider Ref</th>
                <th>Timestamp</th>
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
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                <tr key={tx.journalEntryId}>
                  <td style={{ fontWeight: 500, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{tx.providerTransactionId || tx.referenceId || tx.journalEntryId}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {tx.referenceType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>{formatAmount(tx.amount, tx.currency)}</td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--success`}>
                      SETTLED
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{tx.providerId || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(tx.effectiveAt).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="dashboard-table-action" title="View Transaction Data">
                        <Eye size={16} />
                      </button>
                      <button 
                        className="dashboard-table-action" 
                        style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }} 
                        title="View Raw Provider JSON"
                        onClick={() => handleViewRaw(tx)}
                      >
                        <Code2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw JSON Modal */}
      {isRawJsonModalOpen && selectedTx && (
        <div className="dashboard-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsRawJsonModalOpen(false) }}>
          <div className="dashboard-modal" style={{ maxWidth: '600px' }}>
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Provider Response Payload</h2>
              <button className="dashboard-modal-close" onClick={() => setIsRawJsonModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body" style={{ background: '#0f172a', padding: '0' }}>
              <pre style={{ 
                margin: 0, 
                padding: '1.5rem', 
                color: '#38bdf8', 
                fontFamily: 'monospace', 
                fontSize: '0.85rem',
                overflowX: 'auto' 
              }}>
                {JSON.stringify(rawJsonData, null, 2)}
              </pre>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsRawJsonModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
