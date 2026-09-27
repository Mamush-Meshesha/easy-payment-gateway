import React from 'react';
import { Server, Users, Activity, ShieldAlert } from 'lucide-react';
import '../merchant/DashboardOverview.css';

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="overview-page-title">System Overview</h1>
      
      <div className="overview-stats-grid">
        <div className="overview-stat-card">
          <div className="overview-stat-header">
            <h3 className="overview-stat-title">Active Merchants</h3>
            <div className="overview-stat-icon overview-stat-icon--blue"><Users size={18} /></div>
          </div>
          <div className="overview-stat-value">2,450</div>
        </div>
        <div className="overview-stat-card">
          <div className="overview-stat-header">
            <h3 className="overview-stat-title">System Uptime</h3>
            <div className="overview-stat-icon overview-stat-icon--emerald"><Server size={18} /></div>
          </div>
          <div className="overview-stat-value">99.99%</div>
        </div>
        <div className="overview-stat-card">
          <div className="overview-stat-header">
            <h3 className="overview-stat-title">Txn / Sec (TPS)</h3>
            <div className="overview-stat-icon overview-stat-icon--purple"><Activity size={18} /></div>
          </div>
          <div className="overview-stat-value">42.5</div>
        </div>
        <div className="overview-stat-card">
          <div className="overview-stat-header">
            <h3 className="overview-stat-title">Fraud Alerts</h3>
            <div className="overview-stat-icon overview-stat-icon--amber" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}><ShieldAlert size={18} /></div>
          </div>
          <div className="overview-stat-value">12</div>
        </div>
      </div>
      
      <div className="overview-activity-section">
        <h3 className="overview-activity-title" style={{ marginBottom: '1.5rem' }}>Platform Activity Stream</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Live view of system events across all microservices and tenant partitions.</p>
        <div className="table-wrapper">
          <table className="overview-activity-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Tenant ID</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 500 }}>Provider Timeout (Telebirr)</td>
                <td>SYSTEM</td>
                <td><span className="overview-status-badge overview-status-badge--pending">Warning</span></td>
                <td style={{ color: 'var(--text-muted)' }}>Just now</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>High Velocity Trigger</td>
                <td>MERCH_9921</td>
                <td><span className="overview-status-badge overview-status-badge--failed">Blocked</span></td>
                <td style={{ color: 'var(--text-muted)' }}>2 mins ago</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>Batch Settlement Run</td>
                <td>SYSTEM</td>
                <td><span className="overview-status-badge overview-status-badge--success">Success</span></td>
                <td style={{ color: 'var(--text-muted)' }}>1 hr ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
