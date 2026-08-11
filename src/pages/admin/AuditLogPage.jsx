import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, Filter, User, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles (name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Erro ao buscar logs', description: error.message, variant: 'destructive' });
      } else {
        setLogs(data);
        const uniqueActions = [...new Set(data.map(log => log.action))];
        setActions(uniqueActions);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (JSON.stringify(log.details)?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const renderDetails = (details) => {
    if (!details) return 'N/A';
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Logs de Auditoria</h1>
        <p className="text-muted-foreground mt-1">Monitore todas as atividades importantes que acontecem no sistema.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }} 
        className="card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por usuário, ação ou detalhes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Usuário</th>
                  <th scope="col" className="px-6 py-3">Ação</th>
                  <th scope="col" className="px-6 py-3">Detalhes</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={log.profile?.avatar_url || `https://ui-avatars.com/api/?name=${log.profile?.name || '?'}&background=random`} alt={log.profile?.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-semibold text-foreground">{log.profile?.name || 'Sistema'}</div>
                          <div className="text-muted-foreground text-xs">{log.profile?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs max-w-md truncate">
                      {renderDetails(log.details)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">Os logs de auditoria aparecerão aqui quando as ações forem realizadas.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AuditLogPage;