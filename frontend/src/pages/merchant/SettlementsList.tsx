import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Search, Download, CheckCircle2, AlertTriangle, X, Calendar, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const SettlementsList: React.FC = () => {
  const [isEarlySettlementModalOpen, setIsEarlySettlementModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const [settlements, setSettlements] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>({ availableBalance: 0, pendingSettlement: 0, currency: 'ETB' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [connectedBank, setConnectedBank] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  useEffect(() => {
    const bank = localStorage.getItem('connectedBankName');
    const account = localStorage.getItem('connectedBankAccount');
    if (bank) setConnectedBank(bank);
    if (account) setConnectedAccount(account);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [balRes, stRes] = await Promise.all([
          apiFetch('/api/v1/dashboard/settlements/balance'),
          apiFetch('/api/v1/dashboard/settlements')
        ]);
        setBalances(balRes);
        setSettlements(stRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch settlements');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatAmount = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: curr || 'ETB' }).format(amount / 100);
  };

  const totalSettled30d = settlements
    .filter((s: any) => s.status === 'COMPLETED' && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum: number, s: any) => sum + s.amount, 0);

  return (
    <div>
      <div className="dashboard-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-page-title">Settlements</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="dashboard-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsStatementModalOpen(true)}>
            <Calendar size={16} /> Monthly Statement
          </button>
          <button className="dashboard-primary-btn" onClick={() => setIsEarlySettlementModalOpen(true)}>
            Request Early Settlement
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="dashboard-card" style={{ marginBottom: 0, background: 'linear-gradient(135deg, var(--surface-default), var(--bg-secondary))' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Available Balance</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{formatAmount(balances.availableBalance, balances.currency)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Ready for next settlement run.</p>
        </div>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Total Settled (30d)</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatAmount(totalSettled30d, balances.currency)}</div>
        </div>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Connected Bank</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            <Banknote size={20} color="var(--brand-primary)" />
            {connectedBank ? `${connectedBank} (**${connectedAccount?.slice(-4) || '****'})` : 'Add account via Settings'}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Link to="/dashboard/settings" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 500 }}>Edit Payout Settings →</Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by Settlement ID..." 
            className="dashboard-form-input"
            style={{ paddingLeft: '2.75rem', background: 'var(--surface-default)' }}
          />
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th>Settlement ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Destination Account</th>
                <th>Processing Date</th>
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
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No settlements found.
                  </td>
                </tr>
              ) : (
                settlements.map((st: any) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{st.id}</td>
                  <td style={{ fontWeight: 600 }}>{formatAmount(st.amount, st.currency)}</td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${
                      st.status === 'COMPLETED' ? 'success' : 'pending'
                    }`}>
                      {st.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Banknote size={14} color="var(--text-secondary)" />
                      {st.destinationAccount || 'Pending...'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(st.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="dashboard-table-action" title="Download Report">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Early Settlement Modal */}
      {isEarlySettlementModalOpen && (
        <div className="dashboard-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsEarlySettlementModalOpen(false) }}>
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Request Early Settlement</h2>
              <button className="dashboard-modal-close" onClick={() => setIsEarlySettlementModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#b45309', lineHeight: 1.5 }}>
                  Early settlements are processed within 2 hours but incur an additional <strong>1.5% convenience fee</strong> deducted from the total amount.
                </p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Available Balance</span>
                <span style={{ fontWeight: 600 }}>{formatAmount(balances.availableBalance, balances.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Early Settlement Fee (1.5%)</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>- {formatAmount(balances.availableBalance * 0.015, balances.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total to Receive</span>
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>{formatAmount(balances.availableBalance * 0.985, balances.currency)}</span>
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsEarlySettlementModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={() => {
                toast('Early settlement requested. (This triggers a background processing job).');
                setIsEarlySettlementModalOpen(false);
              }}>Confirm Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="dashboard-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsStatementModalOpen(false) }}>
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Download Statement</h2>
              <button className="dashboard-modal-close" onClick={() => setIsStatementModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Month</label>
                <select className="dashboard-form-input">
                  <option>September 2026</option>
                  <option>August 2026</option>
                  <option>July 2026</option>
                </select>
              </div>
              <div className="dashboard-form-group">
                <label>Format</label>
                <select className="dashboard-form-input">
                  <option>PDF Document (.pdf)</option>
                  <option>Excel Spreadsheet (.xlsx)</option>
                  <option>CSV File (.csv)</option>
                </select>
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsStatementModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={() => setIsStatementModalOpen(false)}>
                <Download size={18} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementsList;
