import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';
import { NessieStatusBar } from '../NessieStatusBar';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/nessie.css';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showToast, removeToast } = useToast();

  // Initialise theme — reads from localStorage, stamps data-theme on <html>
  useTheme();

  const getActiveView = () => {
    if (location.pathname.startsWith('/settings')) return 'Settings';
    return 'Queue';
  };

  const handleViewChange = (view: string) => {
    if (view === 'Settings') navigate('/settings');
    else navigate('/queue');
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar
          activeView={getActiveView()}
          onViewChange={handleViewChange}
          onCreateNewBatch={() => navigate('/queue/new')}
        />

        {/*
          NessieQueue and SettingsPage now own their own Sidebar + RightSidebar.
          AppShell is purely a frame — topbar, outlet, toasts.
        */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Fixed overlay — sits on top of everything, takes no layout space */}
      <NessieStatusBar />
    </>
  );
};