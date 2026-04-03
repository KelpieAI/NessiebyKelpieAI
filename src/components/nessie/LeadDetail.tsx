import { useState, useEffect, useMemo } from 'react';
import type { SuccessfulScrape, LeadStatus } from '../../types/nessie';
import type { Batch } from '../../hooks/useBatches';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  ChevronLeft, ChevronRight, ExternalLink, Copy, Trash2,
  Check, Download, Mail, Tag as TagIcon, X, Send, Globe, Phone,
  MapPin, Sparkles, Zap, PlusCircle,
} from 'lucide-react';
import { EmailComposer } from '../EmailComposer';
import { EmailStats } from './EmailStats';

interface EmailObj {
  email: string;
  confidence: number;
  first_name?: string;
  last_name?: string;
  position?: string;
}

const extractEmailObj = (raw: unknown): EmailObj | null => {
  if (!raw) return null;
  if (typeof raw === 'string') return { email: raw, confidence: 0 };
  if (typeof raw === 'object' && raw !== null && 'email' in raw) {
    const r = raw as any;
    return { email: r.email || '', confidence: r.confidence ?? 0, first_name: r.first_name, last_name: r.last_name, position: r.position };
  }
  return null;
};

const getEmailObjs = (lead: SuccessfulScrape): EmailObj[] => {
  if (!Array.isArray(lead.emails) || lead.emails.length === 0) return [];
  return lead.emails.map(extractEmailObj).filter((e): e is EmailObj => !!e && !!e.email);
};

const getConfidenceColor = (conf: number) => {
  if (conf >= 80) return { color: '#0ABFA3', bg: 'rgba(10,191,163,0.12)', border: 'rgba(10,191,163,0.3)' };
  if (conf >= 50) return { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' };
  return { color: '#FF4F60', bg: 'rgba(255,79,96,0.1)', border: 'rgba(255,79,96,0.25)' };
};

const getConfidenceLabel = (conf: number) => {
  if (conf >= 80) return 'High';
  if (conf >= 50) return 'Medium';
  return 'Low';
};

interface SearchResult {
  name: string; address: string; website: string; phone: string; industry: string;
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

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  new:       { color: 'var(--text3)',   bg: 'var(--surface)' },
  contacted: { color: 'var(--blue)',    bg: 'rgba(74,158,255,0.1)' },
  replied:   { color: 'var(--amber)',   bg: 'rgba(245,166,35,0.1)' },
  qualified: { color: 'var(--teal)',    bg: 'var(--teal-subtle)' },
  dead:      { color: 'var(--danger)',  bg: 'rgba(255,79,96,0.1)' },
};
const getStatusCfg = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.new;

const getGreeting = (name = 'User') => {
  const h = new Date().getHours();
  const d = new Date().getDay();
  const rnd = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  if (d === 0 || d === 6) return rnd([`Weekend warrior, ${name}?`, `Working on a ${d === 0 ? 'Sunday' : 'Saturday'}? Legend, ${name}!`]);
  if (d === 1) return rnd([`Monday blues? Not with these leads, ${name}!`, `Let's make this Monday count, ${name}!`]);
  if (d === 5) return rnd([`TGIF, ${name}! Let's close some deals!`, `Friday energy, ${name}!`]);
  if (h >= 5 && h < 12) return rnd([`Good morning, ${name}!`, `Morning ${name}, let's crush it!`, `Morning ${name}! Ready to hunt?`]);
  if (h >= 12 && h < 17) return rnd([`Hey ${name}, ready to dive in?`, `Alright ${name}, let's hunt!`]);
  if (h >= 17 && h < 21) return rnd([`Good evening, ${name}!`, `Evening ${name}! One last push?`]);
  return rnd([`Still hunting, ${name}?`, `Burning the midnight oil, ${name}?`]);
};

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
      {!hasResults && (
        <div className="welcome-hero">
          <div className="welcome-eyebrow">Ready to Hunt</div>
          <h2 className="welcome-title">{greeting}</h2>
          <p className="welcome-sub">Nessie's ready to dive into your leads. Pick a batch from the sidebar or search for new businesses below.</p>
          <p className="welcome-protip">Pro tip: Use keyboard shortcuts to navigate faster</p>
        </div>
      )}
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
      {error && <div className="ld-error-banner">{error}</div>}
      {enrichmentResult && (
        <div className="ld-success-banner">
          <Check size={14} />
          Found emails for {enrichmentResult.found} out of {enrichmentResult.total} businesses
        </div>
      )}
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
      {hasResults && duplicates.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <span className="section-title">Already in Pipeline</span>
            <span className="ld-dup-badge">{duplicates.length} duplicates</span>
          </div>
          <div className="lfw-results">
            {duplicates.map((dup, i) => (
              <div key={i} className="card lfw-result-card lfw-dup-card" onClick={() => setSelectedDuplicate(dup)}>
                <div className="ld-dup-flag">Duplicate</div>
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
      {selectedDuplicate && (
        <div className="ld-modal-overlay" onClick={() => setSelectedDuplicate(null)}>
          <div className="ld-modal-card" onClick={e => e.stopPropagation()}>
            <button className="ld-modal-close" onClick={() => setSelectedDuplicate(null)}><X size={16} /></button>
            <div className="ld-modal-header">
              <span className="ld-company-name">{selectedDuplicate.company}</span>
              <span className="ld-dup-badge">Duplicate</span>
            </div>
            <div className="ld-modal-section"><div className="label">Already exists in:</div><div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}><span className="ld-value">{selectedDuplicate.existing.batch?.label || 'Unknown batch'}</span><span className="batch-pill">{selectedDuplicate.existing.batch?.channel === 'lead-finder' ? 'Lead Finder' : 'Scraper'}</span><span className="ld-meta">{fmtDate(selectedDuplicate.existing.batch?.created_at || selectedDuplicate.existing.created_at)}</span></div></div>
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
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const currentIndex = lead ? allLeads.findIndex(l => l.id === lead.id) : -1;
  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  useEffect(() => {
    if (lead) {
      setMessageSubject(lead.subject || '');
      setMessageBody(lead.message || '');
      setLeadStatus(lead.lead_status || 'new');
      setTags(lead.tags || []);
      const emailObjs = getEmailObjs(lead);
      if (emailObjs.length > 0) {
        setSelectedEmails(new Set([emailObjs[0].email]));
      } else {
        setSelectedEmails(new Set());
      }
    }
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

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) { next.delete(email); } else { next.add(email); }
      return next;
    });
  };

  const emailObjs = getEmailObjs(lead);
  const sc = getStatusCfg(leadStatus);

  return (
    <div className="ld-wrap ld-wrap-v2">

      {/* ── HEADER ── */}
      <div className="ldv2-header">
        <div className="ldv2-header-left">
          <div className="ldv2-breadcrumb">
            <span className="ldv2-batch-crumb">{batch.label}</span>
            <ChevronRight size={12} color="var(--text4)" />
            <span className="ldv2-company-crumb">{lead.company || lead.domain || lead.website}</span>
          </div>
          <h1 className="ldv2-title">{lead.company || lead.domain || lead.website}</h1>
          <div className="ldv2-header-meta">
            <select className="ld-select" value={leadStatus} onChange={e => handleStatusChange(e.target.value as LeadStatus)}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="qualified">Qualified</option>
              <option value="dead">Dead</option>
            </select>
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
        </div>
        <div className="ldv2-header-right">
          {allLeads.length > 1 && (
            <div className="ld-nav">
              <span className="ld-nav-count">{currentIndex + 1} of {allLeads.length}</span>
              <div className="ld-nav-btns">
                <button className="ld-nav-btn" onClick={() => onNavigate?.('prev')} disabled={currentIndex === 0}><ChevronLeft size={15} /></button>
                <button className="ld-nav-btn" onClick={() => onNavigate?.('next')} disabled={currentIndex === allLeads.length - 1}><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn secondary" onClick={() => window.open(lead.website, '_blank')}>
              <ExternalLink size={13} /> Open Site
            </button>
            <button
              className="btn"
              style={leadStatus === 'contacted' ? { background: 'var(--teal)', color: '#fff' } : {}}
              onClick={() => handleStatusChange(leadStatus === 'contacted' ? 'new' : 'contacted')}
            >
              {leadStatus === 'contacted' ? <><Check size={13} /> Contacted</> : <><Check size={13} /> Mark Contacted</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN BODY ── */}
      <div className="ldv2-body">

        {/* ── LEFT COLUMN ── */}
        <div className="ldv2-left">

          {/* Contact Details */}
          <div className="ldv2-card">
            <div className="ldv2-card-label">CONTACT DETAILS</div>
            <div className="ldv2-contact-grid">
              <div>
                <div className="ldv2-field-label">WEBSITE</div>
                {lead.website
                  ? <a href={lead.website} target="_blank" rel="noreferrer" className="ld-link" style={{ fontSize: '13px' }}>{lead.website.replace(/^https?:\/\//, '')}</a>
                  : <span className="ld-no-email">No website</span>}
              </div>
              <div>
                <div className="ldv2-field-label">EMAIL</div>
                {emailObjs.length > 0
                  ? <span style={{ fontSize: '13px', color: 'var(--teal)' }}>{emailObjs.length} email{emailObjs.length !== 1 ? 's' : ''} found</span>
                  : <span className="ld-no-email">No email found</span>}
              </div>
              {lead.phone && (
                <div>
                  <div className="ldv2-field-label">PHONE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} color="var(--text3)" />
                    <span className="ld-value" style={{ fontSize: '13px' }}>{lead.phone}</span>
                  </div>
                </div>
              )}
              {lead.location && (
                <div>
                  <div className="ldv2-field-label">LOCATION</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} color="var(--text3)" />
                    <span className="ld-value" style={{ fontSize: '13px' }}>{lead.location}</span>
                  </div>
                </div>
              )}
              {lead.industry && (
                <div>
                  <div className="ldv2-field-label">INDUSTRY</div>
                  <span className="lead-industry-pill">{lead.industry}</span>
                </div>
              )}
              <div>
                <div className="ldv2-field-label">BATCH</div>
                <span className="ld-value" style={{ fontSize: '13px' }}>{batch.label}</span>
              </div>
            </div>
          </div>

          {/* Icebreaker */}
          <div className="ldv2-card">
            <div className="ldv2-card-label">ICEBREAKER</div>
            {lead.icebreaker ? (
              <div className="ldv2-icebreaker-filled">
                <p className="ld-content-text">{lead.icebreaker}</p>
              </div>
            ) : (
              <div className="ldv2-icebreaker-empty">
                <div className="ldv2-icebreaker-empty-icon">
                  <Sparkles size={20} color="var(--amber)" />
                </div>
                <p className="ldv2-icebreaker-empty-title">No icebreaker yet</p>
                <p className="ldv2-icebreaker-empty-text">
                  Hey! I'm Nessie — I can craft a personalised icebreaker for <strong>{lead.company || 'this lead'}</strong> based on what I find on their website. A great icebreaker can seriously boost your reply rates!
                </p>
                <div className="ldv2-icebreaker-actions">
                  <button className="btn" style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}>
                    <Zap size={12} /> Generate Icebreaker
                  </button>
                  <button className="btn secondary" style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}>
                    <PlusCircle size={12} /> Add to Queue
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email History */}
          <div className="ldv2-card">
            <div className="ldv2-card-label">EMAIL HISTORY</div>
            {batch.channel === 'email'
              ? <EmailStats leadId={lead.id} />
              : (
                <div className="ldv2-empty-state">
                  <Mail size={24} color="var(--text4)" />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text3)' }}>No emails sent yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text4)' }}>Use "Send Email" to send your first outreach</p>
                </div>
              )}
          </div>

          {/* Actions */}
          <div className="ldv2-card">
            <div className="ldv2-card-label">ACTIONS</div>
            <div className="ldv2-actions-list">
              <button className="ldv2-action-row ldv2-action-disabled" disabled>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} /><span>Find Email</span>
                </div>
                <span className="ldv2-coming-soon">COMING SOON</span>
              </button>
              <button className="ldv2-action-row ldv2-action-disabled" disabled>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={14} /><span>Export Lead</span>
                </div>
                <span className="ldv2-coming-soon">COMING SOON</span>
              </button>
              {!showDeleteConfirm ? (
                <button className="ldv2-action-row ldv2-action-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={14} /><span>Delete Lead</span>
                  </div>
                </button>
              ) : (
                <div className="ld-delete-confirm" style={{ padding: '10px 0' }}>
                  <span className="ld-delete-label">Are you sure?</span>
                  <button className="btn" style={{ background: 'var(--danger)', color: '#fff', fontSize: '12px' }} onClick={async () => { await onLeadDelete?.(lead.id); setShowDeleteConfirm(false); onToast('Lead deleted'); }}>Yes, Delete</button>
                  <button className="btn secondary" style={{ fontSize: '12px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="ldv2-right">
          <div className="ldv2-card ldv2-message-card">
            <div className="ldv2-card-label">MESSAGE</div>

            {/* Email selection — only shown if multiple emails */}
            {emailObjs.length > 0 && (
              <div className="ldv2-email-select-section">
                <div className="ldv2-field-label" style={{ marginBottom: '8px' }}>SEND TO</div>
                <div className="ldv2-email-list">
                  {emailObjs.map((e) => {
                    const conf = getConfidenceColor(e.confidence);
                    const isSelected = selectedEmails.has(e.email);
                    return (
                      <div
                        key={e.email}
                        className={`ldv2-email-row ${isSelected ? 'ldv2-email-row--selected' : ''}`}
                        onClick={() => toggleEmail(e.email)}
                      >
                        <div className="ldv2-email-checkbox">
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <div className="ldv2-email-info">
                          <span className="ldv2-email-addr">{e.email}</span>
                          {(e.first_name || e.last_name || e.position) && (
                            <span className="ldv2-email-name">
                              {[e.first_name, e.last_name].filter(Boolean).join(' ')}
                              {e.position ? ` · ${e.position}` : ''}
                            </span>
                          )}
                        </div>
                        {e.confidence > 0 && (
                          <span className="ldv2-conf-badge" style={{ color: conf.color, background: conf.bg, border: `1px solid ${conf.border}` }}>
                            {e.confidence}% {getConfidenceLabel(e.confidence)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject */}
            {batch.channel === 'email' && (
              <div style={{ marginBottom: '16px' }}>
                <div className="ldv2-field-label" style={{ marginBottom: '7px' }}>SUBJECT</div>
                <input
                  className="input"
                  value={messageSubject}
                  onChange={e => setMessageSubject(e.target.value)}
                  placeholder="Subject line — only for email batches"
                />
              </div>
            )}

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="ldv2-field-label" style={{ marginBottom: '7px' }}>BODY</div>
              <textarea
                className="input"
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                style={{ minHeight: '240px', lineHeight: 1.7, resize: 'vertical', flex: 1 }}
                placeholder="Your message will appear here once Nessie processes this lead. You can also write it manually."
              />
              <div className="ld-helper" style={{ marginTop: '8px' }}>
                {lead.message ? 'Auto-generated from your template. Edit freely before sending.' : 'Auto-generated message based on lead details. Edit freely before sending.'}
              </div>
            </div>

            {/* Send actions */}
            <div className="ldv2-send-row">
              {batch.channel === 'email' && (
                <button
                  className="btn"
                  onClick={() => setShowEmailComposer(true)}
                  disabled={selectedEmails.size === 0}
                >
                  <Send size={13} /> Send Email
                </button>
              )}
              <button className="btn secondary" onClick={() => copy(messageBody, 'Message')}>
                <Copy size={13} /> Copy Message
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── EMAIL COMPOSER MODAL ── */}
      {showEmailComposer && (
        <EmailComposer
          lead={{ id: lead.id, company_name: lead.company || lead.domain || lead.website || 'Unknown', full_name: (lead as any).full_name || '', email: Array.from(selectedEmails)[0] ?? getEmailObjs(lead)[0]?.email ?? '', industry: lead.industry }}
          onClose={() => setShowEmailComposer(false)}
          onSent={async () => { await handleStatusChange('contacted'); onToast('Email sent successfully!'); setShowEmailComposer(false); }}
        />
      )}
    </div>
  );
};
