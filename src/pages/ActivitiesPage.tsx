import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatTimeAgo } from '../utils/time';
import {
  Mail, Eye, MousePointer, MessageSquare, CheckCircle2,
  ChevronDown, ChevronUp, ExternalLink, Inbox,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SentEmail {
  id: string;
  lead_id: string;
  to_email: string;
  to_name: string | null;
  subject: string | null;
  opened: boolean;
  open_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  clicked: boolean;
  click_count: number;
  sent_at: string;
  error: string | null;
  lead?: {
    company: string | null;
    lead_status: string | null;
    batch_uuid: string | null;
    batch_label?: string | null;
  };
}

interface BatchSummary {
  id: string;
  label: string;
  channel: string;
  created_at: string;
  emails_written: number;
  emails_sent: number;
  emails_opened: number;
  replies: number;
}

type FilterTab = 'all' | 'opened' | 'replied' | 'clicked';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEAL   = '#0ABFA3';
const BLUE   = '#3B82F6';
const AMBER  = '#F59E0B';
const DANGER = '#EF4444';
const GREEN  = '#10B981';

const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: '18px 20px',
  }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }}>
      {label}
    </div>
    <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-head)', color: color || 'var(--text)', letterSpacing: '-1px', lineHeight: 1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '6px' }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{sub}</div>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const StatusDot = ({ opened, open_count, replied }: { opened: boolean; open_count: number; replied: boolean }) => {
  if (replied) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 600, color: GREEN, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50px', padding: '2px 8px', fontFamily: 'var(--font-head)' }}>
      <MessageSquare size={10} /> Replied
    </span>
  );
  if (open_count >= 3) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 600, color: AMBER, background: 'rgba(245,159,11,0.1)', border: '1px solid rgba(245,159,11,0.25)', borderRadius: '50px', padding: '2px 8px', fontFamily: 'var(--font-head)' }}>
      <Eye size={10} /> Hot — {open_count}x opens
    </span>
  );
  if (opened) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 600, color: BLUE, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '50px', padding: '2px 8px', fontFamily: 'var(--font-head)' }}>
      <Eye size={10} /> Opened {open_count > 1 ? `${open_count}x` : ''}
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 600, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50px', padding: '2px 8px', fontFamily: 'var(--font-head)' }}>
      <Mail size={10} /> Sent
    </span>
  );
};

// ── Email row ─────────────────────────────────────────────────────────────────

const EmailRow = ({ email }: { email: SentEmail }) => {
  const [expanded, setExpanded] = useState(false);
  const replied = email.lead?.lead_status === 'replied';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', overflow: 'hidden',
      transition: 'border-color 0.14s',
    }}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 120px 90px',
          gap: '12px', padding: '12px 14px', cursor: 'pointer',
          alignItems: 'center',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Lead + email info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email.lead?.company || email.to_name || email.to_email}
            </span>
            {email.lead?.batch_label && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text3)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {email.lead.batch_label}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text3)', fontFamily: 'var(--font-body)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: 'var(--teal)', fontWeight: 500 }}>{email.to_email}</span>
            {email.subject && <><span style={{ color: 'var(--text4)' }}>·</span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{email.subject}</span></>}
          </div>
        </div>

        {/* Status badge */}
        <div>
          <StatusDot opened={email.opened} open_count={email.open_count} replied={replied} />
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: email.opened ? BLUE : 'var(--text4)' }}>
            <Eye size={11} />{email.open_count || 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: email.clicked ? TEAL : 'var(--text4)' }}>
            <MousePointer size={11} />{email.click_count || 0}
          </div>
        </div>

        {/* Sent time + expand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text4)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            {formatTimeAgo(email.sent_at)}
          </span>
          {expanded ? <ChevronUp size={13} color="var(--text3)" /> : <ChevronDown size={13} color="var(--text3)" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 14px',
          background: 'var(--bg2)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text4)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>To</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              {email.to_name ? <><span style={{ fontWeight: 600 }}>{email.to_name}</span><br /></> : null}
              {email.to_email}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text4)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>Sent</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              {new Date(email.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text4)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>First Opened</div>
            <div style={{ fontSize: '12px', color: email.first_opened_at ? BLUE : 'var(--text4)', fontFamily: 'var(--font-body)', fontStyle: email.first_opened_at ? 'normal' : 'italic' }}>
              {email.first_opened_at
                ? new Date(email.first_opened_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Not yet opened'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text4)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>Last Opened</div>
            <div style={{ fontSize: '12px', color: email.last_opened_at ? BLUE : 'var(--text4)', fontFamily: 'var(--font-body)', fontStyle: email.last_opened_at ? 'normal' : 'italic' }}>
              {email.last_opened_at
                ? formatTimeAgo(email.last_opened_at)
                : '—'}
            </div>
          </div>
          {email.error && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: DANGER, fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>Error</div>
              <div style={{ fontSize: '12px', color: DANGER, fontFamily: 'var(--font-body)' }}>{email.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const ActivitiesPage = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [batchSummaries, setBatchSummaries] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [stats, setStats] = useState({ sent: 0, opened: 0, clicked: 0, replied: 0, openRate: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sent emails with lead data
      const { data: sentData } = await supabase
        .from('sent_emails')
        .select('id, lead_id, to_email, to_name, subject, opened, open_count, first_opened_at, last_opened_at, clicked, click_count, sent_at, error')
        .order('sent_at', { ascending: false })
        .limit(200);

      if (!sentData) { setLoading(false); return; }

      // Get unique lead IDs and batch UUIDs
      const leadIds = [...new Set(sentData.map(e => e.lead_id).filter(Boolean))];

      let leadsMap: Record<string, any> = {};
      let batchLabels: Record<string, string> = {};

      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from('successful_scrapes')
          .select('id, company, lead_status, batch_uuid')
          .in('id', leadIds);

        const batchUuids = [...new Set((leadsData || []).map(l => l.batch_uuid).filter(Boolean))];

        if (batchUuids.length > 0) {
          const { data: batchData } = await supabase
            .from('batches')
            .select('id, label')
            .in('id', batchUuids);

          (batchData || []).forEach(b => { batchLabels[b.id] = b.label; });
        }

        (leadsData || []).forEach(l => {
          leadsMap[l.id] = { ...l, batch_label: batchLabels[l.batch_uuid] || null };
        });
      }

      const enriched: SentEmail[] = sentData.map(e => ({
        ...e,
        lead: e.lead_id ? leadsMap[e.lead_id] : undefined,
      }));

      setEmails(enriched);

      // Compute stats
      const sent    = enriched.length;
      const opened  = enriched.filter(e => e.opened).length;
      const clicked = enriched.filter(e => e.clicked).length;
      const replied = enriched.filter(e => e.lead?.lead_status === 'replied').length;
      setStats({ sent, opened, clicked, replied, openRate: sent > 0 ? Math.round(opened / sent * 100) : 0 });

      // Batch summaries — fetch batches that have emails written (message field populated)
      const { data: batchesData } = await supabase
        .from('batches')
        .select('id, label, channel, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (batchesData) {
        const summaries = await Promise.all(
          batchesData.map(async batch => {
            const [writtenRes, repliesRes] = await Promise.all([
              supabase.from('successful_scrapes')
                .select('id', { count: 'exact', head: true })
                .eq('batch_uuid', batch.id)
                .not('message', 'is', null),
              supabase.from('successful_scrapes')
                .select('id', { count: 'exact', head: true })
                .eq('batch_uuid', batch.id)
                .eq('lead_status', 'replied'),
            ]);

            const batchEmails = enriched.filter(e => e.lead?.batch_uuid === batch.id);
            const emailsSent   = batchEmails.length;
            const emailsOpened = batchEmails.filter(e => e.opened).length;

            return {
              id: batch.id,
              label: batch.label,
              channel: batch.channel,
              created_at: batch.created_at,
              emails_written: writtenRes.count || 0,
              emails_sent: emailsSent,
              emails_opened: emailsOpened,
              replies: repliesRes.count || 0,
            };
          })
        );
        setBatchSummaries(summaries.filter(b => b.emails_written > 0 || b.emails_sent > 0));
      }
    } catch (err) {
      console.error('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(e => {
    if (filter === 'all')     return true;
    if (filter === 'opened')  return e.opened;
    if (filter === 'clicked') return e.clicked;
    if (filter === 'replied') return e.lead?.lead_status === 'replied';
    return true;
  });

  const TABS: { label: string; value: FilterTab; count?: number }[] = [
    { label: 'All Sent', value: 'all', count: stats.sent },
    { label: 'Opened',   value: 'opened',  count: stats.opened },
    { label: 'Clicked',  value: 'clicked', count: stats.clicked },
    { label: 'Replied',  value: 'replied', count: stats.replied },
  ];

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--font-head)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Outreach Tracker
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text)', margin: 0, letterSpacing: '-0.5px' }}>
          Activities
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
          Email sends, opens, clicks and replies across all batches
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
          Loading activities…
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <StatCard label="Emails Sent"    value={stats.sent}          color={TEAL}  sub="All time" />
            <StatCard label="Opened"         value={stats.opened}        color={BLUE}  sub={`${stats.openRate}% open rate`} />
            <StatCard label="Link Clicks"    value={stats.clicked}       color={AMBER} sub={stats.sent > 0 ? `${Math.round(stats.clicked / stats.sent * 100)}% click rate` : '0% click rate'} />
            <StatCard label="Replies"        value={stats.replied}       color={GREEN} sub={stats.sent > 0 ? `${Math.round(stats.replied / stats.sent * 100)}% reply rate` : '0% reply rate'} />
            <StatCard label="Batches Active" value={batchSummaries.length} color="var(--text)" sub="With email activity" />
          </div>

          {/* ── Two-column body ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', alignItems: 'start' }}>

            {/* ── Left: sent emails feed ── */}
            <SectionCard
              title="Sent Emails"
              sub="All outreach emails with tracking data"
              right={
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '3px' }}>
                  {TABS.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => setFilter(tab.value)}
                      style={{
                        padding: '5px 12px', fontSize: '11.5px', fontWeight: 600, fontFamily: 'var(--font-head)',
                        background: filter === tab.value ? 'var(--teal)' : 'transparent',
                        color: filter === tab.value ? '#021014' : 'var(--text3)',
                        border: 'none', borderRadius: 'calc(var(--r-md) - 2px)',
                        cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          background: filter === tab.value ? 'rgba(0,0,0,0.18)' : 'var(--border)',
                          color: filter === tab.value ? '#021014' : 'var(--text3)',
                          borderRadius: '50px', padding: '0 5px',
                        }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              }
            >
              {/* Table header */}
              {filteredEmails.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 120px 90px',
                  gap: '12px', padding: '0 14px 8px', borderBottom: '1px solid var(--border)', marginBottom: '8px',
                }}>
                  {['Lead', 'Status', 'Engagement', 'Sent'].map(h => (
                    <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredEmails.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Inbox size={22} color="var(--text4)" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', fontFamily: 'var(--font-head)', marginBottom: '4px' }}>
                      No emails {filter !== 'all' ? `(${filter})` : 'sent yet'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text4)', fontFamily: 'var(--font-body)' }}>
                      {filter === 'all' ? 'Send your first outreach email from a lead detail view.' : `No emails match this filter.`}
                    </div>
                  </div>
                ) : (
                  filteredEmails.map(email => <EmailRow key={email.id} email={email} />)
                )}
              </div>
            </SectionCard>

            {/* ── Right: batch summaries ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <SectionCard title="Batch Breakdown" sub="Email activity by batch">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {batchSummaries.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                      No batch activity yet
                    </div>
                  ) : (
                    batchSummaries.map(batch => (
                      <div key={batch.id}>
                        <div
                          style={{
                            padding: '10px 12px',
                            background: expandedBatch === batch.id ? 'var(--surface2)' : 'var(--surface)',
                            border: `1px solid ${expandedBatch === batch.id ? 'var(--teal-border)' : 'var(--border)'}`,
                            borderRadius: expandedBatch === batch.id ? 'var(--r-md) var(--r-md) 0 0' : 'var(--r-md)',
                            cursor: 'pointer',
                            transition: 'all 0.14s',
                          }}
                          onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                              {batch.label}
                            </span>
                            {expandedBatch === batch.id ? <ChevronUp size={13} color="var(--text3)" /> : <ChevronDown size={13} color="var(--text3)" />}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                              <CheckCircle2 size={11} color={TEAL} />
                              <span style={{ color: TEAL, fontWeight: 600 }}>{batch.emails_written}</span> written
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                              <Mail size={11} color={BLUE} />
                              <span style={{ color: BLUE, fontWeight: 600 }}>{batch.emails_sent}</span> sent
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                              <Eye size={11} color={AMBER} />
                              <span style={{ color: batch.emails_opened > 0 ? AMBER : 'var(--text4)', fontWeight: 600 }}>{batch.emails_opened}</span> opened
                            </div>
                            {batch.replies > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                                <MessageSquare size={11} color={GREEN} />
                                <span style={{ color: GREEN, fontWeight: 600 }}>{batch.replies}</span> replied
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded batch detail */}
                        {expandedBatch === batch.id && (
                          <div style={{
                            borderLeft: `1px solid var(--teal-border)`,
                            borderRight: `1px solid var(--teal-border)`,
                            borderBottom: `1px solid var(--teal-border)`,
                            borderRadius: '0 0 var(--r-md) var(--r-md)',
                            padding: '10px 12px',
                            background: 'var(--bg2)',
                            display: 'flex', flexDirection: 'column', gap: '6px',
                          }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text4)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Performance
                            </div>
                            {[
                              { label: 'Open rate', value: batch.emails_sent > 0 ? `${Math.round(batch.emails_opened / batch.emails_sent * 100)}%` : '—', color: AMBER },
                              { label: 'Reply rate', value: batch.emails_sent > 0 ? `${Math.round(batch.replies / batch.emails_sent * 100)}%` : '—', color: GREEN },
                              { label: 'Created', value: formatTimeAgo(batch.created_at), color: 'var(--text3)' },
                              { label: 'Channel', value: batch.channel || 'email', color: 'var(--text3)' },
                            ].map(({ label, value, color }) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontFamily: 'var(--font-body)' }}>
                                <span style={{ color: 'var(--text3)' }}>{label}</span>
                                <span style={{ color, fontWeight: 600 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              {/* Replies spotlight */}
              {stats.replied > 0 && (
                <SectionCard title="Replies" sub="Leads who replied">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {emails
                      .filter(e => e.lead?.lead_status === 'replied')
                      .slice(0, 8)
                      .map(e => (
                        <div key={e.id} style={{
                          padding: '8px 10px',
                          background: 'rgba(16,185,129,0.05)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: 'var(--r-md)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <MessageSquare size={11} color={GREEN} />
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>
                              {e.lead?.company || e.to_name || e.to_email}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', paddingLeft: '17px' }}>
                            <span style={{ color: 'var(--teal)' }}>{e.to_email}</span>
                            {e.lead?.batch_label && <><span>·</span><span>{e.lead.batch_label}</span></>}
                          </div>
                        </div>
                      ))}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
