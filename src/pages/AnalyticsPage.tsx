import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatTimeAgo } from '../utils/time';

interface AnalyticsData {
  totalLeads: number;
  totalFailed: number;
  totalBatches: number;
  successRate: number;
  avgLeadsPerBatch: number;
  industries: { name: string; value: number }[];
  recentBatches: {
    id: string;
    label: string;
    created_at: string;
    lead_count: number;
  }[];
}

const COLORS = ['#11C2D2', '#0D9AA8', '#09727E', '#064A54', '#04333A'];

export const AnalyticsPage = ({ onNavigateToBatch }: { onNavigateToBatch?: (batchId: string) => void }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [leadsResult, failedResult, batchesResult, industriesResult, recentBatchesResult] = await Promise.all([
        supabase.from('successful_scrapes').select('id', { count: 'exact', head: true }),
        supabase.from('failed_scrapes').select('id', { count: 'exact', head: true }),
        supabase.from('batches').select('*'),
        supabase.from('successful_scrapes').select('industry'),
        supabase.from('batches').select('id, label, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalLeads = leadsResult.count || 0;
      const totalFailed = failedResult.count || 0;
      const totalBatches = batchesResult.data?.length || 0;
      const successRate = totalLeads + totalFailed > 0 ? (totalLeads / (totalLeads + totalFailed)) * 100 : 0;
      const avgLeadsPerBatch = totalBatches > 0 ? totalLeads / totalBatches : 0;

      const industryCounts: Record<string, number> = {};
      industriesResult.data?.forEach((row) => {
        const industry = row.industry || 'Unknown';
        industryCounts[industry] = (industryCounts[industry] || 0) + 1;
      });

      const industries = Object.entries(industryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const recentBatchesWithCounts = await Promise.all(
        (recentBatchesResult.data || []).map(async (batch) => {
          const { count } = await supabase
            .from('successful_scrapes')
            .select('id', { count: 'exact', head: true })
            .eq('batch_uuid', batch.id);
          return {
            ...batch,
            lead_count: count || 0,
          };
        })
      );

      setData({
        totalLeads,
        totalFailed,
        totalBatches,
        successRate,
        avgLeadsPerBatch,
        industries,
        recentBatches: recentBatchesWithCounts,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: 'var(--text)' }}>
        <div style={{ fontSize: '24px', fontFamily: 'Playfair Display, serif', marginBottom: '32px' }}>
          Analytics
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', color: 'var(--text)' }}>
        <div style={{ fontSize: '24px', fontFamily: 'Playfair Display, serif', marginBottom: '32px' }}>
          Analytics
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>Failed to load analytics data.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', color: 'var(--text)' }}>
      <div style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', marginBottom: '32px', fontWeight: 600 }}>
        Analytics
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        <div className="card">
          <div className="label">Total Leads Processed</div>
          <div style={{ fontSize: '48px', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: 'var(--accent)' }}>
            {data.totalLeads}
          </div>
        </div>

        <div className="card">
          <div className="label">Success Rate</div>
          <div style={{ fontSize: '48px', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: 'var(--accent)' }}>
            {data.successRate.toFixed(1)}%
          </div>
        </div>

        <div className="card">
          <div className="label">Total Batches</div>
          <div style={{ fontSize: '48px', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: 'var(--accent)' }}>
            {data.totalBatches}
          </div>
        </div>

        <div className="card">
          <div className="label">Avg Leads per Batch</div>
          <div style={{ fontSize: '48px', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: 'var(--accent)' }}>
            {data.avgLeadsPerBatch.toFixed(1)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <div className="card">
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Industry Breakdown</div>
          {data.industries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.industries}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.industries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center' }}>
              No industry data available
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Recent Activity</div>
          {data.recentBatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(17, 194, 210, 0.05)',
                    borderRadius: '6px',
                    cursor: onNavigateToBatch ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => onNavigateToBatch?.(batch.id)}
                  onMouseEnter={(e) => {
                    if (onNavigateToBatch) {
                      e.currentTarget.style.background = 'rgba(17, 194, 210, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(17, 194, 210, 0.05)';
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{batch.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                    <span>{batch.lead_count} leads</span>
                    <span>•</span>
                    <span>{formatTimeAgo(batch.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center' }}>
              No recent batches
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
