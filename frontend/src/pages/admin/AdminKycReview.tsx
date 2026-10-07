import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ShieldCheck, XCircle, AlertCircle, FileText } from 'lucide-react';

interface KycDocument { id: string; documentType: string; s3Uri: string; verificationStatus: string; rejectionReason?: string; }
interface KycProfile { id: string; status: string; businessName?: string; registrationNo?: string; taxId?: string; updatedAt: string; documents: KycDocument[]; merchant: { legalName: string; status?: string; }; }

const AdminKycReview: React.FC = () => {
  const [profiles, setProfiles] = useState<KycProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('UNDER_REVIEW');
  const [selectedProfile, setSelectedProfile] = useState<KycProfile | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/v1/admin/kyc${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProfiles((await res.json()).data);
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return (
    <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans h-[calc(100vh-80px)] flex flex-col">
      <div className="bg-[#1e1b4b] rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-xl relative overflow-hidden shrink-0 border border-indigo-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white flex items-center gap-2">
            <ShieldCheck className="text-pink-400" /> KYC Compliance Review
          </h1>
          <p className="text-indigo-200 text-[13px] font-medium">Review pending submissions and verify merchant identities.</p>
        </div>
        <div className="relative z-10 flex gap-2">
          {['UNDER_REVIEW', 'VERIFIED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-colors border ${statusFilter === f ? 'bg-pink-600 text-white border-pink-500' : 'bg-indigo-950/50 text-indigo-300 border-indigo-800 hover:bg-indigo-900 hover:text-white'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left List */}
        <div className="w-1/3 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search merchants..." className="bg-transparent text-[13px] outline-none flex-1 font-medium placeholder-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? <div className="p-4 text-center text-slate-500 text-[13px] font-medium">Loading...</div> : profiles.map(p => (
              <div key={p.id} onClick={() => setSelectedProfile(p)} className={`p-4 rounded-xl cursor-pointer transition-colors mb-1 ${selectedProfile?.id === p.id ? 'bg-pink-50 border border-pink-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-[13px] font-bold ${selectedProfile?.id === p.id ? 'text-pink-700' : 'text-slate-800'}`}>{p.merchant.legalName}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' : p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{p.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                  <span>{p.documents.length} Docs</span>
                  <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm relative">
          {selectedProfile ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Business Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Legal Name</span><span className="text-[13px] font-bold text-slate-800">{selectedProfile.merchant.legalName}</span></div>
                  <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tax ID</span><span className="text-[13px] font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedProfile.taxId || 'N/A'}</span></div>
                  <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Registration No</span><span className="text-[13px] font-medium text-slate-800">{selectedProfile.registrationNo || 'N/A'}</span></div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Identity Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProfile.documents.map(doc => (
                    <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex gap-3 bg-slate-50">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><FileText size={20} /></div>
                      <div className="flex-1">
                        <div className="text-[13px] font-bold text-slate-900 mb-1">{doc.documentType.replace('_', ' ')}</div>
                        <a href={doc.s3Uri} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline">View Document &rarr;</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedProfile.status === 'UNDER_REVIEW' && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                  <button className="px-6 py-2 rounded-xl text-[13px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200">Reject</button>
                  <button className="px-6 py-2 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">Approve & Activate</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-4 text-slate-200" />
              <p className="text-[14px] font-bold text-slate-600">Select a KYC profile</p>
              <p className="text-[12px]">Choose a merchant from the list to review their documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminKycReview;
