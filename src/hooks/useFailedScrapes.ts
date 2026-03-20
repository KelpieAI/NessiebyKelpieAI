import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface FailedScrape {
  id: string;
  website: string;
  batch_id: string;
  batch_uuid: string;
  owner_user_id: string;
  error_code: string;
  error_message: string;
  attempts: number;
  status: 'failed' | 'wont-fix' | 'retrying';
  timestamp: string;
  last_updated: string;
}

export const useFailedScrapes = (batchId: string) => {
  const [failedScrapes, setFailedScrapes] = useState<FailedScrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (batchId) {
      fetchFailedScrapes();
      setupRealtimeSubscription();
    }
  }, [batchId]);

  const fetchFailedScrapes = async () => {
    try {
      const { data, error } = await supabase
        .from('failed_scrapes')
        .select('*')
        .eq('batch_uuid', batchId)
        .neq('status', 'wont-fix') // Don't show won't-fix by default
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setFailedScrapes(data || []);
    } catch (error) {
      console.error('Error fetching failed scrapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`failed-scrapes-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'failed_scrapes',
          filter: `batch_uuid=eq.${batchId}`,
        },
        (payload) => {
          console.log('Failed scrape realtime event:', payload);
          
          if (payload.eventType === 'INSERT') {
            setFailedScrapes((prev) => [payload.new as FailedScrape, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setFailedScrapes((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as FailedScrape) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setFailedScrapes((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // Retry a single URL
  const retryUrl = async (scrapeId: string) => {
    try {
      const scrape = failedScrapes.find((s) => s.id === scrapeId);
      if (!scrape) {
        console.error('Scrape not found:', scrapeId);
        return { error: 'Scrape not found' };
      }

      console.log('🔄 Retrying URL:', scrape.website);

      // Update status to retrying
      const { error: updateError } = await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'retrying',
          last_updated: new Date().toISOString()
        })
        .eq('id', scrapeId);

      if (updateError) {
        console.error('Error updating status:', updateError);
        return { error: updateError };
      }

      // Get webhook URL and secret
      const webhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL; // FIXED: Use correct env var
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      
      if (!webhookUrl) {
        console.error('❌ VITE_MAKE_BATCH_WEBHOOK_URL not configured');
        
        // Reset status
        await supabase
          .from('failed_scrapes')
          .update({ status: 'failed' })
          .eq('id', scrapeId);
        
        return { error: 'Webhook URL not configured' };
      }

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Not authenticated');
        
        // Reset status
        await supabase
          .from('failed_scrapes')
          .update({ status: 'failed' })
          .eq('id', scrapeId);
        
        return { error: 'Not authenticated' };
      }

      // Normalize URL (add https:// if missing)
      let normalizedUrl = scrape.website.trim();
      if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      console.log('📤 Sending to webhook:', webhookUrl);
      console.log('📦 Payload:', {
        urls: [normalizedUrl],
        batch_id: scrape.batch_uuid,
        user_id: user.id,
        is_retry: true,
      });

      // Send to Make.com for retry (single URL)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify({
          batch_id: scrape.batch_uuid,
          batch_uuid: scrape.batch_uuid,
          user_id: user.id,
          webhook_secret: webhookSecret,
          urls: [normalizedUrl],
          is_retry: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook failed:', response.status, errorText);
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('✅ Webhook sent successfully');
      
      // Note: Status will be updated by Make.com when it completes
      // Either: success → deleted from failed_scrapes
      // Or: failed again → status back to 'failed'
      
      return { error: null };
    } catch (error) {
      console.error('❌ Error retrying URL:', error);
      
      // Reset status back to failed
      await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'failed',
          last_updated: new Date().toISOString()
        })
        .eq('id', scrapeId);
      
      return { error };
    }
  };

  // Retry all failed scrapes - creates new batch
  const retryAll = async (customLabel?: string) => {
    try {
      const urls = failedScrapes
        .filter((s) => s.status === 'failed')
        .map((s) => s.website);

      if (urls.length === 0) {
        return { error: 'No failed scrapes to retry' };
      }

      // Create new batch for retries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const batchLabel = customLabel || `Retry - ${new Date().toLocaleString()}`;

      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          label: batchLabel,
          status: 'pending',
          total_urls: urls.length,
          processed_urls: 0,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Send to Make.com
      const webhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL;
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      
      if (!webhookUrl) {
        return { error: 'Webhook URL not configured' };
      }

      // Normalize URLs
      const normalizedUrls = urls.map(url => {
        const trimmed = url.trim();
        if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify({
          batch_id: newBatch.id,
          batch_uuid: newBatch.id,
          user_id: user.id,
          webhook_secret: webhookSecret,
          urls: normalizedUrls,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook failed');
      }

      // Mark all as retrying
      await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'retrying',
          last_updated: new Date().toISOString()
        })
        .eq('batch_uuid', batchId)
        .eq('status', 'failed');

      return { data: newBatch, error: null };
    } catch (error) {
      console.error('Error retrying all:', error);
      return { data: null, error };
    }
  };

  // Mark a single scrape as won't fix
  const markWontFix = async (scrapeId: string) => {
    try {
      const { error } = await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'wont-fix',
          last_updated: new Date().toISOString()
        })
        .eq('id', scrapeId);

      if (error) throw error;
      
      // Remove from UI (we filter out wont-fix)
      setFailedScrapes((prev) => prev.filter((s) => s.id !== scrapeId));
      
      return { error: null };
    } catch (error) {
      console.error('Error marking as wont fix:', error);
      return { error };
    }
  };

  // Mark all selected as won't fix
  const markSelectedWontFix = async () => {
    try {
      const { error } = await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'wont-fix',
          last_updated: new Date().toISOString()
        })
        .in('id', selectedIds);

      if (error) throw error;
      
      // Remove from UI
      setFailedScrapes((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      
      return { error: null };
    } catch (error) {
      console.error('Error marking selected as wont fix:', error);
      return { error };
    }
  };

  // Retry all selected
  const retrySelected = async () => {
    try {
      const scrapes = failedScrapes.filter((s) => selectedIds.includes(s.id));
      const urls = scrapes.map((s) => s.website);

      if (urls.length === 0) {
        return { error: 'No scrapes selected' };
      }

      // Mark as retrying
      await supabase
        .from('failed_scrapes')
        .update({ 
          status: 'retrying',
          last_updated: new Date().toISOString()
        })
        .in('id', selectedIds);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Send to Make.com (will go back to same batch)
      const webhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL;
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      
      if (!webhookUrl) {
        // Reset status
        await supabase
          .from('failed_scrapes')
          .update({ status: 'failed' })
          .in('id', selectedIds);
        
        return { error: 'Webhook URL not configured' };
      }

      // Normalize URLs
      const normalizedUrls = urls.map(url => {
        const trimmed = url.trim();
        if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify({
          batch_id: batchId,
          batch_uuid: batchId,
          user_id: user.id,
          webhook_secret: webhookSecret,
          urls: normalizedUrls,
          is_retry: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook failed');
      }

      setSelectedIds([]);
      return { error: null };
    } catch (error) {
      console.error('Error retrying selected:', error);
      
      // Reset status
      await supabase
        .from('failed_scrapes')
        .update({ status: 'failed' })
        .in('id', selectedIds);
      
      return { error };
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(failedScrapes.map((s) => s.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds([]);
  };

  return {
    failedScrapes,
    loading,
    selectedIds,
    retryUrl,
    retryAll,
    retrySelected,
    markWontFix,
    markSelectedWontFix,
    toggleSelect,
    selectAll,
    clearSelection,
    refreshFailedScrapes: fetchFailedScrapes,
  };
};