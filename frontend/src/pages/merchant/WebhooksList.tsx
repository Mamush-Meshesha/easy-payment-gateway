import React, { useState, useEffect } from 'react';
import { Webhook, Edit3, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const WebhooksList: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['payment.success', 'payment.failed']);
  const [isActive, setIsActive] = useState(true);

  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const AVAILABLE_EVENTS = ['payment.success', 'payment.failed', 'refund.completed'];

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/v1/merchants/webhooks');
      setWebhooks(data.webhooks || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) {
      fetchWebhooks();
    }
  }, [merchantId]);

  const handleAddWebhook = async () => {
    if (!merchantId || !endpointUrl.trim() || selectedEvents.length === 0) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/v1/merchants/${merchantId}/webhooks`, {
        method: 'POST',
        body: JSON.stringify({ url: endpointUrl, events: selectedEvents, isActive })
      });
      setIsModalOpen(false);
      setEndpointUrl('');
      setSelectedEvents(['payment.success', 'payment.failed']);
      fetchWebhooks();
    } catch (err: any) {
      alert(err.message || 'Failed to add webhook');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">Webhooks</h1>
        <button className="dashboard-primary-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Endpoint
        </button>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Endpoint URL</th>
                <th>Subscribed Events</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={24} style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    {error}
                  </td>
                </tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No webhooks configured. Add one to receive real-time notifications.
                  </td>
                </tr>
              ) : (
                webhooks.map((hook) => (
                <tr key={hook.id}>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        <Webhook size={16} color="var(--primary)" />
                      </div>
                      {hook.url}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(hook.events || ['payment.success', 'payment.failed']).map((ev: string) => (
                        <span key={ev} style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${hook.isActive ? 'success' : 'failed'}`}>
                      {hook.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(hook.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Managed via API</span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Webhook Modal */}
      {isModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Add Webhook Endpoint</h2>
              <button className="dashboard-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Endpoint URL</label>
                <input 
                  type="url" 
                  className="dashboard-form-input" 
                  placeholder="https://your-domain.com/webhook" 
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                />
              </div>
              <div className="dashboard-form-group">
                <label>Events to send</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {AVAILABLE_EVENTS.map(ev => (
                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedEvents.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        disabled={isSubmitting}
                      /> {ev}
                    </label>
                  ))}
                </div>
              </div>
              <div className="dashboard-form-group" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={isSubmitting}
                  /> Activate endpoint immediately
                </label>
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
              <button 
                className="dashboard-primary-btn" 
                onClick={handleAddWebhook}
                disabled={isSubmitting || !endpointUrl.trim() || selectedEvents.length === 0}
              >
                {isSubmitting ? <Loader2 size={18} className="spin" /> : 'Add Endpoint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksList;
