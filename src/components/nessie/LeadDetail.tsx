import { useState, useEffect, useMemo } from 'react';
import type { SuccessfulScrape, LeadStatus } from '../../types/nessie';
import type { Batch } from '../../hooks/useBatches';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  ChevronLeft, ChevronRight, ExternalLink, Copy, Trash2,
  Check, Download, Mail, Tag as TagIcon, X, Send, Globe, Phone,
} from 'lucide-react';
import { EmailComposer } from '../EmailComposer';
import { EmailStats } from './EmailStats';

interface SearchResult {
  name: string;
  address: string;
  website: string;
  phone: string;
  industry: string;
  emails?: Array<{ email: string; confidence: number; first_name?: string; last_name?: string; position?: string }>;
}

interface DuplicateLead {
  company: string; location: string; website: string; phone: string | null;
  industry: string; domain: string;
  existing: {
    id: string; lead_status: string; emails_enriched: boolean; emails_count: number;
    emails_sent: number; contacted_at: string | null; created_at: string; tags: string[];
    batch: { id: string; label: string; channel: string; created_at: string } | null;
  };
}

interface LeadDetailProps {
  lead: SuccessfulScrape | null;
  batch: Batch | null;
  allLeads: SuccessfulScrape[];
  loading?: boolean;
  onToast: (message: string) => void;
  onLeadUpdate?: (leadId: string, updates: Partial<SuccessfulScrape>) => Promise<void>;
  onLeadDelete?: (leadId: string) => Promise<void>;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

// Status config — maps LeadStatus to CSS variable colours
const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  new:       { color: 'var(--text3)',   bg: 'var(--surface)' },
  contacted: { color: 'var(--blue)',    bg: 'rgba(74,158,255,0.1)' },
  replied:   { color: 'var(--amber)',   bg: 'rgba(245,166,35,0.1)' },
  qualified: { color: 'var(--teal)',    bg: 'var(--teal-subtle)' },
  dead:      { color: 'var(--danger)',  bg: 'rgba(255,79,96,0.1)' },
};
const getStatusCfg = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.new;

// Dynamic greeting (time + day aware)
const getGreeting = (name = 'User') => {
  const h = new Date().getHours();
  const d = new Date().getDay();
  const rnd = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  if (d === 0 || d === 6) return rnd([`Weekend warrior, ${name}?`, `Working on a ${d === 0 ? 'Sunday' : 'Saturday'}? Legend, ${name}!`]);
  if (d === 1) return rnd([`Monday blues? Not with these leads, ${name}!`, `Let's make this Monday count, ${name}!`]);
  if (d === 5) return rnd([`TGIF, ${name}! Let's close some deals!`, `Friday energy, ${name}! 🔥`]);
  if (h >= 5 && h < 12) return rnd([`Good morning, ${name}!`, `Morning ${name}, let's crush it!`, `Morning ${name}! Ready to hunt?`]);
  if (h >= 12 && h < 17) return rnd([`Hey ${name}, ready to dive in?`, `Alright ${name}, let's hunt!`]);
  if (h >= 17 && h < 21) return rnd([`Good evening, ${name}!`, `Evening ${name}! One last push?`]);
  return rnd([`Still hunting, ${name}?`, `Burning the midnight oil, ${name}? 🌙`]);
};

// ─── LeadFinderWelcome ─────────────────────────────────────────────────────────
const LeadFinderWelcome = ({ firstName, greeting }: { firstName: string; greeting: string }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateLead | null>(null);
  const [hasResults, setHasResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentResult, setEnrichmentResult] = useState<{ found: number; total: number } | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || !location.trim()) { setError('Please enter both industry/business type and location'); return; }
    setIsSearching(true); setError(null); setEnrichmentResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Please log in to search'); setIsSearching(false); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ query, location, industry }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Search failed'); }
      const data = await res.json();
      setResults((data.leads || []).map((l: any) => ({ name: l.company || '', address: l.location || '', website: l.website || '', phone: l.phone || '', industry: l.industry || '', emails: [] })));
      setDuplicates(data.duplicates || []);
      setBatchId(data.batch_id || null);
      setHasResults(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Search failed'); }
    finally { setIsSearching(false); }
  };

  const handleReaddDuplicate = async (dup: DuplicateLead) => {
    if (!batchId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: e } = await supabase.from('successful_scrapes').insert({ company: dup.company, location: dup.location, website: dup.website, phone: dup.phone, industry: dup.industry, lead_status: 'new', tags: ['google-places', 'duplicate'], emails: [], batch_id: batchId, batch_uuid: batchId, owner_user_id: session?.user.id || null });
      if (!e) {
        setToastMessage(`${dup.company} re-added to this batch`);
        setTimeout(() => setToastMessage(null), 3000);
        setResults(prev => [...prev, { name: dup.company, address: dup.location, website: dup.website, phone: dup.phone || '', industry: dup.industry, emails: [] }]);
        setDuplicates(prev => prev.filter(d => d.domain !== dup.domain));
      }
    } catch { setError('Failed to re-add duplicate'); }
    setSelectedDuplicate(null);
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className={`lfw-wrap ${hasResults ? 'lfw-wrap--results' : ''}`}>

      {/* Welcome hero — hidden once results load */}
      {!hasResults && (
        <div className="welcome-hero">
          <div className="welcome-eyebrow">Ready to Hunt</div>
          <h2 className="welcome-title">{greeting}</h2>
          <p className="welcome-sub">Nessie's ready to dive into your leads. Pick a batch from the sidebar or search for new businesses below.</p>
          <p className="welcome-protip">Pro tip: Use keyboard shortcuts to navigate faster</p>
        </div>
      )}

      {/* Lead Finder form */}
      <div className={`card ${hasResults ? '' : 'lf-card-welcome'}`}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <span className="section-title">Lead Finder</span>
          <span className="lf-powered">Powered by Google Places</span>
        </div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          <div><label className="label">Industry / Business Type</label><input className="input" placeholder="e.g. dentists, restaurants" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></div>
          <div><label className="label">Location</label><input className="input" placeholder="e.g. Glasgow, Falkirk" value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></div>
          <div><label className="label">Industry Tag <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label><input className="input" placeholder="e.g. healthcare" value={industry} onChange={e => setIndustry(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></div>
        </div>
        <div className="button-row" style={{ marginTop: '16px' }}>
          <button className="btn" onClick={handleSearch} disabled={isSearching}>{isSearching ? 'Searching…' : 'Search Businesses'}</button>
          {hasResults && <button className="btn secondary" onClick={() => {}} disabled={isEnriching || !batchId}>{isEnriching ? 'Finding emails…' : 'Find Emails'}</button>}
          {hasResults && <span className="batch-pill" style={{ marginLeft: 'auto' }}>{results.length} leads</span>}
        </div>
      </div>

      {/* Error */}
      {error && <div className="ld-error-banner">{error}</div>}

      {/* Enrichment success */}
      {enrichmentResult && (
        <div className="ld-success-banner">
          <Check size={14} />
          Found emails for {enrichmentResult.found} out of {enrichmentResult.total} businesses
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="lfw-results">
          {results.map((r, i) => (
            <div key={i} className="card lfw-result-card">
              <div className="lfw-result-left">
                <div className="ld-company-name">{r.name}</div>
                {r.address && <div className="ld-meta-row"><span>📍</span>{r.address}</div>}
                {r.website && <div className="ld-meta-row"><Globe size={11} color="var(--teal)" /><a href={r.website.startsWith('http') ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer" className="ld-link">{r.website}</a></div>}
                {r.phone && <div className="ld-meta-row"><Phone size={11} color="var(--text3)" />{r.phone}</div>}
                {r.industry && <span className="lead-industry-pill">{r.industry}</span>}
              </div>
              <div className="lfw-result-right">
                {r.emails && r.emails.length > 0 ? r.emails.map((c, ci) => (
                  <div key={ci} className="lfw-contact">
                    <div className="lfw-contact-row"><span className="lfw-email">{c.email}</span><span className="lfw-conf">{c.confidence}%</span></div>
                    {(c.first_name || c.last_name || c.position) && <div className="lfw-contact-name">{c.first_name} {c.last_name}{c.position && ` · ${c.position}`}</div>}
                  </div>
                )) : <div className="ld-no-email">— no email yet</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duplicates */}
      {hasResults && duplicates.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <span className="section-title">Already in Pipeline</span>
            <span className="ld-dup-badge">{duplicates.length} duplicates</span>
          </div>
          <div className="lfw-results">
            {duplicates.map((dup, i) => (
              <div key={i} className="card lfw-result-card lfw-dup-card" onClick={() => setSelectedDuplicate(dup)}>
                <div className="ld-dup-flag">🔄 Duplicate</div>
                <div className="lfw-result-left">
                  <div className="ld-company-name">{dup.company}</div>
                  {dup.location && <div className="ld-meta-row"><span>📍</span>{dup.location}</div>}
                  {dup.website && <div className="ld-meta-row"><Globe size={11} color="var(--teal)" /><a href={dup.website.startsWith('http') ? dup.website : `https://${dup.website}`} target="_blank" rel="noreferrer" className="ld-link" onClick={e => e.stopPropagation()}>{dup.website}</a></div>}
                  {dup.phone && <div className="ld-meta-row"><Phone size={11} color="var(--text3)" />{dup.phone}</div>}
                  {dup.industry && <span className="lead-industry-pill">{dup.industry}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate detail modal */}
      {selectedDuplicate && (
        <div className="ld-modal-overlay" onClick={() => setSelectedDuplicate(null)}>
          <div className="ld-modal-card" onClick={e => e.stopPropagation()}>
            <button className="ld-modal-close" onClick={() => setSelectedDuplicate(null)}><X size={16} /></button>
            <div className="ld-modal-header">
              <span className="ld-company-name">{selectedDuplicate.company}</span>
              <span className="ld-dup-badge">🔄 Duplicate</span>
            </div>
            <div className="ld-modal-section"><div className="label">Already exists in:</div><div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}><span className="ld-value">{selectedDuplicate.existing.batch?.label || 'Unknown batch'}</span><span className="batch-pill">{selectedDuplicate.existing.batch?.channel === 'lead-finder' ? '🔍 Lead Finder' : 'Scraper'}</span><span className="ld-meta">{fmtDate(selectedDuplicate.existing.batch?.created_at || selectedDuplicate.existing.created_at)}</span></div></div>
            <div className="ld-modal-section"><div className="label">Current status:</div><span className="bc-status" style={{ color: getStatusCfg(selectedDuplicate.existing.lead_status).color, background: getStatusCfg(selectedDuplicate.existing.lead_status).bg, marginTop: '6px', display: 'inline-block' }}>{selectedDuplicate.existing.lead_status}</span></div>
            <div className="ld-modal-section"><div className="label">Activity:</div><div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>{selectedDuplicate.existing.emails_enriched ? <span style={{ color: 'var(--teal)' }}><Check size={12} style={{ display: 'inline', marginRight: '4px' }} />Emails enriched ({selectedDuplicate.existing.emails_count} found)</span> : <span style={{ color: 'var(--text3)' }}>No emails found yet</span>}<span style={{ color: selectedDuplicate.existing.emails_sent > 0 ? 'var(--teal)' : 'var(--text3)' }}>{selectedDuplicate.existing.emails_sent} outreach emails sent</span><span style={{ color: 'var(--text3)' }}>{selectedDuplicate.existing.contacted_at ? `Last contacted: ${fmtDate(selectedDuplicate.existing.contacted_at)}` : 'Not yet contacted'}</span></div></div>
            {selectedDuplicate.existing.tags?.length > 0 && <div className="ld-modal-section"><div className="label">Tags:</div><div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{selectedDuplicate.existing.tags.map((t, i) => <span key={i} className="lead-industry-pill">{t}</span>)}</div></div>}
            <div className="button-row" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn secondary" onClick={() => handleReaddDuplicate(selectedDuplicate)}>Re-add to this batch</button>
              <button className="btn" onClick={() => setSelectedDuplicate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

// ─── LeadDetail ────────────────────────────────────────────────────────────────
export const LeadDetail = ({ lead, batch, allLeads, loading, onToast, onLeadUpdate, onLeadDelete, onNavigate }: LeadDetailProps) => {
  const { profile } = useAuth();
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const currentIndex = lead ? allLeads.findIndex(l => l.id === lead.id) : -1;
  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  useEffect(() => {
    if (lead) { setMessageSubject(lead.subject || ''); setMessageBody(lead.message || ''); setLeadStatus(lead.lead_status || 'new'); setTags(lead.tags || []); }
  }, [lead]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lead || !onNavigate) return;
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate('prev');
      if (e.key === 'ArrowRight' && currentIndex < allLeads.length - 1) onNavigate('next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lead, currentIndex, allLeads.length, onNavigate]);

  if (loading) return <LoadingSkeleton />;
  if (!lead || !batch) return <LeadFinderWelcome firstName={firstName} greeting={greeting} />;

  const copy = (text: string, label = 'Content') => {
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); }
    else { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    onToast(`${label} copied to clipboard`);
  };

  const handleStatusChange = async (s: LeadStatus) => {
    setLeadStatus(s);
    await onLeadUpdate?.(lead.id, { lead_status: s, contacted_at: s === 'contacted' ? new Date().toISOString() : lead.contacted_at });
    onToast(`Status updated to ${s}`);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const updated = [...tags, newTag.trim()];
    setTags(updated); setNewTag(''); setIsAddingTag(false);
    await onLeadUpdate?.(lead.id, { tags: updated });
    onToast('Tag added');
  };

  const handleRemoveTag = async (t: string) => {
    const updated = tags.filter(x => x !== t);
    setTags(updated);
    await onLeadUpdate?.(lead.id, { tags: updated });
    onToast('Tag removed');
  };

  const sc = getStatusCfg(leadStatus);

  return (
    <div className="ld-wrap">

      {/* ── BREADCRUMB + NAV ── */}
      <div className="ld-toprow">
        <div className="ld-breadcrumb">
          <span className="ld-company-name">{lead.company || lead.domain || lead.website}</span>
          <span className="ld-sep">·</span>
          <span className="batch-pill">{batch.label}</span>
          <span className="ld-sep">·</span>
          <span className="bc-status" style={{ color: sc.color, background: sc.bg }}>{leadStatus}</span>
        </div>

        {allLeads.length > 1 && (
          <div className="ld-nav">
            <span className="ld-nav-count">{currentIndex + 1} of {allLeads.length}</span>
            <div className="ld-nav-btns">
              <button className="ld-nav-btn" onClick={() => onNavigate?.('prev')} disabled={currentIndex === 0}><ChevronLeft size={15} /></button>
              <button className="ld-nav-btn" onClick={() => onNavigate?.('next')} disabled={currentIndex === allLeads.length - 1}><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── LEAD SUMMARY ── */}
      <div className="ld-section">
        <div className="ld-section-header">
          <h2 className="ld-section-title">Lead Summary</h2>
          <button className="btn" onClick={() => window.open(lead.website, '_blank')}>
            <ExternalLink size={13} /> Open Site
          </button>
        </div>

        <div className="ld-grid">
          <div>
            <div className="label">Website</div>
            <a href={lead.website} target="_blank" rel="noreferrer" className="ld-link">{lead.website}</a>
          </div>
          <div>
            <div className="label">Email</div>
            <div className="ld-email-row">
              {Array.isArray(lead.emails) && lead.emails.length > 0 ? (
                <><span className="ld-value">{lead.emails[0]}</span><button className="ld-copy-btn" onClick={() => copy(lead.emails![0], 'Email')}><Copy size={13} color="var(--teal)" /></button></>
              ) : <span className="ld-meta">No email</span>}
            </div>
          </div>
          <div>
            <div className="label">Industry</div>
            <span className="pill-inline">{lead.industry || 'business'}</span>
          </div>
          <div>
            <div className="label">Owner</div>
            <span className="ld-value">Assigned to Nessie user</span>
          </div>
        </div>
      </div>

      {/* ── STATUS + TAGS ── */}
      <div className="ld-section">
        <div className="ld-controls-row">
          <div className="ld-status-group">
            <span className="ld-meta">Status:</span>
            <select className="ld-select" value={leadStatus} onChange={e => handleStatusChange(e.target.value as LeadStatus)}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="qualified">Qualified</option>
              <option value="dead">Dead</option>
            </select>
          </div>

          <div className="ld-tags-group">
            <span className="ld-meta">Tags:</span>
            {tags.map(tag => (
              <div key={tag} className="ld-tag">
                {tag}
                <button className="ld-tag-remove" onClick={() => handleRemoveTag(tag)}><X size={11} /></button>
              </div>
            ))}
            {isAddingTag ? (
              <div className="ld-tag-input-row">
                <input className="input ld-tag-input" type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setIsAddingTag(false); setNewTag(''); } }} placeholder="Tag name…" autoFocus />
                <button className="btn small" onClick={handleAddTag}>Add</button>
                <button className="ld-icon-btn" onClick={() => { setIsAddingTag(false); setNewTag(''); }}><X size={13} /></button>
              </div>
            ) : (
              <button className="ld-add-tag-btn" onClick={() => setIsAddingTag(true)}><TagIcon size={11} />Add Tag</button>
            )}
          </div>

          {(!lead.emails || lead.emails.length === 0) && (
            <button className="ld-coming-soon-btn" disabled title="Coming Soon — Email finder integration">
              <Mail size={13} /> Find Email (Coming Soon)
            </button>
          )}
        </div>
      </div>

      {/* ── ICEBREAKER ── */}
      {lead.icebreaker && (
        <div className="ld-section">
          <h2 className="ld-section-title" style={{ marginBottom: '14px' }}>Icebreaker</h2>
          <div className="ld-content-block">
            <p className="ld-content-text">{lead.icebreaker}</p>
          </div>
        </div>
      )}

      {/* ── MESSAGE ── */}
      <div className="ld-section">
        <div className="ld-section-header">
          <h2 className="ld-section-title">Message</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => copy(messageBody, 'Message')}><Copy size={13} />Copy Message</button>
            {batch.channel === 'email' && <button className="btn" onClick={() => setShowEmailComposer(true)}><Send size={13} />Send Email</button>}
          </div>
        </div>

        <div className="ld-content-block">
          {batch.channel === 'email' && (
            <div style={{ marginBottom: '16px' }}>
              <div className="label" style={{ marginBottom: '7px' }}>Subject</div>
              <input className="input" value={messageSubject} onChange={e => setMessageSubject(e.target.value)} />
            </div>
          )}
          <div>
            <div className="label" style={{ marginBottom: '7px' }}>Body</div>
            <textarea className="input" value={messageBody} onChange={e => setMessageBody(e.target.value)} style={{ minHeight: '200px', lineHeight: 1.7, resize: 'vertical' }} />
            <div className="ld-helper">
              {lead.message ? 'Generated from your custom template. Edit freely before sending.' : 'Auto-generated message based on lead details. Edit freely before sending.'}
            </div>
          </div>
        </div>
      </div>

      {/* ── EMAIL STATS ── */}
      {batch.channel === 'email' && <EmailStats leadId={lead.id} />}

      {/* ── ACTION BUTTONS ── */}
      <div className="ld-actions">
        <button
          className="ld-action-btn"
          onClick={() => handleStatusChange(leadStatus === 'contacted' ? 'new' : 'contacted')}
          style={{ color: leadStatus === 'contacted' ? 'var(--teal)' : 'var(--blue)', background: leadStatus === 'contacted' ? 'var(--teal-subtle)' : 'rgba(74,158,255,0.1)', borderColor: leadStatus === 'contacted' ? 'var(--teal-border)' : 'rgba(74,158,255,0.3)' }}
        >
          {leadStatus === 'contacted' && <Check size={15} />}
          {leadStatus === 'contacted' ? 'Marked as Contacted' : 'Mark as Contacted'}
        </button>

        <button className="ld-action-btn ld-action-btn--disabled" disabled title="Coming Soon — Export individual leads"><Download size={15} />Export (Coming Soon)</button>
        <button className="ld-action-btn ld-action-btn--disabled" disabled title="Coming Soon — Email sequence"><Mail size={15} />Add to Sequence (Coming Soon)</button>

        <div style={{ flex: 1 }} />

        {!showDeleteConfirm ? (
          <button className="ld-action-btn ld-action-btn--danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={15} />Delete Lead</button>
        ) : (
          <div className="ld-delete-confirm">
            <span className="ld-delete-label">Are you sure?</span>
            <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={async () => { await onLeadDelete?.(lead.id); setShowDeleteConfirm(false); onToast('Lead deleted'); }}>Yes, Delete</button>
            <button className="btn secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── EMAIL COMPOSER MODAL ── */}
      {showEmailComposer && (
        <EmailComposer
          lead={{ id: lead.id, company_name: lead.company || lead.domain || lead.website || 'Unknown', full_name: (lead as any).full_name || '', email: Array.isArray(lead.emails) && lead.emails.length > 0 ? lead.emails[0] : '', industry: lead.industry }}
          onClose={() => setShowEmailComposer(false)}
          onSent={async () => { await handleStatusChange('contacted'); onToast('Email sent successfully!'); setShowEmailComposer(false); }}
        />
      )}
    </div>
  );
};