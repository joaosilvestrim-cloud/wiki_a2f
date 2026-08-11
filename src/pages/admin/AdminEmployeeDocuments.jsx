import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Loader2, Search, Eye, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { logAction } from '@/lib/auditLog';

const AdminEmployeeDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null,
    employeeId: '',
    category: 'Nota Fiscal',
    description: ''
  });
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    if (!user || !user.is_admin) {
      toast({ title: 'Acesso negado', description: 'Apenas administradores podem acessar esta página.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    const { data: docData, error: docError } = await supabase
      .from('employee_documents')
      .select(`
        *,
        profile:profiles!employee_documents_user_id_fkey (id, name, email, avatar_url),
        uploaded_by_profile:profiles!employee_documents_uploaded_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (docError) {
      toast({ title: 'Erro ao buscar documentos', description: docError.message, variant: 'destructive' });
    } else {
      setDocuments(docData || []);
      const uniqueCategories = ['all', ...new Set((docData || []).map(doc => doc.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }

    const { data: employeeData, error: employeeError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (employeeError) {
      toast({ title: 'Erro ao buscar funcionários', description: employeeError.message, variant: 'destructive' });
    } else {
      setEmployees(employeeData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.employeeId || !uploadData.category) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    console.log('[AdminDocuments] Iniciando processo de upload para:', uploadData.employeeId);
    setUploadLoading(true);
    
    try {
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${uploadData.employeeId}/${fileName}`;

      // 1. Upload to storage
      console.log('[AdminDocuments] Fazendo upload do arquivo para storage...');
      const { error: uploadError } = await supabase.storage
        .from('employee_uploads')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      // 2. Insert into employee_documents
      console.log('[AdminDocuments] Arquivo no storage com sucesso. Inserindo em employee_documents...');
      const { data: docInsertData, error: dbError } = await supabase
        .from('employee_documents')
        .insert({
          user_id: uploadData.employeeId,
          file_name: uploadData.file.name,
          file_path: filePath,
          file_type: uploadData.file.type,
          file_size: uploadData.file.size,
          category: uploadData.category,
          description: uploadData.description,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. INTEGRATION FIX: If category is Nota Fiscal, also insert into invoice_tracking
      if (uploadData.category === 'Nota Fiscal') {
        console.log('[AdminDocuments] Categoria é Nota Fiscal. Registrando em invoice_tracking...');
        
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoice_tracking')
          .insert({
            employee_id: uploadData.employeeId,
            invoice_number: uploadData.file.name, // Using filename as number if not provided
            file_path: filePath,
            file_size: uploadData.file.size,
            uploaded_at: new Date().toISOString()
          })
          .select();

        if (invoiceError) {
          console.error("[AdminDocuments] FALHA ao inserir em invoice_tracking:", invoiceError);
          toast({ title: 'Aviso', description: 'Documento salvo, mas falha ao registrar no rastreio de NFs. Erro: ' + invoiceError.message, variant: 'destructive' });
        } else {
          console.log("[AdminDocuments] SUCESSO ao inserir em invoice_tracking:", invoiceData);
        }
      }

      toast({ title: 'Sucesso', description: 'Documento anexado com sucesso!' });
      await logAction('admin_uploaded_document', { employeeId: uploadData.employeeId, category: uploadData.category });
      
      setIsUploadOpen(false);
      setUploadData({ file: null, employeeId: '', category: 'Nota Fiscal', description: '' });
      if(fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
      
    } catch (err) {
      console.error('[AdminDocuments] Erro no fluxo de upload:', err);
      toast({ title: 'Erro', description: err.message || 'Falha no upload', variant: 'destructive' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!user || !user.is_admin) return;

    const { error: storageError } = await supabase.storage
      .from('employee_uploads')
      .remove([doc.file_path]);

    if (storageError && storageError.message !== 'The resource was not found') {
      toast({ title: 'Erro', description: storageError.message, variant: 'destructive' });
      return;
    }

    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if (dbError) {
      toast({ title: 'Erro', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Arquivo deletado com sucesso!' });
      fetchData();
    }
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage.from('employee_uploads').download(filePath);
      if (error) throw error;
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: 'Erro no download', description: error.message, variant: 'destructive' });
    }
  };

  const handleView = async (doc) => {
    try {
      const { data, error } = await supabase.storage.from('employee_uploads').createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setViewingDoc({ ...doc, url: data.signedUrl });
    } catch (error) {
      toast({ title: 'Erro ao visualizar', description: error.message, variant: 'destructive' });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.profile?.name && doc.profile.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesEmployee = selectedEmployee === 'all' || doc.user_id === selectedEmployee;
    return matchesSearch && matchesCategory && matchesEmployee;
  });

  const getFileColor = (type) => {
    if (type?.includes('pdf')) return 'text-red-500';
    if (type?.includes('word')) return 'text-blue-500';
    if (type?.includes('image')) return 'text-green-500';
    return 'text-primary';
  };

  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Documentos dos Funcionários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os documentos e notas fiscais (NFs).</p>
        </motion.div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <UploadCloud className="w-4 h-4 mr-2" /> Novo Documento
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome do arquivo ou funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="flex-1 bg-card">
              <SelectValue placeholder="Filtrar por funcionário..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Funcionários</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1 bg-card">
              <SelectValue placeholder="Filtrar por categoria..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="Nota Fiscal">Nota Fiscal</SelectItem>
              {categories.filter(c => c !== 'all' && c !== 'Nota Fiscal').map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-3">Funcionário</th>
                  <th className="px-6 py-3">Arquivo</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{doc.profile?.name || 'Desconhecido'}</div>
                      <div className="text-xs text-muted-foreground">{doc.profile?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${getFileColor(doc.file_type)}`} />
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[200px]">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(doc)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path, doc.file_name)}><Download className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
                              <AlertDialogDescription>Deseja excluir "{doc.file_name}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDocuments.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">Nenhum documento encontrado.</div>
          )}
        </motion.div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Anexar Documento</DialogTitle>
            <DialogDescription>
              Faça upload de documentos (incluindo Notas Fiscais) para funcionários.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select 
                value={uploadData.employeeId} 
                onValueChange={(val) => setUploadData(prev => ({...prev, employeeId: val}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={uploadData.category} 
                onValueChange={(val) => setUploadData(prev => ({...prev, category: val}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nota Fiscal">Nota Fiscal</SelectItem>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="Recibo">Recibo</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {uploadData.category === 'Nota Fiscal' && (
                <p className="text-xs text-muted-foreground mt-1">Este arquivo também será registrado no Monitoramento de NFs.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setUploadData(prev => ({...prev, file: e.target.files[0]}))}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input 
                placeholder="Ex: NF Referente ao mês de Junho/26" 
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({...prev, description: e.target.value}))}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploadLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploadLoading}>
                {uploadLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Fazer Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 mt-4">
            {viewingDoc?.file_type?.startsWith('image/') ? (
              <img src={viewingDoc.url} alt={viewingDoc.file_name} className="w-full h-full object-contain" />
            ) : viewingDoc?.file_type === 'application/pdf' ? (
              <iframe src={viewingDoc.url} className="w-full h-full border-0" title={viewingDoc.file_name}></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-24 h-24 text-muted-foreground mb-4" />
                <p className="mb-4">Este arquivo não suporta pré-visualização.</p>
                <Button onClick={() => handleDownload(viewingDoc.file_path, viewingDoc.file_name)}>Fazer Download</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmployeeDocuments;