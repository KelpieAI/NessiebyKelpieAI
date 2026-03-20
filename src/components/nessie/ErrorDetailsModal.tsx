import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import type { FailedScrape } from '../../hooks/useFailedScrapes';
import { explainError, getSeverityColor, getSeverityIcon, type ErrorExplanation } from '../../utils/errorExplainer';

interface ErrorDetailsModalProps {
  scrape: FailedScrape;
  onClose: () => void;
  onRetry: () => void;
  onWontFix: () => void;
}

export const ErrorDetailsModal = ({
  scrape,
  onClose,
  onRetry,
  onWontFix,
}: ErrorDetailsModalProps) => {
  const [explanation, setExplanation] = useState<ErrorExplanation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExplanation();
  }, [scrape.error_code, scrape.error_message]);

  const loadExplanation = async () => {
    setLoading(true);
    try {
      const result = await explainError(scrape.error_code, scrape.error_message, true);
      setExplanation(result);
    } catch (error) {
      console.error('Error loading explanation:', error);
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '600px',
          maxHeight: '90vh',
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
            Failed Scrape Details
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
        <div
          style={{
            padding: '24px',
            maxHeight: 'calc(90vh - 180px)',
            overflowY: 'auto',
          }}
        >
          {/* Website */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Website
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text)',
                wordBreak: 'break-all',
              }}
            >
              {scrape.website}
            </div>
          </div>

          {/* Error Code */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Error Code
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'rgb(251, 191, 36)',
                fontWeight: 600,
              }}
            >
              {scrape.error_code || 'Unknown Error'}
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Attempted
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)' }}>
              {formatTime(scrape.timestamp)}
              {scrape.attempts > 1 && ` • ${scrape.attempts} attempts`}
            </div>
          </div>

          {/* AI Explanation */}
          {loading ? (
            <div
              style={{
                padding: '20px',
                background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                textAlign: 'center',
              }}
            >
              <div
                className="spinner"
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(148, 163, 184, 0.2)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Analyzing error...
              </div>
            </div>
          ) : explanation ? (
            <div
              style={{
                padding: '16px',
                background: `${getSeverityColor(explanation.severity)}15`,
                borderRadius: '8px',
                border: `1px solid ${getSeverityColor(explanation.severity)}40`,
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '20px', marginTop: '-2px' }}>
                  {getSeverityIcon(explanation.severity)}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '8px',
                    }}
                  >
                    What this means:
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text)',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                    }}
                  >
                    {explanation.simple}
                  </div>

                  {explanation.causes.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        Possible causes:
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '20px',
                          fontSize: '13px',
                          color: 'var(--text)',
                        }}
                      >
                        {explanation.causes.map((cause, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '12px',
                      background: getSeverityColor(explanation.severity) + '20',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    ✅ {explanation.fix}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Raw Error Message */}
          <div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              Raw Error Message
            </div>
            <div
              style={{
                padding: '12px',
                background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                lineHeight: '1.5',
                wordBreak: 'break-all',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {scrape.error_message}
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
            onClick={() => {
              onWontFix();
              onClose();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CheckCircle size={16} />
            Mark as Won't Fix
          </button>

          <button
            onClick={() => {
              onRetry();
              onClose();
            }}
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
            Retry Now
          </button>
        </div>
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};