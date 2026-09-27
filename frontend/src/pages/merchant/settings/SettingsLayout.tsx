import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../DashboardShared.css';
import './SettingsLayout.css';

const SettingsLayout: React.FC = () => {
  return (
    <div>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">Settings</h1>
      </div>
      <div className="settings-container">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <NavLink to="/dashboard/settings/general" className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}>General</NavLink>
            <NavLink to="/dashboard/settings/preferences" className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}>Preferences</NavLink>
            <NavLink to="/dashboard/settings/payment-methods" className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}>Payment Methods</NavLink>
          </nav>
        </aside>
        <main className="settings-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
