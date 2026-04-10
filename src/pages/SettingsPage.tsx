import { useState } from 'react';
import {
  User, Users, Mail, FileText, Shield, Zap, Key,
  Settings, AlertTriangle, ChevronRight, CheckCircle,
  AlertCircle, Globe,
} from 'lucide-react';
import { EmailTemplatesManager } from '../components/EmailTemplatesManager';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import type { Theme } from '../hooks/useTheme';

// ── Theme data ────────────────────────────────────────────────────────────────

const THEMES: {
  id: Theme;
  name: string;
  description: string;
  preview: { bg: string; bg2: string; surface: string; teal: string; text: string; text2: string };
}[] = [
  {
    id: 'kelpie',
    name: 'Kelpie',
    description: 'Deep dark with teal — the Kelpie AI signature look',
    preview: { bg: '#080C10', bg2: '#0C1118', surface: '#192130', teal: '#0ABFA3', text: '#EEF2F7', text2: '#526478' },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Pure neutral dark — no tint, just clean black',
    preview: { bg: '#0D0D0D', bg2: '#141414', surface: '#222222', teal: '#0ABFA3', text: '#F2F2F2', text2: '#5C5C5C' },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light mode — easier on the eyes in bright rooms',
    preview: { bg: '#F4F6F8', bg2: '#FFFFFF', surface: '#EAECEF', teal: '#0ABFA3', text: '#0F1923', text2: '#8A9BB0' },
  },
];

// ── Nav structure ─────────────────────────────────────────────────────────────

type SectionId =
  | 'profile'
  | 'team'
  | 'email-config'
  | 'email-templates'
  | 'send-limits'
  | 'scraping-rules'
  | 'webhooks'
  | 'api-access'
  | 'preferences'
  | 'danger-zone';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  comingSoon?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile',    label: 'Profile',           icon: <User size={14} /> },
      { id: 'team',       label: 'Team & Permissions', icon: <Users size={14} />, comingSoon: true },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { id: 'email-config',    label: 'Email Configuration', icon: <Mail size={14} /> },
      { id: 'email-templates', label: 'Email Templates',     icon: <FileText size={14} /> },
      { id: 'send-limits',     label: 'Send Limits',         icon: <Shield size={14} />, badge: '!', comingSoon: true },
      { id: 'scraping-rules',  label: 'Scraping Rules',      icon: <Globe size={14} />, comingSoon: true },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'webhooks',   label: 'Webhooks',   icon: <Zap size={14} />, comingSoon: true },
      { id: 'api-access', label: 'API Access', icon: <Key size={14} />, comingSoon: true },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'preferences', label: 'Preferences', icon: <Settings size={14} /> },
      { id: 'danger-zone', label: 'Danger Zone',  icon: <AlertTriangle size={14} /> },
    ],
  },
];

// ── Shared card wrapper ───────────────────────────────────────────────────────

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: '24px',
    marginBottom: '16px', ...style,
  }}>
    {children}
  </div>
);

const CardHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)', margin: 0 }}>{title}</h2>
    {sub && <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>{sub}</p>}
  </div>
);

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 14px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px',
  }}>
    <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{value}</span>
  </div>
);

const ComingSoonBadge = () => (
  <span style={{
    fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
    background: 'rgba(255,197,0,0.12)', color: '#f59e0b',
    fontFamily: 'var(--font-head)', letterSpacing: '0.06em', textTransform: 'uppercase',
  }}>
    Soon
  </span>
);

// ── Section content ───────────────────────────────────────────────────────────

const ProfileSection = ({ profile }: { profile: any }) => (
  <>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: '#021014', fontFamily: 'var(--font-head)', flexShrink: 0,
        }}>
          {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>
            {profile?.full_name || 'Unknown'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
            {profile?.role === 'admin' ? 'Admin' : 'User'} · Kelpie AI
          </div>
        </div>
      </div>

      <FieldRow label="Full Name"  value={profile?.full_name || '—'} />
      <FieldRow label="Email"      value={profile?.email || '—'} />
      <FieldRow label="Role"       value={profile?.role === 'admin' ? 'Admin' : 'User'} />
      <FieldRow label="Gmail"      value={profile?.google_email || 'Not connected'} />
      <FieldRow label="Username"   value={profile?.username || '—'} />

      <p style={{ fontSize: '11px', color: 'var(--text4)', fontFamily: 'var(--font-body)', marginTop: '12px', marginBottom: 0 }}>
        Profile editing coming in a future update.
      </p>
    </Card>
  </>
);

const EmailConfigSection = ({ profile }: { profile: any }) => {
  const gmailConnected  = !!profile?.google_refresh_token;
  const gmailEmail      = profile?.google_email;

  return (
    <>
      <Card>
        <CardHeader title="Connected Email Accounts" sub="Accounts used to send outreach from Nessie" />

        {/* Gmail */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', marginBottom: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
              background: 'linear-gradient(135deg,#EA4335,#FBBC04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Gmail
                {gmailConnected && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: 'var(--teal-subtle)', color: 'var(--teal)', letterSpacing: '0.04em' }}>
                    PRIMARY
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {gmailConnected ? (
                  <><CheckCircle size={10} color="#22c55e" /><span style={{ color: '#22c55e' }}>{gmailEmail} · Connected</span></>
                ) : (
                  <><AlertCircle size={10} color="var(--text3)" /><span>Not connected — sign in with Google</span></>
                )}
              </div>
            </div>
          </div>
          {gmailConnected && (
            <div style={{ fontSize: '11px', color: 'var(--text4)', fontFamily: 'var(--font-body)' }}>
              Sign out and back in with Google to switch
            </div>
          )}
        </div>

        {/* Outlook — coming soon */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', opacity: 0.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
              background: 'linear-gradient(135deg,#0078D4,#50E6FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>
                Outlook / Microsoft 365
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                Coming soon
              </div>
            </div>
          </div>
          <ComingSoonBadge />
        </div>
      </Card>

      <Card>
        <CardHeader title="Sender Configuration" sub="How your outreach emails appear to recipients" />
        <FieldRow label="From Name"  value={profile?.full_name || '—'} />
        <FieldRow label="From Email" value={gmailEmail || '—'} />
        <FieldRow label="Provider"   value={gmailConnected ? 'Gmail (OAuth)' : 'Not configured'} />
        <p style={{ fontSize: '11px', color: 'var(--text4)', fontFamily: 'var(--font-body)', marginTop: '12px', marginBottom: 0 }}>
          Sender name and reply-to customisation coming in a future update.
        </p>
      </Card>
    </>
  );
};

const ComingSoonSection = ({ title, sub }: { title: string; sub: string }) => (
  <Card>
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Zap size={20} color="var(--text3)" />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)', maxWidth: '320px', margin: '0 auto' }}>
        {sub}
      </div>
      <div style={{
        display: 'inline-block', marginTop: '20px',
        padding: '6px 16px', borderRadius: '20px',
        background: 'rgba(255,197,0,0.1)', border: '1px solid rgba(255,197,0,0.2)',
        fontSize: '11px', fontWeight: 700, color: '#f59e0b',
        fontFamily: 'var(--font-head)', letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Coming Soon
      </div>
    </div>
  </Card>
);

const PreferencesSection = ({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) => (
  <Card>
    <CardHeader title="Theme" sub="Choose how Nessie looks. Saved automatically." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {THEMES.map((t) => {
        const isActive = theme === t.id;
        const borderColor = t.id === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              background: 'none',
              border: `2px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
              borderRadius: 'var(--r-lg)', padding: 0,
              cursor: 'pointer', transition: 'all 0.15s',
              overflow: 'hidden', textAlign: 'left',
              boxShadow: isActive ? '0 0 0 4px var(--teal-subtle)' : 'none',
            }}
          >
            <div style={{ background: t.preview.bg, padding: '12px', borderBottom: `1px solid ${isActive ? 'var(--teal-border)' : 'var(--border)'}` }}>
              <div style={{ background: t.preview.bg2, borderRadius: '5px 5px 0 0', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', border: `1px solid ${borderColor}` }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: t.preview.teal, opacity: 0.9 }} />
                <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: t.preview.text, opacity: 0.7 }} />
                <div style={{ flex: 1 }} />
                <div style={{ width: '28px', height: '6px', borderRadius: '3px', background: t.preview.teal, opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', gap: '5px', height: '44px' }}>
                <div style={{ width: '32px', background: t.preview.bg2, borderRadius: '4px', border: `1px solid ${borderColor}`, padding: '4px' }}>
                  <div style={{ height: '5px', background: t.preview.teal, borderRadius: '2px', marginBottom: '3px', opacity: 0.8 }} />
                  <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', marginBottom: '2px' }} />
                  <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', width: '70%' }} />
                </div>
                <div style={{ flex: 1, background: t.preview.surface, borderRadius: '4px', border: `1px solid ${borderColor}`, padding: '5px' }}>
                  <div style={{ height: '5px', background: t.preview.text, borderRadius: '2px', marginBottom: '4px', width: '60%', opacity: 0.8 }} />
                  <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', marginBottom: '3px' }} />
                  <div style={{ height: '4px', background: t.preview.text2, borderRadius: '2px', width: '80%' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--bg2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '13px', fontWeight: 700, color: isActive ? 'var(--teal)' : 'var(--text)' }}>
                  {t.name}
                </span>
                {isActive && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--teal-subtle)', color: 'var(--teal)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-head)' }}>
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
  </Card>
);

const DangerZoneSection = () => (
  <Card style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
    <CardHeader title="Danger Zone" sub="Destructive actions — these cannot be undone" />
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', background: 'rgba(239,68,68,0.05)',
      border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-md)',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: '2px' }}>
          Delete All Leads
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
          Permanently remove all scraped leads and batches
        </div>
      </div>
      <button style={{
        padding: '7px 14px', fontSize: '12px', fontWeight: 600,
        color: '#EF4444', background: 'transparent',
        border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--r-md)',
        cursor: 'not-allowed', opacity: 0.6, fontFamily: 'var(--font-head)',
      }}>
        Coming Soon
      </button>
    </div>
  </Card>
);

// ── Section page headers ──────────────────────────────────────────────────────

const PAGE_META: Record<SectionId, { eyebrow: string; title: string; sub: string }> = {
  'profile':          { eyebrow: 'Account Settings',  title: 'Profile',           sub: 'Your personal account details' },
  'team':             { eyebrow: 'Account Settings',  title: 'Team & Permissions', sub: 'Manage team members and roles' },
  'email-config':     { eyebrow: 'Outreach',          title: 'Email Configuration', sub: 'Connected accounts and sender settings' },
  'email-templates':  { eyebrow: 'Outreach',          title: 'Email Templates',    sub: 'Reusable templates for outreach campaigns' },
  'send-limits':      { eyebrow: 'Outreach',          title: 'Send Limits',        sub: 'Daily and hourly send rate controls' },
  'scraping-rules':   { eyebrow: 'Outreach',          title: 'Scraping Rules',     sub: 'Control how Nessie scrapes websites' },
  'webhooks':         { eyebrow: 'Integrations',      title: 'Webhooks',           sub: 'Send data to external services' },
  'api-access':       { eyebrow: 'Integrations',      title: 'API Access',         sub: 'Manage API keys and access tokens' },
  'preferences':      { eyebrow: 'System',            title: 'Preferences',        sub: 'Appearance and display settings' },
  'danger-zone':      { eyebrow: 'System',            title: 'Danger Zone',        sub: 'Irreversible actions — proceed with caution' },
};

// ── Main component ────────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();

  const meta = PAGE_META[activeSection];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection profile={profile} />;
      case 'email-config':
        return <EmailConfigSection profile={profile} />;
      case 'email-templates':
        return <EmailTemplatesManager />;
      case 'preferences':
        return <PreferencesSection theme={theme} setTheme={setTheme} />;
      case 'danger-zone':
        return <DangerZoneSection />;
      case 'team':
        return <ComingSoonSection title="Team & Permissions" sub="Invite team members, assign roles, and control who can access what in Nessie." />;
      case 'send-limits':
        return <ComingSoonSection title="Send Limits" sub="Set daily and hourly caps on outreach emails to protect your sender reputation." />;
      case 'scraping-rules':
        return <ComingSoonSection title="Scraping Rules" sub="Customise how Nessie scrapes websites — set excluded domains, rate limits, and content filters." />;
      case 'webhooks':
        return <ComingSoonSection title="Webhooks" sub="Push lead data, email events, and batch completions to any external URL automatically." />;
      case 'api-access':
        return <ComingSoonSection title="API Access" sub="Generate API keys to integrate Nessie with your own tools and workflows." />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: '220px', flexShrink: 0,
        background: 'var(--bg)', borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '20px 0',
      }}>
        {/* Nessie branding */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>Nessie</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '1px' }}>Kelpie AI · Outreach Console</div>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: '4px' }}>
            <div style={{
              padding: '8px 16px 4px',
              fontSize: '9px', fontWeight: 700, color: 'var(--text4)',
              fontFamily: 'var(--font-head)', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '8px 16px', fontSize: '13px',
                    fontFamily: 'var(--font-body)', fontWeight: isActive ? 600 : 400,
                    color: item.id === 'danger-zone'
                      ? (isActive ? '#EF4444' : 'rgba(239,68,68,0.7)')
                      : isActive ? 'var(--teal)' : 'var(--text2)',
                    background: isActive ? 'var(--teal-subtle)' : 'transparent',
                    border: 'none', borderRadius: '0',
                    cursor: 'pointer', transition: 'all 0.12s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && !isActive && (
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.badge}
                    </span>
                  )}
                  {item.comingSoon && !isActive && (
                    <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,197,0,0.1)', color: '#f59e0b', fontFamily: 'var(--font-head)', letterSpacing: '0.04em' }}>
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--font-head)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {meta.eyebrow}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text)', margin: 0, letterSpacing: '-0.4px' }}>
            {meta.title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
            {meta.sub}
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};