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
  
  const views = ['Queue', 'Analytics', 'Settings'];

  // Handle view change with navigation for Settings
  const handleViewChange = (view: string) => {
    if (view === 'Settings') {
      navigate('/settings');
    } else if (view === 'Queue' || view === 'Analytics') {
      // Navigate back to queue with the view
      navigate('/queue');
      onViewChange(view);
    } else {
      onViewChange(view);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand">Nessie</div>
        <div className="nessie-pill">Kelpie AI Outreach Console</div>
      </div>
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
        <button
          onClick={onCreateNewBatch}
          style={{
            background: 'var(--accent)',
            color: '#021014',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            marginLeft: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 194, 210, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Create new batch"
        >
          <span style={{ fontSize: '14px' }}>+</span> New Batch
        </button>
        
        {/* User Dropdown Menu */}
        <div style={{ position: 'relative', marginLeft: '16px' }} ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (!showUserMenu) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span>
              {profile?.full_name || 'User'}
              {isAdmin && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '10px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  (admin)
                </span>
              )}
            </span>
            <ChevronDown 
              size={14} 
              style={{
                transition: 'transform 0.2s',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#1a2634',
              border: '1px solid #2d3748',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              minWidth: '200px',
              zIndex: 1000,
              overflow: 'hidden',
            }}>
              {/* User Info Section */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #2d3748',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '4px',
                }}>
                  {profile?.full_name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                }}>
                  {profile?.email}
                </div>
                {isAdmin && (
                  <div style={{
                    marginTop: '8px',
                    display: 'inline-block',
                    background: 'rgba(20, 184, 166, 0.1)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    border: '1px solid rgba(20, 184, 166, 0.3)',
                  }}>
                    Admin
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div style={{ padding: '8px 0' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <User size={16} />
                  Profile
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>

              {/* Sign Out Section */}
              <div style={{
                padding: '8px 0',
                borderTop: '1px solid #2d3748',
              }}>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};