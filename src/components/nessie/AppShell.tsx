import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';
import { useBatches } from '../../hooks/useBatches';
import { NessieStatusBar } from '../NessieStatusBar';
import '../../styles/nessie.css';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showToast, removeToast } = useToast();
  const { batches, deleteBatch, refreshBatches } = useBatches();

  const getActiveView = () => {
    if (location.pathname.startsWith('/find-leads')) return 'Lead Finder';
    if (location.pathname.startsWith('/settings')) return 'Settings';
    return 'Queue';
  };

  const handleViewChange = (view: string) => {
    if (view === 'Lead Finder') navigate('/find-leads');
    else if (view === 'Settings') navigate('/settings');
    else navigate('/queue');
  };

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

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
          {/* This is where each page renders — only this bit swaps */}
          <Outlet />
        </main>

        {/* Right sidebar fixed on the right */}
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