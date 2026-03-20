export type FailedScrapeStatus = 'failed' | 'retrying' | 'resolved';
export type SuccessfulScrapeStatus = 'success' | 'resolved';

// New: Lead status for tracking pipeline
export type LeadStatus = 'new' | 'contacted' | 'replied' | 'qualified' | 'dead';

export interface FailedScrape {
  id: string;
  website: string;
  batch_id: string;
  timestamp: string;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  status: FailedScrapeStatus;
  last_updated: string;
  created_at: string;
}

export interface ScrapeFailedPayload {
  event: 'scrape_failed';
  source: string;
  timestamp: string;
  website: string;
  error_code: string | number;
  error_message: string;
  batch_id: string;
  attempt?: number;
}

export interface ScrapeResolvedPayload {
  website: string;
  batch_id: string;
}

export interface RetryPayload {
  website: string;
  batch_id: string;
}

export interface MakeRetryPayload {
  trigger: 'retry_single';
  website: string;
  batch_id: string;
  source: 'nessie_ui';
}

export interface SuccessfulScrape {
  id: string;
  website: string;
  domain?: string;
  batch_id: string;
  batch_uuid?: string;
  timestamp: string;
  status: SuccessfulScrapeStatus;
  created_at: string;
  owner_user_id?: string;
  
  // Lead data from scrape
  company?: string;
  industry?: string;
  emails?: string[];
  icebreaker?: string;
  
  // Outreach templates
  subject?: string;
  message?: string;
  
  // Lead tracking fields
  lead_status?: LeadStatus;
  tags?: string[];
  contacted_at?: string;
  viewed_at?: string;
  notes?: string;
  
  // Social/contact info (for future Smart Info)
  phone?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  location?: string;
  company_size?: string;
}

export interface ScrapeSuccessPayload {
  website: string;
  batch_id: string;
  timestamp?: string;
}