import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { fetchAuth } from '../../lib/fetchAuth';
import { Plus, X, Calendar, RefreshCcw, CreditCard, User, Tag, Clock, CheckCircle } from 'lucide-react';

interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
  currentPeriodEnd: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  isActive: boolean;
}

const SubscriptionsList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Form State
  const [planName, setPlanName] = useState('Premium Tier');
  const [planAmount, setPlanAmount] = useState('4900');
  const [planCurrency, setPlanCurrency] = useState('ETB');
  const [planInterval, setPlanInterval] = useState('MONTHLY');

  const [subPlanId, setSubPlanId] = useState('');
  const [subCustomerId, setSubCustomerId] = useState('cust_12345');
  const [subPaymentMethodId, setSubPaymentMethodId] = useState('550e8400-e29b-41d4-a716-446655440000');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetchAuth('/api/v1/billing/subscriptions'),
        fetchAuth('/api/v1/billing/plans')
      ]);

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscriptions(data || []);
      }
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleCancel = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold">Cancel Subscription?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs font-bold" onClick={() => toast.dismiss(t.id)}>Keep it</button>
          <button className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await fetchAuth(`/api/v1/billing/subscriptions/${id}/cancel`, { method: 'POST' });
              fetchData();
            } catch (err) { console.error('Error canceling subscription', err); }
          }}>Cancel it</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAuth('/api/v1/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          amount: parseInt(planAmount),
          currency: planCurrency,
          interval: planInterval
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSubPlanId(data.id || (data as any).ID);
        setIsPlanModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Failed to create plan: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAuth('/api/v1/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: subPlanId,
          customer_id: subCustomerId,
          default_payment_method_id: subPaymentMethodId
        })
      });
      if (res.ok) {
        setIsSubModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Failed to create subscription: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>ACTIVE</span>;
      case 'PAST_DUE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>PAST DUE</span>;
      case 'CANCELED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>CANCELED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>{status}</span>;
    }
  };

  return (
    <div className="p-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Solid Blue Header Banner mimicking reference image */}
      <div className="bg-[#0284c7] rounded-xl px-8 py-6 mb-8 flex justify-between items-center text-white shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight mb-1">Billing & Subscriptions</h1>
          <p className="text-blue-100 text-[13px] font-medium">
            Manage recurring revenue, billing tiers, and autonomous subscriber invoicing.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-blue-500"
          >
            <RefreshCcw size={16} className={isFetching ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[13px] bg-white text-[#0284c7] hover:bg-slate-50 transition-colors"
          >
            <Tag size={16} /> New Plan
          </button>
          <button 
            onClick={() => setIsSubModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[13px] bg-white text-[#0284c7] hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} /> Subscribe Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Active Plans Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Active Plans</h2>
          </div>
          {loading ? (
            <div className="p-16 text-center">
              <RefreshCcw size={32} className="animate-spin text-blue-500 mx-auto mb-4 opacity-80" />
              <p className="text-slate-500 font-medium">Loading pricing tiers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plan ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pricing</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No billing plans configured. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => {
                      const id = plan.id || (plan as any).ID;
                      return (
                        <tr key={id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[13px] text-slate-500">
                            {id ? id.split('-')[0] : '...'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {plan.name || (plan as any).Name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-extrabold text-slate-800">{(plan.amount || (plan as any).Amount) / 100} {(plan.currency || (plan as any).Currency)}</span>
                            <span className="text-slate-400 text-[13px] font-medium"> / {(plan.interval || (plan as any).Interval).toLowerCase()}</span>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge((plan.isActive ?? (plan as any).IsActive) ? 'ACTIVE' : 'CANCELED')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Subscribed Customers</h2>
          </div>
          {loading ? (
            <div className="p-16 text-center">
              <RefreshCcw size={32} className="animate-spin text-blue-500 mx-auto mb-4 opacity-80" />
              <p className="text-slate-500 font-medium">Loading active subscriptions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sub ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plan ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Renewal</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                          <User size={32} className="text-blue-500 opacity-80" />
                        </div>
                        <h3 className="text-base font-semibold font-bold text-slate-900 mb-2">No Active Subscribers</h3>
                        <p className="text-slate-500 text-[13px] max-w-sm mx-auto">You haven't subscribed any customers yet. Attach a customer to a plan to see it here.</p>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const id = sub.id || (sub as any).ID;
                      const planId = sub.planId || (sub as any).PlanID;
                      const status = sub.status || (sub as any).Status;
                      return (
                        <tr key={id || Math.random()} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[13px] text-slate-500">
                            {id ? id.split('-')[0] : '...'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <User size={14} />
                              </div>
                              <span className="font-semibold text-slate-800">{sub.customerId || (sub as any).CustomerID}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[13px] text-indigo-600 font-semibold bg-indigo-50/30 rounded-lg inline-block mt-3 ml-6 mb-3 px-3 py-1">
                            {planId ? planId.split('-')[0] : '...'}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-600 text-[13px] font-medium">
                              <Clock size={14} className="text-slate-400" />
                              {new Date(sub.currentPeriodEnd || (sub as any).CurrentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(status === 'ACTIVE' || status === 'PAST_DUE') ? (
                              <button 
                                onClick={() => handleCancel(id)}
                                className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 rounded-md">
                  <Tag size={16} className="text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">New Billing Plan</h2>
              </div>
              <button 
                className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={() => setIsPlanModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePlan}>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Plan Name</label>
                  <input 
                    required 
                    value={planName} 
                    onChange={e => setPlanName(e.target.value)} 
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[13px] transition-all outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (cents)</label>
                    <input 
                      type="number" 
                      required 
                      value={planAmount} 
                      onChange={e => setPlanAmount(e.target.value)} 
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[13px] transition-all outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
                    <input 
                      required 
                      value={planCurrency} 
                      onChange={e => setPlanCurrency(e.target.value)} 
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[13px] transition-all outline-none font-medium uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Billing Interval</label>
                  <select 
                    value={planInterval} 
                    onChange={e => setPlanInterval(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[13px] transition-all outline-none font-medium appearance-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsPlanModalOpen(false)} 
                  className="px-3 py-1.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-amber-600 rounded-lg shadow-sm hover:bg-amber-700 transition-all"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBSCRIPTION MODAL */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Plus size={16} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Subscribe Customer</h2>
              </div>
              <button 
                className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={() => setIsSubModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSub}>
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plan ID</label>
                    <span className="text-[10px] text-slate-400 font-medium">(Create Plan first)</span>
                  </div>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required 
                      value={subPlanId} 
                      onChange={e => setSubPlanId(e.target.value)} 
                      placeholder="e.g. 550e8400-e29b-..." 
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer ID</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required 
                      value={subCustomerId} 
                      onChange={e => setSubCustomerId(e.target.value)} 
                      placeholder="e.g. cust_12345" 
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method ID</label>
                  <div className="relative">
                    <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required 
                      value={subPaymentMethodId} 
                      onChange={e => setSubPaymentMethodId(e.target.value)} 
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsSubModalOpen(false)} 
                  className="px-3 py-1.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                >
                  Subscribe Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
