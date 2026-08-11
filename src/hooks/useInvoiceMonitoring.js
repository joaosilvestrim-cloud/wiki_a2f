import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useInvoiceMonitoring(selectedMonth, selectedYear) {
  const [data, setData] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    console.log(`[useInvoiceMonitoring] Iniciando busca de dados para o período: ${selectedMonth}/${selectedYear}`);
    console.log(`[Task 4/6] FIX: Alterado de 'invoice_tracking' para 'employee_documents'`);
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch active profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, name, is_active')
        .eq('is_active', true);
        
      if (profErr) throw profErr;
      console.log(`[useInvoiceMonitoring] Perfis ativos carregados: ${profiles.length}`);

      // 2. Fetch all employee_documents that represent invoices (Nota Fiscal, NF-e)
      const { data: documents, error: docErr } = await supabase
        .from('employee_documents')
        .select('*')
        .in('category', ['Nota Fiscal', 'NF-e', 'Recibo']) // Added likely categories for invoices
        .order('created_at', { ascending: false });
        
      if (docErr) throw docErr;
      console.log(`[useInvoiceMonitoring] Total de documentos de NF encontrados em employee_documents: ${documents.length}`);
      
      // Map columns from employee_documents to expected structure
      const mappedInvoices = documents.map(doc => ({
        ...doc,
        employee_id: doc.user_id,
        invoice_number: doc.file_name,
        uploaded_at: doc.created_at
      }));
      
      setRawInvoices(mappedInvoices);

      // 3. Define date boundaries based on selected month/year
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 1);

      // 4. Group and calculate per employee
      const processedData = profiles.map(emp => {
        const empInvoices = mappedInvoices.filter(inv => inv.employee_id === emp.id);
        
        // Filter this month
        const thisMonthInvoices = empInvoices.filter(inv => {
          const d = new Date(inv.uploaded_at);
          return d >= startDate && d < endDate;
        });

        const totalInvoices = empInvoices.length;
        const invoicesThisMonth = thisMonthInvoices.length;
        const lastUploadDate = totalInvoices > 0 ? empInvoices[0].uploaded_at : null;

        // Status determination
        let status = 'red'; // Nunca enviou
        if (invoicesThisMonth > 0) {
          status = 'green'; // Enviado este mês
        } else if (totalInvoices > 0) {
          status = 'yellow'; // Pendente este mês (mas já enviou antes)
        }

        return {
          ...emp,
          totalInvoices,
          invoicesThisMonth,
          lastUploadDate,
          invoicesList: empInvoices,
          status
        };
      });

      console.log(`[useInvoiceMonitoring] Dados processados com sucesso. Total de funcionários: ${processedData.length}`);
      setData(processedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[useInvoiceMonitoring] Erro na busca/transformação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Real-time synchronization and initial fetch
  useEffect(() => {
    fetchData();

    console.log('[useInvoiceMonitoring] Configurando listener realtime para employee_documents...');
    const channel = supabase
      .channel('wiki:employee_documents_monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'wiki', table: 'employee_documents' },
        (payload) => {
          console.log('[useInvoiceMonitoring] Evento realtime detectado em employee_documents:', payload.eventType, payload);
          // Trigger the UI update
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('[useInvoiceMonitoring] Status da inscrição realtime:', status);
      });

    // Clean up subscription on unmount
    return () => {
      console.log('[useInvoiceMonitoring] Removendo listener realtime de employee_documents.');
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { 
    data, 
    rawInvoices,
    loading, 
    error, 
    refetch: fetchData,
    lastUpdate
  };
}