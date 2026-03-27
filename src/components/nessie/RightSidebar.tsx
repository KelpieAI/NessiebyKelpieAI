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
      <div className="rs-collapsed">
        <button className="rs-collapse-btn" onClick={() => setIsCollapsed(false)} title="Expand sidebar">
          <ChevronLeft size={16} />
        </button>
        <div className="rs-collapsed-label">ACTIVITY</div>
      </div>
    );
  }

  return (
    <div className="rs-panel">
      {/* Collapse toggle */}
      <div className="rs-collapse-bar">
        <button className="rs-collapse-btn" onClick={() => setIsCollapsed(true)} title="Collapse sidebar">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="rs-scroll">
        {/* Hot Activity */}
        <div className="rs-section">
          <button className="rs-section-header" onClick={() => setActivityExpanded(!activityExpanded)}>
            <div className="rs-section-title">
              <Flame size={13} color="var(--amber)" />
              Hot Activity
            </div>
            <span className="rs-chevron" style={{ transform: activityExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
          </button>
          {activityExpanded && (
            <div className="rs-section-body">
              <HotActivity onLeadClick={onLeadClick} />
            </div>
          )}
        </div>

        {/* Quick Notes */}
        <div className="rs-section rs-section--flex">
          <button className="rs-section-header" onClick={() => setNotesExpanded(!notesExpanded)}>
            <div className="rs-section-title">
              <StickyNote size={13} color="var(--teal)" />
              Quick Notes
            </div>
            <span className="rs-chevron" style={{ transform: notesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
          </button>
          {notesExpanded && (
            <div className="rs-section-body rs-section-body--flex">
              <QuickNotes />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};