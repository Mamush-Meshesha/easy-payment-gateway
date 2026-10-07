import React from 'react';
import { Server, Users, Activity, ShieldAlert, ArrowUpRight, ArrowDownRight, Database, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: '00:00', tps: 12 },
  { time: '04:00', tps: 18 },
  { time: '08:00', tps: 85 },
  { time: '12:00', tps: 140 },
  { time: '16:00', tps: 110 },
  { time: '20:00', tps: 45 },
  { time: '24:00', tps: 20 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* PREMIUM HEADER BANNER */}
      <div className="bg-[#1e1b4b] rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-xl relative overflow-hidden border border-indigo-900">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-lg font-bold tracking-tight mb-2 text-white">System Overview</h1>
          <p className="text-indigo-200 text-[13px] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            All 6 microservices operational. Multi-region routing active.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-[13px] bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors border border-indigo-800 shadow-sm">
            <Download size={16} /> Audit Log
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          title="Active Merchants" 
          value="2,450" 
          trend="up" 
          trendValue="12.5%" 
          icon={<Users size={18} />} 
          color="blue" 
        />
        <StatCard 
          title="System Uptime" 
          value="99.99%" 
          trend="neutral" 
          trendValue="0.0%" 
          icon={<Server size={18} />} 
          color="emerald" 
        />
        <StatCard 
          title="Peak TPS" 
          value="142.5" 
          trend="up" 
          trendValue="18.1%" 
          icon={<Activity size={18} />} 
          color="purple" 
        />
        <StatCard 
          title="Fraud Alerts" 
          value="12" 
          trend="down" 
          trendValue="4.0%" 
          icon={<ShieldAlert size={18} />} 
          color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN CHART AREA */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-1">Global Transaction Throughput</h3>
                <p className="text-[12px] text-slate-500 font-medium">Transactions per second (TPS) across all regions</p>
              </div>
              <select className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 outline-none hover:border-slate-300">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#db2777" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="tps" stroke="#db2777" strokeWidth={3} fillOpacity={1} fill="url(#colorTps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PLATFORM ACTIVITY STREAM */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[15px] font-bold text-slate-900">Platform Activity Stream</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant ID</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                          <Activity size={14} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-800">Provider Timeout (Telebirr)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">SYSTEM</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Warning</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-slate-500 font-medium">Just now</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                          <ShieldAlert size={14} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-800">High Velocity Trigger</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">MERCH_9921</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">Blocked</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-slate-500 font-medium">2 mins ago</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Database size={14} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-800">Batch Settlement Run</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">SYSTEM</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Success</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-slate-500 font-medium">1 hr ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMNS */}
        <div className="space-y-8">
          
          {/* SYSTEM HEALTH WIDGET */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-20 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <Server size={20} className="text-pink-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">Cluster Health</h3>
                <p className="text-[11px] text-slate-400 font-medium">All nodes active</p>
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-300 font-medium">API Gateway</span>
                <span className="text-[12px] font-bold text-emerald-400">99.99%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-300 font-medium">PostgreSQL DB</span>
                <span className="text-[12px] font-bold text-emerald-400">99.95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-300 font-medium">Redis Cache</span>
                <span className="text-[12px] font-bold text-emerald-400">100%</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-[12px] font-bold text-center transition-colors">
              View Node Details &rarr;
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, trendValue, icon, color }: { title: string, value: string, trend: 'up' | 'down' | 'neutral', trendValue: string, icon: React.ReactNode, color: string }) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400';
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_15px_-10px_rgba(0,0,0,0.05)] p-5 hover:shadow-[0_8px_25px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-lg font-black text-slate-900 tracking-tight mb-2">{value}</div>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center text-[11px] font-bold ${trendColor}`}>
          {trend === 'up' && <ArrowUpRight size={12} className="mr-0.5" />}
          {trend === 'down' && <ArrowDownRight size={12} className="mr-0.5" />}
          {trendValue}
        </span>
        <span className="text-[11px] text-slate-400 font-medium tracking-wide">vs last month</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
