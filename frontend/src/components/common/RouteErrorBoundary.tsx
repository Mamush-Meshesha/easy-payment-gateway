import React, { useState } from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export const RouteErrorBoundary: React.FC = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showDetails, setShowDetails] = useState(false);

  let errorMessage = 'An unexpected error occurred while loading this page.';
  let errorStatus = 500;
  let errorStack = '';

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const handleResetSession = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 w-full animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-center p-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-rose-100">
          <AlertTriangle size={28} />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
          {errorStatus === 404 ? 'Page Not Found' : 'Application Notice'}
        </span>

        <h2 className="text-xl font-extrabold text-slate-800 mt-3 mb-2">
          {errorStatus === 404 ? 'Resource Not Found' : 'Something went wrong'}
        </h2>

        <p className="text-sm text-slate-500 mb-6">
          {errorMessage || 'We encountered an unexpected issue while rendering this section.'}
        </p>

        <div className="flex flex-col gap-2.5 mb-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
          >
            <RotateCcw size={16} /> Reload Page
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
          >
            <Home size={16} /> Return to Dashboard
          </button>

          <button
            onClick={handleResetSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium rounded-xl text-xs transition-all mt-1"
          >
            <LogOut size={14} /> Clear Cache & Re-login
          </button>
        </div>

        {errorStack && (
          <div className="text-left border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-between w-full font-medium"
            >
              <span>Technical details</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg overflow-x-auto max-h-40 leading-relaxed">
                {errorStack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
