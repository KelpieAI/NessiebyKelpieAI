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

export const EmailStats = ({ leadId }: EmailStatsProps) => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmails, setShowAllEmails] = useState(false);

  useEffect(() => {
    fetchEmailStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sent_emails_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sent_emails',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          fetchEmailStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchEmailStats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sent_emails')
      .select('id, subject, sent_at, opened, open_count, first_opened_at, last_opened_at, clicked, click_count')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching email stats:', error);
    } else {
      setEmails(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
        Loading email history...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <Mail size={32} color="#64748b" style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
          No emails sent yet
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Click "Send Email" above to send your first email to this lead
        </div>
      </div>
    );
  }

  const latestEmail = emails[0];
  const totalOpens = emails.reduce((sum, e) => sum + e.open_count, 0);
  const totalClicks = emails.reduce((sum, e) => sum + e.click_count, 0);
  const openedCount = emails.filter(e => e.opened).length;

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatus = () => {
    if (!latestEmail.opened) {
      return { icon: Clock, color: '#94a3b8', text: 'Waiting for reply' };
    }
    if (latestEmail.open_count >= 3) {
      return { icon: CheckCircle, color: '#22c55e', text: `Opened ${latestEmail.open_count}x - Hot lead!` };
    }
    if (latestEmail.opened) {
      return { icon: Eye, color: '#3b82f6', text: 'Opened' };
    }
    return { icon: XCircle, color: '#64748b', text: 'Not opened yet' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div style={{ marginTop: '48px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Mail size={18} />
        Email History
      </h2>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        {/* Latest Email Summary */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Last sent: {getTimeSince(latestEmail.sent_at)}
              </div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                {latestEmail.subject}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: `${status.color}15`,
                border: `1px solid ${status.color}30`,
                borderRadius: '6px',
              }}
            >
              <StatusIcon size={14} color={status.color} />
              <span style={{ fontSize: '12px', color: status.color, fontWeight: 600 }}>
                {status.text}
              </span>
            </div>
          </div>

          {latestEmail.last_opened_at && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Last activity: {getTimeSince(latestEmail.last_opened_at)}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Emails Sent
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#e2e8f0' }}>
              {emails.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Total Opens
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={20} />
              {totalOpens}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Link Clicks
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MousePointer size={20} />
              {totalClicks}
            </div>
          </div>
        </div>

        {/* View All Button */}
        {emails.length > 1 && (
          <button
            onClick={() => setShowAllEmails(!showAllEmails)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {showAllEmails ? '▲ Hide' : '▼ View All'} Emails ({emails.length})
          </button>
        )}

        {/* All Emails List */}
        {showAllEmails && emails.length > 1 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            {emails.map((email, index) => (
              <div
                key={email.id}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '6px',
                  marginBottom: index < emails.length - 1 ? '8px' : '0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {getTimeSince(email.sent_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} />
                    {email.open_count} {email.open_count === 1 ? 'open' : 'opens'}
                  </span>
                  {email.click_count > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MousePointer size={12} />
                      {email.click_count} {email.click_count === 1 ? 'click' : 'clicks'}
                    </span>
                  )}
                  {email.opened && email.last_opened_at && (
                    <span style={{ color: '#64748b' }}>
                      Last: {getTimeSince(email.last_opened_at)}
                    </span>
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