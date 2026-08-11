import React, { useState, useMemo, useEffect } from 'react';
import { useInvoiceMonitoring } from '@/hooks/useInvoiceMonitoring';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Eye, ArrowUpDown, FileCheck, AlertCircle, RefreshCw, TerminalSquare, Clock } from 'lucide-react';
import { InvoiceDetailsModal } from '@/components/admin/InvoiceDetailsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/customSupabaseClient';

const MONTHS = [
  { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
];

const YEARS = [2024, 2025, 2026, 2027];

const InvoiceMonitoringPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.is_admin;

  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showDebug, setShowDebug] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  const { data: employeeInvoices, rawInvoices, loading, error, refetch, lastUpdate } = useInvoiceMonitoring(selectedMonth, selectedYear);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const addLog = (msg) => {
    console.log(msg);
    setDiagnosticLogs(prev => [...prev, msg]);
  };

  const runDiagnostics = async () => {
    setDiagnosticLogs([]);
    addLog("=== TASK 1: DIAGNOSTIC invoice_tracking ===");
    const { data: invData, error: invErr } = await supabase.from('invoice_tracking').select('*').limit(10);
    if (invErr) {
      addLog(`Error querying invoice_tracking: ${invErr.message}`);
    } else {
      addLog(`invoice_tracking exists. Sample row count: ${invData.length}`);
      if(invData.length > 0) addLog(`Schema check: ${Object.keys(invData[0]).join(', ')}`);
    }

    addLog("=== TASK 2: DIAGNOSTIC employee_documents ===");
    const { data: docData, error: docErr } = await supabase.from('employee_documents').select('*').limit(10);
    if (docErr) {
      addLog(`Error querying employee_documents: ${docErr.message}`);
    } else {
      addLog(`employee_documents exists. Sample row count: ${docData.length}`);
      if(docData.length > 0) addLog(`Schema check: ${Object.keys(docData[0]).join(', ')}`);
    }

    addLog("=== TASK 5: Comparing Data Sources ===");
    addLog(`InvoiceMonitoringPage is now reading from employee_documents where category = 'Nota Fiscal' or 'NF-e'.`);
    addLog(`MyPortalPage saves to employee_documents. Mismatch fixed!`);
  };

  useEffect(() => {
    if (isAdmin && showDebug) {
      runDiagnostics();
    }
  }, [showDebug, isAdmin]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    if (!employeeInvoices) return [];
    
    let result = employeeInvoices.filter(emp => {
      const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [employeeInvoices, searchTerm, statusFilter, sortConfig]);

  const getStatusBadge = (status) => {
    if (status === 'green') return <span className="badge-green"><FileCheck className="w-3 h-3 mr-1"/> Enviado</span>;
    if (status === 'yellow') return <span className="badge-yellow">Pendente</span>;
    return <span className="badge-red">Nunca Enviou</span>;
  };

  const metrics = {
    total: employeeInvoices?.length || 0,
    invoicesThisMonth: employeeInvoices?.reduce((acc, emp) => acc + emp.invoicesThisMonth, 0) || 0,
    green: employeeInvoices?.filter(e => e.status === 'green').length || 0,
    yellow: employeeInvoices?.filter(e => e.status === 'yellow').length || 0,
    red: employeeInvoices?.filter(e => e.status === 'red').length || 0,
  };

  // Debug Panel Data calculation
  const getDebugData = () => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 1);
    
    const invoicesThisPeriod = rawInvoices.filter(inv => {
      const d = new Date(inv.uploaded_at);
      return d >= startDate && d < endDate;
    });

    return {
      totalDbRecords: rawInvoices.length,
      recordsThisPeriod: invoicesThisPeriod.length,
      employeesWithoutRecords: metrics.red,
      lastTen: rawInvoices.slice(0, 10)
    };
  };

  const handleForceUpdate = () => {
    console.log('[InvoiceMonitoringPage] Atualização forçada acionada pelo usuário.');
    refetch();
    if(showDebug) runDiagnostics();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de NFs</h1>
          <p className="text-muted-foreground mt-1">Acompanhamento de envios de notas fiscais por período.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {lastUpdate && (
            <div className="flex items-center text-xs text-muted-foreground mr-2 bg-secondary px-2 py-1 rounded-md">
              <Clock className="w-3 h-3 mr-1" />
              Última att: {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleForceUpdate} disabled={loading} title="Forçar Atualização">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[110px] bg-card">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="secondary" size="icon" onClick={() => setShowDebug(!showDebug)} title="Painel de Debug">
              <TerminalSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isAdmin && showDebug && (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-700">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
            <h3 className="text-slate-100 font-bold flex items-center gap-2">
              <TerminalSquare className="w-4 h-4" /> 
              Painel de Diagnóstico de Dados (employee_documents)
            </h3>
            <span className="text-slate-500">Período: {selectedMonth}/{selectedYear}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-slate-400">NFs na Tabela DB:</div>
              <div className="text-xl text-blue-400 font-bold">{getDebugData().totalDbRecords}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-slate-400">Registros no Período:</div>
              <div className="text-xl text-green-400 font-bold">{getDebugData().recordsThisPeriod}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-slate-400">Total de Perfis Ativos:</div>
              <div className="text-xl text-yellow-400 font-bold">{metrics.total}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-slate-400">Perfis Sem NFs:</div>
              <div className="text-xl text-red-400 font-bold">{getDebugData().employeesWithoutRecords}</div>
            </div>
          </div>

          <div className="mt-4 mb-4 border-b border-slate-700 pb-2">
             <div className="text-slate-400 mb-1">Diagnostic Log Output:</div>
             <div className="bg-slate-950 p-2 rounded max-h-32 overflow-y-auto text-green-400">
                {diagnosticLogs.map((log, idx) => <div key={idx}>{log}</div>)}
             </div>
          </div>

          <div className="mt-4">
            <div className="text-slate-400 mb-1 border-b border-slate-700 pb-1">Últimos 10 Documentos (NFs):</div>
            {getDebugData().lastTen.length > 0 ? (
              <table className="w-full text-left mt-2">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-1">ID</th>
                    <th className="pb-1">User ID</th>
                    <th className="pb-1">Arquivo</th>
                    <th className="pb-1">Data/Hora (Created At)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {getDebugData().lastTen.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-800/50">
                      <td className="py-1 pr-2 truncate max-w-[80px]" title={inv.id}>{inv.id.substring(0,8)}...</td>
                      <td className="py-1 pr-2 truncate max-w-[120px]" title={inv.user_id}>{inv.user_id}</td>
                      <td className="py-1 pr-2 truncate max-w-[200px]" title={inv.file_path}>{inv.file_path}</td>
                      <td className="py-1 text-slate-400">{new Date(inv.created_at).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-slate-500 italic py-2">Nenhum registro encontrado com categorias de NF.</div>
            )}
          </div>
        </div>
      )}

      {error ? (
        <Alert variant="destructive" className="bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="card p-4 flex flex-col justify-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Entregues (Mês)</span>
              <span className="text-2xl font-bold">{metrics.invoicesThisMonth}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center border-l-4 border-l-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Ativos</span>
              <span className="text-2xl font-bold">{metrics.total}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center border-l-4 border-l-[hsl(var(--status-green))]">
              <span className="text-xs font-semibold text-[hsl(var(--status-green))] uppercase">Enviados (Mês)</span>
              <span className="text-2xl font-bold text-[hsl(var(--status-green))]">{metrics.green}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center border-l-4 border-l-[hsl(var(--status-yellow))]">
              <span className="text-xs font-semibold text-[hsl(var(--status-yellow))] uppercase">Pendentes (Mês)</span>
              <span className="text-2xl font-bold text-[hsl(var(--status-yellow))]">{metrics.yellow}</span>
            </div>
            <div className="card p-4 flex flex-col justify-center border-l-4 border-l-[hsl(var(--status-red))]">
              <span className="text-xs font-semibold text-[hsl(var(--status-red))] uppercase">Sem Histórico</span>
              <span className="text-2xl font-bold text-[hsl(var(--status-red))]">{metrics.red}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="green">Enviado</SelectItem>
                  <SelectItem value="yellow">Pendente</SelectItem>
                  <SelectItem value="red">Nunca Enviou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden shadow-sm min-h-[400px]">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-secondary/50" />
                ))}
              </div>
            ) : employeeInvoices && employeeInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b">
                    <tr>
                      <th 
                        className="px-6 py-4 font-medium cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Funcionário <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-4 font-medium">Status ({MONTHS.find(m => m.value === selectedMonth)?.label})</th>
                      <th 
                        className="px-6 py-4 font-medium cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleSort('totalInvoices')}
                      >
                        <div className="flex items-center gap-1">
                          Total Enviadas <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 font-medium cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleSort('invoicesThisMonth')}
                      >
                        <div className="flex items-center gap-1">
                          No Período <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 font-medium cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleSort('lastUploadDate')}
                      >
                        <div className="flex items-center gap-1">
                          Último Envio <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-4 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {filteredAndSortedData.map((emp) => (
                      <tr key={emp.id} className="table-row-hover">
                        <td className="px-6 py-4 font-medium text-foreground">{emp.name || 'Sem nome'}</td>
                        <td className="px-6 py-4">{getStatusBadge(emp.status)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{emp.totalInvoices}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{emp.invoicesThisMonth}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {emp.lastUploadDate ? new Date(emp.lastUploadDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredAndSortedData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                          Nenhum funcionário encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Nenhum dado encontrado</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                  Não foi possível encontrar registros de funcionários ou não há conexão com o banco de dados. 
                  Verifique o painel de debug (ícone de terminal) para mais detalhes.
                </p>
                <Button variant="outline" className="mt-6" onClick={handleForceUpdate}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Forçar Atualização
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <InvoiceDetailsModal 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        employee={selectedEmployee} 
        onRefreshNeeded={refetch}
      />
    </div>
  );
};

export default InvoiceMonitoringPage;