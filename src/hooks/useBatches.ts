import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Batch {
  id: string;
  owner_user_id: string | null;
  label: string;
  created_at: string;
  status: 'pending' | 'processing' | 'complete';
  total_urls: number;
  processed_urls: number;
  channel?: string;
  subject_template?: string;
  message_template?: string;
  // ADDED: Real-time calculated fields
  successful_count?: number;
  failed_count?: number;
  actual_processed?: number; // successful + failed (more accurate than processed_urls)
}

export const useBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchesWithCounts();

    // Create a single channel for all realtime subscriptions
    const channel = supabase
      .channel('nessie-realtime')
      
      // Listen to batches table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches',
        },
        (payload) => {
          console.log('Realtime batch event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            // New batch created - add with zero counts
            const newBatch = {
              ...(payload.new as Batch),
              successful_count: 0,
              failed_count: 0,
              actual_processed: 0,
            };
            setBatches((prev) => [newBatch, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Batch updated - accept ALL values from database
            console.log('🔄 Realtime batch UPDATE:', payload.new);
            setBatches((prev) =>
              prev.map((b) => {
                if (b.id === payload.new.id) {
                  const updated = payload.new as Batch;
                  console.log(`   → Updating batch ${b.label}:`, updated);
        
                  return {
                    ...b,
                    ...updated,  // Take ALL values from database including counts
                  };
                }
                return b;
              })
          );
          }

      
      // Listen to successful_scrapes inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'successful_scrapes',
        },
        (payload) => {
          console.log('✅ Realtime successful scrape:', payload.new);
          const batchUuid = (payload.new as any).batch_uuid;
          console.log('   → Batch UUID:', batchUuid);
          
          if (batchUuid) {
            setBatches((prev) => {
              console.log('   → Current batches:', prev.length);
              const updated = prev.map((batch) => {
                if (batch.id === batchUuid) {
                  const newSuccessful = (batch.successful_count || 0) + 1;
                  const newProcessed = newSuccessful + (batch.failed_count || 0);
                  console.log(`   → Updating batch ${batch.label}: ${newSuccessful} successful, ${newProcessed} total`);
                  
                  // DON'T auto-complete client-side - let Make.com handle it
                  return {
                    ...batch,
                    successful_count: newSuccessful,
                    actual_processed: newProcessed,
                  };
                }
                return batch;
              });
              return updated;
            });
          }
        }
      )
      
      // Listen to failed_scrapes inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'failed_scrapes',
        },
        (payload) => {
          console.log('❌ Realtime failed scrape:', payload.new);
          const batchUuid = (payload.new as any).batch_uuid;
          console.log('   → Batch UUID:', batchUuid);
          
          if (batchUuid) {
            setBatches((prev) => {
              console.log('   → Current batches:', prev.length);
              const updated = prev.map((batch) => {
                if (batch.id === batchUuid) {
                  const newFailed = (batch.failed_count || 0) + 1;
                  const newProcessed = (batch.successful_count || 0) + newFailed;
                  console.log(`   → Updating batch ${batch.label}: ${newFailed} failed, ${newProcessed} total`);
                  
                  // DON'T auto-complete client-side - let Make.com handle it
                  return {
                    ...batch,
                    failed_count: newFailed,
                    actual_processed: newProcessed,
                  };
                }
                return batch;
              });
              return updated;
            });
          }
        }
      )
      
      .subscribe((status, err) => {
        console.log('🔴 Realtime subscription status:', status);
        if (err) {
          console.error('🔴 Realtime subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected! Listening to batches, successful_scrapes, failed_scrapes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error - check Supabase settings');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchBatchesWithCounts = async () => {
    try {
      console.log('Fetching batches with counts...');
      
      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      // For each batch, fetch successful and failed counts
      const batchesWithCounts = await Promise.all(
        (batchesData || []).map(async (batch) => {
          // Count successful scrapes
          const { count: successCount } = await supabase
            .from('successful_scrapes')
            .select('*', { count: 'exact', head: true })
            .eq('batch_uuid', batch.id);

          // Count failed scrapes
          const { count: failCount } = await supabase
            .from('failed_scrapes')
            .select('*', { count: 'exact', head: true })
            .eq('batch_uuid', batch.id);

          const successful = successCount || 0;
          const failed = failCount || 0;
          const actualProcessed = successful + failed;

          return {
            ...batch,
            successful_count: successful,
            failed_count: failed,
            actual_processed: actualProcessed,
          };
        })
      );

      console.log('Batches with counts fetched:', batchesWithCounts);
      setBatches(batchesWithCounts);
    } catch (error) {
      console.error('Error fetching batches with counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (batchData: {
    label: string;
    total_urls: number;
    user_id: string;
    channel?: string;
    subject_template?: string;
    message_template?: string;
  }) => {
    try {
      console.log('Creating batch with data:', batchData);

      const { data, error } = await supabase
        .from('batches')
        .insert({
          label: batchData.label,
          status: 'pending' as const,
          total_urls: batchData.total_urls,
          processed_urls: 0,
          owner_user_id: batchData.user_id,
          channel: batchData.channel || 'dm',
          subject_template: batchData.subject_template,
          message_template: batchData.message_template,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Batch created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating batch (caught):', error);
      return { data: null, error };
    }
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error updating batch:', error);
      return { error };
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      console.log('Deleting batch:', id);
    
      // STEP 1: Delete failed_scrapes first
      await supabase
        .from('failed_scrapes')
        .delete()
        .eq('batch_uuid', id);

      // STEP 2: Delete successful_scrapes
      await supabase
        .from('successful_scrapes')
        .delete()
        .eq('batch_uuid', id);

      // STEP 3: Now delete the batch
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBatches((prev) => prev.filter((b) => b.id !== id));
    
      return { error: null };
    } catch (error) {
      console.error('Error deleting batch:', error);
      return { error };
    }
  };

  return {
    batches,
    loading,
    createBatch,
    updateBatch,
    deleteBatch,
    refreshBatches: fetchBatchesWithCounts,
  };
};