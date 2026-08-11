import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const InvoiceDetailsModal = ({ isOpen, onClose, employee, onRefreshNeeded }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isOpen && employee) {
      loadInvoices();
    }
  }, [isOpen, employee]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoice_tracking')
        .select('*')
        .eq('employee_id', employee.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as notas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      // Assuming 'employee_documents' bucket is used for invoice storage
      const { data, error } = await supabase.storage
        .from('employee_documents')
        .createSignedUrl(doc.file_path, 60);
        
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o link de download.', variant: 'destructive' });
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Tem certeza que deseja deletar a NF ${doc.invoice_number}?`)) return;
    
    setDeletingId(doc.id);
    try {
      // First attempt to remove file from storage
      const { error: storageError } = await supabase.storage
        .from('employee_documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.warn('File not found in storage or permission denied, continuing with DB deletion.', storageError);
      }

      const { error: dbError } = await supabase
        .from('invoice_tracking')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({ title: 'Sucesso', description: 'Nota fiscal deletada com sucesso.' });
      
      if (onRefreshNeeded) onRefreshNeeded();
      loadInvoices();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Erro', description: 'Falha ao deletar a nota fiscal.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const totalSize = invoices.reduce((acc, curr) => acc + (curr.file_size || 0), 0);

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Notas Fiscais - {employee.name}</DialogTitle>
          <DialogDescription>
            Histórico completo de envio de notas fiscais deste funcionário.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border mb-4">
            <span className="text-sm font-medium">Total de Registros: {invoices.length}</span>
            <span className="text-sm text-muted-foreground">Tamanho Total: {(totalSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : invoices.length > 0 ? (
            <div className="overflow-hidden border rounded-lg max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-secondary/50 border-b sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número da NF</th>
                    <th className="px-4 py-3 font-medium">Data de Envio</th>
                    <th className="px-4 py-3 font-medium">Tamanho</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {invoices.map((doc) => (
                    <tr key={doc.id} className="table-row-hover">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {doc.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleDownload(doc)}
                            title="Baixar"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            title="Deletar"
                          >
                            {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed">
              Nenhuma nota fiscal encontrada no histórico.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;