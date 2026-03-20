import { useState } from 'react';
import { Mail, Plus, Trash2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { TopBar } from '../components/nessie/TopBar';
import { EmailTemplatesManager } from '../components/EmailTemplatesManager';

interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  display_name?: string;
  is_active: boolean;
  is_primary: boolean;
  last_used_at?: string;
  created_at: string;
}

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'templates' | 'profile' | 'appearance'>('integrations');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConnectGmail = () => {
    console.log('Connecting Gmail...');
    alert('Gmail OAuth flow will:\n1. Open Google consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleConnectOutlook = () => {
    console.log('Connecting Outlook...');
    alert('Outlook OAuth flow will:\n1. Open Microsoft consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleDisconnect = (accountId: string) => {
    console.log('Disconnecting account:', accountId);
    setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const handleSetPrimary = (accountId: string) => {
    console.log('Setting primary account:', accountId);
    setEmailAccounts(prev => prev.map(acc => ({
      ...acc,
      is_primary: acc.id === accountId,
    })));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView="Settings"
        onViewChange={() => {}}
        onCreateNewBatch={() => {}}
      />

      <div style={{ 
        padding: '24px 32px', 
        maxWidth: '1000px', 
        margin: '0 auto',
      }}>
        {/* Compact Page Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '24px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '4px',
          }}>
            Settings
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Manage integrations and preferences
          </p>
        </div>

        {/* Compact Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '16px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
        }}>
          {[
            { id: 'integrations', label: 'Integrations' },
            { id: 'templates', label: 'Templates' },
            { id: 'profile', label: 'Profile' },
            { id: 'appearance', label: 'Appearance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 0',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'Space Grotesk, sans-serif',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Integrations Section */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <div>
                  <h2 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: 'var(--text)',
                    marginBottom: '2px',
                  }}>
                    Email Accounts
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>
                    Connect email accounts to send outreach from Nessie
                  </p>
                </div>
              </div>

              {/* Connected Accounts */}
              {emailAccounts.length > 0 ? (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: account.provider === 'gmail' 
                            ? 'linear-gradient(135deg, #EA4335 0%, #FBBC04 100%)'
                            : 'linear-gradient(135deg, #0078D4 0%, #50E6FF 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Mail size={16} color="white" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'Space Grotesk, sans-serif',
                            color: 'var(--text)',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            {account.email_address}
                            {account.is_primary && (
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '2px 5px',
                                borderRadius: '3px',
                                background: 'rgba(17, 194, 210, 0.15)',
                                color: 'var(--accent)',
                                letterSpacing: '0.3px',
                              }}>
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'Space Grotesk, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                            {account.is_active ? (
                              <>
                                <span>•</span>
                                <CheckCircle size={10} style={{ color: 'rgb(34, 197, 94)' }} />
                                <span style={{ color: 'rgb(34, 197, 94)' }}>Connected</span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <AlertCircle size={10} style={{ color: 'rgb(239, 68, 68)' }} />
                                <span style={{ color: 'rgb(239, 68, 68)' }}>Disconnected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!account.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(account.id)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              fontFamily: 'Space Grotesk, sans-serif',
                              color: 'var(--text-secondary)',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.color = 'var(--text)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'Space Grotesk, sans-serif',
                            color: 'rgb(239, 68, 68)',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={10} />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border)',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}>
                  <Mail size={32} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{
                    fontSize: '13px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: 'var(--text-secondary)',
                    marginBottom: '2px',
                  }}>
                    No email accounts connected
                  </p>
                  <p style={{
                    fontSize: '11px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: 'var(--text-secondary)',
                    opacity: 0.7,
                  }}>
                    Connect an account below to start sending
                  </p>
                </div>
              )}

              {/* Connect Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleConnectGmail}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #EA4335 0%, #FBBC04 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={14} />
                  Connect Gmail
                </button>

                <button
                  onClick={handleConnectOutlook}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #0078D4 0%, #50E6FF 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={14} />
                  Connect Outlook
                </button>
              </div>
            </div>

            {/* Other Settings Cards */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
            }}
            >
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: 'var(--text)',
                  marginBottom: '2px',
                }}>
                  CRM Integrations
                </h3>
                <p style={{
                  fontSize: '11px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: 'var(--text-secondary)',
                }}>
                  Coming soon • HubSpot, Salesforce, Pipedrive
                </p>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
            }}
            >
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: 'var(--text)',
                  marginBottom: '2px',
                }}>
                  Automation Tools
                </h3>
                <p style={{
                  fontSize: '11px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: 'var(--text-secondary)',
                }}>
                  Coming soon • Zapier, Make.com, n8n
                </p>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <EmailTemplatesManager />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Profile Settings
            </h2>
            <p style={{ 
              fontSize: '12px',
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--text-secondary)',
            }}>
              Coming soon...
            </p>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Appearance Settings
            </h2>
            <p style={{ 
              fontSize: '12px',
              fontFamily: 'Space Grotesk, sans-serif',
              color: 'var(--text-secondary)',
            }}>
              Coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};