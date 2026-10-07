import React, { useEffect, useState } from 'react';
import { fetchAuth } from '../../lib/fetchAuth';
import { Shield, Plus, X, AlertTriangle, CheckCircle, Slash, Activity } from 'lucide-react';

interface RadarRule {
  id: string;
  name: string;
  priority: number;
  condition: {
    field: string;
    operator: string;
    value: any;
  };
  action: 'ALLOW' | 'FLAG' | 'REVIEW' | 'BLOCK';
  isActive: boolean;
}

const RadarRules: React.FC = () => {
  const [rules, setRules] = useState<RadarRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Form State
  const [name, setName] = useState('');
  const [field, setField] = useState('amount');
  const [operator, setOperator] = useState('>');
  const [value, setValue] = useState('');
  const [action, setAction] = useState<'ALLOW' | 'FLAG' | 'REVIEW' | 'BLOCK'>('BLOCK');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetchAuth('/api/v1/risk/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedValue = field === 'amount' ? parseInt(value) : value;
      const res = await fetchAuth('/api/v1/risk/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          priority: 10,
          condition: {
            field,
            operator,
            value: parsedValue
          },
          action,
          isActive: true
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setName('');
        setField('amount');
        setOperator('>');
        setValue('');
        setAction('BLOCK');
        fetchRules();
      }
    } catch (err) {
      console.error('Error creating rule', err);
    }
  };

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'BLOCK':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'REVIEW':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FLAG':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ALLOW':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BLOCK':
        return <Slash size={14} className="text-red-600 mr-1.5" />;
      case 'REVIEW':
        return <Activity size={14} className="text-amber-600 mr-1.5" />;
      case 'FLAG':
        return <AlertTriangle size={14} className="text-orange-600 mr-1.5" />;
      case 'ALLOW':
        return <CheckCircle size={14} className="text-emerald-600 mr-1.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-base font-semibold font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 tracking-tight">Fraud Radar Rules</h1>
          </div>
          <p className="text-slate-500 text-base mt-3 max-w-2xl">
            Configure powerful custom rules to detect, flag, and block fraudulent transactions before they reach your provider.
          </p>
        </div>
        <div>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(99,102,241,0.35)] transition-all active:scale-95"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Add Rule
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-24 text-center text-slate-500">
            <Activity size={36} className="animate-spin mx-auto mb-6 text-indigo-500 opacity-80" />
            <p className="text-lg font-medium">Loading rules engine...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rule Name</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="inline-flex p-5 bg-indigo-50 rounded-full mb-5">
                        <Shield size={36} className="text-indigo-500 opacity-80" />
                      </div>
                      <h3 className="text-base font-semibold font-semibold text-slate-900 mb-2">No Rules Active</h3>
                      <p className="text-slate-500 text-base max-w-sm mx-auto">Create your first risk rule to start automatically blocking fraudulent payments.</p>
                      <button 
                        className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-[13px] bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        onClick={() => setShowAddModal(true)}
                      >
                        Create Rule
                      </button>
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-semibold text-slate-800">
                        {rule.name}
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-indigo-700 shadow-sm">
                          <span className="font-semibold">{rule.condition.field}</span>
                          <span className="mx-2 text-slate-400">{rule.condition.operator}</span>
                          <span className="font-semibold">{rule.condition.value}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getActionStyles(rule.action)}`}>
                          {getActionIcon(rule.action)}
                          {rule.action}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${rule.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {rule.isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                          )}
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Glassmorphic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <Shield size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Create Radar Rule</h2>
              </div>
              <button 
                className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={() => setShowAddModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRule}>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rule Name</label>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Block high value txns from specific IP" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[13px] transition-all outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Field</label>
                    <select 
                      value={field} 
                      onChange={e => setField(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[13px] transition-all outline-none appearance-none font-medium text-slate-700"
                    >
                      <option value="amount">Amount</option>
                      <option value="ip_address">IP Address</option>
                      <option value="currency">Currency</option>
                      <option value="payment_method">Payment Method</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Operator</label>
                    <select 
                      value={operator} 
                      onChange={e => setOperator(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[13px] transition-all outline-none appearance-none font-medium text-slate-700"
                    >
                      <option value=">">Greater than</option>
                      <option value="<">Less than</option>
                      <option value="==">Equals</option>
                      <option value="!=">Not Equals</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Value</label>
                  <input 
                    required 
                    type="text" 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    placeholder="e.g. 5000" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[13px] transition-all outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Action to Take</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['BLOCK', 'REVIEW', 'FLAG', 'ALLOW'].map((act) => (
                      <label key={act} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${action === act ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input 
                          type="radio" 
                          name="action" 
                          value={act} 
                          checked={action === act} 
                          onChange={(e) => setAction(e.target.value as any)}
                          className="w-3.5 h-3.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-[13px] font-semibold text-slate-700">{act}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  className="px-3 py-1.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarRules;
