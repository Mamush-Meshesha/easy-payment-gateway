import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { 
  LayoutDashboard, 
  CreditCard, 
  Activity, 
  ArrowLeftRight, 
  LogOut, 
  Settings,
  Key,
  Webhook,
  Bell,
  BookOpen,
  FileCheck,
  Repeat,
  AlertTriangle,
  ShieldAlert,
  Search,
  ChevronDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

const MerchantLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out flex flex-col lg:static ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-20 shrink-0' : 'lg:w-64 shrink-0'}`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-[#0284c7] font-bold text-xl overflow-hidden whitespace-nowrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 shrink-0">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>EasyPay</span>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
          <NavItem to="/dashboard" end icon={<LayoutDashboard size={18} />} label="Dashboard" isCollapsed={isCollapsed} />
          
          <div className={`pt-4 pb-1 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
            Core
          </div>
          <div className={`hidden lg:block h-px bg-slate-100 my-2 ${isCollapsed ? '' : 'hidden'}`}></div>
          
          <NavItem to="/dashboard/payments" icon={<CreditCard size={18} />} label="Payments" isCollapsed={isCollapsed} />
          <NavItem to="/dashboard/transactions" icon={<Activity size={18} />} label="Transactions" isCollapsed={isCollapsed} />
          
          {user?.role !== 'MERCHANT_DEV' && (
            <>
              <NavItem to="/dashboard/subscriptions" icon={<Repeat size={18} />} label="Subscriptions" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/refunds" icon={<ArrowLeftRight size={18} />} label="Refunds" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/disputes" icon={<AlertTriangle size={18} />} label="Disputes" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/settlements" icon={<CreditCard size={18} />} label="Settlements" isCollapsed={isCollapsed} />
            </>
          )}

          <div className={`pt-4 pb-1 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
            Developers
          </div>
          <div className={`hidden lg:block h-px bg-slate-100 my-2 ${isCollapsed ? '' : 'hidden'}`}></div>
          
          <NavItem to="/dashboard/developers" icon={<BookOpen size={18} />} label="Documentation" isCollapsed={isCollapsed} />
          <NavItem to="/dashboard/api-keys" icon={<Key size={18} />} label="API Keys" isCollapsed={isCollapsed} />
          <NavItem to="/dashboard/webhooks" icon={<Webhook size={18} />} label="Webhooks" isCollapsed={isCollapsed} />

          {user?.role !== 'MERCHANT_DEV' && (
            <>
              <div className={`pt-4 pb-1 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
                Risk & Security
              </div>
              <div className={`hidden lg:block h-px bg-slate-100 my-2 ${isCollapsed ? '' : 'hidden'}`}></div>
              <NavItem to="/dashboard/radar" icon={<ShieldAlert size={18} />} label="Fraud Radar" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/risk-analytics" icon={<BarChart3 size={18} />} label="Risk Analytics" isCollapsed={isCollapsed} />
              
              <div className={`pt-4 pb-1 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
                System
              </div>
              <div className={`hidden lg:block h-px bg-slate-100 my-2 ${isCollapsed ? '' : 'hidden'}`}></div>
              <NavItem to="/dashboard/kyc" icon={<FileCheck size={18} />} label="KYC Onboarding" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" isCollapsed={isCollapsed} />
              <NavItem to="/dashboard/settings" icon={<Settings size={18} />} label="Settings" isCollapsed={isCollapsed} />
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-2 shrink-0">
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center px-3 py-2 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors whitespace-nowrap overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
            title="Log out"
          >
            <LogOut size={18} className="shrink-0" /> 
            <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Log out</span>
          </button>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden transition-all duration-300">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          
          <div className="flex items-center flex-1 gap-4">
            {/* Sidebar Toggle Button for ALL screens */}
            <button 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              title="Toggle Sidebar"
            >
              <Menu size={22} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search payments, customers, refunds..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] transition-all"
              />
            </div>
          </div>

          {/* Top Right Icons & User Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
                  3
                </span>
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-[13px] font-bold text-slate-800">Notifications</h3>
                    <span className="text-[11px] font-bold text-blue-600 cursor-pointer">Mark all read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <p className="text-[12px] font-bold text-slate-800">High Risk Payment Blocked</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">A transaction of ETB 5,000 was blocked by Fraud Radar.</p>
                      <p className="text-[10px] text-slate-400 mt-1">2 mins ago</p>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <p className="text-[12px] font-bold text-slate-800">Settlement Complete</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">ETB 145,200 has been transferred to your bank account.</p>
                      <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <p className="text-[12px] font-bold text-slate-800">New Webhook Failure</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Endpoint https://api.yoursite.com/webhook is failing.</p>
                      <p className="text-[10px] text-slate-400 mt-1">3 hours ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                    <NavLink to="/dashboard/notifications" className="text-[11px] font-bold text-blue-600 hover:text-blue-800" onClick={() => setIsNotificationOpen(false)}>
                      View all notifications
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div className="relative" ref={profileRef}>
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[13px] font-bold text-[#0284c7] group-hover:text-[#0369a1] transition-colors">{user?.role === 'SUPER_ADMIN' ? 'Administrator' : 'Merchant'}</span>
                  <span className="text-[11px] text-slate-500">{user?.merchantId?.substring(0, 8) || 'System'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-blue-400 text-white flex items-center justify-center font-bold shadow-sm shrink-0 text-[13px]">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{user?.email || 'admin@easypay.com'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{user?.merchantId || 'merch_123456789'}</p>
                  </div>
                  <div className="py-2 border-b border-slate-100">
                    <NavLink to="/dashboard/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                      <Settings size={16} /> Account Settings
                    </NavLink>
                    <NavLink to="/dashboard/developers" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                      <BookOpen size={16} /> Developer Docs
                    </NavLink>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative w-full">
          {/* We are placing the Outlet in a container that can expand */}
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, end, isCollapsed }: { to: string; icon: React.ReactNode; label: string; end?: boolean; isCollapsed: boolean }) => (
  <NavLink 
    to={to}
    end={end}
    title={isCollapsed ? label : undefined}
    className={({ isActive }) => 
      `flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
        isCollapsed ? 'justify-center' : 'justify-start gap-3'
      } ${
        isActive 
          ? 'bg-[#f0f9ff] text-[#0284c7]' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <div className="shrink-0">{icon}</div>
    <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>{label}</span>
  </NavLink>
);

export default MerchantLayout;
