import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useInvoiceTracking() {
  const getReferenceDate = () => new Date('2026-06-23T00:00:00Z');

  const getPeriodFilter = (period) => {
    const now = getReferenceDate();
    let startDate = null;

    if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === 'last_30_days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString();
    }
    
    return startDate;
  };

  const fetchEmployeeInvoices = useCallback(async (employeeId, period = 'this_month') => {
    let query = supabase
      .from('invoice_tracking')
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });

    const startDate = getPeriodFilter(period);
    if (startDate) {
      query = query.gte('uploaded_at', startDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, []);

  const fetchAllInvoicesThisMonth = useCallback(async () => {
    const startDate = getPeriodFilter('this_month');
    const { data, error } = await supabase
      .from('invoice_tracking')
      .select('*')
      .gte('uploaded_at', startDate);
      
    if (error) throw error;
    return data || [];
  }, []);

  const getInvoiceSummary = useCallback((employees, invoicesThisMonth) => {
    const activeEmployees = employees.filter(e => e.is_active);
    
    const invoiceCountsByEmployee = invoicesThisMonth.reduce((acc, inv) => {
      acc[inv.employee_id] = (acc[inv.employee_id] || 0) + 1;
      return acc;
    }, {});

    let withInvoices = 0;
    let withoutInvoices = 0;

    activeEmployees.forEach(emp => {
      if (invoiceCountsByEmployee[emp.id] > 0) {
        withInvoices++;
      } else {
        withoutInvoices++;
      }
    });

    return {
      totalActive: activeEmployees.length,
      withInvoices,
      withoutInvoices
    };
  }, []);

  return {
    fetchEmployeeInvoices,
    fetchAllInvoicesThisMonth,
    getInvoiceSummary
  };
}