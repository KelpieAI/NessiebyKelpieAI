import { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import type { FailedScrape } from '../../hooks/useFailedScrapes';
import { getSeverityColor, getSeverityIcon } from '../../utils/errorExplainer';

interface FailedScrapeCardProps {
  scrape: FailedScrape;
  isSelected: boolean;
  onRetry: () => void;
  onWontFix: () => void;
  onViewDetails: () => void;
  onToggleSelect: () => void;
}

export const FailedScrapeCard = ({
  scrape,
  isSelected,
  onRetry,
  onWontFix,
  onViewDetails,
  onToggleSelect,
}: FailedScrapeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRetrying, setIsRetrying] = useState(scrape.status === 'retrying');

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    // Status will update via realtime
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Truncate error message for card view
  const getTruncatedError = (error: string, maxLength: number = 80) => {
    if (error.length <= maxLength) return error;
    return error.substring(0, maxLength) + '...';
  };

  return (
    <div
      className="failed-scrape-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '12px',
        background: isRetrying
          ? 'rgba(251, 191, 36, 0.05)'
          : isSelected
          ? 'rgba(20, 184, 166, 0.1)'
          : 'rgba(255, 255, 255, 0.03)',
        border: isRetrying
          ? '1px solid rgba(251, 191, 36, 0.3)'
          : isSelected
          ? '1px solid rgba(20, 184, 166, 0.4)'
          : '1px solid rgba(148, 163, 184, 0.1)',
        transition: 'all 0.2s',
        opacity: isRetrying ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        {/* Checkbox */}
        <div
          onClick={onToggleSelect}
          style={{
            width: '18px',
            height: '18px',
            marginTop: '2px',
            borderRadius: '4px',
            border: isSelected
              ? '2px solid var(--accent)'
              : '2px solid rgba(148, 163, 184, 0.4)',
            background: isSelected ? 'var(--accent)' : 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered || isSelected ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L5 9L10 3"
                stroke="#021014"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Website URL */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '6px',
              wordBreak: 'break-all',
            }}
          >
            {scrape.website}
          </div>

          {/* Error Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'start',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <AlertTriangle
              size={16}
              style={{
                color: 'rgb(251, 191, 36)',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgb(251, 191, 36)',
                  fontWeight: 500,
                  marginBottom: '2px',
                }}
              >
                {scrape.error_code || 'Error'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4',
                }}
              >
                {getTruncatedError(scrape.error_message)}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
            }}
          >
            Attempted: {formatTime(scrape.timestamp)}
            {scrape.attempts > 1 && ` • ${scrape.attempts} attempts`}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isRetrying
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'var(--accent)',
                color: isRetrying ? 'var(--text-secondary)' : '#021014',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isRetrying) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  animation: isRetrying ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>

            <button
              onClick={onWontFix}
              disabled={isRetrying}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isRetrying) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <CheckCircle size={12} />
              Won't Fix
            </button>

            <button
              onClick={onViewDetails}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Info size={12} />
              Details
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};