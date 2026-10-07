import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { fetchAuth } from '../../lib/fetchAuth';
import { RefreshCcw, AlertOctagon, Scale, FileText, CheckCircle2, ShieldAlert, X, Activity, MoreHorizontal, FileSearch, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface Dispute {
  id: string;
  paymentId: string;
  reason: string;
  status: 'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST' | 'ACCEPTED';
  amount: number;
  currency: string;
  dueBy: string;
  createdAt: string;
}

const DisputesList: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [showEvidenceModal, setShowEvidenceModal] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsFetching(true);
    try {
      const response = await fetchAuth('/api/v1/disputes');
      if (response.ok) {
        const data = await response.json();
        setDisputes(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch disputes', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEvidenceModal) return;

    try {
      const res = await fetchAuth(`/api/v1/disputes/${showEvidenceModal}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: 'merchant_explanation.txt',
          s3Key: `disputes/${showEvidenceModal}/merchant_explanation.txt`,
          mimeType: 'text/plain'
        })
      });

      if (res.ok) {
        setShowEvidenceModal(null);
        setEvidenceText('');
        fetchDisputes();
      } else {
        const err = await res.json();
        toast.error('Failed to submit: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error('Error submitting evidence', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEEDS_RESPONSE':
      case 'OPEN':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100/60 text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Action Required</span>
          </div>
        );
      case 'UNDER_REVIEW':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100/60 text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Under Review</span>
          </div>
        );
      case 'WON':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100/60 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Won</span>
          </div>
        );
      case 'LOST':
      case 'ACCEPTED':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">{status}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">{status}</span>
          </div>
        );
    }
  };

  const getReasonIcon = (reason: string) => {
    if (reason?.includes('FRAUD')) return <ShieldAlert size={14} className="text-rose-500" />;
    if (reason?.includes('PRODUCT')) return <AlertOctagon size={14} className="text-amber-500" />;
    return <AlertOctagon size={14} className="text-slate-400" />;
  };

  const handleSimulate = async () => {
    try {
      const res = await fetchAuth('/api/v1/disputes/simulate', { method: 'POST' });
      if (res.ok) {
        fetchDisputes();
      } else {
        const err = await res.json();
        toast.error('Simulation failed: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold">Accept Dispute?</span>
        <span className="text-sm">You will lose the funds permanently.</span>
        <div className="flex gap-2 justify-end mt-2">
          <button className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs font-bold" onClick={() => toast.dismiss(t.id)}>Cancel</button>
          <button className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold" onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await fetchAuth(`/api/v1/disputes/${id}/accept`, { method: 'POST' });
              if (res.ok) fetchDisputes();
              else {
                const err = await res.json();
                toast.error('Failed to accept dispute: ' + JSON.stringify(err));
              }
            } catch (err) { console.error(err); }
          }}>Accept Dispute</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const actionRequiredCount = disputes.filter(d => (d.status || (d as any).Status) === 'NEEDS_RESPONSE' || (d.status as any) === 'OPEN').length;
  const underReviewCount = disputes.filter(d => (d.status || (d as any).Status) === 'UNDER_REVIEW').length;
  const wonCount = disputes.filter(d => (d.status || (d as any).Status) === 'WON').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white text-slate-900 font-sans p-6 md:p-10">
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Disputes
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Defend against fraudulent chargebacks and track your dispute resolutions in real-time. Automatically submit evidence to issuing banks.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
              onClick={fetchDisputes}
            >
              <RefreshCcw size={14} className={isFetching ? 'animate-spin text-slate-400' : 'text-slate-400'} />
              Refresh
            </button>
            <button 
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-[0.98]"
              onClick={handleSimulate}
            >
              <ShieldAlert size={14} className="text-white/80" />
              Simulate Chargeback
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <ShieldAlert size={18} className="text-rose-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Action Required</h3>
              </div>
              {actionRequiredCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {actionRequiredCount}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Chargebacks needing response</p>
            </div>
          </div>
          
          <div className="flex flex-col p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Scale size={18} className="text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Under Review</h3>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {underReviewCount}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Pending bank decision</p>
            </div>
          </div>
          
          <div className="flex flex-col p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ShieldCheck size={18} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Disputes Won</h3>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {wonCount}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Successfully defended</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center text-slate-400">
              <RefreshCcw size={28} className="animate-spin mb-4 text-slate-300" />
              <p className="text-sm font-semibold tracking-wide uppercase">Syncing records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Dispute ID</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Payment ID</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Amount at Risk</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Reason</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Due By</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="inline-flex p-4 rounded-xl bg-emerald-50 mb-4">
                          <CheckCircle2 size={28} className="text-emerald-500" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">No Active Disputes</h3>
                        <p className="text-[14px] text-slate-500 max-w-xs mx-auto">Your account is in excellent standing. You have zero open chargebacks or disputes.</p>
                      </td>
                    </tr>
                  ) : (
                    disputes.map((dispute) => {
                      const id = dispute.id || (dispute as any).ID;
                      const paymentId = dispute.paymentId || (dispute as any).PaymentID;
                      const status = dispute.status || (dispute as any).Status;
                      const reason = dispute.reason || (dispute as any).Reason;
                      const amount = dispute.amount || (dispute as any).Amount;
                      const currency = dispute.currency || (dispute as any).Currency;
                      const dueBy = dispute.dueBy || (dispute as any).DueBy;

                      const isOverdue = new Date(dueBy) < new Date();
                      const needsAction = status === 'NEEDS_RESPONSE' || (status as any) === 'OPEN';

                      return (
                        <tr key={id || Math.random()} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100/80 px-2 py-1 rounded">
                              {id ? id.split('-')[0] : '...'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-medium text-slate-500">
                              {paymentId ? paymentId.split('-')[0] : '...'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-900 text-sm">
                              {currency} {(amount / 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              {getReasonIcon(reason)}
                              {reason ? reason.replace(/_/g, ' ') : 'UNKNOWN'}
                            </div>
                          </td>
                          <td className={`px-5 py-3.5 text-sm font-medium ${isOverdue && needsAction ? 'text-rose-600' : 'text-slate-600'}`}>
                            {new Date(dueBy).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            {getStatusBadge(status)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {needsAction ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                  onClick={() => handleAccept(id)}
                                >
                                  Accept
                                </button>
                                <button 
                                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
                                  onClick={() => setShowEvidenceModal(id)}
                                >
                                  Submit Evidence
                                </button>
                              </div>
                            ) : (
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                <MoreHorizontal size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modern Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-indigo-50 rounded-lg">
                  <FileSearch className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Submit Evidence</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Dispute ID: <span className="font-mono text-slate-700">{showEvidenceModal.split('-')[0]}</span></p>
                </div>
              </div>
              <button 
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setShowEvidenceModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEvidence}>
              <div className="p-6 space-y-6">
                <div className="flex gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <FileText className="text-blue-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[13px] font-medium text-blue-900 leading-relaxed">
                    Provide compelling evidence (like IP logs, delivery receipts, or communication history) to significantly increase your chances of recovering the funds.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-700">Merchant Explanation <span className="text-rose-500">*</span></label>
                  <textarea 
                    className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none placeholder-slate-400 shadow-sm"
                    required 
                    rows={5}
                    value={evidenceText} 
                    onChange={e => setEvidenceText(e.target.value)} 
                    placeholder="Describe the transaction and provide relevant details..." 
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all active:scale-[0.98]"
                  onClick={() => setShowEvidenceModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all active:scale-[0.98]"
                >
                  Submit Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesList;
