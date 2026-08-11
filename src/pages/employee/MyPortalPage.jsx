import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Trash2, Loader2, Search, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';
import { logAction } from '@/lib/auditLog';

const MyPortalPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [documentCategories, setDocumentCategories] = useState([]);

  const fetchDocumentCategories = async () => {
    const { data, error } = await supabase.from('document_categories').select('name').order('name');
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({ title: 'Erro ao buscar categorias', description: error.message, variant: 'destructive' });
    } else {
      setDocumentCategories(data.map(c => c.name));
      if (data.length > 0) {
        setCategory(data[0].name);
      }
    }
  };

  const fetchDocuments = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    console.log(`[Task 3] Fetching documents from 'employee_documents' for user: ${user.id}`);
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({ title: 'Erro ao buscar documentos', description: error.message, variant: 'destructive' });
    } else {
      console.log(`[Task 3] Loaded ${data?.length || 0} documents from employee_documents`);
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.id) {
      fetchDocuments();
      fetchDocumentCategories();
    }
  }, [user]);

  const handleUploadClick = () => {
    if (!user || !user.id) return;
    fileInputRef.current.click();
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileToUpload(file);
      setIsModalOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!user || !user.id) return;

    if (!fileToUpload || !category) {
      toast({ title: 'Campos obrigatórios', description: 'Selecione um arquivo e uma categoria.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    console.log(`[Task 3] Starting upload flow for file: ${fileToUpload.name}`);
    const sanitizedFileName = sanitizeFileName(fileToUpload.name);
    const fileName = `${user.id}/${uuidv4()}-${sanitizedFileName}`;
    
    console.log(`[Task 3] 1. Uploading to storage bucket 'employee_uploads'...`);
    const { error: uploadError } = await supabase.storage
      .from('employee_uploads')
      .upload(fileName, fileToUpload);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    console.log(`[Task 3] 2. Saving metadata to table 'employee_documents'...`);
    console.log(`[Task 3] Columns: user_id=${user.id}, file_name=${fileToUpload.name}, category=${category}`);
    
    const { error: dbError } = await supabase.from('employee_documents').insert({
      user_id: user.id,
      file_name: fileToUpload.name,
      file_path: fileName,
      file_type: fileToUpload.type,
      file_size: fileToUpload.size,
      description,
      category,
      uploaded_by: user.id,
    });

    if (dbError) {
      console.error('Erro ao salvar documento:', dbError);
      toast({ title: 'Erro ao salvar documento', description: dbError.message, variant: 'destructive' });
    } else {
      console.log(`[Task 3] 3. Successfully saved to employee_documents`);
      toast({ title: 'Documento enviado com sucesso!' });
      fetchDocuments();
      setIsModalOpen(false);
      setFileToUpload(null);
      setDescription('');
    }
    setUploading(false);
  };

  const handleDelete = async (doc) => {
    if (!user || !user.id || doc.user_id !== user.id) return;

    const { error: storageError } = await supabase.storage
      .from('employee_uploads')
      .remove([doc.file_path]);

    if (storageError && storageError.message !== 'The resource was not found') {
      toast({ title: 'Erro ao deletar arquivo do armazenamento', description: storageError.message, variant: 'destructive' });
      return;
    }

    const { error: dbError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', doc.id)
      .eq('user_id', user.id);

    if (dbError) {
      toast({ title: 'Erro ao deletar registro do banco', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Arquivo deletado com sucesso!' });
      fetchDocuments();
    }
  };

  const handleDownload = async (filePath, fileName) => {
    if (!user || !user.id) return;
    try {
      const { data, error } = await supabase.storage.from('employee_uploads').download(filePath);
      if (error) throw error;
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
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
    if (!user || !user.id) return;
    try {
      const { data, error } = await supabase.storage
        .from('employee_uploads')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      setViewingDoc({ ...doc, url: data.signedUrl });
    } catch (error) {
      toast({ title: 'Erro ao visualizar', description: error.message, variant: 'destructive' });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFileColor = (type) => {
    if (type?.includes('pdf')) return 'text-red-500';
    if (type?.includes('word')) return 'text-blue-500';
    if (type?.includes('image')) return 'text-green-500';
    return 'text-primary';
  };

  if (!user || !user.id) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">Acesso não autorizado</h3>
          <p className="text-muted-foreground">Por favor, faça login para acessar seus documentos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Portal</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus documentos pessoais e profissionais.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
          <Button onClick={handleUploadClick} className="mt-4 sm:mt-0">
            <Upload className="w-4 h-4 mr-2" />
            Enviar Documento
          </Button>
        </div>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar em seus documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Arquivo</th>
                  <th scope="col" className="px-6 py-3">Categoria</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${getFileColor(doc.file_type)}`} />
                        <span className="font-medium text-foreground truncate max-w-xs">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">{doc.category}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(doc)} className="w-8 h-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path, doc.file_name)} className="w-8 h-8">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} className="w-8 h-8 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDocuments.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground">Clique em "Enviar Documento" para adicionar seu primeiro arquivo.</p>
            </div>
          )}
        </motion.div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Novo Documento</DialogTitle>
            <DialogDescription>
              Adicione uma descrição e categoria para o seu arquivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="font-medium bg-secondary p-3 rounded-md">{fileToUpload?.name}</div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  {/* Default fallback if table is empty */}
                  {documentCategories.length === 0 && (
                    <>
                      <SelectItem value="Nota Fiscal">Nota Fiscal</SelectItem>
                      <SelectItem value="NF-e">NF-e</SelectItem>
                      <SelectItem value="Recibo">Recibo</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl h-[90vh] bg-card border-border text-foreground flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.file_name}</DialogTitle>
            <DialogDescription>{viewingDoc?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4">
            {viewingDoc?.file_type?.startsWith('image/') ? (
              <img src={viewingDoc.url} alt={viewingDoc.file_name} className="w-full h-full object-contain" />
            ) : viewingDoc?.file_type === 'application/pdf' ? (
              <iframe src={viewingDoc.url} className="w-full h-full border-0" title={viewingDoc.file_name}></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-24 h-24 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold">Visualização não suportada</p>
                <p className="text-muted-foreground mb-4">O tipo de arquivo '{viewingDoc?.file_type}' não pode ser exibido aqui.</p>
                <Button onClick={() => handleDownload(viewingDoc.file_path, viewingDoc.file_name)}>
                  <Download className="mr-2 h-4 w-4" />
                  Fazer Download
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPortalPage;