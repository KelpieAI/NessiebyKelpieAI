import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/nessie/Sidebar';
import { TabBar } from '../components/nessie/TabBar';
import { LeadDetail } from '../components/nessie/LeadDetail';
import { RightSidebar } from '../components/nessie/RightSidebar';
import { Toast } from '../components/nessie/Toast';
import { AnalyticsPage } from './AnalyticsPage';
import LeadsTable from '../components/nessie/LeadsTable';
import { StaleBatchBanner } from '../components/nessie/StaleBatchBanner';
import { useBatches } from '../hooks/useBatches';
import { useLeads } from '../hooks/useLeads';
import { useToast } from '../hooks/useToast';
import { useBatchTimeout } from '../hooks/useBatchTimeout';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { supabase } from '../lib/supabase';
import type { SuccessfulScrape } from '../hooks/useLeads';
import { Search, Mail, Phone, Globe, X, RefreshCw } from 'lucide-react';
import '../styles/nessie.css';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

interface EmailContact {
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  confidence?: number;
}

interface FinderLead {
  id: string;
  company: string;
  location: string;
  website: string;
  phone: string | null;
  emails: EmailContact[];
  lead_status: string;
  batch_id: string;
  batch_uuid: string;
  industry?: string;
}

interface DuplicateLead {
  company: string;
  location: string;
  website: string;
  phone: string | null;
  industry: string;
  domain: string;
  existing: {
    id: string;
    lead_status: string;
    emails_enriched: boolean;
    emails_count: number;
    emails_sent: number;
    contacted_at: string | null;
    created_at: string;
    tags: string[];
    batch: {
      id: string;
      label: string;
      channel: string;
      created_at: string;
    } | null;
  };
}

type MainView = 'welcome' | 'finder-results' | 'lead-detail' | 'leads-table' | 'analytics';

export const NessieQueue = () => {
  const [activeView, setActiveView] = useState('Queue');
  const [mainView, setMainView] = useState<MainView>('welcome');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all');
  const [openTabs, setOpenTabs] = useState<LeadTab[]>([]);
  const [leadsByBatch, setLeadsByBatch] = useState<Record<string, SuccessfulScrape[]>>({});
  const [loadingLead, setLoadingLead] = useState(false);

  // Lead Finder state
  const [finderQuery, setFinderQuery] = useState('');
  const [finderLocation, setFinderLocation] = useState('');
  const [finderIndustry, setFinderIndustry] = useState('');
  const [finderSearching, setFinderSearching] = useState(false);
  const [finderEnriching, setFinderEnriching] = useState(false);
  const [finderLeads, setFinderLeads] = useState<FinderLead[]>([]);
  const [finderDuplicates, setFinderDuplicates] = useState<DuplicateLead[]>([]);
  const [finderBatchId, setFinderBatchId] = useState<string | null>(null);
  const [finderEnrichSummary, setFinderEnrichSummary] = useState<{ enriched: number; total: number } | null>(null);
  const [finderError, setFinderError] = useState<string | null>(null);
  const [hasResults, setHasResults] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateLead | null>(null);

  const navigate = useNavigate();
  const { batches, deleteBatch, refreshBatches } = useBatches();
  const { leads, updateLead, deleteLead } = useLeads(activeBatchId);
  const { toasts, showToast, removeToast } = useToast();
  const { staleBatches, hasStaleBatches, markBatchComplete, autoCompleteStale } = useBatchTimeout(batches);

  useEffect(() => {
    if (activeBatchId && leads) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: leads,
      }));
    }
  }, [activeBatchId, leads]);

  // ── Lead Finder handlers ──────────────────────────────────────

  const handleFinderSearch = async () => {
    if (!finderQuery || !finderLocation) return;
    setFinderSearching(true);
    setFinderError(null);
    setFinderLeads([]);
    setFinderDuplicates([]);
    setFinderBatchId(null);
    setFinderEnrichSummary(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-places`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            query: finderQuery,
            location: finderLocation,
            industry: finderIndustry,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFinderError(data.error || 'Search failed');
        return;
      }

      setFinderLeads(data.leads || []);
      setFinderDuplicates(data.duplicates || []);

      // Only set batch ID and switch view if we got new leads
      if (data.batch_id) {
        setFinderBatchId(data.batch_id);
      }

      setHasResults(true);
      setMainView('finder-results');

      if (data.count > 0) {
        showToast(`Found ${data.count} new businesses`);
      } else {
        showToast(`All ${data.skipped} businesses already in pipeline`);
      }

      await refreshBatches();
    } catch (err: any) {
      setFinderError(err.message);
    } finally {
      setFinderSearching(false);
    }
  };

  const handleFinderEnrich = async () => {
    if (!finderBatchId) return;
    setFinderEnriching(true);
    setFinderError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ batch_id: finderBatchId }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFinderError(data.error || 'Enrichment failed');
        return;
      }

      setFinderEnrichSummary(data.results);
      showToast(`Found emails for ${data.results.enriched} businesses`);

      const { data: updated } = await supabase
        .from('successful_scrapes')
        .select('*')
        .eq('batch_uuid', finderBatchId);

      if (updated) setFinderLeads(updated as FinderLead[]);
    } catch (err: any) {
      setFinderError(err.message);
    } finally {
      setFinderEnriching(false);
    }
  };

  const handleReaddDuplicate = async (duplicate: DuplicateLead) => {
    if (!finderBatchId) {
      showToast('No active batch to add to');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('successful_scrapes')
      .insert({
        company: duplicate.company,
        location: duplicate.location,
        website: duplicate.website,
        phone: duplicate.phone,
        industry: duplicate.industry,
        lead_status: 'new',
        tags: ['google-places', 'duplicate'],
        emails: [],
        batch_id: finderBatchId,
        batch_uuid: finderBatchId,
        owner_user_id: session?.user.id || null,
      })

    if (!error) {
      showToast(`${duplicate.company} re-added to this batch`);
      setFinderLeads(prev => [...prev, {
        id: crypto.randomUUID(),
        company: duplicate.company,
        location: duplicate.location,
        website: duplicate.website,
        phone: duplicate.phone,
        industry: duplicate.industry,
        emails: [],
        lead_status: 'new',
        batch_id: finderBatchId,
        batch_uuid: finderBatchId,
        tags: ['google-places', 'duplicate'],
      } as FinderLead]);
      setFinderDuplicates(prev => prev.filter(d => d.domain !== duplicate.domain));
    } else {
      showToast('Failed to re-add lead');
    }
    setSelectedDuplicate(null);
  };

  // ── Batch / Lead handlers ─────────────────────────────────────

  const handleCreateNewBatch = () => navigate('/queue/new');

  const handleDeleteBatch = async (batchId?: string) => {
    const idToDelete = batchId || activeBatchId;
    if (!idToDelete) return;

    const { error } = await deleteBatch(idToDelete);
    if (error) { showToast('Failed to delete batch'); return; }

    if (idToDelete === activeBatchId) {
      setActiveBatchId(null);
      setActiveLeadId(null);
      setMainView('welcome');
      setHasResults(false);
    }

    await refreshBatches();
    showToast('Batch deleted');
  };

  const handleLeadUpdate = async (leadId: string, updates: Partial<SuccessfulScrape>) => {
    const { error } = await updateLead(leadId, updates);
    if (error) { showToast('Failed to update lead'); return; }

    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.leadId === leadId ? { ...tab, lead: { ...tab.lead, ...updates } } : tab
      )
    );

    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      }));
    }
  };

  const handleLeadDelete = async (leadId: string) => {
    const { error } = await deleteLead(leadId);
    if (error) { showToast('Failed to delete lead'); return; }

    setOpenTabs((prev) => prev.filter((tab) => tab.leadId !== leadId));

    if (activeLeadId === leadId && activeBatchId) {
      const remainingLeads = leadsByBatch[activeBatchId]?.filter((l) => l.id !== leadId) || [];
      if (remainingLeads.length > 0) {
        openLead(remainingLeads[0], activeBatchId);
      } else {
        setActiveLeadId(null);
      }
    }

    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).filter((lead) => lead.id !== leadId),
      }));
    }

    showToast('Lead deleted');
  };

  const handleActivityLeadClick = (leadId: string) => {
    let foundLead: SuccessfulScrape | undefined;
    let foundBatchId: string | undefined;

    if (activeBatchId) {
      foundLead = leadsByBatch[activeBatchId]?.find(l => l.id === leadId);
      if (foundLead) foundBatchId = activeBatchId;
    }

    if (!foundLead) {
      for (const batchId in leadsByBatch) {
        foundLead = leadsByBatch[batchId]?.find(l => l.id === leadId);
        if (foundLead) { foundBatchId = batchId; break; }
      }
    }

    if (foundLead && foundBatchId) {
      openLead(foundLead, foundBatchId);
    } else {
      showToast('Lead not found');
    }
  };

  const handleLeadNavigate = (direction: 'prev' | 'next') => {
    if (!activeBatchId) return;
    const currentLeads = leadsByBatch[activeBatchId] || [];
    const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev'
      ? Math.max(0, currentIndex - 1)
      : Math.min(currentLeads.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) openLead(currentLeads[newIndex], activeBatchId);
  };

  const handleOpenFailedTab = (batchId: string) => {
    setActiveBatchId(batchId);
    setActiveTab('failed');
    setMainView('leads-table');
  };

  const handleMarkBatchComplete = async (batchId: string) => {
    const { error } = await markBatchComplete(batchId);
    if (error) {
      showToast('Failed to mark batch complete');
    } else {
      showToast('Batch marked as complete');
      await refreshBatches();
    }
  };

  const handleAutoCompleteAll = async () => {
    const { count, error } = await autoCompleteStale();
    if (error) {
      showToast('Failed to complete stale batches');
    } else {
      showToast(`${count} stale batches marked as complete`);
      await refreshBatches();
    }
  };

  const handleBatchClick = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    setActiveBatchId(batchId);
    setActiveTab('all');

    if (batch?.channel === 'lead-finder') {
      supabase
        .from('successful_scrapes')
        .select('*')
        .eq('batch_uuid', batchId)
        .then(({ data }) => {
          if (data) {
            setFinderLeads(data as FinderLead[]);
            setFinderDuplicates([]);
            setFinderBatchId(batchId);
            setHasResults(true);
            setMainView('finder-results');
            setLeadsByBatch(prev => ({ ...prev, [batchId]: data as SuccessfulScrape[] }));
          }
        });
    } else {
      setMainView('lead-detail');
      const batchLeads = leadsByBatch[batchId] || [];
      if (batchLeads.length > 0) {
        if (!batchLeads.find((l) => l.id === activeLeadId)) {
          openLead(batchLeads[0], batchId);
        }
      } else {
        setActiveLeadId(null);
      }
    }
  };

  const handleLeadClick = (leadId: string, batchId: string) => {
    const lead = leadsByBatch[batchId]?.find((l) => l.id === leadId);
    if (lead) openLead(lead, batchId);
  };

  const handleFinderLeadClick = (lead: FinderLead) => {
    const scrape = lead as unknown as SuccessfulScrape;
    setLeadsByBatch(prev => ({
      ...prev,
      [lead.batch_uuid]: finderLeads as unknown as SuccessfulScrape[],
    }));
    openLead(scrape, lead.batch_uuid);
    setMainView('lead-detail');
  };

  const openLead = (lead: SuccessfulScrape, batchId: string) => {
    setLoadingLead(true);
    setActiveLeadId(lead.id);
    setActiveBatchId(batchId);
    setMainView('lead-detail');

    const existingTab = openTabs.find((t) => t.leadId === lead.id);
    if (!existingTab) {
      setOpenTabs((prev) => [...prev, { leadId: lead.id, lead }]);
    }

    setTimeout(() => setLoadingLead(false), 200);
  };

  const handleTabClose = (leadId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.leadId !== leadId));

    if (activeLeadId === leadId) {
      const remainingTabs = openTabs.filter((t) => t.leadId !== leadId);
      if (remainingTabs.length > 0) {
        setActiveLeadId(remainingTabs[remainingTabs.length - 1].leadId);
      } else {
        setActiveLeadId(null);
        setMainView('welcome');
      }
    }
  };

  useKeyboardShortcuts({
    onCreateBatch: () => { handleCreateNewBatch(); showToast('Create a new batch'); },
    onSaveNotes: () => { if (activeLeadId) showToast('Note saved'); },
    onNavigateUp: () => handleLeadNavigate('prev'),
    onNavigateDown: () => handleLeadNavigate('next'),
    onDeleteBatch: handleDeleteBatch,
  });

  const currentLead = activeLeadId
    ? Object.values(leadsByBatch).flat().find((l) => l.id === activeLeadId)
    : null;

  const currentBatch = batches.find((b) => b.id === activeBatchId);
  const allLeadsInBatch = activeBatchId ? (leadsByBatch[activeBatchId] || []) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // ── Render helpers ────────────────────────────────────────────

  const renderLeadCard = (lead: FinderLead) => (
    <div
      key={lead.id}
      className="card"
      style={{ padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => handleFinderLeadClick(lead)}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(17,194,210,0.4)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            {lead.company}
          </div>
          <div className="label" style={{ marginBottom: '8px', textTransform: 'none', letterSpacing: 0 }}>
            📍 {lead.location}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            {lead.website && (
              
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <Globe size={11} />
                {lead.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            )}
            {lead.phone && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={11} /> {lead.phone}
              </span>
            )}
            {lead.industry && (
              <span className="lead-industry-pill">{lead.industry}</span>
            )}
          </div>
        </div>

        <div style={{ minWidth: '240px' }}>
          {lead.emails && lead.emails.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {lead.emails.map((e, i) => (
                <div key={i} style={{
                  background: 'rgba(17, 194, 210, 0.06)',
                  border: '1px solid rgba(17, 194, 210, 0.18)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{e.email}</span>
                    <span className="label" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                      {e.confidence}%
                    </span>
                  </div>
                  {(e.first_name || e.position) && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', paddingLeft: '17px' }}>
                      {[e.first_name, e.last_name].filter(Boolean).join(' ')}
                      {e.position && ` — ${e.position}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              — no email yet
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderDuplicateCard = (dup: DuplicateLead) => (
    <div
      key={dup.domain}
      className="card"
      style={{
        padding: '12px 14px',
        cursor: 'pointer',
        opacity: 0.55,
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onClick={() => setSelectedDuplicate(dup)}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.borderColor = 'rgba(246,173,85,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.55';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Duplicate badge */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '999px',
        background: 'rgba(246, 173, 85, 0.12)',
        color: '#f6ad55',
        fontSize: '10px',
        fontWeight: 500,
      }}>
        <RefreshCw size={9} />
        Duplicate
      </div>

      <div style={{ flex: 1, paddingRight: '90px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
          {dup.company}
        </div>
        <div className="label" style={{ marginBottom: '8px', textTransform: 'none', letterSpacing: 0 }}>
          📍 {dup.location}
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {dup.website && (
            
              href={dup.website}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <Globe size={11} />
              {dup.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          )}
          {dup.phone && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={11} /> {dup.phone}
            </span>
          )}
          {dup.industry && (
            <span className="lead-industry-pill">{dup.industry}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderDuplicateModal = () => {
    if (!selectedDuplicate) return null;
    const dup = selectedDuplicate;
    const ex = dup.existing;

    const statusColour = ex.lead_status === 'contacted'
      ? '#11c2d2'
      : ex.lead_status === 'converted'
      ? 'rgb(34,197,94)'
      : '#7a94a3';

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setSelectedDuplicate(null)}
      >
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '480px',
            width: '90%',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={() => setSelectedDuplicate(null)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{dup.company}</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(246, 173, 85, 0.12)',
              color: '#f6ad55',
              fontSize: '10px',
              fontWeight: 500,
            }}>
              <RefreshCw size={9} />
              Duplicate
            </div>
          </div>

          {/* Already exists in */}
          <div style={{ marginBottom: '16px' }}>
            <div className="label" style={{ marginBottom: '6px' }}>Already exists in</div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
            }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {ex.batch?.label || 'Unknown batch'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {ex.batch?.channel === 'lead-finder' ? (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: 'rgba(99,179,237,0.12)',
                    color: '#63b3ed',
                  }}>🔍 Lead Finder</span>
                ) : (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: 'rgba(17,194,210,0.12)',
                    color: 'var(--accent)',
                  }}>🌐 Scraper</span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Added {formatDate(ex.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: '16px' }}>
            <div className="label" style={{ marginBottom: '6px' }}>Current status</div>
            <span style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: `${statusColour}20`,
              color: statusColour,
              border: `1px solid ${statusColour}40`,
              textTransform: 'capitalize',
            }}>
              {ex.lead_status || 'new'}
            </span>
          </div>

          {/* Activity */}
          <div style={{ marginBottom: '20px' }}>
            <div className="label" style={{ marginBottom: '8px' }}>Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ color: ex.emails_enriched ? 'var(--accent)' : 'var(--text-muted)' }}>
                {ex.emails_enriched
                  ? `✓ Emails enriched (${ex.emails_count} found)`
                  : '— No emails found yet'}
              </div>
              <div style={{ color: ex.emails_sent > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                {ex.emails_sent > 0
                  ? `✓ ${ex.emails_sent} outreach email${ex.emails_sent > 1 ? 's' : ''} sent`
                  : '— No outreach sent yet'}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {ex.contacted_at
                  ? `Last contacted: ${formatDate(ex.contacted_at)}`
                  : '— Not yet contacted'}
              </div>
            </div>
          </div>

          {/* Tags */}
          {ex.tags && ex.tags.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div className="label" style={{ marginBottom: '6px' }}>Tags</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ex.tags.map((tag, i) => (
                  <span key={i} className="lead-industry-pill">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="button-row">
            <button
              className="btn secondary"
              onClick={() => handleReaddDuplicate(dup)}
            >
              <RefreshCw size={12} />
              Re-add to this batch
            </button>
            <button
              className="btn"
              onClick={() => {
                if (ex.batch?.id) {
                  const mockLead = {
                    id: ex.id,
                    batch_uuid: ex.batch.id,
                    batch_id: ex.batch.id,
                  } as unknown as FinderLead;
                  handleFinderLeadClick(mockLead);
                }
                setSelectedDuplicate(null);
              }}
            >
              View Lead
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────

  const renderMainContent = () => {
    if (activeView === 'Analytics') {
      return (
        <AnalyticsPage
          onNavigateToBatch={(batchId) => {
            setActiveView('Queue');
            handleBatchClick(batchId);
          }}
        />
      );
    }

    if (mainView === 'leads-table') {
      return (
        <LeadsTable
          activeBatchId={activeBatchId}
          initialTab={activeTab}
        />
      );
    }

    if (mainView === 'lead-detail') {
      return (
        <>
          <TabBar
            tabs={openTabs}
            activeLeadId={activeLeadId}
            onTabClick={(leadId) => {
              setActiveLeadId(leadId);
              setLoadingLead(true);
              setTimeout(() => setLoadingLead(false), 150);
            }}
            onTabClose={handleTabClose}
          />
          <div className="content">
            <section className="content-main">
              <LeadDetail
                lead={currentLead}
                batch={currentBatch || null}
                allLeads={allLeadsInBatch}
                loading={loadingLead}
                onToast={showToast}
                onLeadUpdate={handleLeadUpdate}
                onLeadDelete={handleLeadDelete}
                onNavigate={handleLeadNavigate}
              />
            </section>
          </div>
        </>
      );
    }

    if (mainView === 'finder-results') {
      return (
        <div className="content">
          <section className="content-main">

            {/* Search form */}
            <div className="card" style={{ marginBottom: '18px' }}>
              <div className="form-grid">
                <div>
                  <div className="label">Industry / Business Type</div>
                  <input
                    className="input"
                    placeholder="e.g. plumbers, accountants"
                    value={finderQuery}
                    onChange={(e) => setFinderQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                    style={{ marginTop: '6px' }}
                  />
                </div>
                <div>
                  <div className="label">Location</div>
                  <input
                    className="input"
                    placeholder="e.g. Glasgow, Edinburgh"
                    value={finderLocation}
                    onChange={(e) => setFinderLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                    style={{ marginTop: '6px' }}
                  />
                </div>
                <div>
                  <div className="label">Industry Tag <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></div>
                  <input
                    className="input"
                    placeholder="e.g. Plumbing"
                    value={finderIndustry}
                    onChange={(e) => setFinderIndustry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                    style={{ marginTop: '6px' }}
                  />
                </div>
              </div>
              <div className="button-row" style={{ marginTop: '14px' }}>
                <button
                  className="btn"
                  onClick={handleFinderSearch}
                  disabled={finderSearching || !finderQuery || !finderLocation}
                  style={{ opacity: finderSearching || !finderQuery || !finderLocation ? 0.6 : 1 }}
                >
                  <Search size={13} />
                  {finderSearching ? 'Searching...' : 'Search Businesses'}
                </button>
                {finderBatchId && (
                  <button
                    className="btn secondary"
                    onClick={handleFinderEnrich}
                    disabled={finderEnriching}
                    style={{ opacity: finderEnriching ? 0.6 : 1 }}
                  >
                    <Mail size={13} />
                    {finderEnriching ? 'Finding emails...' : 'Find Emails'}
                  </button>
                )}
              </div>
            </div>

            {finderError && (
              <div style={{
                background: 'rgba(255, 78, 106, 0.1)',
                border: '1px solid rgba(255, 78, 106, 0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--danger)',
                marginBottom: '16px'
              }}>
                ⚠️ {finderError}
              </div>
            )}

            {finderEnrichSummary && (
              <div style={{
                background: 'rgba(17, 194, 210, 0.08)',
                border: '1px solid rgba(17, 194, 210, 0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--accent)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✓ Found emails for {finderEnrichSummary.enriched} out of {finderEnrichSummary.total} businesses
              </div>
            )}

            {/* New leads */}
            {finderLeads.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-title">Results</div>
                  <span className="batch-pill">{finderLeads.length} new leads</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {finderLeads.map(renderLeadCard)}
                </div>
              </div>
            )}

            {/* Duplicates */}
            {finderDuplicates.length > 0 && (
              <div className="section" style={{ marginTop: '24px' }}>
                <div className="section-header">
                  <div className="section-title">Already in Pipeline</div>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(246, 173, 85, 0.12)',
                    color: '#f6ad55',
                    border: '1px solid rgba(246,173,85,0.3)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {finderDuplicates.length} duplicate{finderDuplicates.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  These businesses are already in your pipeline. Click any card to view their history or re-add them.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {finderDuplicates.map(renderDuplicateCard)}
                </div>
              </div>
            )}

            {/* All duplicates — no new leads */}
            {finderLeads.length === 0 && finderDuplicates.length > 0 && (
              <div style={{
                background: 'rgba(246, 173, 85, 0.08)',
                border: '1px solid rgba(246,173,85,0.3)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '13px',
                color: '#f6ad55',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔄 All {finderDuplicates.length} businesses from this search are already in your pipeline
              </div>
            )}

          </section>
        </div>
      );
    }

    // Default — welcome + search form
    return (
      <div className="content">
        <section className="content-main">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            textAlign: 'center',
            padding: '40px 24px 24px',
          }}>
            <img
              src="/Logo white.png"
              alt="Nessie"
              style={{ width: '80px', marginBottom: '20px', opacity: 0.9 }}
            />
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '10px' }}>
              Hey Sami, wrapping up?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6, marginBottom: '8px' }}>
              Nessie's ready to dive into your leads. Pick a batch from the sidebar or search for new businesses below.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '32px' }}>
              Pro tip: Use keyboard shortcuts to navigate faster
            </p>
          </div>

          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: '14px' }}>
              <div className="section-title">Lead Finder</div>
              <span className="section-tag">powered by Google Places</span>
            </div>
            <div className="form-grid">
              <div>
                <div className="label">Industry / Business Type</div>
                <input
                  className="input"
                  placeholder="e.g. plumbers, accountants, dentists"
                  value={finderQuery}
                  onChange={(e) => setFinderQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                  style={{ marginTop: '6px' }}
                />
              </div>
              <div>
                <div className="label">Location</div>
                <input
                  className="input"
                  placeholder="e.g. Glasgow, Edinburgh, Falkirk"
                  value={finderLocation}
                  onChange={(e) => setFinderLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                  style={{ marginTop: '6px' }}
                />
              </div>
              <div>
                <div className="label">Industry Tag <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></div>
                <input
                  className="input"
                  placeholder="e.g. Plumbing, Finance"
                  value={finderIndustry}
                  onChange={(e) => setFinderIndustry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinderSearch()}
                  style={{ marginTop: '6px' }}
                />
              </div>
            </div>
            <div className="button-row" style={{ marginTop: '14px' }}>
              <button
                className="btn"
                onClick={handleFinderSearch}
                disabled={finderSearching || !finderQuery || !finderLocation}
                style={{ opacity: finderSearching || !finderQuery || !finderLocation ? 0.6 : 1 }}
              >
                <Search size={13} />
                {finderSearching ? 'Searching...' : 'Search Businesses'}
              </button>
            </div>

            {finderError && (
              <div style={{
                background: 'rgba(255, 78, 106, 0.1)',
                border: '1px solid rgba(255, 78, 106, 0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--danger)',
                marginTop: '14px'
              }}>
                ⚠️ {finderError}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div>
      <div className="layout">
        <Sidebar
          batches={batches}
          leadsByBatch={leadsByBatch}
          activeBatchId={activeBatchId}
          activeLeadId={activeLeadId}
          onBatchClick={handleBatchClick}
          onLeadClick={handleLeadClick}
          onToast={showToast}
          onCreateNewBatch={handleCreateNewBatch}
          onRefreshBatches={refreshBatches}
          onDeleteBatch={handleDeleteBatch}
          onOpenFailedTab={handleOpenFailedTab}
        />

        <main className="main">
          {renderMainContent()}
        </main>

        <RightSidebar onLeadClick={handleActivityLeadClick} />
      </div>

      {/* Duplicate modal */}
      {renderDuplicateModal()}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {hasStaleBatches && activeView === 'Queue' && (
        <StaleBatchBanner
          staleBatches={staleBatches}
          onMarkComplete={handleMarkBatchComplete}
          onAutoCompleteAll={handleAutoCompleteAll}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
};