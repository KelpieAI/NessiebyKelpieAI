import { supabase } from '../lib/supabase';
import { FailedScrape, ScrapeFailedPayload, SuccessfulScrape } from '../types/nessie';

export interface UpsertFailedScrapeParams {
  website: string;
  batch_id: string;
  timestamp: string;
  error_code: string;
  error_message: string;
  attempt?: number;
}

export const upsertFailedScrape = async (params: UpsertFailedScrapeParams): Promise<FailedScrape> => {
  const { data: existing, error: fetchError } = await supabase
    .from('failed_scrapes')
    .select('*')
    .eq('website', params.website)
    .eq('batch_id', params.batch_id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to check existing record: ${fetchError.message}`);
  }

  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from('failed_scrapes')
      .update({
        attempts: existing.attempts + 1,
        error_code: params.error_code,
        error_message: params.error_message,
        timestamp: params.timestamp,
        last_updated: now,
        status: 'failed',
      })
      .eq('website', params.website)
      .eq('batch_id', params.batch_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('failed_scrapes')
      .insert({
        website: params.website,
        batch_id: params.batch_id,
        timestamp: params.timestamp,
        error_code: params.error_code,
        error_message: params.error_message,
        attempts: params.attempt || 1,
        status: 'failed',
        last_updated: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert record: ${error.message}`);
    }

    return data;
  }
};

export const updateScrapeStatus = async (
  website: string,
  batch_id: string,
  status: 'failed' | 'retrying' | 'resolved',
  incrementAttempts: boolean = false
): Promise<FailedScrape | null> => {
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from('failed_scrapes')
    .select('*')
    .eq('website', website)
    .eq('batch_id', batch_id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch record: ${fetchError.message}`);
  }

  if (!existing) {
    return null;
  }

  const updateData: any = {
    status,
    last_updated: now,
  };

  if (incrementAttempts) {
    updateData.attempts = existing.attempts + 1;
  }

  const { data, error } = await supabase
    .from('failed_scrapes')
    .update(updateData)
    .eq('website', website)
    .eq('batch_id', batch_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return data;
};

export const getFailedScrapes = async (filters?: {
  status?: string;
  timeFilter?: string;
  search?: string;
}): Promise<FailedScrape[]> => {
  let query = supabase
    .from('failed_scrapes')
    .select('*')
    .order('timestamp', { ascending: false });

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status.toLowerCase());
  }

  if (filters?.timeFilter && filters.timeFilter !== 'All') {
    const now = new Date();
    let cutoffDate: Date;

    switch (filters.timeFilter) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    query = query.gte('timestamp', cutoffDate.toISOString());
  }

  if (filters?.search) {
    query = query.ilike('website', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch failed scrapes: ${error.message}`);
  }

  return data || [];
};

export const retryFailedScrape = async (
  website: string,
  batch_id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateScrapeStatus(website, batch_id, 'retrying', true);

    const makeWebhookUrl = import.meta.env.VITE_MAKE_RETRY_WEBHOOK_URL;

    if (!makeWebhookUrl) {
      throw new Error('VITE_MAKE_RETRY_WEBHOOK_URL not configured');
    }

    const payload = {
      trigger: 'retry_single',
      website,
      batch_id,
      source: 'nessie_ui',
    };

    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await updateScrapeStatus(website, batch_id, 'failed', false);
      throw new Error(`Make webhook returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getSuccessfulScrapes = async (filters?: {
  status?: string;
  timeFilter?: string;
  search?: string;
}): Promise<SuccessfulScrape[]> => {
  let query = supabase
    .from('successful_scrapes')
    .select('*')
    .order('timestamp', { ascending: false });

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status.toLowerCase());
  }

  if (filters?.timeFilter && filters.timeFilter !== 'All') {
    const now = new Date();
    let cutoffDate: Date;

    switch (filters.timeFilter) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    query = query.gte('timestamp', cutoffDate.toISOString());
  }

  if (filters?.search) {
    query = query.ilike('website', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch successful scrapes: ${error.message}`);
  }

  return data || [];
};
