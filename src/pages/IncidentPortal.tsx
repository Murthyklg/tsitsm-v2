import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { IncidentManagement } from '../components/IncidentManagement';
import { IncidentList } from './IncidentList';
import { ActivityLogsPanel } from '../components/ActivityLogsPanel';
import { UserMenu } from '../components/UserMenu';
import logo from '../assets/companyLogo.png';
import '../pages/Dashboard.css';

interface IncidentPortalProps {
  onPortalSwitch?: (portal: 'assets' | 'incidents') => void;
  selectedPortal?: 'assets' | 'incidents';
}

export const IncidentPortal: React.FC<IncidentPortalProps> = ({ onPortalSwitch }) => {
  const { user, logout, isAdmin } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'dashboard' | 'all' | 'open' | 'work in progress' | 'resolved'>('dashboard');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-brand">
          <img src={logo} alt="Company logo" className="header-logo" />
        </div>

        <div className="mobile-topbar-left">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            ☰
          </button>
          <div className="mobile-topbar-brand">
            <img src={logo} alt="Company logo" className="header-logo" />
          </div>
        </div>
        <UserMenu
          userEmail={user?.email ?? undefined}
          isAdmin={isAdmin}
          onShowLogs={() => setShowLogsModal(true)}
          onLogout={logout}
        />
      </header>

      <main className={`incident-portal-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
        <aside className={`incident-sidebar ${isSidebarOpen ? 'sidebar-visible' : ''}`}>
          <div className="sidebar-topbar">
            <div className="sidebar-brand-row">
              <img src={logo} alt="App logo" className="sidebar-logo" />
              <div>
                <h1>ThaiSummit ITSM</h1>
              </div>
            </div>
            
          </div>
          <button className={`sidebar-link ${selectedOption === 'dashboard' ? 'active' : ''}`} onClick={() => setSelectedOption('dashboard')}>
            Dashboard
          </button>
          <button
            className={`sidebar-link ${selectedOption === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedOption('all'); closeSidebar(); }}
          >
            All Tickets
          </button>
          <button
            className={`sidebar-link ${selectedOption === 'open' ? 'active' : ''}`}
            onClick={() => { setSelectedOption('open'); closeSidebar(); }}
          >
            Open Tickets
          </button>
          <button
            className={`sidebar-link ${selectedOption === 'work in progress' ? 'active' : ''}`}
            onClick={() => { setSelectedOption('work in progress'); closeSidebar(); }}
          >
            Work in Progress
          </button>
          <button
            className={`sidebar-link ${selectedOption === 'resolved' ? 'active' : ''}`}
            onClick={() => { setSelectedOption('resolved'); closeSidebar(); }}
          >
            Resolved Tickets
          </button>
          <button className="sidebar-link " onClick={() => { onPortalSwitch?.('assets'); closeSidebar(); }}>
            Asset Management
          </button>

          <div className="sidebar-footer">
            <p>Copyright © 2026</p>
            <p>
              Powered by{' '}
              <a href="https://www.topin.co.in" target="_blank" rel="noreferrer">
                Topin Technologies
              </a>
            </p>
            <a href="https://www.topin.co.in" target="_blank" rel="noreferrer" className="sidebar-footer-link">
              www.topin.co.in
            </a>
          </div>
        </aside>

        <section className="incident-main">
          {selectedOption === 'dashboard' ? (
            <IncidentManagement />
          ) : (
            <IncidentList statusFilter={selectedOption} />
          )}
        </section>
      </main>

      {isAdmin && showLogsModal && (
        <div className="logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="logs-modal" onClick={(event) => event.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h2>Incident Management Logs</h2>
                <p>Login, logout, incident actions, and related activities</p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowLogsModal(false)}>&times;</button>
            </div>
            <div className="logs-modal-content">
              <ActivityLogsPanel moduleFilter="incident" extraModules={['auth']} title="Incident Management Activity Log" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
