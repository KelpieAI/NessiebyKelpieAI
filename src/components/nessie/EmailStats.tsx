import { useState, useEffect } from 'react';
import { Mail, Eye, MousePointer, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmailStatsProps {
  leadId: string;
}

interface SentEmail {
  id: string;
  subject: string;
  sent_at: string;
  opened: boolean;
  open_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  clicked: boolean;
  click_count: number;
}

// Status config — maps email state to CSS variable colours
const getStatus = (email: SentEmail) => {
  if (email.open_count >= 3)
    return { icon: CheckCircle, color: 'var(--teal)',   text: `Opened ${email.open_count}x — Hot lead!` };
  if (email.opened)
    return { icon: Eye,         color: 'var(--blue)',   text: 'Opened' };
  if (!email.opened)
    return { icon: Clock,       color: 'var(--text3)',  text: 'Waiting for open' };
  return   { icon: XCircle,     color: 'var(--text3)',  text: 'Not opened yet' };
};

const getTimeSince = (dateString: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
};

export const EmailStats = ({ leadId }: EmailStatsProps) => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchEmailStats();
    const channel = supabase
      .channel('sent_emails_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sent_emails', filter: `lead_id=eq.${leadId}` }, fetchEmailStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leadId]);

  const fetchEmailStats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sent_emails')
      .select('id, subject, sent_at, opened, open_count, first_opened_at, last_opened_at, clicked, click_count')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false });
    if (!error) setEmails(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="ld-section">
        <div className="skeleton title" />
        <div className="skeleton text" />
        <div className="skeleton text" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="ld-section">
        <div className="es-empty">
          <Mail size={28} color="var(--text3)" style={{ opacity: 0.4 }} />
          <div className="es-empty-title">No emails sent yet</div>
          <div className="es-empty-sub">Click "Send Email" above to send your first email to this lead</div>
        </div>
      </div>
    );
  }

  const latest = emails[0];
  const status = getStatus(latest);
  const StatusIcon = status.icon;
  const totalOpens = emails.reduce((s, e) => s + e.open_count, 0);
  const totalClicks = emails.reduce((s, e) => s + e.click_count, 0);

  return (
    <div className="ld-section">
      <h2 className="ld-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Mail size={16} />
        Email History
      </h2>

      <div className="ld-content-block">

        {/* Latest email summary */}
        <div className="es-latest">
          <div className="es-latest-info">
            <div className="es-sent-at">Last sent: {getTimeSince(latest.sent_at)}</div>
            <div className="es-subject">{latest.subject}</div>
          </div>
          <div className="es-status-pill" style={{ color: status.color, background: `color-mix(in srgb, ${status.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${status.color} 25%, transparent)` }}>
            <StatusIcon size={13} />
            {status.text}
          </div>
        </div>

        {latest.last_opened_at && (
          <div className="es-last-activity">
            Last activity: {getTimeSince(latest.last_opened_at)}
          </div>
        )}

        {/* Stats grid */}
        <div className="es-stats-grid">
          <div className="es-stat">
            <div className="es-stat-label">Emails Sent</div>
            <div className="es-stat-val">{emails.length}</div>
          </div>
          <div className="es-stat">
            <div className="es-stat-label">Total Opens</div>
            <div className="es-stat-val" style={{ color: 'var(--blue)' }}>
              <Eye size={18} /> {totalOpens}
            </div>
          </div>
          <div className="es-stat">
            <div className="es-stat-label">Link Clicks</div>
            <div className="es-stat-val" style={{ color: 'var(--teal)' }}>
              <MousePointer size={18} /> {totalClicks}
            </div>
          </div>
        </div>

        {/* Toggle all emails */}
        {emails.length > 1 && (
          <button className="es-toggle-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? '▲ Hide' : '▼ View All'} Emails ({emails.length})
          </button>
        )}

        {/* All emails list */}
        {showAll && emails.length > 1 && (
          <div className="es-all-list">
            {emails.map((email, i) => (
              <div key={email.id} className="es-email-row" style={{ marginBottom: i < emails.length - 1 ? '8px' : 0 }}>
                <div className="es-email-row-top">
                  <span className="es-email-subject">{email.subject}</span>
                  <span className="es-email-time">{getTimeSince(email.sent_at)}</span>
                </div>
                <div className="es-email-row-meta">
                  <span className="es-email-meta-item">
                    <Eye size={11} /> {email.open_count} {email.open_count === 1 ? 'open' : 'opens'}
                  </span>
                  {email.click_count > 0 && (
                    <span className="es-email-meta-item">
                      <MousePointer size={11} /> {email.click_count} {email.click_count === 1 ? 'click' : 'clicks'}
                    </span>
                  )}
                  {email.opened && email.last_opened_at && (
                    <span className="es-email-meta-item">Last: {getTimeSince(email.last_opened_at)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};