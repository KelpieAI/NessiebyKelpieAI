import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { ChevronRight, ChevronDown, AlertTriangle, StopCircle, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface BatchCardProps {
  batch: Batch;
  leads: SuccessfulScrape[];
  isActive: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  activeLeadId: string | null;
  onClick: () => void;
  onToggleExpand: () => void;
  onLeadClick: (leadId: string) => void;
  onSelect: (e: React.MouseEvent) => void;
  onOpenFailedTab?: () => void;
  onStopBatch?: (batchId: string) => void;
}

export const BatchCard = ({
  batch,
  leads,
  isActive,
  isExpanded,
  isSelected,
  activeLeadId,
  onClick,
  onToggleExpand,
  onLeadClick,
  onSelect,
  onOpenFailedTab,
  onStopBatch,
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const successfulCount = batch.successful_count || leads.length;
  const failedCount = batch.failed_count || 0;
  const actualProcessed = batch.processed_urls || 0;
  const status = batch.status;
  const isComplete = status === 'complete';
  const isProcessing = status === 'processing';
  const isPartial = status === 'partial';
  const isFullyProcessed = actualProcessed >= batch.total_urls;
  const isLeadFinder = batch.channel === 'lead-finder';

  const leadsWithEmail = useMemo(() => {
    return leads.filter(lead => lead.emails && lead.emails.length > 0).length;
  }, [leads]);

  useEffect(() => {
    if (isComplete && isFullyProcessed) {
      setShowCompletionMessage(true);
      const timer = setTimeout(() => setShowCompletionMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isFullyProcessed]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const handleBatchClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') ||
        (e.target as HTMLElement).closest('.batch-checkbox') ||
        (e.target as HTMLElement).closest('.stop-button')) return;
    onClick();
  };

  const handleBatchDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') ||
        (e.target as HTMLElement).closest('.batch-checkbox') ||
        (e.target as HTMLElement).closest('.stop-button')) return;
    onToggleExpand();
  };

  // Status pill config — maps status to CSS variable colours
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    complete:   { label: 'COMPLETE',   color: 'var(--teal)',   bg: 'var(--teal-subtle)' },
    processing: { label: 'PROCESSING', color: 'var(--amber)',  bg: 'rgba(245,166,35,0.1)' },
    partial:    { label: 'PARTIAL',    color: 'var(--amber)',  bg: 'rgba(245,166,35,0.1)' },
    pending:    { label: 'PENDING',    color: 'var(--text3)',  bg: 'var(--surface)' },
    error:      { label: 'ERROR',      color: 'var(--danger)', bg: 'rgba(255,79,96,0.1)' },
  };
  const sc = statusConfig[status] ?? statusConfig.pending;

  return (
    <div className="batch-card-wrapper">
      <div
        className={`batch-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleBatchClick}
        onDoubleClick={handleBatchDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top row — name + status */}
        <div className="bc-top">
          <div className="bc-left">
            {/* Checkbox — only visible on hover or when selected */}
            <div
              className="batch-checkbox"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSelect(e); }}
              style={{ opacity: isHovered || isSelected ? 1 : 0 }}
            >
              {isSelected && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="#001A16" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Name + lead-finder tag */}
            <div className="bc-name-group">
              <div className="bc-name">{batch.label}</div>
              {isLeadFinder && (
                <div className="bc-lf-tag">
                  <Search size={9} />
                  Lead Finder
                </div>
              )}
            </div>
          </div>

          {/* Status pill + expand toggle */}
          <div className="bc-right">
            <div
              className="bc-status"
              style={{ color: sc.color, background: sc.bg }}
            >
              {sc.label}
            </div>
            {successfulCount > 0 && (
              <button
                className="batch-toggle bc-expand"
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Meta line */}
        <div className="bc-meta">
          {isLeadFinder
            ? `${successfulCount} businesses found · ${formatDateTime(batch.created_at)}`
            : `${successfulCount} leads · ${formatDateTime(batch.created_at)}`
          }
        </div>

        {/* ── PROCESSING STATE ── */}
        {isProcessing && (
          <div className="bc-footer">
            <div className="bc-processing-row">
              <div className="bc-spinner" />
              <div>
                <div className="bc-processing-label">{actualProcessed}/{batch.total_urls} processed</div>
                <div className="bc-processing-sub">{successfulCount} success · {failedCount} failed</div>
              </div>
            </div>
            {onStopBatch && (
              <button
                className="stop-button bc-stop-btn"
                onClick={(e) => { e.stopPropagation(); onStopBatch(batch.id); }}
              >
                <StopCircle size={11} />
                Stop Processing
              </button>
            )}
          </div>
        )}

        {/* ── PARTIAL STATE ── */}
        {isPartial && (
          <div className="bc-footer">
            <div className="bc-partial-label">⏸ Stopped at {actualProcessed}/{batch.total_urls}</div>
            <div className="bc-processing-sub">{successfulCount} success · {failedCount} failed</div>
          </div>
        )}

        {/* ── COMPLETE STATE ── */}
        {isComplete && (
          <div className="bc-footer">
            {showCompletionMessage && isFullyProcessed && !isLeadFinder && (
              <div className="bc-complete-msg">✓ All {batch.total_urls} URLs processed</div>
            )}
            <div className="bc-complete-sub">
              {isLeadFinder
                ? `${successfulCount} leads · ${leadsWithEmail} with email`
                : `${successfulCount} success · ${failedCount} failed`
              }
            </div>
            {failedCount > 0 && !isLeadFinder && (
              <div
                className="bc-failed-alert"
                onClick={(e) => { e.stopPropagation(); onOpenFailedTab?.(); }}
                style={{ cursor: onOpenFailedTab ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={11} color="var(--amber)" />
                  <span>{failedCount} {failedCount === 1 ? 'scrape' : 'scrapes'} need attention</span>
                </div>
                {onOpenFailedTab && <ChevronRight size={11} color="var(--amber)" />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EXPANDED LEADS LIST ── */}
      {isExpanded && successfulCount > 0 && (
        <div className="bc-leads-list">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`lead-item ${activeLeadId === lead.id ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onLeadClick(lead.id); }}
            >
              <div className="lead-company">{lead.company || lead.website || 'Unknown'}</div>
              <div className="lead-domain">{lead.website}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};