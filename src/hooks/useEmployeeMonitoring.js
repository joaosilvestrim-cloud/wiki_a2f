import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export function useEmployeeMonitoring() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os funcionários.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleEmployeeStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setEmployees(prev => prev.map(emp => 
        emp.id === userId ? { ...emp, is_active: newStatus } : emp
      ));
      
      toast({ title: "Sucesso", description: `Status atualizado para ${newStatus ? 'Ativo' : 'Inativo'}.` });
      
      await logActivity(userId, 'status_change');
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ title: "Erro", description: "Falha ao atualizar o status.", variant: "destructive" });
    }
  };

  const getLastAccess = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('monitoring_logs')
        .select('timestamp')
        .eq('employee_id', userId)
        .eq('action', 'login')
        .order('timestamp', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      return data?.[0]?.timestamp || null;
    } catch (error) {
      console.error('Error getting last access:', error);
      return null;
    }
  };

  const logActivity = async (userId, action) => {
    try {
      await supabase
        .from('monitoring_logs')
        .insert([{ 
          employee_id: userId, 
          action: action, 
          timestamp: new Date().toISOString() 
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const checkInactiveEmployees = async (daysThreshold = 30) => {
    // Simple implementation for threshold logic
    toast({ title: "Info", description: "Verificação de inatividade não implementada nesta versão." });
  };

  return {
    employees,
    loading,
    fetchEmployees,
    toggleEmployeeStatus,
    getLastAccess,
    logActivity,
    checkInactiveEmployees
  };
}