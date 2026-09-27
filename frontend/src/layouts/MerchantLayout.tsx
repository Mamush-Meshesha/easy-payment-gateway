import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  BookOpen
} from 'lucide-react';
import './MerchantLayout.css';

const MerchantLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="merchant-layout">
      {/* Sidebar */}
      <aside className="merchant-sidebar">
        <div className="merchant-sidebar-header">
          <div className="merchant-sidebar-logo">E</div>
          <span>EasyPay</span>
        </div>
        
        <nav className="merchant-sidebar-nav">
          <NavItem to="/dashboard" end icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem to="/dashboard/payments" icon={<CreditCard size={20} />} label="Payments" />
          <NavItem to="/dashboard/transactions" icon={<Activity size={20} />} label="Transactions" />
          
          {user?.role !== 'MERCHANT_DEV' && (
            <>
              <NavItem to="/dashboard/refunds" icon={<ArrowLeftRight size={20} />} label="Refunds" />
              <NavItem to="/dashboard/settlements" icon={<CreditCard size={20} />} label="Settlements" />
            </>
          )}
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 1rem' }}>
            Developers
          </div>
          <NavItem to="/dashboard/developers" icon={<BookOpen size={20} />} label="Documentation" />
          <NavItem to="/dashboard/api-keys" icon={<Key size={20} />} label="API Keys" />
          <NavItem to="/dashboard/webhooks" icon={<Webhook size={20} />} label="Webhooks" />
          
          {user?.role !== 'MERCHANT_DEV' && (
            <>
              <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 1rem' }}>
                Account
              </div>
              <NavItem to="/dashboard/notifications" icon={<Bell size={20} />} label="Notifications" />
              <NavItem to="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
            </>
          )}
        </nav>

        <div className="merchant-sidebar-footer">
          <div className="merchant-sidebar-user" title={user?.email}>
            {user?.email}
          </div>
          <button onClick={handleLogout} className="merchant-logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="merchant-main-wrapper">
        <header className="merchant-topbar">
          <div className="merchant-topbar-title">
            {user?.merchantId ? `Merchant ID: ${user.merchantId}` : 'Merchant Dashboard'}
          </div>
          <div className="merchant-topbar-actions">
            <button className="merchant-notification-bell">
              <Bell size={20} />
              <span className="merchant-notification-badge"></span>
            </button>
          </div>
        </header>
        
        <main className="merchant-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) => (
  <NavLink 
    to={to}
    end={end}
    className={({ isActive }) => `merchant-nav-item ${isActive ? 'active' : ''}`}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default MerchantLayout;
