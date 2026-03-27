import { useState, useMemo, useRef, useCallback } from 'react';
import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { BatchCard } from './BatchCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Search, RefreshCw, Trash2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  batches: Batch[];
  leadsByBatch: Record<string, SuccessfulScrape[]>;
  activeBatchId: string | null;
  activeLeadId: string | null;
  onBatchClick: (batchId: string) => void;
  onLeadClick: (leadId: string, batchId: string) => void;
  onToast: (message: string) => void;
  onCreateNewBatch: () => void;
  onRefreshBatches: () => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
  onOpenFailedTab?: (batchId: string) => void; // NEW: Handler to open failed tab
}

export const Sidebar = ({
  batches,
  leadsByBatch,
  activeBatchId,
  activeLeadId,
  onBatchClick,
  onLeadClick,
  onToast,
  onCreateNewBatch,
  onRefreshBatches,
  onDeleteBatch,
  onOpenFailedTab, // NEW: Destructure the new prop
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(268);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(268);

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 480;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isCollapsed) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isCollapsed, sidebarWidth]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [lastSelectedBatchId, setLastSelectedBatchId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshBatches();
      onToast('Batches refreshed');
    } catch (error) {
      onToast('Failed to refresh batches');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteClick = () => {
    // If batches are selected, delete them. Otherwise delete active batch.
    if (selectedBatchIds.size > 0) {
      setShowDeleteDialog(true);
    } else if (activeBatchId) {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);
    
    if (selectedBatchIds.size > 0) {
      // Bulk delete
      try {
        for (const batchId of selectedBatchIds) {
          await onDeleteBatch(batchId);
        }
        onToast(`${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''} deleted`);
        setSelectedBatchIds(new Set());
        setLastSelectedBatchId(null);
      } catch (error) {
        onToast('Failed to delete batches');
      }
    } else if (activeBatchId) {
      // Single delete
      try {
        await onDeleteBatch(activeBatchId);
        onToast('Batch deleted');
      } catch (error) {
        onToast('Failed to delete batch');
      }
    }
  };

  const handleExportClick = () => {
    if (selectedBatchIds.size === 0) return;
    
    // Collect all leads from selected batches
    const allLeads: SuccessfulScrape[] = [];
    selectedBatchIds.forEach(batchId => {
      const leads = leadsByBatch[batchId] || [];
      allLeads.push(...leads);
    });
    
    if (allLeads.length === 0) {
      onToast('No leads to export');
      return;
    }
    
    // Create CSV
    const headers = ['Company', 'Website', 'Industry', 'Emails', 'Batch'];
    const rows = allLeads.map(lead => [
      lead.company || '',
      lead.website || '',
      lead.industry || '',
      (lead.emails || []).join('; '),
      batches.find(b => b.id === lead.batch_id)?.label || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nessie-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    onToast(`Exported ${allLeads.length} leads from ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}`);
  };

  const activeBatch = batches.find((b) => b.id === activeBatchId);
  const selectedBatches = batches.filter(b => selectedBatchIds.has(b.id));
  
  // FIXED: Use batch.successful_count instead of leadsByBatch cache
  const totalLeadsToDelete = selectedBatchIds.size > 0
    ? selectedBatches.reduce((sum, batch) => {
        // Try cache first, fallback to batch count
        const cacheCount = leadsByBatch[batch.id]?.length;
        const batchCount = batch.successful_count || 0;
        return sum + (cacheCount !== undefined ? cacheCount : batchCount);
      }, 0)
    : activeBatch ? (leadsByBatch[activeBatch.id]?.length || activeBatch.successful_count || 0) : 0;

  const handleBatchToggle = (batchId: string) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const handleLeadClickWithExpand = (leadId: string) => {
    const batchId = batches.find(b =>
      (leadsByBatch[b.id] || []).some(l => l.id === leadId)
    )?.id;

    if (batchId && !expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }

    if (batchId) {
      onLeadClick(leadId, batchId);
    }
  };

  const handleBatchClickWithExpand = (batchId: string) => {
    if (!expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }
    onBatchClick(batchId);
  };

  const handleBatchSelect = (batchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (event.shiftKey && lastSelectedBatchId) {
      // Range selection
      const currentIndex = filteredBatches.findIndex(b => b.id === batchId);
      const lastIndex = filteredBatches.findIndex(b => b.id === lastSelectedBatchId);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      
      const newSelected = new Set(selectedBatchIds);
      for (let i = start; i <= end; i++) {
        newSelected.add(filteredBatches[i].id);
      }
      setSelectedBatchIds(newSelected);
    } else if (event.metaKey || event.ctrlKey) {
      // Toggle individual
      const newSelected = new Set(selectedBatchIds);
      if (newSelected.has(batchId)) {
        newSelected.delete(batchId);
      } else {
        newSelected.add(batchId);
      }
      setSelectedBatchIds(newSelected);
      setLastSelectedBatchId(batchId);
    } else {
      // Single click on checkbox - toggle this one
      const newSelected = new Set(selectedBatchIds);
      if (newSelected.has(batchId)) {
        newSelected.delete(batchId);
      } else {
        newSelected.add(batchId);
      }
      setSelectedBatchIds(newSelected);
      setLastSelectedBatchId(batchId);
    }
  };

  const handleStopBatch = async (batchId: string) => {
     try {
      const { error } = await supabase
        .from('batches')
        .update({ status: 'partial' })
        .eq('id', batchId);

      if (error) throw error;
    
      onToast('Batch stopped - remaining URLs cancelled');
    } catch (error) {
      console.error('Error stopping batch:', error);
      onToast('Failed to stop batch');
    }
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return batches;
    }

    const query = searchQuery.toLowerCase().trim();

    return batches.filter((batch) => {
      if (batch.label.toLowerCase().includes(query)) {
        return true;
      }

      const leads = leadsByBatch[batch.id] || [];
      return leads.some((lead) => {
        const websiteMatch = lead.website?.toLowerCase().includes(query);
        const domainMatch = lead.domain?.toLowerCase().includes(query);
        const companyMatch = lead.company?.toLowerCase().includes(query);
        const industryMatch = lead.industry?.toLowerCase().includes(query);

        const emailsArray = Array.isArray(lead.emails) ? lead.emails : [];
        const emailMatch = emailsArray.some((email: string) =>
          email.toLowerCase().includes(query)
        );

        return websiteMatch || domainMatch || companyMatch || industryMatch || emailMatch;
      });
    });
  }, [batches, leadsByBatch, searchQuery]);

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{ width: isCollapsed ? 'var(--sidebar-width-collapsed)' : `${sidebarWidth}px` }}
    >
      {/* Drag handle — only visible when expanded */}
      {!isCollapsed && (
        <div
          className="sidebar-drag-handle"
          onMouseDown={handleDragStart}
          title="Drag to resize"
        />
      )}
      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <div className="sidebar-title">Batches</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className="sidebar-toggle"
                onClick={() => {
                  onCreateNewBatch();
                  onToast('Create a new batch');
                }}
                title="Create new batch"
                style={{ background: 'var(--accent)', color: '#021014', fontWeight: 600 }}
              >
                +
              </button>
              <button
                className="sidebar-toggle"
                onClick={handleRefresh}
                title="Refresh batches"
                disabled={isRefreshing}
                style={{
                  opacity: isRefreshing ? 0.5 : 1,
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              {selectedBatchIds.size > 0 && (
                <button
                  className="sidebar-toggle"
                  onClick={handleExportClick}
                  title={`Export ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}`}
                  style={{
                    background: 'var(--accent)',
                    color: '#021014',
                  }}
                >
                  <Download size={14} />
                </button>
              )}
              <button
                className="sidebar-toggle"
                onClick={handleDeleteClick}
                title={
                  selectedBatchIds.size > 0 
                    ? `Delete ${selectedBatchIds.size} selected batch${selectedBatchIds.size > 1 ? 'es' : ''}` 
                    : "Delete batch (Del)"
                }
                disabled={!activeBatchId && selectedBatchIds.size === 0}
                style={{
                  opacity: (!activeBatchId && selectedBatchIds.size === 0) ? 0.3 : 1,
                  cursor: (!activeBatchId && selectedBatchIds.size === 0) ? 'not-allowed' : 'pointer',
                  background: selectedBatchIds.size > 0 ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: selectedBatchIds.size > 0 ? 'rgb(239, 68, 68)' : 'inherit',
                }}
              >
                <Trash2 size={14} />
              </button>
              <button
                className="sidebar-toggle"
                onClick={handleToggle}
                title="Collapse sidebar"
              >
                ☰
              </button>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search batches, websites, emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              />
            </div>
          </div>

          <div className="batch-list">
            {batches.length === 0 ? (
              <div className="empty-sidebar">
                No batches yet. Create a batch on the right to let Nessie hunt.
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="empty-sidebar">
                No results found for "{searchQuery}"
              </div>
            ) : (
              filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  leads={leadsByBatch[batch.id] || []}
                  isActive={batch.id === activeBatchId}
                  isExpanded={expandedBatches.has(batch.id)}
                  isSelected={selectedBatchIds.has(batch.id)}
                  activeLeadId={activeLeadId}
                  onClick={() => handleBatchClickWithExpand(batch.id)}
                  onToggleExpand={() => handleBatchToggle(batch.id)}
                  onLeadClick={(leadId) => handleLeadClickWithExpand(leadId)}
                  onSelect={(e) => handleBatchSelect(batch.id, e)}
                  onOpenFailedTab={onOpenFailedTab ? () => onOpenFailedTab(batch.id) : undefined} // NEW: Pass handler
                  onStopBatch={handleStopBatch}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Collapsed state - just show the hamburger button */}
      {isCollapsed && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '16px',
        }}>
          <button
            className="sidebar-toggle"
            onClick={handleToggle}
            title="Expand sidebar"
            style={{
              background: 'var(--accent)',
              color: '#021014',
            }}
          >
            ☰
          </button>
        </div>
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          title={selectedBatchIds.size > 1 ? "Delete Multiple Batches" : "Delete Batch"}
          message={
            selectedBatchIds.size > 0
              ? `Are you sure you want to delete ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}? This will also delete all ${totalLeadsToDelete} lead${totalLeadsToDelete === 1 ? '' : 's'} associated with them. This action cannot be undone.\n\n${selectedBatches.map(b => `• ${b.label}`).join('\n')}`
              : `Are you sure you want to delete this batch? This will also delete all ${totalLeadsToDelete} lead${totalLeadsToDelete === 1 ? '' : 's'} associated with it. This action cannot be undone.${activeBatch ? `\n\n• ${activeBatch.label}` : ''}`
          }
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
};