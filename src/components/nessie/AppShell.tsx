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
  const { toasts, removeToast } = useToast();

  useTheme();

  const getActiveView = () => {
    if (location.pathname.startsWith('/settings'))   return 'Settings';
    if (location.pathname.startsWith('/analytics'))  return 'Analytics';
    if (location.pathname.startsWith('/activities')) return 'Activities';
    if (location.pathname.startsWith('/docs'))       return 'Docs';
    return 'Queue';
  };

  const handleViewChange = (view: string) => {
    if (view === 'Settings')       navigate('/settings');
    else if (view === 'Analytics') navigate('/analytics');
    else if (view === 'Activities') navigate('/activities');
    else if (view === 'Docs')      navigate('/docs');
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

      <NessieStatusBar />
    </>
  );
};