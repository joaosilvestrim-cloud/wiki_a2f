import { useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useInvoiceSync(refreshCallback) {
  useEffect(() => {
    if (!refreshCallback) return;

    // Set up real-time subscription on the employee_documents table
    // Changed from invoice_tracking since documents are stored here
    const channel = supabase
      .channel('wiki:employee_documents_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'wiki', table: 'employee_documents' },
        (payload) => {
          console.log('[useInvoiceSync] Document change received!', payload);
          // Only trigger if it's an invoice-related document
          if (
            payload.new?.category === 'Nota Fiscal' || 
            payload.new?.category === 'NF-e' ||
            payload.old?.category === 'Nota Fiscal' ||
            payload.old?.category === 'NF-e'
          ) {
            refreshCallback();
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCallback]);
}