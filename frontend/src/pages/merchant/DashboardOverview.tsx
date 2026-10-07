import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Activity, CreditCard, Clock, Loader2, ArrowUpRight, ArrowDownRight, ShieldCheck, Zap, Plus, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../../lib/api';

// Mock chart data for premium look
const chartData = [
  { name: 'Mon', revenue: 4000, volume: 2400 },
  { name: 'Tue', revenue: 3000, volume: 1398 },
  { name: 'Wed', revenue: 6000, volume: 4800 },
  { name: 'Thu', revenue: 4500, volume: 3908 },
  { name: 'Fri', revenue: 8000, volume: 6800 },
  { name: 'Sat', revenue: 7500, volume: 5800 },
  { name: 'Sun', revenue: 10000, volume: 8300 },
];

const DashboardOverview: React.FC = () => {
  const [balances, setBalances] = useState<any>({ availableBalance: 0, pendingSettlement: 0, currency: 'ETB' });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, txnRes] = await Promise.all([
          apiFetch('/api/v1/dashboard/settlements/balance'),
          apiFetch('/api/v1/dashboard/transactions?limit=6')
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
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: curr || 'ETB', minimumFractionDigits: 0 }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-4 sm:p-8 w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans bg-slate-50">
      
      {/* PREMIUM HEADER BANNER - Light Theme / Brand Color */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-overlay filter blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">{greeting}, Merchant</h1>
          <p className="text-blue-100 text-[14px] font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></span>
            All systems operational. Processing payments smoothly.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/20 shadow-sm text-white">
            <Download size={16} /> Export
          </button>
          <Link to="/dashboard/payments" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-lg">
            <Plus size={16} /> Create Payment
          </Link>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Volume" 
          value="ETB 145,200" 
          trend="up" 
          trendValue="12.5%" 
          icon={<DollarSign size={20} />} 
          color="emerald" 
        />
        <StatCard 
          title="Active Subscriptions" 
          value="1,248" 
          trend="up" 
          trendValue="4.2%" 
          icon={<Activity size={20} />} 
          color="blue" 
        />
        <StatCard 
          title="Available Balance" 
          value={formatAmount(balances.availableBalance, balances.currency)} 
          trend="up" 
          trendValue="8.1%" 
          icon={<CreditCard size={20} />} 
          color="indigo" 
        />
        <StatCard 
          title="Pending Settlement" 
          value={formatAmount(balances.pendingSettlement, balances.currency)} 
          trend="neutral" 
          trendValue="0.0%" 
          icon={<Clock size={20} />} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* MAIN CHART AREA - TAKES 2 COLUMNS */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1 tracking-tight">Gross Revenue</h3>
                <p className="text-[13px] text-slate-500 font-medium">Last 7 days performance</p>
              </div>
              <select className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 outline-none hover:border-slate-300 bg-slate-50 cursor-pointer shadow-sm">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Year to Date</option>
              </select>
            </div>
            <div className="h-[320px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 700, padding: '12px 16px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT TRANSACTIONS (SLEEK) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-transparent">
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Recent Transactions</h3>
              <Link to="/dashboard/transactions" className="text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg">View All &rarr;</Link>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Transaction</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-slate-400 text-[14px]">No recent transactions</td>
                    </tr>
                  ) : (
                    recentTransactions.map((txn: any) => (
                      <tr key={txn.journalEntryId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-4 rounded-l-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100/50 group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                              <DollarSign size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                              <div className="text-[14px] font-bold text-slate-800 font-mono">{txn.providerTransactionId || txn.referenceId?.substring(0, 8)}</div>
                              <div className="text-[12px] text-slate-500 font-medium capitalize mt-0.5">{txn.referenceType?.toLowerCase() || 'Payment'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-black text-slate-800 text-[14px]">
                          {formatAmount(txn.amount, txn.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                            Settled
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-slate-500 font-medium rounded-r-2xl">
                          {new Date(txn.effectiveAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMNS */}
        <div className="space-y-8">
          
          {/* RISK RADAR CARD - Redeisgned Light Theme version */}
          <div className="bg-white rounded-3xl border border-indigo-100 shadow-[0_8px_30px_rgb(99,102,241,0.06)] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[60px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                <ShieldCheck size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Fraud Radar</h3>
                <p className="text-[13px] text-slate-500 font-medium">Active Protection</p>
              </div>
            </div>
            
            <div className="space-y-5 relative z-10 mb-8">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[13px] text-slate-600 font-bold">Blocked Attempts</span>
                <span className="text-[13px] font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">24</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[13px] text-slate-600 font-bold">Risk Score</span>
                <span className="text-[13px] font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Excellent
                </span>
              </div>
            </div>
            <Link to="/dashboard/radar" className="block w-full py-3.5 rounded-xl bg-white hover:bg-indigo-50 border-2 border-indigo-100 text-indigo-700 text-[13px] font-bold text-center transition-all shadow-sm hover:shadow-md relative z-10">
              View Rules &rarr;
            </Link>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <h3 className="text-[16px] font-bold text-slate-900 mb-6 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionBtn to="/dashboard/payments" icon={<CreditCard size={20} />} label="Charge" />
              <ActionBtn to="/dashboard/subscriptions" icon={<Activity size={20} />} label="Plan" />
              <ActionBtn to="/dashboard/developers" icon={<Zap size={20} />} label="API" />
              <ActionBtn to="/dashboard/kyc" icon={<ShieldCheck size={20} />} label="Verify" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const ActionBtn = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <Link to={to} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all group duration-300">
    <div className="text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all mb-2 duration-300">
      {icon}
    </div>
    <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700 tracking-wide uppercase">{label}</span>
  </Link>
)

const StatCard = ({ title, value, trend, trendValue, icon, color }: { title: string, value: string, trend: 'up' | 'down' | 'neutral', trendValue: string, icon: React.ReactNode, color: string }) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400';
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 tracking-tight mb-2">{value}</div>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center text-[12px] font-bold ${trendColor}`}>
          {trend === 'up' && <ArrowUpRight size={14} className="mr-0.5" />}
          {trend === 'down' && <ArrowDownRight size={14} className="mr-0.5" />}
          {trendValue}
        </span>
        <span className="text-[12px] text-slate-400 font-medium tracking-wide">vs last month</span>
      </div>
    </div>
  );
};

export default DashboardOverview;
