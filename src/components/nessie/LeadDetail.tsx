import { useState, useEffect, useMemo } from 'react';
import type { SuccessfulScrape, LeadStatus } from '../../types/nessie';
import type { Batch } from '../../hooks/useBatches';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  Download,
  Mail,
  Tag as TagIcon,
  X,
  Send,
  Globe,
  Phone,
} from 'lucide-react';
import { EmailComposer } from '../EmailComposer';
import { EmailStats } from './EmailStats';

interface SearchResult {
  name: string;
  address: string;
  website: string;
  phone: string;
  industry: string;
  emails?: Array<{
    email: string;
    confidence: number;
    first_name?: string;
    last_name?: string;
    position?: string;
  }>;
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

// Dynamic greeting generator with time-based + random variation
const getEmptyStateGreeting = (userName: string = 'User'): string => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Time-based pools
  const morningGreetings = [
    `Good morning, ${userName}!`,
    `Morning ${userName}, let's crush it!`,
    `Rise and shine, ${userName}!`,
    `Morning ${userName}! Ready to hunt?`,
  ];

  const afternoonGreetings = [
    `Happy afternoon, ${userName}!`,
    `Afternoon ${userName}! Feeling productive?`,
    `Hey ${userName}, ready to dive in?`,
    `Alright ${userName}, let's hunt!`,
  ];

  const eveningGreetings = [
    `Good evening, ${userName}!`,
    `Evening ${userName}! One last push?`,
    `Hey ${userName}, wrapping up?`,
    `Alright ${userName}, let's go!`,
  ];

  const nightGreetings = [
    `Still hunting, ${userName}?`,
    `Burning the midnight oil, ${userName}? 🌙`,
    `Late night grind, ${userName}!`,
    `Night owl mode, ${userName}?`,
  ];

  // Day-specific variations (adds extra personality on specific days)
  const mondayGreetings = [
    `Monday blues? Not with these leads, ${userName}!`,
    `${userName}! How's your Monday shaping up?`,
    `Let's make this Monday count, ${userName}!`,
  ];

  const fridayGreetings = [
    `TGIF, ${userName}! Let's close some deals!`,
    `Friday energy, ${userName}! 🔥`,
    `Almost the weekend, ${userName}! Let's finish strong.`,
  ];

  const weekendGreetings = [
    `Weekend warrior, ${userName}?`,
    `Working on a ${day === 0 ? 'Sunday' : 'Saturday'}? Legend, ${userName}!`,
    `${userName}! Dedication level: 💯`,
  ];

  // Select greeting based on time and day
  let greetingPool: string[];

  // Weekend override
  if (day === 0 || day === 6) {
    greetingPool = weekendGreetings;
  }
  // Monday special
  else if (day === 1 && Math.random() > 0.5) {
    greetingPool = mondayGreetings;
  }
  // Friday special
  else if (day === 5 && Math.random() > 0.5) {
    greetingPool = fridayGreetings;
  }
  // Time-based
  else if (hour >= 5 && hour < 12) {
    greetingPool = morningGreetings;
  } else if (hour >= 12 && hour < 17) {
    greetingPool = afternoonGreetings;
  } else if (hour >= 17 && hour < 21) {
    greetingPool = eveningGreetings;
  } else {
    greetingPool = nightGreetings;
  }

  // Return random greeting from selected pool
  return greetingPool[Math.floor(Math.random() * greetingPool.length)];
};

interface LeadFinderWelcomeProps {
  firstName: string;
  greeting: string;
}

const LeadFinderWelcome = ({ firstName, greeting }: LeadFinderWelcomeProps) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentResult, setEnrichmentResult] = useState<{ found: number; total: number } | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || !location.trim()) {
      setError('Please enter both industry/business type and location');
      return;
    }

    setIsSearching(true);
    setError(null);
    setEnrichmentResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to search');
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-places`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query, location, industry }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setBatchId(data.batch_id || null);
      setHasResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnrich = async () => {
    if (!batchId) {
      setError('No batch to enrich');
      return;
    }

    setIsEnriching(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to enrich');
        setIsEnriching(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ batch_id: batchId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Enrichment failed');
      }

      const data = await response.json();
      setEnrichmentResult({ found: data.found || 0, total: data.total || results.length });

      const { data: enrichedLeads } = await supabase
        .from('successful_scrapes')
        .select('*')
        .eq('batch_uuid', batchId);

      if (enrichedLeads) {
        const mappedResults: SearchResult[] = enrichedLeads.map((lead: any) => ({
          name: lead.company || lead.domain || '',
          address: lead.address || '',
          website: lead.website || '',
          phone: lead.phone || '',
          industry: lead.industry || '',
          emails: lead.emails?.map((email: string, idx: number) => ({
            email,
            confidence: lead.email_confidence?.[idx] || 0,
            first_name: lead.first_name || '',
            last_name: lead.last_name || '',
            position: lead.job_title || '',
          })) || [],
        }));
        setResults(mappedResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: hasResults ? 'stretch' : 'center',
        justifyContent: hasResults ? 'flex-start' : 'center',
        minHeight: '500px',
        textAlign: hasResults ? 'left' : 'center',
        padding: hasResults ? '24px 32px' : '40px',
        fontFamily: "'Space Grotesk', sans-serif",
        transition: 'all 0.3s ease',
      }}
    >
      {/* Welcome Section - fades out when results appear */}
      <div
        style={{
          opacity: hasResults ? 0 : 1,
          transform: hasResults ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          display: hasResults ? 'none' : 'block',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>
          🐉
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '12px',
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '450px',
            marginBottom: '24px',
            margin: '0 auto 24px',
          }}
        >
          Nessie's ready to dive into your leads. Pick a batch from the sidebar or search for new businesses below.
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#64748b',
            fontStyle: 'italic',
            marginBottom: '32px',
          }}
        >
          Pro tip: Use keyboard shortcuts to navigate faster
        </div>
      </div>

      {/* Search Form - always visible, moves to top when results appear */}
      <div
        className="card"
        style={{
          maxWidth: hasResults ? '100%' : '600px',
          width: '100%',
          margin: hasResults ? '0 0 24px 0' : '0 auto',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <span className="section-title">Lead Finder</span>
          <span className="section-tag">Search for businesses</span>
        </div>

        <div
          className="form-grid"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
        >
          <div>
            <label className="label">Industry / Business Type</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. dentists, restaurants"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Austin, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label">Industry Tag (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="button-row" style={{ marginTop: '16px' }}>
          <button
            className="btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search Businesses'}
          </button>
          {hasResults && (
            <button
              className="btn secondary"
              onClick={handleEnrich}
              disabled={isEnriching || !batchId}
            >
              {isEnriching ? 'Finding emails...' : 'Find Emails'}
            </button>
          )}
          {hasResults && (
            <span className="batch-pill" style={{ marginLeft: 'auto' }}>
              {results.length} leads
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: 'rgba(255, 78, 106, 0.1)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            width: '100%',
            maxWidth: hasResults ? '100%' : '600px',
          }}
        >
          {error}
        </div>
      )}

      {/* Enrichment Success Banner */}
      {enrichmentResult && (
        <div
          style={{
            background: 'rgba(17, 194, 210, 0.08)',
            color: 'var(--accent)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          Found emails for {enrichmentResult.found} out of {enrichmentResult.total} businesses
        </div>
      )}

      {/* Results Section - fades in after search */}
      {hasResults && (
        <div
          style={{
            opacity: 1,
            transition: 'opacity 0.3s ease 0.1s',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {results.map((result, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '24px',
              }}
            >
              {/* Left Side - Company Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '6px',
                  }}
                >
                  {result.name}
                </div>

                {result.address && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>📍</span>
                    {result.address}
                  </div>
                )}

                {result.website && (
                  <div
                    style={{
                      fontSize: '12px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Globe size={12} color="var(--accent)" />
                    <a
                      href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'none',
                      }}
                    >
                      {result.website}
                    </a>
                  </div>
                )}

                {result.phone && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#e2e8f0',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Phone size={12} color="var(--text-muted)" />
                    {result.phone}
                  </div>
                )}

                {result.industry && (
                  <span className="lead-industry-pill">
                    {result.industry}
                  </span>
                )}
              </div>

              {/* Right Side - Email Contacts */}
              <div style={{ minWidth: '240px' }}>
                {result.emails && result.emails.length > 0 ? (
                  result.emails.map((contact, cidx) => (
                    <div key={cidx} style={{ marginBottom: cidx < result.emails!.length - 1 ? '8px' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            color: 'var(--accent)',
                            fontWeight: 500,
                          }}
                        >
                          {contact.email}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {contact.confidence}%
                        </span>
                      </div>
                      {(contact.first_name || contact.last_name || contact.position) && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {contact.first_name} {contact.last_name}
                          {contact.position && ` - ${contact.position}`}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    — no email yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LeadDetail = ({
  lead,
  batch,
  allLeads,
  loading,
  onToast,
  onLeadUpdate,
  onLeadDelete,
  onNavigate
}: LeadDetailProps) => {
  const { profile } = useAuth();

  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  console.log('[LeadDetail] Rendering. Loading:', loading, 'Lead:', lead?.id, 'Batch:', batch?.id);

  // Calculate lead position in batch
  const currentLeadIndex = lead ? allLeads.findIndex(l => l.id === lead.id) : -1;
  const leadNumber = currentLeadIndex + 1;
  const totalLeads = allLeads.length;

  // Extract first name from full_name (e.g., "Sami Mustafa" → "Sami")
  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  // Generate greeting once and cache it (won't regenerate on re-renders)
  const emptyStateGreeting = useMemo(() => getEmptyStateGreeting(firstName), [firstName]);

  // Update message when lead changes
  useEffect(() => {
    if (lead) {
      // Use the message/subject returned from Make.com (no fallback - Make handles template merging)
      const subject = lead.subject || '';
      const body = lead.message || '';

      setMessageSubject(subject);
      setMessageBody(body);
      setLeadStatus(lead.lead_status || 'new');
      setTags(lead.tags || []);
    }
  }, [lead]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lead || !onNavigate) return;

      if (e.key === 'ArrowLeft' && currentLeadIndex > 0) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && currentLeadIndex < totalLeads - 1) {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lead, currentLeadIndex, totalLeads, onNavigate]);

  if (loading) {
    console.log('[LeadDetail] Showing loading skeleton');
    return <LoadingSkeleton />;
  }

  if (!lead || !batch) {
    console.log('[LeadDetail] No lead or batch selected');
    return (
      <LeadFinderWelcome
        firstName={firstName}
        greeting={emptyStateGreeting}
      />
    );
  }

  console.log('[LeadDetail] Displaying lead:', lead.company, lead.domain);

  const copyToClipboard = (text: string, label: string = 'Content') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    onToast(`${label} copied to clipboard`);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setLeadStatus(newStatus);
    if (onLeadUpdate) {
      await onLeadUpdate(lead.id, {
        lead_status: newStatus,
        contacted_at: newStatus === 'contacted' ? new Date().toISOString() : lead.contacted_at
      });
    }
    onToast(`Status updated to ${newStatus}`);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    setIsAddingTag(false);

    if (onLeadUpdate) {
      await onLeadUpdate(lead.id, { tags: updatedTags });
    }
    onToast('Tag added');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);

    if (onLeadUpdate) {
      await onLeadUpdate(lead.id, { tags: updatedTags });
    }
    onToast('Tag removed');
  };

  const handleMarkContacted = async () => {
    const newStatus = leadStatus === 'contacted' ? 'new' : 'contacted';
    await handleStatusChange(newStatus);
  };

  const handleDeleteLead = async () => {
    if (onLeadDelete) {
      await onLeadDelete(lead.id);
      setShowDeleteConfirm(false);
      onToast('Lead deleted');
    }
  };

  const openWebsite = () => {
    window.open(lead.website, '_blank');
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
      case 'contacted':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
      case 'replied':
        return { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24' };
      case 'qualified':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' };
      case 'dead':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
    }
  };

  const statusColors = getStatusColor(leadStatus);

  return (
    <div
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Breadcrumb & Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
            {lead.company || lead.domain || lead.website}
          </span>
          <span>•</span>
          <div
            style={{
              background: 'rgba(20, 184, 166, 0.1)',
              color: '#14b8a6',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(20, 184, 166, 0.3)',
            }}
          >
            {batch.label}
          </div>
          <span>•</span>
          <div
            style={{
              background: statusColors.bg,
              color: statusColors.text,
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {leadStatus}
          </div>
        </div>

        {/* Lead Counter & Navigation */}
        {totalLeads > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              {leadNumber} of {totalLeads}
            </span>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => onNavigate && onNavigate('prev')}
                disabled={currentLeadIndex === 0}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: currentLeadIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentLeadIndex === 0 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentLeadIndex > 0) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <ChevronLeft size={16} color="#e2e8f0" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('next')}
                disabled={currentLeadIndex === totalLeads - 1}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: currentLeadIndex === totalLeads - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentLeadIndex === totalLeads - 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentLeadIndex < totalLeads - 1) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <ChevronRight size={16} color="#e2e8f0" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Summary Section */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#e2e8f0',
              margin: 0,
            }}
          >
            Lead Summary
          </h2>
          <button
            onClick={openWebsite}
            style={{
              background: 'var(--accent)',
              color: '#021014',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <ExternalLink size={14} />
            Open Site
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Website
            </div>
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#14b8a6',
                textDecoration: 'none',
              }}
            >
              {lead.website}
            </a>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {Array.isArray(lead.emails) && lead.emails.length > 0 ? (
                <>
                  {lead.emails[0]}
                  <button
                    onClick={() => copyToClipboard(lead.emails![0], 'Email')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    <Copy size={14} color="#14b8a6" />
                  </button>
                </>
              ) : (
                'No email'
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Industry
            </div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(20, 184, 166, 0.1)',
                color: '#14b8a6',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid rgba(20, 184, 166, 0.2)',
              }}
            >
              {lead.industry || 'business'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Owner
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#e2e8f0',
              }}
            >
              Assigned to Nessie user
            </div>
          </div>
        </div>
      </div>

      {/* Status & Tags Section */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              Status:
            </span>
            <select
              value={leadStatus}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                color: '#e2e8f0',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="qualified">Qualified</option>
              <option value="dead">Dead</option>
            </select>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              Tags:
            </span>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  padding: '4px 8px 4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  <X size={12} color="#94a3b8" />
                </button>
              </div>
            ))}

            {isAddingTag ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') {
                      setIsAddingTag(false);
                      setNewTag('');
                    }
                  }}
                  placeholder="Tag name..."
                  autoFocus
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    fontFamily: "'Space Grotesk', sans-serif",
                    outline: 'none',
                    width: '120px',
                  }}
                />
                <button
                  onClick={handleAddTag}
                  style={{
                    background: 'var(--accent)',
                    color: '#021014',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTag('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  border: '1px dashed rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                <TagIcon size={12} />
                Add Tag
              </button>
            )}
          </div>

          {/* Find Email Button - COMING SOON */}
          {(!lead.emails || lead.emails.length === 0) && (
            <button
              disabled
              title="Coming Soon - Email finder integration"
              style={{
                background: 'rgba(148, 163, 184, 0.05)',
                color: '#64748b',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: 0.5,
              }}
            >
              <Mail size={14} />
              Find Email (Coming Soon)
            </button>
          )}
        </div>
      </div>

      {/* Icebreaker Section */}
      <div style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#e2e8f0',
            marginBottom: '20px',
          }}
        >
          Icebreaker
        </h2>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#cbd5e1',
              margin: 0,
            }}
          >
            {lead.icebreaker}
          </p>
        </div>
      </div>

      {/* Message Section */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#e2e8f0',
              margin: 0,
            }}
          >
            Message
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copyToClipboard(messageBody, 'Message')}
              style={{
                background: 'var(--accent)',
                color: '#021014',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Copy size={14} />
              Copy Message
            </button>

            {/* Only show Send Email button for email batches */}
            {batch.channel === 'email' && (
              <button
                onClick={() => setShowEmailComposer(true)}
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#021014',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Send size={14} />
                Send Email
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          {batch.channel === 'email' && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Subject
              </div>
              <input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Body
            </div>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#e2e8f0',
                fontFamily: "'Space Grotesk', sans-serif",
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '8px',
              }}
            >
              {lead.message
                ? 'Generated from your custom template. Edit freely before sending.'
                : 'Auto-generated message based on lead details. Edit freely before sending.'}
            </div>
          </div>
        </div>
      </div>

      {/* Email Stats - Only show for email batches */}
      {batch.channel === 'email' && <EmailStats leadId={lead.id} />}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '24px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <button
          onClick={handleMarkContacted}
          style={{
            background:
              leadStatus === 'contacted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: leadStatus === 'contacted' ? '#22c55e' : '#3b82f6',
            border: `1px solid ${
              leadStatus === 'contacted' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'
            }`,
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              leadStatus === 'contacted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              leadStatus === 'contacted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)';
          }}
        >
          {leadStatus === 'contacted' ? <Check size={16} /> : null}
          {leadStatus === 'contacted' ? 'Marked as Contacted' : 'Mark as Contacted'}
        </button>

        {/* Export CSV - COMING SOON */}
        <button
          disabled
          title="Coming Soon - Export individual leads"
          style={{
            background: 'rgba(148, 163, 184, 0.05)',
            color: '#64748b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.5,
          }}
        >
          <Download size={16} />
          Export (Coming Soon)
        </button>

        {/* Add to Sequence - COMING SOON */}
        <button
          disabled
          title="Coming Soon - Email sequence integration"
          style={{
            background: 'rgba(148, 163, 184, 0.05)',
            color: '#64748b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.5,
          }}
        >
          <Mail size={16} />
          Add to Sequence (Coming Soon)
        </button>

        <div style={{ flex: 1 }} />

        {/* Delete Lead */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <Trash2 size={16} />
            Delete Lead
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#ef4444',
                fontWeight: 500,
              }}
            >
              Are you sure?
            </span>
            <button
              onClick={handleDeleteLead}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* EmailComposer Modal */}
      {showEmailComposer && (
        <EmailComposer
          lead={{
            id: lead.id,
            company_name: lead.company || lead.domain || lead.website || 'Unknown',
            full_name: (lead as any).full_name || '',
            email: Array.isArray(lead.emails) && lead.emails.length > 0 ? lead.emails[0] : '',
            industry: lead.industry,
          }}
          onClose={() => setShowEmailComposer(false)}
          onSent={async () => {
            await handleStatusChange('contacted');
            onToast('Email sent successfully!');
            setShowEmailComposer(false);
          }}
        />
      )}
    </div>
  );
};