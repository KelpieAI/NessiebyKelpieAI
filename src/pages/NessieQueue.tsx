import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nessie/TopBar';
import { Sidebar } from '../components/nessie/Sidebar';
import { TabBar } from '../components/nessie/TabBar';
import { LeadDetail } from '../components/nessie/LeadDetail';
import { RightSidebar } from '../components/nessie/RightSidebar';
import { Toast } from '../components/nessie/Toast';
import { AnalyticsPage } from './AnalyticsPage';
import LeadsTable from '../components/nessie/LeadsTable';
import { StaleBatchBanner } from '../components/nessie/StaleBatchBanner';
import { useBatches } from '../hooks/useBatches';
import { useLeads } from '../hooks/useLeads';
import { useToast } from '../hooks/useToast';
import { useBatchTimeout } from '../hooks/useBatchTimeout';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { SuccessfulScrape } from '../hooks/useLeads';
import '../styles/nessie.css';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

export const NessieQueue = () => {
  const [activeView, setActiveView] = useState('Queue');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all'); // Track LeadsTable tab
  const [showLeadsTable, setShowLeadsTable] = useState(false); // NEW: Track if showing LeadsTable
  const [openTabs, setOpenTabs] = useState<LeadTab[]>([]);
  const [leadsByBatch, setLeadsByBatch] = useState<Record<string, SuccessfulScrape[]>>({});
  const [loadingLead, setLoadingLead] = useState(false);

  const navigate = useNavigate();

  const { batches, deleteBatch, refreshBatches } = useBatches();
  const { leads, updateLead, deleteLead } = useLeads(activeBatchId);
  const { toasts, showToast, removeToast } = useToast();
  const { staleBatches, hasStaleBatches, markBatchComplete, autoCompleteStale } = useBatchTimeout(batches);

  useEffect(() => {
    if (activeBatchId && leads) {
      console.log('[NessieQueue] Updating leadsByBatch cache. Batch:', activeBatchId, 'Leads count:', leads.length);
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: leads,
      }));
    }
  }, [activeBatchId, leads]);


  const handleCreateNewBatch = () => {
    navigate('/queue/new');
  };

  const handleDeleteBatch = async (batchId?: string) => {
    console.log('🗑️ DELETE CALLED with batchId:', batchId);
    console.log('🗑️ activeBatchId:', activeBatchId);
    
    const idToDelete = batchId || activeBatchId;
    console.log('🗑️ Will delete:', idToDelete);
    
    if (!idToDelete) {
      console.log('❌ No batch ID to delete!');
      return;
    }

    const { error } = await deleteBatch(idToDelete);
    
    console.log('🗑️ Delete result - Error:', error);
    
    if (error) {
      showToast('Failed to delete batch');
      return;
    }

    // If we deleted the active batch, clear selection
    if (idToDelete === activeBatchId) {
      setActiveBatchId(null);
      setActiveLeadId(null);
      setShowLeadsTable(false);
    }

    await refreshBatches();
    showToast('Batch deleted');
  };

  // Handle lead updates (status, tags, etc.)
  const handleLeadUpdate = async (leadId: string, updates: Partial<SuccessfulScrape>) => {
    console.log('[NessieQueue] Updating lead:', leadId, updates);
    
    const { error } = await updateLead(leadId, updates);
    
    if (error) {
      showToast('Failed to update lead');
      console.error('Error updating lead:', error);
      return;
    }

    // Update the lead in tabs if it's open
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.leadId === leadId
          ? { ...tab, lead: { ...tab.lead, ...updates } }
          : tab
      )
    );

    // Update leadsByBatch cache
    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      }));
    }
  };

  // Handle lead deletion
  const handleLeadDelete = async (leadId: string) => {
    console.log('[NessieQueue] Deleting lead:', leadId);
    
    const { error } = await deleteLead(leadId);
    
    if (error) {
      showToast('Failed to delete lead');
      console.error('Error deleting lead:', error);
      return;
    }

    // Close the tab if it's open
    setOpenTabs((prev) => prev.filter((tab) => tab.leadId !== leadId));

    // If this was the active lead, select another one
    if (activeLeadId === leadId && activeBatchId) {
      const remainingLeads = leadsByBatch[activeBatchId]?.filter((l) => l.id !== leadId) || [];
      if (remainingLeads.length > 0) {
        openLead(remainingLeads[0], activeBatchId);
      } else {
        setActiveLeadId(null);
      }
    }

    // Update leadsByBatch cache
    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).filter((lead) => lead.id !== leadId),
      }));
    }

    showToast('Lead deleted');
  };

  // Handle clicking on activity items in right sidebar
  const handleActivityLeadClick = (leadId: string) => {
    console.log('[NessieQueue] Activity clicked for lead:', leadId);
    
    // Find the lead across all batches
    let foundLead: SuccessfulScrape | undefined;
    let foundBatchId: string | undefined;

    // First check current batch
    if (activeBatchId) {
      foundLead = leadsByBatch[activeBatchId]?.find(l => l.id === leadId);
      if (foundLead) {
        foundBatchId = activeBatchId;
      }
    }

    // If not found, search all batches
    if (!foundLead) {
      for (const batchId in leadsByBatch) {
        foundLead = leadsByBatch[batchId]?.find(l => l.id === leadId);
        if (foundLead) {
          foundBatchId = batchId;
          break;
        }
      }
    }

    // If found, open the lead
    if (foundLead && foundBatchId) {
      openLead(foundLead, foundBatchId);
    } else {
      console.warn('Lead not found in cache:', leadId);
      showToast('Lead not found');
    }
  };

  // Handle lead navigation (prev/next)
  const handleLeadNavigate = (direction: 'prev' | 'next') => {
    if (!activeBatchId) return;

    const currentLeads = leadsByBatch[activeBatchId] || [];
    const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);

    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex = currentIndex < currentLeads.length - 1 ? currentIndex + 1 : currentIndex;
    }

    if (newIndex !== currentIndex) {
      openLead(currentLeads[newIndex], activeBatchId);
    }
  };

  // Handle opening failed tab from batch card warning
  const handleOpenFailedTab = (batchId: string) => {
    console.log('🚨 Opening failed tab for batch:', batchId);
    setActiveBatchId(batchId);
    setActiveTab('failed'); // Switch to failed tab
    setShowLeadsTable(true); // Show LeadsTable view
    console.log('✅ Set showLeadsTable to true');
  };

  // Handle stale batch completion
  const handleMarkBatchComplete = async (batchId: string) => {
    const { error } = await markBatchComplete(batchId);
    if (error) {
      showToast('Failed to mark batch complete');
    } else {
      showToast('Batch marked as complete');
      await refreshBatches();
    }
  };

  const handleAutoCompleteAll = async () => {
    const { count, error } = await autoCompleteStale();
    if (error) {
      showToast('Failed to complete stale batches');
    } else {
      showToast(`${count} stale batches marked as complete`);
      await refreshBatches();
    }
  };

  useKeyboardShortcuts({
    onCreateBatch: () => {
      handleCreateNewBatch();
      showToast('Create a new batch');
    },
    onSaveNotes: () => {
      if (activeLeadId) {
        showToast('Note saved');
      }
    },
    onNavigateUp: () => handleLeadNavigate('prev'),
    onNavigateDown: () => handleLeadNavigate('next'),
    onDeleteBatch: handleDeleteBatch,
  });


  const handleBatchClick = (batchId: string) => {
    console.log('[NessieQueue] Batch clicked:', batchId);
    setActiveBatchId(batchId);
    setActiveTab('all'); // Reset to "all" tab when clicking batch normally
    setShowLeadsTable(false); // Hide LeadsTable, show normal view

    const batchLeads = leadsByBatch[batchId] || [];
    console.log('[NessieQueue] Leads in cache for batch:', batchLeads.length);

    if (batchLeads.length > 0) {
      if (!batchLeads.find((l) => l.id === activeLeadId)) {
        console.log('[NessieQueue] Opening first lead from batch');
        openLead(batchLeads[0], batchId);
      }
    } else {
      console.log('[NessieQueue] No leads in cache, clearing active lead');
      setActiveLeadId(null);
    }
  };

  const handleLeadClick = (leadId: string, batchId: string) => {
    setShowLeadsTable(false); // Hide LeadsTable when clicking a lead
    const lead = leadsByBatch[batchId]?.find((l) => l.id === leadId);
    if (lead) {
      openLead(lead, batchId);
    }
  };

  const openLead = (lead: SuccessfulScrape, batchId: string) => {
    setLoadingLead(true);
    setActiveLeadId(lead.id);
    setActiveBatchId(batchId);

    const existingTab = openTabs.find((t) => t.leadId === lead.id);
    if (!existingTab) {
      setOpenTabs((prev) => [...prev, { leadId: lead.id, lead }]);
    }

    setTimeout(() => {
      setLoadingLead(false);
    }, 200);
  };

  const handleTabClose = (leadId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.leadId !== leadId));

    if (activeLeadId === leadId) {
      const remainingTabs = openTabs.filter((t) => t.leadId !== leadId);
      if (remainingTabs.length > 0) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        setActiveLeadId(lastTab.leadId);
      } else {
        setActiveLeadId(null);
      }
    }
  };

  const currentLead = activeLeadId
    ? Object.values(leadsByBatch)
        .flat()
        .find((l) => l.id === activeLeadId)
    : null;

  const currentBatch = batches.find((b) => b.id === activeBatchId);

  // Get all leads in current batch for navigation
  const allLeadsInBatch = activeBatchId ? (leadsByBatch[activeBatchId] || []) : [];

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        onCreateNewBatch={handleCreateNewBatch}
      />

      {activeView === 'Analytics' ? (
        <AnalyticsPage
          onNavigateToBatch={(batchId) => {
            setActiveView('Queue');
            handleBatchClick(batchId);
          }}
        />
      ) : activeView === 'Settings' ? (
        <div style={{ padding: '40px', color: 'var(--text)' }}>
          <div style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', marginBottom: '32px', fontWeight: 600 }}>
            Settings
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Settings page coming soon...</div>
        </div>
      ) : (
        <div className="layout">
          <Sidebar
            batches={batches}
            leadsByBatch={leadsByBatch}
            activeBatchId={activeBatchId}
            activeLeadId={activeLeadId}
            onBatchClick={handleBatchClick}
            onLeadClick={handleLeadClick}
            onToast={showToast}
            onCreateNewBatch={handleCreateNewBatch}
            onRefreshBatches={refreshBatches}
            onDeleteBatch={handleDeleteBatch}
            onOpenFailedTab={handleOpenFailedTab} // Pass handler
          />

          <main className="main">
            {/* NEW: Show LeadsTable OR normal view */}
            {showLeadsTable ? (
              <LeadsTable 
                activeBatchId={activeBatchId}
                initialTab={activeTab}
              />
            ) : (
              <>
                <TabBar
                  tabs={openTabs}
                  activeLeadId={activeLeadId}
                  onTabClick={(leadId) => {
                    setActiveLeadId(leadId);
                    setLoadingLead(true);
                    setTimeout(() => setLoadingLead(false), 150);
                  }}
                  onTabClose={handleTabClose}
                />

                <div className="content">
                  <section className="content-main">
                    <LeadDetail
                      lead={currentLead}
                      batch={currentBatch || null}
                      allLeads={allLeadsInBatch}
                      loading={loadingLead}
                      onToast={showToast}
                      onLeadUpdate={handleLeadUpdate}
                      onLeadDelete={handleLeadDelete}
                      onNavigate={handleLeadNavigate}
                    />
                  </section>
                </div>
              </>
            )}
          </main>

          {/* Right Sidebar - Activity & Notes */}
          <RightSidebar onLeadClick={handleActivityLeadClick} />
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Stale Batch Warning Banner */}
      {hasStaleBatches && activeView === 'Queue' && (
        <StaleBatchBanner
          staleBatches={staleBatches}
          onMarkComplete={handleMarkBatchComplete}
          onAutoCompleteAll={handleAutoCompleteAll}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
};