import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SuccessfulScrape } from '../../types/nessie';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

interface TabBarProps {
  tabs: LeadTab[];
  activeLeadId: string | null;
  onTabClick: (leadId: string) => void;
  onTabClose: (leadId: string) => void;
}

const getDomainFromUrl = (url: string | undefined): string => {
  if (!url) return 'Lead';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || 'Lead';
  }
};

export const TabBar = ({
  tabs,
  activeLeadId,
  onTabClick,
  onTabClose,
}: TabBarProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [tabs]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (tabs.length === 0) return null;

  return (
    <div
      style={{
        position: 'relative',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {showLeftFade && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to right, var(--surface), transparent)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}
      {showRightFade && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to left, var(--surface), transparent)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.leadId === activeLeadId;
          const isHovered = hoveredTab === tab.leadId;
          const displayName = tab.lead.company || getDomainFromUrl(tab.lead.website);

          return (
            <div
              key={tab.leadId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDrop}
              onMouseEnter={() => setHoveredTab(tab.leadId)}
              onMouseLeave={() => setHoveredTab(null)}
              onClick={() => onTabClick(tab.leadId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: isActive
                  ? 'rgba(17, 194, 210, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#11c2d2' : '#a0a0a0',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                boxShadow: isActive
                  ? '0 2px 8px rgba(17, 194, 210, 0.2)'
                  : 'none',
                transform: isHovered && !isActive ? 'scale(1.02)' : 'scale(1)',
                opacity: draggedIndex === index ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <span
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </span>

              {!isActive && isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.leadId);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: 0,
                    marginLeft: '-4px',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
