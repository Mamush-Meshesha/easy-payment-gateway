import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Activity, 
  LogOut,
  Bell
} from 'lucide-react';
import './MerchantLayout.css'; // Reusing the same core styles, but we will override the sidebar color inline

const AdminLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="merchant-layout">
      {/* Sidebar with Admin specific coloring */}
      <aside className="merchant-sidebar">
        <div className="merchant-sidebar-header">
          <div className="merchant-sidebar-logo" style={{ background: '#ec4899', boxShadow: '0 2px 10px rgba(236, 72, 153, 0.4)' }}>
            <ShieldCheck size={18} />
          </div>
          <span>EasyPay Admin</span>
        </div>
        
        <nav className="merchant-sidebar-nav">
          <NavItem to="/admin" end icon={<Activity size={20} />} label="System Overview" />
          <NavItem to="/admin/merchants" icon={<Users size={20} />} label="Merchants" />
          <NavItem to="/admin/providers" icon={<Server size={20} />} label="Providers" />
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
            Global Command Center
          </div>
          <div className="merchant-topbar-actions">
            <button className="merchant-notification-bell">
              <Bell size={20} />
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

export default AdminLayout;
