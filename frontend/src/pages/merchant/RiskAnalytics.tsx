import React, { useEffect, useState } from 'react';
import { fetchAuth } from '../../lib/fetchAuth';
import { ShieldAlert, Activity, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface RiskDecision {
  id: string;
  paymentId: string;
  actionTaken: string;
  reason: string;
  mlScore: number;
  amount: number;
  currency: string;
  requires3ds: boolean;
  createdAt: string;
}

interface RiskStats {
  totalScored: number;
  averageScore: number;
  blockedCount: number;
  challengedCount: number;
  allowedCount: number;
  recentTransactions: RiskDecision[];
}

const RiskAnalytics: React.FC = () => {
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetchAuth('/api/v1/risk/analytics');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          // Fallback if API fails
          setStats({
            totalScored: 0,
            averageScore: 0.0,
            blockedCount: 0,
            challengedCount: 0,
            allowedCount: 0,
            recentTransactions: [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch risk analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <Activity size={36} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading risk models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-sm">
              <ShieldAlert size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 tracking-tight">
              Risk & 3DS Analytics
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-2 max-w-2xl">
            Monitor real-time machine learning risk scores and 3D Secure authentication challenges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Scored</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.totalScored.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity size={20} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp size={12} /> +12% this week
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Risk Score</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.averageScore.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <BarChart3 size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium">
            Moderate risk profile
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">3DS Challenged</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.challengedCount.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldAlert size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {(stats!.challengedCount / stats!.totalScored * 100).toFixed(1)}% step-up rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blocked (Fraud)</p>
              <h3 className="text-2xl font-bold text-red-600">{stats?.blockedCount.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {(stats!.blockedCount / stats!.totalScored * 100).toFixed(1)}% block rate
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-6">Risk Score Distribution</h3>
        <div className="flex items-end h-48 gap-2">
          {/* Simulated Histogram */}
          {[12, 34, 45, 60, 80, 100, 85, 45, 30, 20, 15, 10, 5, 2, 1, 0, 0, 2, 5, 12].map((height, i) => (
            <div key={i} className="flex-1 bg-slate-100 hover:bg-indigo-100 rounded-t-sm transition-colors relative group" style={{ height: `${height}%` }}>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded hidden group-hover:block whitespace-nowrap">
                Score: {(i * 0.05).toFixed(2)}
              </div>
              <div 
                className="absolute bottom-0 w-full rounded-t-sm transition-all" 
                style={{ 
                  height: '100%',
                  backgroundColor: i > 15 ? '#ef4444' : i > 10 ? '#f59e0b' : '#6366f1' 
                }} 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[11px] font-semibold text-slate-400">
          <span>Safe (0.00)</span>
          <span>Suspicious (0.50)</span>
          <span>High Fraud (1.00)</span>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Recent Scored Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ML Score</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">3DS Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Final Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentTransactions?.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-[12px] font-semibold text-indigo-600">{txn.paymentId.substring(0, 13)}...</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(txn.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 text-[13px]">{txn.currency} {(txn.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-bold ${txn.mlScore > 0.7 ? 'text-red-600' : txn.mlScore > 0.3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {txn.mlScore.toFixed(2)}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${txn.mlScore > 0.7 ? 'bg-red-500' : txn.mlScore > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${txn.mlScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {txn.requires3ds ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                        <ShieldAlert size={12} /> Step-Up
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                        Frictionless
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
                      txn.actionTaken === 'BLOCK' ? 'bg-red-100 text-red-700' : 
                      txn.actionTaken === 'CHALLENGE' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {txn.actionTaken}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalytics;
