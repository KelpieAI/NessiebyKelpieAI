import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface RetryAllModalProps {
  failedCount: number;
  onConfirm: (customLabel: string) => void;
  onClose: () => void;
}

export const RetryAllModal = ({
  failedCount,
  onConfirm,
  onClose,
}: RetryAllModalProps) => {
  const defaultLabel = `Retry - ${new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
  
  const [batchName, setBatchName] = useState(defaultLabel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(batchName.trim() || defaultLabel);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-in',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
          background: 'var(--background)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Retry All Failed Scrapes
          </h3>
          <button
            onClick={onClose}
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
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              This will create a new batch with {failedCount} failed{' '}
              {failedCount === 1 ? 'URL' : 'URLs'} and send them to Make.com for
              re-scraping.
            </p>

            <div>
              <label
                htmlFor="batch-name"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}
              >
                Batch Name (optional)
              </label>
              <input
                id="batch-name"
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder={defaultLabel}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                }}
              >
                Leave blank to use the default timestamp-based name
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '14px',
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
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent)',
                color: '#021014',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <RefreshCw size={16} />
              Retry All ({failedCount})
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
};