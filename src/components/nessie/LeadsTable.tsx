import { useEffect, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import { FailedScrapeCard } from './FailedScrapeCard';
import { ErrorDetailsModal } from './ErrorDetailsModal';
import { RetryAllModal } from './RetryAllModal';
import { useFailedScrapes, type FailedScrape } from '../../hooks/useFailedScrapes';

interface Lead {
  id: string;
  website: string;
  domain: string | null;
  company: string | null;
  emails: string[];
  industry: string | null;
  icebreaker: string | null;
  batch_id: string;
  timestamp: string;
  status: string;
  created_at: string;
}

interface LeadsTableProps {
  activeBatchId?: string | null;
  initialTab?: 'all' | 'failed';
}

export default function LeadsTable({ activeBatchId = null, initialTab = 'all' }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>(initialTab);
  
  // Failed scrapes modal states
  const [selectedScrape, setSelectedScrape] = useState<FailedScrape | null>(null);
  const [showRetryAllModal, setShowRetryAllModal] = useState(false);

  // Only use failed scrapes hook if we have an active batch
  const failedHook = activeBatchId ? useFailedScrapes(activeBatchId) : null;

  useEffect(() => {
    fetchLeads();
    
    // Real-time subscription for new leads
    const subscription = supabase
      .channel('successful_scrapes_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'successful_scrapes' 
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, activeBatchId]);

  // Switch to failed tab when initialTab changes
  useEffect(() => {
    if (initialTab === 'failed') {
      setActiveTab('failed');
    }
  }, [initialTab]);

  const fetchLeads = async () => {
    let query = supabase
      .from('successful_scrapes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by batch if active
    if (activeBatchId) {
      query = query.eq('batch_uuid', activeBatchId);
    }

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    const headers = ['Company', 'Domain', 'Industry', 'Emails', 'Icebreaker', 'Status'];
    const rows = leads.map(lead => [
      lead.company || '',
      lead.domain || '',
      lead.industry || '',
      (lead.emails || []).join('; '),
      lead.icebreaker || '',
      lead.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nessie-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRetryAll = async (customLabel: string) => {
    if (!failedHook) return;
    
    const { error } = await failedHook.retryAll(customLabel);
    if (!error) {
      setShowRetryAllModal(false);
      // Optionally show success toast
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kelpie-500"></div>
      </div>
    );
  }

  const failedCount = failedHook?.failedScrapes.length || 0;
  const showFailedTab = activeBatchId && failedCount > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
        {/* Header with Tabs */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {activeBatchId ? 'Batch Leads' : 'All Leads'}
            </h2>
            {activeTab === 'all' && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-kelpie-500 text-background rounded-lg hover:bg-kelpie-600 transition-colors"
              >
                <Download size={18} />
                Export CSV
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'all' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'all' ? '#021014' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              All Leads ({leads.length})
            </button>
            
            {showFailedTab && (
              <button
                onClick={() => setActiveTab('failed')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: activeTab === 'failed' ? 'rgb(239, 68, 68)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Failed ({failedCount})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'all' ? (
          /* ALL LEADS TAB */
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 px-6 pt-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-kelpie-500/20 text-kelpie-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({leads.length})
              </button>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Website</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Industry</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Emails</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Icebreaker</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm text-foreground">{lead.company || '-'}</td>
                        <td className="p-4 text-sm">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-kelpie-400 hover:text-kelpie-300 flex items-center gap-1"
                          >
                            {lead.domain || lead.website}
                            <ExternalLink size={14} />
                          </a>
                        </td>
                        <td className="p-4 text-sm text-foreground">{lead.industry || '-'}</td>
                        <td className="p-4 text-sm text-foreground">
                          {lead.emails && lead.emails.length > 0 
                            ? lead.emails.join(', ') 
                            : 'No emails found'}
                        </td>
                        <td className="p-4 text-sm text-foreground max-w-md truncate">
                          {lead.icebreaker || '-'}
                        </td>
                        <td className="p-4 text-sm">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-kelpie-400 hover:text-kelpie-300"
                          >
                            Visit
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* FAILED SCRAPES TAB */
          <div className="p-6">
            {!failedHook ? (
              <div className="text-center p-8 text-muted-foreground">
                Select a batch to view failed scrapes
              </div>
            ) : failedHook.loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kelpie-500 mx-auto"></div>
              </div>
            ) : failedHook.failedScrapes.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No failed scrapes
              </div>
            ) : (
              <>
                {/* Bulk Actions Bar */}
                {failedHook.selectedIds.length > 0 && (
                  <div
                    style={{
                      padding: '16px',
                      marginBottom: '20px',
                      background: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                      {failedHook.selectedIds.length} selected
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={failedHook.retrySelected}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--accent)',
                          color: '#021014',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Retry Selected
                      </button>
                      <button
                        onClick={failedHook.markSelectedWontFix}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Mark as Won't Fix
                      </button>
                      <button
                        onClick={failedHook.clearSelection}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Top Actions */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setShowRetryAllModal(true)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#021014',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry All ({failedCount})
                  </button>
                  <button
                    onClick={failedHook.selectAll}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Select All
                  </button>
                </div>

                {/* Failed Scrapes List */}
                <div>
                  {failedHook.failedScrapes.map((scrape) => (
                    <FailedScrapeCard
                      key={scrape.id}
                      scrape={scrape}
                      isSelected={failedHook.selectedIds.includes(scrape.id)}
                      onRetry={() => failedHook.retryUrl(scrape.id)}
                      onWontFix={() => failedHook.markWontFix(scrape.id)}
                      onViewDetails={() => setSelectedScrape(scrape)}
                      onToggleSelect={() => failedHook.toggleSelect(scrape.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedScrape && (
        <ErrorDetailsModal
          scrape={selectedScrape}
          onClose={() => setSelectedScrape(null)}
          onRetry={() => {
            if (failedHook) {
              failedHook.retryUrl(selectedScrape.id);
            }
          }}
          onWontFix={() => {
            if (failedHook) {
              failedHook.markWontFix(selectedScrape.id);
            }
          }}
        />
      )}

      {showRetryAllModal && failedHook && (
        <RetryAllModal
          failedCount={failedCount}
          onConfirm={handleRetryAll}
          onClose={() => setShowRetryAllModal(false)}
        />
      )}
    </div>
  );
}