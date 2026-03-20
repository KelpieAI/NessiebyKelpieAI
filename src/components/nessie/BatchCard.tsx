import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { ChevronRight, ChevronDown, AlertTriangle, StopCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  onStopBatch?: (batchId: string) => void; // NEW
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
  onStopBatch, // NEW
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  
  const successfulCount = batch.successful_count || leads.length;
  const failedCount = batch.failed_count || 0;
  const actualProcessed = batch.processed_urls || 0;
  const status = batch.status;
  const isComplete = status === 'complete';
  const isProcessing = status === 'processing';
  const isPartial = status === 'partial'; // NEW
  const isFullyProcessed = actualProcessed >= batch.total_urls;

  useEffect(() => {
    if (isComplete && isFullyProcessed) {
      setShowCompletionMessage(true);
      const timer = setTimeout(() => {
        setShowCompletionMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isFullyProcessed]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  };

  const handleBatchClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') || 
        (e.target as HTMLElement).closest('.batch-checkbox') ||
        (e.target as HTMLElement).closest('.stop-button')) {
      return;
    }
    onClick();
  };

  const handleBatchDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') || 
        (e.target as HTMLElement).closest('.batch-checkbox') ||
        (e.target as HTMLElement).closest('.stop-button')) {
      return;
    }
    onToggleExpand();
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(e);
  };

  // NEW: Stop button handler
  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStopBatch) {
      onStopBatch(batch.id);
    }
  };

  return (
    <div className="batch-card-wrapper">
      <div
        className={`batch-card ${isActive ? 'active' : ''}`}
        onClick={handleBatchClick}
        onDoubleClick={handleBatchDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '8px',
          userSelect: 'none',
          background: isSelected
            ? 'rgba(20, 184, 166, 0.15)'
            : isActive 
            ? 'rgba(20, 184, 166, 0.1)' 
            : isHovered 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'transparent',
          border: isSelected 
            ? '1px solid rgba(20, 184, 166, 0.5)'
            : isActive 
            ? '1px solid rgba(20, 184, 166, 0.3)' 
            : '1px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', flex: 1, minWidth: 0 }}>
            <div
              className="batch-checkbox"
              onClick={handleCheckboxClick}
              style={{
                width: '16px',
                height: '16px',
                marginTop: '2px',
                borderRadius: '3px',
                border: isSelected 
                  ? '2px solid var(--accent)' 
                  : '2px solid rgba(148, 163, 184, 0.4)',
                background: isSelected ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
                opacity: isHovered || isSelected ? 1 : 0,
                pointerEvents: isHovered || isSelected ? 'auto' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1 5L4 8L9 2"
                    stroke="#021014"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {batch.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                {successfulCount} leads • {formatDateTime(batch.created_at)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                background:
                  status === 'complete'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : status === 'processing'
                    ? 'rgba(251, 191, 36, 0.1)'
                    : status === 'partial' // NEW
                    ? 'rgba(249, 115, 22, 0.1)'
                    : 'rgba(100, 116, 139, 0.1)',
                color:
                  status === 'complete'
                    ? 'rgb(34, 197, 94)'
                    : status === 'processing'
                    ? 'rgb(251, 191, 36)'
                    : status === 'partial' // NEW
                    ? 'rgb(249, 115, 22)'
                    : 'rgb(148, 163, 184)',
              }}
            >
              {status.toUpperCase()}
            </div>

            {successfulCount > 0 && (
              <button
                className="batch-toggle"
                onClick={handleToggleClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Processing indicator with Stop button */}
        {status === 'processing' && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <div className="batch-spinner" />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgb(251, 191, 36)',
                  fontWeight: 500,
                  marginBottom: '2px',
                }}>
                  {actualProcessed}/{batch.total_urls} processed
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}>
                  {successfulCount} success • {failedCount} failed
                </div>
              </div>
            </div>

            {/* NEW: Stop button */}
            {onStopBatch && (
              <button
                className="stop-button"
                onClick={handleStopClick}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'rgb(239, 68, 68)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <StopCircle size={12} />
                Stop Processing
              </button>
            )}
          </div>
        )}

        {/* Partial status indicator */}
        {status === 'partial' && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <div style={{
              fontSize: '12px',
              color: 'rgb(249, 115, 22)',
              fontWeight: 500,
              marginBottom: '6px',
            }}>
              ⏸ Stopped at {actualProcessed}/{batch.total_urls}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              {successfulCount} success • {failedCount} failed
            </div>
          </div>
        )}

        {/* Complete indicator */}
        {status === 'complete' && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            {showCompletionMessage && isFullyProcessed && (
              <div style={{
                fontSize: '12px',
                color: 'rgb(34, 197, 94)',
                fontWeight: 500,
                marginBottom: '6px',
                animation: 'fadeIn 0.3s ease-in',
              }}>
                ✓ All {batch.total_urls} URLs processed
              </div>
            )}
            
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>{successfulCount} success • {failedCount} failed</span>
            </div>
            
            {failedCount > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenFailedTab) {
                    onOpenFailedTab();
                  }
                }}
                style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: onOpenFailedTab ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (onOpenFailedTab) {
                    e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={12} color="rgb(251, 191, 36)" />
                  <span style={{
                    fontSize: '11px',
                    color: 'rgb(251, 191, 36)',
                    fontWeight: 500,
                  }}>
                    {failedCount} {failedCount === 1 ? 'scrape' : 'scrapes'} need attention
                  </span>
                </div>
                {onOpenFailedTab && (
                  <ChevronRight size={12} color="rgb(251, 191, 36)" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead list */}
      {isExpanded && successfulCount > 0 && (
        <div style={{ marginLeft: '16px', marginBottom: '8px' }}>
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`lead-item ${activeLeadId === lead.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onLeadClick(lead.id);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '4px',
                background: activeLeadId === lead.id ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: activeLeadId === lead.id ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeLeadId !== lead.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeLeadId !== lead.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lead.company || lead.website || 'Unknown'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lead.website}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .batch-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(251, 191, 36, 0.2);
          border-top-color: rgb(251, 191, 36);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};