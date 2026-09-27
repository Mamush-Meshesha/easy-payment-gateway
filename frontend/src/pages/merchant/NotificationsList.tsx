import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardShared.css';

const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiFetch('/api/v1/dashboard/notifications?limit=50');
        setNotifications(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">Notifications</h1>
        <button className="dashboard-primary-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'none' }}>
          <CheckCircle2 size={18} /> Mark all as read
        </button>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 size={24} style={{ margin: '0 auto', color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <Bell size={32} />
            </div>
            <h3 className="dashboard-empty-title">You're all caught up</h3>
            <p className="dashboard-empty-desc">You don't have any new notifications at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                style={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  gap: '1rem',
                  background: 'transparent'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: notif.type === 'SMS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                  color: notif.type === 'SMS' ? '#10b981' : '#3b82f6',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{notif.subject || 'System Notification'}</h4>
                  <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Message sent to {notif.recipient} ({notif.status}) {notif.error_details && ` - ${notif.error_details}`}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(notif.created_at || notif.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
