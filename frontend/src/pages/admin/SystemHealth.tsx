import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Shield, RefreshCcw, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ServiceHealth {
  name: string;
  status: 'ok' | 'degraded' | 'down' | 'loading';
  latency?: number;
  timestamp?: string;
  icon: React.FC<any>;
}

const SystemHealth: React.FC = () => {
  const [adminHealth, setAdminHealth] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    setError(null);
    const startTime = performance.now();
    try {
      const data = await apiFetch('/api/v1/admin/system/health');
      const latency = Math.round(performance.now() - startTime);
      setAdminHealth({ ...data, latency });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const detailsArray = adminHealth?.detailsArray || [];

  const services: ServiceHealth[] = [
    { name: 'Admin Service (BFF)', status: error ? 'down' : (adminHealth ? 'ok' : 'loading'), latency: adminHealth?.latency, timestamp: adminHealth?.timestamp, icon: Server },
    ...detailsArray.map((item: any) => ({
      name: item.name,
      status: error ? 'down' : (item.status || 'loading'),
      latency: item.latency,
      icon: item.name.includes('Database') || item.name.includes('Redis') ? Database : Activity
    }))
  ];

  const overallStatus = error ? 'System Degraded' : 'All Systems Operational';
  const isHealthy = !error;

  return (
    <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="bg-[#1e1b4b] rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-xl relative overflow-hidden border border-indigo-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white flex items-center gap-2">
            <Zap className="text-pink-400" /> System Health
          </h1>
          <p className="text-indigo-200 text-[13px] font-medium">Real-time status of gateway microservices and infrastructure.</p>
        </div>
        <div className="relative z-10">
          <button onClick={fetchHealth} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] bg-pink-600 text-white hover:bg-pink-500 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border ${isHealthy ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'} p-8 flex items-center gap-6 mb-8`}>
        <div className="relative">
          {isHealthy ? <CheckCircle2 size={48} className="text-emerald-500 relative z-10" /> : <AlertCircle size={48} className="text-red-500 relative z-10" />}
          {isHealthy && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>}
        </div>
        <div>
          <h2 className={`text-2xl font-black mb-1 ${isHealthy ? 'text-emerald-900' : 'text-red-900'}`}>{overallStatus}</h2>
          <div className={`flex items-center gap-2 text-[12px] font-bold ${isHealthy ? 'text-emerald-700' : 'text-red-700'}`}>
            <Clock size={14} /> Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((svc, idx) => {
          const Icon = svc.icon;
          const isOk = svc.status === 'ok';
          const isDown = svc.status === 'down';
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOk ? 'bg-emerald-50 text-emerald-600' : isDown ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-1">{svc.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOk ? 'bg-emerald-100 text-emerald-700' : isDown ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {svc.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latency</div>
                  <div className="text-[15px] font-black text-slate-900 font-mono">{svc.latency ? `${svc.latency}ms` : '--'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uptime</div>
                  <div className="text-[15px] font-black text-slate-900 font-mono">{isOk ? '99.99%' : '--'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Infrastructure Management */}
      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight mb-6 text-slate-900 flex items-center gap-2">
          <Server className="text-indigo-500" /> Infrastructure Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Redis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-red-400 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Redis Cache</h3>
                <p className="text-xs text-slate-500">Idempotency & Configs</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button 
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => {
                  toast.success(
                    'Active Cached Keys (Mocked):\n\n' +
                    '1. idem:payment:01a11277... (TTL: 23h)\n' +
                    '2. config:merchant:f17e21f0... (TTL: 55m)\n' +
                    '3. rate_limit:ca0724b3... (TTL: 1m)\n\n' +
                    'Total Keys: 5\nMemory Usage: 1.2MB',
                    { duration: 5000 }
                  );
                }}
              >
                View Keys
              </button>
              <button 
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => toast.success('Redis cache flushed successfully (Mocked)')}
              >
                Flush
              </button>
            </div>
          </div>

          {/* Terraform */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-purple-400 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Server size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Terraform (AWS)</h3>
                <p className="text-xs text-slate-500">Production IaC</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button 
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => toast('Triggering Terraform Apply via CI/CD pipeline... (Mocked)')}
              >
                Trigger Deploy
              </button>
            </div>
          </div>

          {/* Kafka */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-orange-400 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Apache Kafka</h3>
                <p className="text-xs text-slate-500">Event Bus</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button 
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => toast('Kafka Topic: payment.events\nPartitions: 3\nReplicas: 1\nStatus: Healthy')}
              >
                View Topics
              </button>
            </div>
          </div>

          {/* Dozzle / Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Log Streamer</h3>
                <p className="text-xs text-slate-500">Dozzle UI</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <a 
                href="http://192.168.122.127:8765" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-center"
              >
                Open Dozzle
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemHealth;
