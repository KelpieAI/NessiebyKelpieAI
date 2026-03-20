import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

interface StaleBatch {
  batch: {
    id: string;
    label: string;
    total_urls: number;
    processed_urls: number;
    successful_count?: number;
    failed_count?: number;
  };
  staleDuration: number;
}

interface StaleBatchBannerProps {
  staleBatches: StaleBatch[];
  onMarkComplete: (batchId: string) => void;
  onAutoCompleteAll: () => void;
  onDismiss: () => void;
}

export const StaleBatchBanner = ({
  staleBatches,
  onMarkComplete,
  onAutoCompleteAll,
  onDismiss,
}: StaleBatchBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (staleBatches.length === 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '600px',
        width: '90%',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="rgb(251, 191, 36)" />
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '2px',
                }}
              >
                {staleBatches.length} {staleBatches.length === 1 ? 'batch' : 'batches'} stuck in processing
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                These batches appear complete but are still marked as processing
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
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
            <X size={16} />
          </button>
        </div>

        {/* Batch List (if only a few) */}
        {staleBatches.length <= 3 && (
          <div style={{ marginBottom: '12px' }}>
            {staleBatches.map(({ batch, staleDuration }) => (
              <div
                key={batch.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {batch.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {batch.processed_urls}/{batch.total_urls} processed • Stuck for {staleDuration} min
                  </div>
                </div>
                <button
                  onClick={() => onMarkComplete(batch.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#021014',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onAutoCompleteAll}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#021014',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <CheckCircle size={14} />
            Mark All Complete ({staleBatches.length})
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};