import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const InvoiceAlerts = ({ employeeInvoices }) => {
  const overdueEmployees = employeeInvoices.filter(emp => emp.status === 'yellow' || emp.status === 'red');

  if (overdueEmployees.length === 0) {
    return null;
  }

  const handleRemind = (empName) => {
    toast({
      title: "Lembrete Enviado",
      description: `Notificação enviada com sucesso para ${empName}.`,
    });
  };

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        <AlertTriangle className="w-5 h-5 text-yellow-500" /> 
        Atenção: NFs Pendentes (Junho 2026)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
        {overdueEmployees.map((emp) => (
          <Alert 
            key={emp.id} 
            className={`flex flex-col justify-between transition-colors ${
              emp.status === 'red' 
                ? 'border-destructive/30 bg-destructive/5' 
                : 'border-yellow-500/30 bg-yellow-500/5'
            }`}
          >
            <div className="flex items-start gap-3">
              {emp.status === 'red' ? (
                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle className="text-sm font-semibold truncate" title={emp.name}>
                  {emp.name}
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-1">
                  {emp.status === 'red' 
                    ? 'Nunca enviou notas fiscais.' 
                    : `Último envio: ${new Date(emp.lastInvoiceDate).toLocaleDateString('pt-BR')}`}
                </AlertDescription>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                className={`h-7 text-xs ${emp.status === 'red' ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-yellow-500/10 hover:text-yellow-600'}`}
                onClick={() => handleRemind(emp.name)}
              >
                <Bell className="w-3 h-3 mr-1" /> Lembrar
              </Button>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
};