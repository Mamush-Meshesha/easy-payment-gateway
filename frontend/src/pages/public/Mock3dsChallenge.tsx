import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const Mock3dsChallenge: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');

  if (!paymentId) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Invalid Challenge Request</div>;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('PROCESSING');
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    if (otp === '123456') {
      setStatus('SUCCESS');
      // In a real system, the issuer would redirect the user back to the merchant's success URL
      // We simulate this by resolving the payment state and redirecting to the checkout page
      try {
        await fetch(`/api/v1/checkout/payments/${paymentId}/process`, {
          method: 'POST',
        });
      } catch (err) {
        console.error(err);
      }
      setTimeout(() => {
        navigate(`/checkout/${paymentId}`);
      }, 2000);
    } else {
      setStatus('FAILED');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
        {/* Mock Bank Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Secure 3D Authentication</h2>
            <p className="text-[12px] text-slate-500">Mock Issuer Bank</p>
          </div>
        </div>

        {status === 'SUCCESS' ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Authentication Successful</h3>
            <p className="text-sm text-slate-500 mb-6">Returning you to the merchant...</p>
          </div>
        ) : status === 'FAILED' ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Authentication Failed</h3>
            <p className="text-sm text-slate-500 mb-6">Incorrect OTP code entered.</p>
            <button 
              onClick={() => setStatus('IDLE')}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
              <Smartphone size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-700 mb-1">We've sent a code to your registered mobile device ending in <strong>*489</strong>.</p>
              <p className="text-xs text-slate-500 font-medium">Use code 123456 to succeed.</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-[13px] font-bold text-slate-700 mb-2 text-center">Enter 6-digit OTP</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-3xl tracking-[0.5em] font-mono border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                placeholder="------"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'PROCESSING' || otp.length !== 6}
              className={`w-full py-4 rounded-xl font-bold text-white text-[15px] transition-colors ${status === 'PROCESSING' || otp.length !== 6 ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {status === 'PROCESSING' ? 'Verifying...' : 'Submit & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Mock3dsChallenge;
