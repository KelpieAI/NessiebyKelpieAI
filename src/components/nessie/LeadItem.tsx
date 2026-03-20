import { useState } from 'react';
import type { SuccessfulScrape } from '../../types/nessie';

interface LeadItemProps {
  lead: SuccessfulScrape;
  isActive: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const cleanAndTruncateUrl = (url: string | undefined, maxLength: number = 18): string => {
  if (!url) return '';

  const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  if (cleanUrl.length <= maxLength) {
    return cleanUrl;
  }

  return cleanUrl.substring(0, maxLength) + '...';
};

export const LeadItem = ({
  lead,
  isActive,
  onClick,
  onDragStart,
  onDragEnd,
}: LeadItemProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const fullUrl = lead.website || lead.domain || '';
  const displayUrl = cleanAndTruncateUrl(fullUrl, 18);

  return (
    <li
      className={`lead-item ${isActive ? 'active' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        position: 'relative',
      }}
    >
      <div className="lead-handle">☰</div>
      <div
        className="lead-main"
        style={{
          flex: 1,
          minWidth: 0,
          marginRight: '8px',
        }}
      >
        <div className="lead-company">{lead.company || lead.domain}</div>
        <div
          className="lead-domain"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
          {displayUrl}
          {showTooltip && fullUrl && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                background: '#1a2830',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                marginBottom: '4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
              }}
            >
              {fullUrl}
            </div>
          )}
        </div>
      </div>
      <span
        className="lead-industry-pill"
        style={{
          flexShrink: 0,
        }}
      >
        {lead.industry || 'business'}
      </span>
    </li>
  );
};
