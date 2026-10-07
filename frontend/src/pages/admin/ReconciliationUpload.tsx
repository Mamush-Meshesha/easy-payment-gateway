import React, { useState } from 'react';
import { UploadCloud, CheckCircle, FileText, Loader2, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useGetGlobalProvidersQuery } from '../../services/api/settingsApi';

const ReconciliationUpload: React.FC = () => {
  const { data: providers, isLoading: isProvidersLoading } = useGetGlobalProvidersQuery();
  const [providerId, setProviderId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="bg-[#1e1b4b] rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-xl relative overflow-hidden border border-indigo-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white flex items-center gap-2">
            <Activity className="text-pink-400" /> Ledger Reconciliation
          </h1>
          <p className="text-indigo-200 text-[13px] font-medium">Intelligent ledger reconciliation & exception management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 className="text-[14px] font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UploadCloud className="text-pink-600" size={18} /> Upload Statement
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Provider</label>
              <select className="w-full px-3 py-2 text-[13px] font-medium border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                <option value="">Select a provider...</option>
                {providers?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Statement File (CSV)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-pink-400 transition-colors">
                <FileText size={32} className="text-slate-400 mb-3" />
                <p className="text-[13px] font-bold text-slate-700">Drop CSV file here</p>
                <p className="text-[11px] text-slate-500 mt-1">Must match provider's standard schema</p>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-[13px] font-bold shadow-sm flex justify-center items-center gap-2 transition-colors">
              <ShieldAlert size={16} /> Run Reconciliation Engine
            </button>
          </div>
        </div>

        {/* Jobs Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-indigo-600" size={18} /> Recent Reconciliation Jobs
            </h2>
          </div>
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">Ledgers perfectly synced</h3>
            <p className="text-[13px]">Upload a new statement to detect exceptions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReconciliationUpload;
