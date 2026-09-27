import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Activity, CreditCard, Clock, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './DashboardOverview.css';

const DashboardOverview: React.FC = () => {
  const [balances, setBalances] = useState<any>({ availableBalance: 0, pendingSettlement: 0, currency: 'ETB' });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, txnRes] = await Promise.all([
          apiFetch('/api/v1/dashboard/settlements/balance'),
          apiFetch('/api/v1/dashboard/transactions?limit=5')
        ]);
        setBalances(balRes);
        setRecentTransactions(txnRes.entries || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatAmount = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: curr || 'ETB' }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={48} className="spin" style={{ color: 'var(--brand-primary)' }} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="overview-page-title">Dashboard Overview</h1>
      
      <div className="overview-stats-grid">
        <StatCard 
          title="Total Volume" 
          value="ETB 0.00" 
          subtitle="vs last 30 days" 
          trend="neutral" 
          trendValue="0.0%" 
          icon={<DollarSign size={18} />} 
          iconColor="emerald" 
        />
        <StatCard 
          title="Successful Payments" 
          value="0" 
          subtitle="vs last 30 days" 
          trend="neutral" 
          trendValue="0%" 
          icon={<Activity size={18} />} 
          iconColor="blue" 
        />
        <StatCard 
          title="Available Balance" 
          value={formatAmount(balances.availableBalance, balances.currency)} 
          subtitle="Ready for settlement" 
          trend="neutral" 
          trendValue="0.0%" 
          icon={<CreditCard size={18} />} 
          iconColor="purple" 
        />
        <StatCard 
          title="Pending Settlement" 
          value={formatAmount(balances.pendingSettlement, balances.currency)} 
          subtitle="Processing" 
          trend="neutral" 
          trendValue="0.0%" 
          icon={<Clock size={18} />} 
          iconColor="amber" 
        />
      </div>

      <div className="overview-activity-section">
        <div className="overview-activity-header">
          <h3 className="overview-activity-title">Recent Activity</h3>
          <Link to="/dashboard/transactions" className="overview-activity-btn">View All</Link>
        </div>
        
        <div className="table-wrapper">
          <table className="overview-activity-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No recent activity
                  </td>
                </tr>
              ) : (
                recentTransactions.map((txn: any) => (
                <tr key={txn.journalEntryId}>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{txn.providerTransactionId || txn.referenceId}</td>
                  <td>{txn.referenceType}</td>
                  <td style={{ fontWeight: 600 }}>{formatAmount(txn.amount, txn.currency)}</td>
                  <td>
                    <span className={`overview-status-badge overview-status-badge--success`}>
                      SETTLED
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(txn.effectiveAt).toLocaleString()}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: React.ReactNode;
  iconColor: 'emerald' | 'blue' | 'purple' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, trendValue, icon, iconColor }) => (
  <div className="overview-stat-card">
    <div className="overview-stat-header">
      <h3 className="overview-stat-title">{title}</h3>
      <div className={`overview-stat-icon overview-stat-icon--${iconColor}`}>
        {icon}
      </div>
    </div>
    <div className="overview-stat-value">{value}</div>
    <div className="overview-stat-footer">
      <span className={`overview-stat-trend overview-stat-trend--${trend}`}>
        {trend === 'up' && <TrendingUp size={14} />}
        {trend === 'down' && <TrendingDown size={14} />}
        {trendValue}
      </span>
      <span>{subtitle}</span>
    </div>
  </div>
);

export default DashboardOverview;
