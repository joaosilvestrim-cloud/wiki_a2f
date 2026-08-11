import React, { useEffect, useState } from 'react';
import { useEmployeeMonitoring } from '@/hooks/useEmployeeMonitoring';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

const EmployeeMonitoringPage = () => {
  const { employees, loading, fetchEmployees, toggleEmployeeStatus } = useEmployeeMonitoring();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Funcionários</h1>
          <p className="text-muted-foreground">Gerencie o status e acesso dos funcionários.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Departamento</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-card-foreground">{emp.name || 'Sem nome'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.department || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.is_active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleEmployeeStatus(emp.id, emp.is_active !== false)}
                        className={emp.is_active !== false ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
                      >
                        {emp.is_active !== false ? <ToggleRight className="w-5 h-5 mr-1" /> : <ToggleLeft className="w-5 h-5 mr-1" />}
                        {emp.is_active !== false ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeMonitoringPage;