import React, { useState } from 'react';
import { Eye, X, Loader2, RefreshCcw, CheckCircle2, XCircle, Clock, Copy } from 'lucide-react';
import { useGetWebhookDeliveriesQuery, useReplayWebhookDeliveryMutation } from '../../services/api/webhookApi';
import type { WebhookDelivery } from '../../services/api/webhookApi';
import './DashboardShared.css';

const WebhookDeliveryLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data, isLoading, isFetching, error, refetch } = useGetWebhookDeliveriesQuery({ page, limit });
  const [replayWebhook, { isLoading: isReplaying }] = useReplayWebhookDeliveryMutation();
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  const deliveries = data?.data || [];
  const totalPages = (data as any)?.totalPages || 1;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleReplay = async (id: string) => {
    try {
      await replayWebhook(id).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to replay webhook', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="dashboard-status-badge dashboard-status-badge--success">SUCCESS</span>;
      case 'FAILED':
        return <span className="dashboard-status-badge dashboard-status-badge--failed">FAILED</span>;
      case 'RETRYING':
      case 'PENDING':
        return <span className="dashboard-status-badge dashboard-status-badge--pending" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>{status}</span>;
      default:
        return <span className="dashboard-status-badge">{status}</span>;
    }
  };

  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return '#10b981';
    if (code >= 400) return '#ef4444';
    return 'var(--text-muted)';
  };

  const formatPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="dashboard-page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 className="dashboard-page-title" style={{ fontSize: '1.25rem' }}>Delivery Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Inspect real-time webhook delivery attempts and payloads.</p>
        </div>
        <button 
          className="dashboard-btn-secondary" 
          onClick={() => refetch()} 
          disabled={isFetching}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCcw size={16} className={isFetching ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Event Type</th>
                <th>Status</th>
                <th>HTTP Code</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto', color: 'var(--brand-primary)' }} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    Failed to load webhook deliveries.
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No webhook deliveries found.
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(delivery.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {delivery.eventType}
                      </span>
                    </td>
                    <td>{getStatusBadge(delivery.status)}</td>
                    <td style={{ color: getStatusCodeColor(delivery.responseStatusCode), fontWeight: 600 }}>
                      {delivery.responseStatusCode === 0 ? 'Timeout/Err' : delivery.responseStatusCode}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{delivery.attemptCount}</td>
                    <td style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => setSelectedDelivery(delivery)}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', padding: '0' }}
                      >
                        <Eye size={16} /> Inspect
                      </button>
                      <button 
                        onClick={() => handleReplay(delivery.id)}
                        disabled={isReplaying}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: isReplaying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', padding: '0', opacity: isReplaying ? 0.5 : 1 }}
                      >
                        <RefreshCcw size={16} /> Replay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className="dashboard-btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="dashboard-btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payload Inspector Modal */}
      {selectedDelivery && (
        <div className="dashboard-modal-overlay" style={{ zIndex: 100 }}>
          <div className="dashboard-modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="dashboard-modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 className="dashboard-modal-title">Inspect Delivery</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  ID: {selectedDelivery.id}
                </p>
              </div>
              <button className="dashboard-modal-close" onClick={() => setSelectedDelivery(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="dashboard-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Type</div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedDelivery.eventType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HTTP Status</div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem', color: getStatusCodeColor(selectedDelivery.responseStatusCode) }}>
                    {selectedDelivery.responseStatusCode === 0 ? 'Timeout' : selectedDelivery.responseStatusCode}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                  <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(selectedDelivery.status)}</div>
                </div>
              </div>

              {selectedDelivery.lastError && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>Error Message</h3>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {selectedDelivery.lastError}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Request Payload</h3>
                  <button 
                    onClick={() => handleCopy(formatPayload(selectedDelivery.payload))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                  >
                    <Copy size={14} /> Copy JSON
                  </button>
                </div>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid #333' }}>
                  <code>{formatPayload(selectedDelivery.payload)}</code>
                </pre>
              </div>

              {selectedDelivery.responseBody && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Response Body</h3>
                  <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid #333' }}>
                    <code>{selectedDelivery.responseBody}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDeliveryLogs;
