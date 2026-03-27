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

    const channel = supabase
      .channel('activity_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sent_emails' }, () => fetchActivities())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_opens' }, () => fetchActivities())
      .subscribe();

    const interval = setInterval(fetchActivities, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;
    try {
      const { data: sentEmails } = await supabase
        .from('sent_emails')
        .select(`
          id, subject, sent_at, opened, open_count, last_opened_at, clicked, lead_id,
          successful_scrapes!inner ( id, company, domain, full_name )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (!sentEmails) { setActivities([]); setLoading(false); return; }

      const activityList: Activity[] = [];

      sentEmails.forEach((email: any) => {
        const lead = email.successful_scrapes;
        const companyName = lead?.company || lead?.domain || 'Unknown';
        const leadName = lead?.full_name || 'Unknown';

        if (email.opened && email.last_opened_at) {
          activityList.push({ id: `open-${email.id}`, type: 'open', lead_id: email.lead_id, lead_name: leadName, company_name: companyName, timestamp: email.last_opened_at, email_subject: email.subject, open_count: email.open_count });
        }
        if (email.clicked) {
          activityList.push({ id: `click-${email.id}`, type: 'click', lead_id: email.lead_id, lead_name: leadName, company_name: companyName, timestamp: email.last_opened_at || email.sent_at, email_subject: email.subject });
        }
        if (new Date(email.sent_at).getTime() > Date.now() - 3600000) {
          activityList.push({ id: `sent-${email.id}`, type: 'sent', lead_id: email.lead_id, lead_name: leadName, company_name: companyName, timestamp: email.sent_at, email_subject: email.subject });
        }
      });

      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activityList.slice(0, 10));
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const typeConfig = {
    open:  { icon: <Eye size={13} />,         color: 'var(--blue)',   label: (a: Activity) => a.open_count && a.open_count >= 3 ? `Opened ${a.open_count}x 🔥` : 'Opened email' },
    click: { icon: <MousePointer size={13} />, color: 'var(--teal)',   label: () => 'Clicked link' },
    sent:  { icon: <Mail size={13} />,         color: 'var(--text3)',  label: () => 'Email sent' },
  };

  if (loading) {
    return (
      <div className="ha-loading">
        <div className="skeleton" style={{ width: '100%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '80%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '90%' }} />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="ha-empty">
        <div className="ha-empty-icon">🔥</div>
        <div className="ha-empty-title">No activity yet</div>
        <div className="ha-empty-sub">Send some emails to see activity here</div>
      </div>
    );
  }

  return (
    <div className="ha-list">
      {activities.map((activity) => {
        const cfg = typeConfig[activity.type];
        return (
          <div key={activity.id} className="ha-item" onClick={() => onLeadClick(activity.lead_id)}>
            <div className="ha-item-icon" style={{ color: cfg.color }}>{cfg.icon}</div>
            <div className="ha-item-body">
              <div className="ha-item-name">{activity.lead_name}</div>
              <div className="ha-item-company">{activity.company_name}</div>
              <div className="ha-item-meta">{cfg.label(activity)} · {getTimeSince(activity.timestamp)}</div>
            </div>
            <ChevronRight size={12} className="ha-item-arrow" />
          </div>
        );
      })}
    </div>
  );
};