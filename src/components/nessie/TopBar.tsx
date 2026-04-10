import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';

interface TopBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreateNewBatch: () => void;
}

export const TopBar = ({ activeView, onViewChange, onCreateNewBatch }: TopBarProps) => {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const views = ['Queue', 'Analytics', 'Docs', 'Settings'];

  const handleViewChange = (view: string) => {
    onViewChange(view);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="topbar">
      {/* Left — logo */}
      <div className="topbar-left">
        <div className="brand">Nessie</div>
        <div className="nessie-pill">Kelpie AI Outreach Console</div>
      </div>

      {/* Centre — nav links */}
      <div className="topbar-nav">
        {views.map((view) => (
          <span
            key={view}
            className={activeView === view ? 'active' : ''}
            onClick={() => handleViewChange(view)}
          >
            {view}
          </span>
        ))}

        {/* New Batch button */}
        <button className="topbar-new-batch" onClick={onCreateNewBatch}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Batch
        </button>
      </div>

      {/* Right — user pill */}
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }} ref={menuRef}>
        <button
          className="topbar-user-pill"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="topbar-avatar">
            {profile?.full_name ? getInitials(profile.full_name) : 'U'}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{profile?.full_name || 'User'}</span>
            {isAdmin && <span className="topbar-user-role">Admin</span>}
          </div>
          <ChevronDown
            size={13}
            style={{
              color: 'var(--text3)',
              transition: 'transform 0.2s',
              transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              marginLeft: '2px',
            }}
          />
        </button>

        {/* Dropdown */}
        {showUserMenu && (
          <div className="topbar-dropdown">
            <div className="topbar-dropdown-header">
              <div className="tdd-name">{profile?.full_name}</div>
              <div className="tdd-email">{profile?.email}</div>
              {isAdmin && <span className="tdd-badge">Admin</span>}
            </div>

            <div className="topbar-dropdown-items">
              <button
                className="tdd-item"
                onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
              >
                <User size={14} /> Profile
              </button>
              <button
                className="tdd-item"
                onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
              >
                <Settings size={14} /> Settings
              </button>
            </div>

            <div className="topbar-dropdown-footer">
              <button className="tdd-item danger" onClick={handleSignOut}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};