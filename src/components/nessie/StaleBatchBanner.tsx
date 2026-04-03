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

  if (staleBatches.length === 0 || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <div className="sbb-wrap">
      <div className="sbb-card">

        {/* Header */}
        <div className="sbb-header">
          <div className="sbb-header-left">
            <AlertTriangle size={18} color="var(--amber)" />
            <div>
              <div className="sbb-title">
                {staleBatches.length} {staleBatches.length === 1 ? 'batch' : 'batches'} stuck in processing
              </div>
              <div className="sbb-sub">
                These batches appear complete but are still marked as processing
              </div>
            </div>
          </div>
          <button className="sbb-close" onClick={handleDismiss}>
            <X size={15} />
          </button>
        </div>

        {/* Batch list */}
        {staleBatches.length <= 3 && (
          <div className="sbb-list">
            {staleBatches.map(({ batch, staleDuration }) => (
              <div key={batch.id} className="sbb-item">
                <div className="sbb-item-info">
                  <div className="sbb-item-name">{batch.label}</div>
                  <div className="sbb-item-meta">
                    {batch.processed_urls}/{batch.total_urls} processed · Stuck for {staleDuration} min
                  </div>
                </div>
                <button className="btn small" onClick={() => onMarkComplete(batch.id)}>
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="sbb-actions">
          <button className="btn" style={{ flex: 1 }} onClick={onAutoCompleteAll}>
            <CheckCircle size={13} />
            Mark All Complete ({staleBatches.length})
          </button>
          <button className="btn secondary" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};