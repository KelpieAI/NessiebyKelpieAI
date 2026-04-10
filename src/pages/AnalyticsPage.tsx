import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { formatTimeAgo } from '../utils/time';

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalLeads: number;
  leadsWithEmail: number;
  totalFailed: number;
  totalBatches: number;
  successRate: number;
  avgLeadsPerBatch: number;
  contacted: number;
  industries: { name: string; value: number }[];
  leadsPerDay: { date: string; leads: number; contacted: number }[];
  topBatches: { id: string; label: string; lead_count: number; with_email: number }[];
  statusSplit: { name: string; value: number; color: string }[];
  recentBatches: { id: string; label: string; created_at: string; lead_count: number }[];
}

type Period = '7' | '30' | '90' | 'all';

const TEAL    = '#0ABFA3';
const BLUE    = '#3B82F6';
const PURPLE  = '#8B5CF6';
const AMBER   = '#F59E0B';
const DANGER  = '#EF4444';
const GRAY    = '#526478';

const INDUSTRY_COLORS = [TEAL, BLUE, PURPLE, AMBER, '#10B981', '#F472B6'];

// ── Helper: get date cutoff ──────────────────────────────────────────────────
function getCutoff(period: Period): string | null {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - parseInt(period));
  return d.toISOString();
}

// ── Helper: format date label ────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, color, dimmed,
}: {
  label: string; value: string | number; sub?: string; color?: string; dimmed?: boolean;
}) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: '18px 20px',
    opacity: dimmed ? 0.5 : 1,
  }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', fontFamily: 'var(--font-head)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }}>
      {label}
    </div>
    <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-head)', color: color || 'var(--text)', letterSpacing: '-1px', lineHeight: 1 }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: '6px' }}>
        {sub}
      </div>
    )}
  </div>
);

const SectionCard = ({ title, sub, children, right }: {
  title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode;
}) => (
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

// ── Main page ────────────────────────────────────────────────────────────────

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30');

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const cutoff = getCutoff(period);

      // Base query builder
      const leadsQ  = () => supabase.from('successful_scrapes').select('*', { count: 'exact', head: true });
      const failedQ = () => supabase.from('failed_scrapes').select('id', { count: 'exact', head: true });

      // Apply time filter
      const applyTime = (q: any) => cutoff ? q.gte('created_at', cutoff) : q;

      const [
        leadsRes,
        leadsWithEmailRes,
        failedRes,
        batchesRes,
        contactedRes,
        industriesRes,
        leadsPerDayRes,
        topBatchesRes,
        statusRes,
        recentBatchesRes,
      ] = await Promise.all([
        applyTime(leadsQ()),
        applyTime(supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }).not('emails', 'eq', '[]')),
        applyTime(failedQ()),
        cutoff
          ? supabase.from('batches').select('id', { count: 'exact', head: true }).gte('created_at', cutoff)
          : supabase.from('batches').select('id', { count: 'exact', head: true }),
        applyTime(supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }).in('lead_status', ['contacted', 'replied', 'qualified'])),
        applyTime(supabase.from('successful_scrapes').select('industry')),
        applyTime(supabase.from('successful_scrapes').select('created_at, lead_status')),
        supabase.from('batches').select('id, label, created_at').order('created_at', { ascending: false }).limit(10),
        applyTime(supabase.from('successful_scrapes').select('lead_status')),
        supabase.from('batches').select('id, label, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalLeads       = leadsRes.count || 0;
      const leadsWithEmail   = leadsWithEmailRes.count || 0;
      const totalFailed      = failedRes.count || 0;
      const totalBatches     = batchesRes.count || 0;
      const contacted        = contactedRes.count || 0;
      const successRate      = totalLeads + totalFailed > 0 ? (totalLeads / (totalLeads + totalFailed)) * 100 : 0;
      const avgLeadsPerBatch = totalBatches > 0 ? totalLeads / totalBatches : 0;

      // Industry breakdown
      const industryCounts: Record<string, number> = {};
      industriesRes.data?.forEach(row => {
        const ind = row.industry || 'Unknown';
        industryCounts[ind] = (industryCounts[ind] || 0) + 1;
      });
      const industries = Object.entries(industryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Leads per day — bucket by date
      const dayMap: Record<string, { leads: number; contacted: number }> = {};
      const days = period === 'all' ? 90 : parseInt(period);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = { leads: 0, contacted: 0 };
      }
      leadsPerDayRes.data?.forEach(row => {
        const key = row.created_at.split('T')[0];
        if (dayMap[key]) {
          dayMap[key].leads++;
          if (['contacted', 'replied', 'qualified'].includes(row.lead_status)) {
            dayMap[key].contacted++;
          }
        }
      });
      const leadsPerDay = Object.entries(dayMap).map(([date, vals]) => ({
        date: fmtDate(date),
        ...vals,
      }));

      // Top batches with lead counts
      const topBatches = await Promise.all(
        (topBatchesRes.data || []).map(async batch => {
          const [totalRes, emailRes] = await Promise.all([
            supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }).eq('batch_uuid', batch.id),
            supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }).eq('batch_uuid', batch.id).not('emails', 'eq', '[]'),
          ]);
          return {
            id: batch.id,
            label: batch.label,
            lead_count: totalRes.count || 0,
            with_email: emailRes.count || 0,
          };
        })
      );

      // Lead status split for donut
      const statusCounts: Record<string, number> = {};
      statusRes.data?.forEach(row => {
        const s = row.lead_status || 'new';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusColors: Record<string, string> = {
        new: GRAY, contacted: TEAL, replied: BLUE, qualified: '#10B981', dead: DANGER,
      };
      const statusSplit = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value, color: statusColors[name] || GRAY }))
        .sort((a, b) => b.value - a.value);

      // Recent batches
      const recentBatches = await Promise.all(
        (recentBatchesRes.data || []).map(async batch => {
          const { count } = await supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }).eq('batch_uuid', batch.id);
          return { ...batch, lead_count: count || 0 };
        })
      );

      setData({ totalLeads, leadsWithEmail, totalFailed, totalBatches, successRate, avgLeadsPerBatch, contacted, industries, leadsPerDay, topBatches, statusSplit, recentBatches });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7 days', value: '7' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--font-head)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Performance Overview
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text)', margin: 0, letterSpacing: '-0.5px' }}>
            Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
            Outreach performance across all batches
          </p>
        </div>

        {/* Period filter */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '3px' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-head)',
                background: period === p.value ? 'var(--teal)' : 'transparent',
                color: period === p.value ? '#021014' : 'var(--text3)',
                border: 'none', borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
          Loading analytics…
        </div>
      ) : !data ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Failed to load data.</div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <StatCard label="Total Leads Found"  value={data.totalLeads}                          color={TEAL}   sub="All time" />
            <StatCard label="Leads with Email"   value={data.leadsWithEmail}                      color="var(--text)" sub={`${data.totalLeads > 0 ? Math.round(data.leadsWithEmail / data.totalLeads * 100) : 0}% of leads`} />
            <StatCard label="Scrape Success Rate" value={`${data.successRate.toFixed(1)}%`}       color={BLUE}   sub={`${data.totalFailed} failed`} />
            <StatCard label="Contacted"          value={data.contacted}                           color={PURPLE} sub="Marked as contacted" />
            <StatCard label="Failed Scrapes"     value={data.totalFailed}                         color={DANGER} sub="Could not scrape" />
            <StatCard label="Avg Leads / Batch"  value={data.avgLeadsPerBatch.toFixed(1)}         color={AMBER}  sub={`${data.totalBatches} batches total`} />
          </div>

          {/* ── Middle row: chart + funnel ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px', marginBottom: '12px' }}>

            {/* Line chart */}
            <SectionCard title="Lead Activity" sub={`Leads found per day — last ${period === 'all' ? '90' : period} days`}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.leadsPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-body)' }}
                    tickLine={false} axisLine={false}
                    interval={Math.floor(data.leadsPerDay.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-body)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-body)' }}
                    labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--text3)' }}
                  />
                  <Line type="monotone" dataKey="leads"     stroke={TEAL}   strokeWidth={2} dot={false} name="Leads Found" />
                  <Line type="monotone" dataKey="contacted" stroke={PURPLE} strokeWidth={2} dot={false} name="Contacted" />
                </LineChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                {[{ color: TEAL, label: 'Leads Found' }, { color: PURPLE, label: 'Contacted' }].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                    <div style={{ width: '16px', height: '2px', background: color, borderRadius: '1px' }} />
                    {label}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Lead funnel */}
            <SectionCard title="Lead Funnel" sub="Conversion this period">
              {(() => {
                const leadsWithEmailPct = data.totalLeads > 0 ? data.leadsWithEmail / data.totalLeads : 0;
                const contactedPct     = data.totalLeads > 0 ? data.contacted / data.totalLeads : 0;
                const rows = [
                  { label: 'Found',        value: data.totalLeads,     pct: 1,               color: TEAL },
                  { label: 'Has Email',    value: data.leadsWithEmail,  pct: leadsWithEmailPct, color: BLUE },
                  { label: 'Contacted',    value: data.contacted,       pct: contactedPct,    color: PURPLE },
                  { label: 'Sent',         value: '—',                  pct: 0,               color: GRAY, dim: true },
                  { label: 'Opened',       value: '—',                  pct: 0,               color: GRAY, dim: true },
                ];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rows.map(({ label, value, pct, color, dim }) => (
                      <div key={label} style={{ opacity: dim ? 0.4 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text3)' }}>{label}</span>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                            {typeof value === 'number' && <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: '6px' }}>{Math.round(pct * 100)}%</span>}
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--surface)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(pct * 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text4)', fontFamily: 'var(--font-body)' }}>
                      * Email open/reply tracking coming soon
                    </div>
                  </div>
                );
              })()}
            </SectionCard>
          </div>

          {/* ── Bottom row: top batches + status split + recent batches ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 280px', gap: '12px' }}>

            {/* Top batches */}
            <SectionCard title="Top Batches" sub="By leads found">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: '8px', padding: '0 0 8px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  {['Batch', 'Leads', 'w/ Email'].map(h => (
                    <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>
                {data.topBatches.filter(b => b.lead_count > 0).slice(0, 7).map((b, i) => (
                  <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 700, fontFamily: 'var(--font-head)' }}>{b.lead_count}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                      {b.with_email}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>({b.lead_count > 0 ? Math.round(b.with_email / b.lead_count * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
                {data.topBatches.filter(b => b.lead_count > 0).length === 0 && (
                  <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>No batch data yet</div>
                )}
              </div>
            </SectionCard>

            {/* Lead status donut */}
            <SectionCard title="Lead Status" sub="Current period">
              {data.statusSplit.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={data.statusSplit} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                        {data.statusSplit.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', fontFamily: 'var(--font-body)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {data.statusSplit.map(({ name, value, color }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-body)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                          <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{name}</span>
                        </div>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>No status data</div>
              )}
            </SectionCard>

            {/* Recent batches */}
            <SectionCard title="Recent Batches" sub="Latest activity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.recentBatches.map(b => (
                  <div key={b.id} style={{
                    padding: '10px 12px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-body)', display: 'flex', gap: '8px' }}>
                      <span>{b.lead_count} leads</span>
                      <span>·</span>
                      <span>{formatTimeAgo(b.created_at)}</span>
                    </div>
                  </div>
                ))}
                {data.recentBatches.length === 0 && (
                  <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>No batches yet</div>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
};