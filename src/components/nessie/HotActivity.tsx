import { useState, useEffect } from 'react';
import { Eye, MousePointer, Mail, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Activity {
  id: string;
  type: 'open' | 'click' | 'sent';
  lead_id: string;
  lead_name: string;
  company_name: string;
  timestamp: string;
  email_subject: string;
  open_count?: number;
}

interface HotActivityProps {
  onLeadClick: (leadId: string) => void;
}

export const HotActivity = ({ onLeadClick }: HotActivityProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sent_emails',
        },
        () => {
          fetchActivities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_opens',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      // Fetch recent sent emails with lead info
      const { data: sentEmails } = await supabase
        .from('sent_emails')
        .select(`
          id,
          subject,
          sent_at,
          opened,
          open_count,
          last_opened_at,
          clicked,
          lead_id,
          successful_scrapes!inner (
            id,
            company,
            domain,
            full_name
          )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (!sentEmails) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Build activity list
      const activityList: Activity[] = [];

      sentEmails.forEach((email: any) => {
        const lead = email.successful_scrapes;
        const companyName = lead?.company || lead?.domain || 'Unknown';
        const leadName = lead?.full_name || 'Unknown';

        // Add open activity (if opened)
        if (email.opened && email.last_opened_at) {
          activityList.push({
            id: `open-${email.id}`,
            type: 'open',
            lead_id: email.lead_id,
            lead_name: leadName,
            company_name: companyName,
            timestamp: email.last_opened_at,
            email_subject: email.subject,
            open_count: email.open_count,
          });
        }

        // Add click activity (if clicked)
        if (email.clicked) {
          activityList.push({
            id: `click-${email.id}`,
            type: 'click',
            lead_id: email.lead_id,
            lead_name: leadName,
            company_name: companyName,
            timestamp: email.last_opened_at || email.sent_at,
            email_subject: email.subject,
          });
        }

        // Add sent activity (recent sends)
        const sentRecently = new Date(email.sent_at).getTime() > Date.now() - 3600000; // Last hour
        if (sentRecently) {
          activityList.push({
            id: `sent-${email.id}`,
            type: 'sent',
            lead_id: email.lead_id,
            lead_name: leadName,
            company_name: companyName,
            timestamp: email.sent_at,
            email_subject: email.subject,
          });
        }
      });

      // Sort by timestamp (most recent first)
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Take top 10
      setActivities(activityList.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'open':
        return <Eye size={14} color="#3b82f6" />;
      case 'click':
        return <MousePointer size={14} color="#22c55e" />;
      case 'sent':
        return <Mail size={14} color="#94a3b8" />;
      default:
        return <Mail size={14} />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'open':
        return activity.open_count && activity.open_count >= 3
          ? `Opened ${activity.open_count}x 🔥`
          : 'Opened email';
      case 'click':
        return 'Clicked link';
      case 'sent':
        return 'Email sent';
      default:
        return 'Activity';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>🔥</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
          No activity yet
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', opacity: 0.7 }}>
          Send some emails to see activity here
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {activities.map((activity) => (
        <div
          key={activity.id}
          onClick={() => onLeadClick(activity.lead_id)}
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ marginTop: '2px' }}>{getActivityIcon(activity.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activity.lead_name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activity.company_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {getActivityText(activity)} • {getTimeSince(activity.timestamp)}
              </div>
            </div>
            <ChevronRight size={14} color="#64748b" style={{ marginTop: '8px', flexShrink: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
};