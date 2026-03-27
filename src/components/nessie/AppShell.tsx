import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';
import { useBatches } from '../../hooks/useBatches';
import { NessieStatusBar } from '../NessieStatusBar';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/nessie.css';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showToast, removeToast } = useToast();
  const { batches, deleteBatch, refreshBatches } = useBatches();

  // Initialise theme — reads from localStorage and applies data-theme to <html>
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
    <div>
      <TopBar
        activeView={getActiveView()}
        onViewChange={handleViewChange}
        onCreateNewBatch={() => navigate('/queue/new')}
      />

      <div className="layout">
        <Sidebar
          batches={batches}
          leadsByBatch={{}}
          activeBatchId={null}
          activeLeadId={null}
          onBatchClick={() => navigate('/queue')}
          onLeadClick={() => navigate('/queue')}
          onToast={showToast}
          onCreateNewBatch={() => navigate('/queue/new')}
          onRefreshBatches={refreshBatches}
          onDeleteBatch={async (id) => {
            await deleteBatch(id || '');
            await refreshBatches();
          }}
          onOpenFailedTab={() => navigate('/queue')}
        />

        <main className="main">
          <Outlet />
        </main>

        <RightSidebar onLeadClick={() => navigate('/queue')} />
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <NessieStatusBar />
    </div>
  );
};