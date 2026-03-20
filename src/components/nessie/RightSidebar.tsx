import { useState } from 'react';
import { ChevronRight, ChevronLeft, Flame, StickyNote } from 'lucide-react';
import { HotActivity } from './HotActivity';
import { QuickNotes } from './QuickNotes';

interface RightSidebarProps {
  onLeadClick: (leadId: string) => void;
}

export const RightSidebar = ({ onLeadClick }: RightSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(true);

  if (isCollapsed) {
    return (
      <div
        style={{
          width: '40px',
          background: 'var(--sidebar-bg)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '20px',
          gap: '16px',
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Expand sidebar"
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ 
          color: 'var(--text-secondary)', 
          opacity: 0.5,
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}>
          ACTIVITY
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '320px',
        background: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Space Grotesk', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Collapse Button */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Collapse sidebar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Hot Activity Section */}
        <div style={{ 
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setActivityExpanded(!activityExpanded)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="#ef4444" />
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#e2e8f0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Hot Activity
              </span>
            </div>
            <span style={{ 
              color: 'var(--text-secondary)',
              transform: activityExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}>
              ▼
            </span>
          </button>

          {activityExpanded && (
            <div style={{ padding: '0 20px 20px 20px' }}>
              <HotActivity onLeadClick={onLeadClick} />
            </div>
          )}
        </div>

        {/* Quick Notes Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StickyNote size={16} color="#fbbf24" />
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#e2e8f0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Quick Notes
              </span>
            </div>
            <span style={{ 
              color: 'var(--text-secondary)',
              transform: notesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}>
              ▼
            </span>
          </button>

          {notesExpanded && (
            <div style={{ flex: 1, padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <QuickNotes />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};