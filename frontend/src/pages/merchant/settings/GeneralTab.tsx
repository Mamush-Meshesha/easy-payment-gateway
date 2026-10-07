import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Mail, Globe, MapPin, Phone, Hash, UploadCloud, AlertCircle, Save, Key, ShieldCheck } from 'lucide-react';
import type { RootState } from '../../../store/store';
import { useGetMerchantDetailsQuery } from '../../../services/api/settingsApi';

const GeneralTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId || '';

  const { data: merchant, isLoading } = useGetMerchantDetailsQuery(merchantId, { skip: !merchantId });

  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Loading profile data...</div>;
  }

  const markChanged = () => setHasChanges(true);

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">General Settings</h2>
          <p className="text-[13px] text-slate-500 font-medium">Manage your company's core profile, public details, and contact information.</p>
        </div>
        {hasChanges && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg transition-all shadow-sm">
            <Save size={16} /> Save Changes
          </button>
        )}
      </div>

      <div className="space-y-6">
        
        {/* PUBLIC BRANDING */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[14px] font-bold text-slate-800">Public Branding</h3>
            <p className="text-[12px] text-slate-500">This information will be displayed to customers on payment receipts and checkout pages.</p>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-8">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                  <UploadCloud size={24} />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Upload Logo</span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600">Public Business Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" defaultValue={merchant?.legalName || 'Acme Corp'} onChange={markChanged} className="w-full pl-9 pr-3 py-2 text-[13px] font-medium border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600">Brand Color (Hex)</label>
                  <div className="relative flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-[#0284c7] border border-slate-200 shrink-0"></div>
                    <input type="text" defaultValue="#0284c7" onChange={markChanged} className="w-full px-3 py-2 text-[13px] font-medium font-mono border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600">Website URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="url" defaultValue="https://acmecorp.com" onChange={markChanged} className="w-full pl-9 pr-3 py-2 text-[13px] font-medium border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600">Support Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" defaultValue={user?.email || 'support@acmecorp.com'} onChange={markChanged} className="w-full pl-9 pr-3 py-2 text-[13px] font-medium border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL & COMPLIANCE */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-[14px] font-bold text-slate-800">Legal & Compliance</h3>
              <p className="text-[12px] text-slate-500">Official registered business details verified via KYC.</p>
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-600">Legal Business Name</label>
              <input type="text" value={merchant?.legalName || 'Acme Corporation LLC'} readOnly className="w-full px-3 py-2 text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" />
              <p className="text-[11px] text-slate-400 mt-1">To change this, you must re-submit KYC documents.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-600">Tax Identification Number (TIN)</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value="********9012" readOnly className="w-full pl-9 pr-3 py-2 text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-bold text-slate-600">Registered Business Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                <textarea rows={2} readOnly value="123 Financial District Blvd, Suite 400\nNew York, NY 10001, United States" className="w-full pl-9 pr-3 py-2.5 text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed resize-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ACCOUNT INFO */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[14px] font-bold text-slate-800">Account Details</h3>
            <p className="text-[12px] text-slate-500">System-level account information and identifiers.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600">Merchant Account ID</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={merchantId || 'merch_9s8d7f6g5h4j3k2l'} readOnly className="w-full pl-9 pr-3 py-2 text-[13px] font-mono text-blue-600 bg-blue-50 border border-blue-100 rounded-lg outline-none cursor-text" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600">Primary Timezone</label>
                <select onChange={markChanged} className="w-full px-3 py-2 text-[13px] font-medium border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="EAT">Eastern Africa Time (EAT)</option>
                  <option value="EST">Eastern Standard Time (EST)</option>
                  <option value="PST">Pacific Standard Time (PST)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section className="bg-red-50 rounded-xl border border-red-100 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-red-100 bg-red-100/50 flex items-center gap-2 text-red-800">
            <AlertCircle size={18} />
            <h3 className="text-[14px] font-bold">Danger Zone</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="text-[13px] font-bold text-red-900">Close Account</h4>
              <p className="text-[12px] text-red-700">Permanently delete your account, data, and stop all active subscriptions.</p>
            </div>
            <button className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-[13px] font-bold hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm whitespace-nowrap">
              Close Account
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default GeneralTab;
