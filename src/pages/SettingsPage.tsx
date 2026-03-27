import { useState } from 'react';
import { Mail, Plus, Trash2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { TopBar } from '../components/nessie/TopBar';
import { EmailTemplatesManager } from '../components/EmailTemplatesManager';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../hooks/useTheme';

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

// Theme definitions for the UI picker
const THEMES: { id: Theme; name: string; description: string; preview: { bg: string; bg2: string; surface: string; teal: string; text: string; text2: string } }[] = [
  {
    id: 'kelpie',
    name: 'Kelpie',
    description: 'Deep dark with teal — the Kelpie AI signature look',
    preview: {
      bg: '#080C10',
      bg2: '#0C1118',
      surface: '#192130',
      teal: '#0ABFA3',
      text: '#EEF2F7',
      text2: '#526478',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Pure neutral dark — no tint, just clean black',
    preview: {
      bg: '#0D0D0D',
      bg2: '#141414',
      surface: '#222222',
      teal: '#0ABFA3',
      text: '#F2F2F2',
      text2: '#5C5C5C',
    },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light mode — easier on the eyes in bright rooms',
    preview: {
      bg: '#F4F6F8',
      bg2: '#FFFFFF',
      surface: '#EAECEF',
      teal: '#0ABFA3',
      text: '#0F1923',
      text2: '#8A9BB0',
    },
  },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'templates' | 'profile' | 'appearance'>('integrations');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleConnectGmail = () => {
    alert('Gmail OAuth flow will:\n1. Open Google consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleConnectOutlook = () => {
    alert('Outlook OAuth flow will:\n1. Open Microsoft consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleDisconnect = (accountId: string) => {
    setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const handleSetPrimary = (accountId: string) => {
    setEmailAccounts(prev => prev.map(acc => ({
      ...acc,
      is_primary: acc.id === accountId,
    })));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
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
        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '22px',
            fontFamily: 'var(--font-head)',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '4px',
            letterSpacing: '-0.4px',
          }}>
            Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
            Manage integrations and preferences
          </p>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          {[
            { id: 'integrations', label: 'Integrations' },
            { id: 'templates',    label: 'Templates' },
            { id: 'profile',      label: 'Profile' },
            { id: 'appearance',   label: 'Appearance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-head)',
                color: activeTab === tab.id ? 'var(--teal)' : 'var(--text3)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--teal)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '2px' }}>Email Accounts</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>Connect email accounts to send outreach from Nessie</p>
                </div>
              </div>

              {emailAccounts.length > 0 ? (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {emailAccounts.map((account) => (
                    <div key={account.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: account.provider === 'gmail' ? 'linear-gradient(135deg,#EA4335,#FBBC04)' : 'linear-gradient(135deg,#0078D4,#50E6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mail size={16} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {account.email_address}
                            {account.is_primary && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: 'var(--teal-subtle)', color: 'var(--teal)', letterSpacing: '0.3px' }}>PRIMARY</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                            {account.is_active ? <><span>·</span><CheckCircle size={10} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e' }}>Connected</span></> : <><span>·</span><AlertCircle size={10} style={{ color: 'var(--danger)' }} /><span style={{ color: 'var(--danger)' }}>Disconnected</span></>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!account.is_primary && <button onClick={() => handleSetPrimary(account.id)} className="btn ghost small">Set Primary</button>}
                        <button onClick={() => handleDisconnect(account.id)} style={{ padding: '5px 10px', fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--danger)', background: 'transparent', border: '1px solid rgba(255,79,96,0.25)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.14s' }}><Trash2 size={10} /> Disconnect</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 'var(--r-md)', marginBottom: '12px' }}>
                  <Mail size={28} color="var(--text3)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '2px', fontFamily: 'var(--font-body)' }}>No email accounts connected</p>
                  <p style={{ fontSize: '11px', color: 'var(--text4)', fontFamily: 'var(--font-body)' }}>Connect an account below to start sending</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleConnectGmail} disabled={loading} style={{ flex: 1, padding: '10px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-head)', color: '#fff', background: 'linear-gradient(135deg,#EA4335,#FBBC04)', border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.5 : 1, transition: 'all 0.15s' }}><Plus size={14} />Connect Gmail</button>
                <button onClick={handleConnectOutlook} disabled={loading} style={{ flex: 1, padding: '10px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-head)', color: '#fff', background: 'linear-gradient(135deg,#0078D4,#50E6FF)', border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.5 : 1, transition: 'all 0.15s' }}><Plus size={14} />Connect Outlook</button>
              </div>
            </div>

            {[
              { title: 'CRM Integrations', sub: 'Coming soon · HubSpot, Salesforce, Pipedrive' },
              { title: 'Automation Tools', sub: 'Coming soon · Make.com, Zapier, n8n' },
            ].map((item) => (
              <div key={item.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.14s' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '2px' }}>{item.title}</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>{item.sub}</p>
                </div>
                <ChevronRight size={16} color="var(--text3)" />
              </div>
            ))}
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === 'templates' && <EmailTemplatesManager />}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '8px' }}>Profile Settings</h2>
            <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>Coming soon…</p>
          </div>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Theme picker */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '4px' }}>Theme</h2>
                <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                  Choose how Nessie looks. Your preference is saved automatically.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {THEMES.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        background: 'none',
                        border: `2px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                        borderRadius: 'var(--r-lg)',
                        padding: '0',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        overflow: 'hidden',
                        textAlign: 'left',
                        boxShadow: isActive ? '0 0 0 4px var(--teal-subtle)' : 'none',
                      }}
                    >
                      {/* Mini preview */}
                      <div style={{ background: t.preview.bg, padding: '12px', borderBottom: `1px solid ${isActive ? 'var(--teal-border)' : 'var(--border)'}` }}>
                        {/* Mini topbar */}
                        <div style={{ background: t.preview.bg2, borderRadius: '5px 5px 0 0', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', border: `1px solid ${t.id === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}` }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: t.preview.teal, opacity: 0.9 }} />
                          <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: t.preview.text, opacity: 0.7 }} />
                          <div style={{ flex: 1 }} />
                          <div style={{ width: '28px', height: '6px', borderRadius: '3px', background: t.preview.teal, opacity: 0.8 }} />
                        </div>
                        {/* Mini layout */}
                        <div style={{ display: 'flex', gap: '5px', height: '44px' }}>
                          {/* Sidebar */}
                          <div style={{ width: '32px', background: t.preview.bg2, borderRadius: '4px', border: `1px solid ${t.id === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`, padding: '4px' }}>
                            <div style={{ height: '5px', background: t.preview.teal, borderRadius: '2px', marginBottom: '3px', opacity: 0.8 }} />
                            <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', marginBottom: '2px' }} />
                            <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', width: '70%' }} />
                          </div>
                          {/* Main */}
                          <div style={{ flex: 1, background: t.preview.surface, borderRadius: '4px', border: `1px solid ${t.id === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`, padding: '5px' }}>
                            <div style={{ height: '5px', background: t.preview.text, borderRadius: '2px', marginBottom: '4px', width: '60%', opacity: 0.8 }} />
                            <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', marginBottom: '3px' }} />
                            <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', width: '80%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Label */}
                      <div style={{ padding: '10px 12px', background: 'var(--bg2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontFamily: 'var(--font-head)', fontSize: '13px', fontWeight: 700, color: isActive ? 'var(--teal)' : 'var(--text)' }}>
                            {t.name}
                          </span>
                          {isActive && (
                            <span style={{ fontFamily: 'var(--font-head)', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--teal-subtle)', color: 'var(--teal)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              Active
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text3)', margin: 0, lineHeight: 1.4 }}>
                          {t.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coming soon extras */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px 20px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: '4px' }}>More Customisation</h2>
              <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                Custom accent colours, font size, compact mode, and more — coming in a future update.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};