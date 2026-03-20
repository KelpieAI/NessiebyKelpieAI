import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SuccessfulScrape {
  id: string;
  website: string;
  domain?: string;
  company: string | null;
  batch_id: string;
  batch_uuid: string;
  timestamp: string;
  emails: string[];
  industry: string | null;
  icebreaker: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  
  // NEW: Lead tracking fields
  lead_status?: 'new' | 'contacted' | 'replied' | 'qualified' | 'dead';
  tags?: string[];
  contacted_at?: string;
  viewed_at?: string;
  notes?: string;
}

export const useLeads = (batchId: string | null) => {
  const [leads, setLeads] = useState<SuccessfulScrape[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!batchId) {
      console.log('[useLeads] No batchId provided, clearing leads');
      setLeads([]);
      return;
    }

    console.log('[useLeads] Loading leads for batch:', batchId);
    
    const fetchLeads = async () => {
      try {
        setLoading(true);

        const batchIdCondition = batchId.includes('-')
          ? 'batch_uuid'
          : 'batch_id';

        console.log('[useLeads] Querying successful_scrapes for', batchIdCondition + ':', batchId);

        const { data, error } = await supabase
          .from('successful_scrapes')
          .select('*')
          .eq(batchIdCondition, batchId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('[useLeads] Error fetching leads:', error);
          throw error;
        }

        console.log('[useLeads] Leads loaded:', data?.length || 0, 'leads');
        setLeads(data || []);
      } catch (error) {
        console.error('[useLeads] Error (caught):', error);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchLeads();

    // Poll every 7 seconds for new leads
    const interval = setInterval(fetchLeads, 7000);

    // Cleanup on unmount or batchId change
    return () => {
      clearInterval(interval);
    };
  }, [batchId]);

  // NEW: Update lead function
  const updateLead = async (leadId: string, updates: Partial<SuccessfulScrape>) => {
    try {
      console.log('[useLeads] Updating lead:', leadId, updates);
      
      const { error } = await supabase
        .from('successful_scrapes')
        .update(updates)
        .eq('id', leadId);

      if (error) {
        console.error('[useLeads] Error updating lead:', error);
        throw error;
      }

      // Optimistically update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        )
      );

      return { error: null };
    } catch (error) {
      console.error('[useLeads] Error updating lead (caught):', error);
      return { error };
    }
  };

  // NEW: Delete lead function
  const deleteLead = async (leadId: string) => {
    try {
      console.log('[useLeads] Deleting lead:', leadId);
      
      const { error } = await supabase
        .from('successful_scrapes')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('[useLeads] Error deleting lead:', error);
        throw error;
      }

      // Optimistically remove from local state
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));

      return { error: null };
    } catch (error) {
      console.error('[useLeads] Error deleting lead (caught):', error);
      return { error };
    }
  };

  return { 
    leads, 
    loading,
    updateLead,
    deleteLead,
  };
};