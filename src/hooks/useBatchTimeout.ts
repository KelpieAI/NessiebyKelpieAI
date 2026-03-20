import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Batch } from './useBatches';

interface StaleBatch {
  batch: Batch;
  staleDuration: number; // minutes
}

export const useBatchTimeout = (batches: Batch[]) => {
  const [staleBatches, setStaleBatches] = useState<StaleBatch[]>([]);
  const TIMEOUT_MINUTES = 30; // Consider batch stale after 30 minutes

  useEffect(() => {
    checkForStaleBatches();
    
    // Check every minute
    const interval = setInterval(checkForStaleBatches, 60000);
    
    return () => clearInterval(interval);
  }, [batches]);

  const checkForStaleBatches = () => {
    const now = new Date();
    const stale: StaleBatch[] = [];

    batches.forEach(batch => {
      if (batch.status === 'processing') {
        const updatedAt = new Date(batch.updated_at || batch.created_at);
        const minutesStale = Math.floor((now.getTime() - updatedAt.getTime()) / 1000 / 60);

        // Check if batch has been processing for too long
        if (minutesStale >= TIMEOUT_MINUTES) {
          // Also check if it looks complete based on counts
          const totalResponses = (batch.successful_count || 0) + (batch.failed_count || 0);
          const looksComplete = totalResponses >= batch.total_urls;

          if (looksComplete) {
            stale.push({ batch, staleDuration: minutesStale });
          }
        }
      }
    });

    setStaleBatches(stale);
  };

  const markBatchComplete = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ 
          status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);

      if (error) throw error;

      // Refresh stale batches list
      checkForStaleBatches();

      return { error: null };
    } catch (error) {
      console.error('Error marking batch complete:', error);
      return { error };
    }
  };

  const autoCompleteStale = async () => {
    try {
      const batchIds = staleBatches.map(s => s.batch.id);
      
      if (batchIds.length === 0) {
        return { error: 'No stale batches to complete' };
      }

      const { error } = await supabase
        .from('batches')
        .update({ 
          status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .in('id', batchIds);

      if (error) throw error;

      // Clear stale batches
      setStaleBatches([]);

      return { count: batchIds.length, error: null };
    } catch (error) {
      console.error('Error auto-completing stale batches:', error);
      return { error };
    }
  };

  return {
    staleBatches,
    hasStaleBatches: staleBatches.length > 0,
    markBatchComplete,
    autoCompleteStale,
  };
};