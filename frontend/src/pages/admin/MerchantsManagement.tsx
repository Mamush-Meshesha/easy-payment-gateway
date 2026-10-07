import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, CheckCircle2, Ban, X, AlertTriangle, Plus, UserPlus, Loader2, Building2, Search, Filter } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const MerchantsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMerchants = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/v1/admin/merchants');
      setMerchants(data.merchants || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load merchants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const handleSuspendClick = (merchant: any) => {
    setSelectedMerchant(merchant);
    setIsSuspendModalOpen(true);
  };

  const handleApproveClick = (merchant: any) => {
    setSelectedMerchant(merchant);
    setIsApproveModalOpen(true);
  };

  return (
    <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="bg-[#1e1b4b] rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-xl relative overflow-hidden border border-indigo-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white flex items-center gap-2">
            <Building2 className="text-pink-400" /> Merchants (Tenants)
          </h1>
          <p className="text-indigo-200 text-[13px] font-medium">Manage all merchant accounts and their API access.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] bg-pink-600 text-white hover:bg-pink-500 transition-colors shadow-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Merchant
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by Business Name or Email..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm" />
        </div>
        <div className="relative w-48">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tenant ID</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Business Name</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Owner Email</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Volume</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <Loader2 size={24} className="mx-auto text-pink-500 animate-spin" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-red-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400 font-medium">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                merchants.map((merchant) => {
                  const bName = merchant.businessName || merchant.legalName || merchant.legal_name || merchant.name || 'N/A';
                  const email = merchant.owner?.email || merchant.email || merchant.owner_email || 'N/A';
                  const dateVal = merchant.createdAt || merchant.created_at || merchant.joined;
                  const displayDate = dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                  const status = merchant.status || 'UNKNOWN';

                  return (
                    <tr key={merchant.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{merchant.id.substring(0,8)}...</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-slate-800">{bName}</td>
                      <td className="px-5 py-3 text-[13px] text-slate-600">{email}</td>
                      <td className="px-5 py-3 text-[13px] font-black text-slate-800">ETB {(merchant.monthlyVolume || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-[12px] text-slate-500 font-medium">{displayDate}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === 'PENDING' && (
                            <button className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve Merchant" onClick={() => handleApproveClick(merchant)}>
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {status === 'ACTIVE' && (
                            <button className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Suspend" onClick={() => handleSuspendClick(merchant)}>
                              <Ban size={16} />
                            </button>
                          )}
                          {status === 'SUSPENDED' && (
                            <button className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Re-activate">
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <div className="relative">
                            <button 
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="More Options"
                              onClick={() => setOpenDropdownId(openDropdownId === merchant.id ? null : merchant.id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openDropdownId === merchant.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[150px] animate-in fade-in slide-in-from-top-2">
                                <button className="w-full text-left px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-pink-600 rounded-md transition-colors" onClick={() => navigate(`/admin/merchants/${merchant.id}`)}>View Details</button>
                                <button className="w-full text-left px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-pink-600 rounded-md transition-colors" onClick={() => navigate(`/admin/merchants/${merchant.id}`)}>Edit Limits</button>
                                <button className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => { toast('Reset API Keys clicked'); setOpenDropdownId(null); }}>Reset API Keys</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-[15px] font-bold text-slate-900">Onboard New Merchant</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Business Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500" placeholder="e.g. Acme Corporation" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Owner Email</label>
                <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500" placeholder="owner@acmecorp.com" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Initial Status</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500">
                  <option>PENDING (Requires KYC Approval)</option>
                  <option>ACTIVE (Auto-Approve)</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button className="px-4 py-2 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 text-[13px] font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors flex items-center gap-2" onClick={() => setIsAddModalOpen(false)}>
                <UserPlus size={16} /> Create Merchant
              </button>
            </div>
          </div>
        </div>
      )}

      {isApproveModalOpen && selectedMerchant && (
        <ApproveModal merchant={selectedMerchant} onClose={() => setIsApproveModalOpen(false)} onSuccess={() => { setIsApproveModalOpen(false); loadMerchants(); }} />
      )}
      {isSuspendModalOpen && selectedMerchant && (
        <SuspendModal merchant={selectedMerchant} onClose={() => setIsSuspendModalOpen(false)} onSuccess={() => { setIsSuspendModalOpen(false); loadMerchants(); }} />
      )}
    </div>
  );
};

const SuspendModal: React.FC<{ merchant: any, onClose: () => void, onSuccess: () => void }> = ({ merchant, onClose, onSuccess }) => {
  const [reason, setReason] = useState('Suspicious Activity / High Fraud Rate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSuspendSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/admin/merchants/${merchant.id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to suspend merchant'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="p-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Suspend Merchant?</h2>
          <p className="text-[13px] text-slate-500 mb-6">Are you sure you want to suspend <strong>{merchant.businessName || merchant.legalName || merchant.id}</strong>? They will immediately lose access to the platform.</p>
          
          {error && <div className="p-3 mb-4 text-[12px] font-bold text-red-600 bg-red-50 rounded-lg">{error}</div>}

          <div className="text-left">
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Reason for suspension</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting}>
              <option>Suspicious Activity / High Fraud Rate</option>
              <option>Terms of Service Violation</option>
              <option>Non-payment of fees</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button className="px-4 py-2 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2" onClick={handleSuspendSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Suspend Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ApproveModal: React.FC<{ merchant: any, onClose: () => void, onSuccess: () => void }> = ({ merchant, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleApproveSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/admin/merchants/${merchant.id}/approve`, { method: 'PATCH' });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to approve merchant'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="p-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Approve Merchant?</h2>
          <p className="text-[13px] text-slate-500">You are about to approve <strong>{merchant.businessName || merchant.legalName || merchant.id}</strong> for live transaction processing. Have you verified their KYC documents?</p>
          {error && <div className="mt-4 p-3 text-[12px] font-bold text-red-600 bg-red-50 rounded-lg">{error}</div>}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button className="px-4 py-2 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="px-4 py-2 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2" onClick={handleApproveSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantsManagement;
