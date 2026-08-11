import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Share2, 
  MoreVertical,
  Folder,
  Calendar,
  Loader2,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { logAction } from '@/lib/auditLog';

const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const [viewingDoc, setViewingDoc] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const fetchDocuments = async () => {
    if (!user) {
      toast({ title: 'Erro de autenticação', description: 'Usuário não autenticado', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setLoading(true);
    
    let query = supabase
      .from('documents')
      .select(`
        *,
        profile:profiles(name, avatar_url)
      `);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({ title: 'Erro ao buscar documentos', description: error.message, variant: 'destructive' });
      await logAction('document_fetch_error', { error: error.message });
    } else {
      setDocuments(data || []);
      const uniqueCategories = ['Todos', ...new Set((data || []).map(doc => doc.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleUploadClick = () => {
    if (!user?.is_admin) {
      toast({ 
        title: 'Acesso negado', 
        description: 'Apenas administradores podem fazer upload de documentos da empresa.', 
        variant: 'destructive' 
      });
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!user?.is_admin) {
      toast({ 
        title: 'Acesso negado', 
        description: 'Apenas administradores podem fazer upload.', 
        variant: 'destructive' 
      });
      return;
    }

    setUploading(true);
    const sanitizedFileName = sanitizeFileName(file.name);
    const fileName = `${uuidv4()}-${sanitizedFileName}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company_documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      await logAction('document_upload_error', { error: uploadError.message, fileName: file.name });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('documents').insert({
      name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      category: 'Geral',
      uploaded_by: user.id,
    });

    if (dbError) {
      console.error('Erro ao salvar documento:', dbError);
      toast({ title: 'Erro ao salvar documento', description: dbError.message, variant: 'destructive' });
      await logAction('document_save_error', { error: dbError.message, fileName: file.name });
    } else {
      toast({ title: 'Documento enviado com sucesso!' });
      await logAction('company_document_uploaded', { fileName: file.name, fileSize: file.size, category: 'Geral' });
      fetchDocuments();
    }
    setUploading(false);
  };
  
  const handleDownload = async (filePath, fileName, documentId) => {
    if (!user) {
      toast({ title: 'Acesso negado', description: 'Você precisa estar autenticado.', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase.storage.from('company_documents').download(filePath);
      if (error) {
        console.error('Erro no download:', error);
        toast({ title: 'Erro no download', description: error.message, variant: 'destructive' });
        await logAction('document_download_error', { error: error.message, documentId, fileName });
        return;
      }
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await logAction('company_document_downloaded', { documentId, fileName });
    } catch (error) {
      console.error('Exceção no download:', error);
      toast({ title: 'Erro no download', description: 'Erro inesperado ao baixar arquivo.', variant: 'destructive' });
    }
  };

  const handleDelete = async (doc) => {
    if (!user?.is_admin) {
      toast({ 
        title: 'Acesso negado', 
        description: 'Apenas administradores podem deletar documentos.', 
        variant: 'destructive' 
      });
      return;
    }

    const { error: storageError } = await supabase.storage.from('company_documents').remove([doc.file_path]);
    if (storageError && storageError.message !== 'The resource was not found') {
      console.error('Erro ao deletar arquivo:', storageError);
      toast({ title: 'Erro ao deletar arquivo', description: storageError.message, variant: 'destructive' });
      await logAction('document_delete_error', { error: storageError.message, documentId: doc.id });
      return;
    }
    const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
    if (dbError) {
      console.error('Erro ao deletar registro:', dbError);
      toast({ title: 'Erro ao deletar registro', description: dbError.message, variant: 'destructive' });
      await logAction('document_delete_db_error', { error: dbError.message, documentId: doc.id });
    } else {
      toast({ title: 'Documento deletado com sucesso!' });
      await logAction('company_document_deleted', { documentId: doc.id, fileName: doc.name });
      fetchDocuments();
    }
  };

  const handleView = async (doc) => {
    if (!user) {
      toast({ title: 'Acesso negado', description: 'Você precisa estar autenticado.', variant: 'destructive' });
      return;
    }

    try {
      const { data } = supabase.storage.from('company_documents').getPublicUrl(doc.file_path);
      setViewingDoc({ ...doc, url: data.publicUrl });
      await logAction('company_document_viewed', { documentId: doc.id, fileName: doc.name });
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      toast({ title: 'Erro ao visualizar', description: 'Não foi possível abrir o documento.', variant: 'destructive' });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.profile?.name && doc.profile.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAction = (action, document = null) => {
    const message = document ? `${action} - ${document.name}` : action;
    toast({
      title: `🚧 ${message}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const getFileIcon = (type) => FileText;
  const getFileColor = (type) => {
    if (type?.includes('pdf')) return 'text-red-500 bg-red-500/10';
    if (type?.includes('word')) return 'text-blue-500 bg-blue-500/10';
    if (type?.includes('presentation')) return 'text-orange-500 bg-orange-500/10';
    if (type?.includes('sheet')) return 'text-green-500 bg-green-500/10';
    return 'text-primary bg-primary/10';
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">Acesso não autorizado</h3>
          <p className="text-muted-foreground">Por favor, faça login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentos da Empresa</h1>
          <p className="text-muted-foreground mt-1">Documentos compartilhados com todos os funcionários</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        {user.is_admin && (
          <Button onClick={handleUploadClick} disabled={uploading} className="mt-4 sm:mt-0 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Enviando...' : 'Upload Documento'}
          </Button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" placeholder="Buscar documentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div className="flex gap-2">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              {categories.map(category => <option key={category} value={category} className="bg-card">{category}</option>)}
            </select>
            <Button variant="outline" onClick={() => handleAction('Filtros Avançados')} className="border-border text-foreground hover:bg-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document, index) => (
              <motion.div key={document.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileColor(document.file_type)}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  {user.is_admin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Tem certeza que deseja excluir o documento "{document.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(document)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="text-foreground font-semibold mb-2 line-clamp-2">{document.name}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs font-semibold uppercase">
                      {document.file_type?.split('/')[1] || 'FILE'}
                    </span>
                    <span>{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <div className="mb-4 space-y-2 border-t border-border pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Folder className="w-4 h-4 mr-2 text-primary" />
                    <span>{document.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span>{new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <img src={document.profile?.avatar_url || `https://ui-avatars.com/api/?name=${document.profile?.name || '?'}&background=random`} alt={document.profile?.name} className="w-6 h-6 rounded-full border border-border" />
                    <span className="text-sm text-muted-foreground">{document.profile?.name || 'Desconhecido'}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleDownload(document.file_path, document.name, document.id)} className="flex-1 border-border text-foreground hover:bg-secondary" variant="outline">
                    <Download className="w-4 h-4 mr-1 text-primary" />
                    Download
                  </Button>
                  <Button size="sm" onClick={() => handleView(document)} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredDocuments.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground">
                {user.is_admin 
                  ? 'Faça o upload do primeiro documento para começar.' 
                  : 'Nenhum documento disponível no momento.'}
              </p>
            </motion.div>
          )}
        </>
      )}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl h-[90vh] bg-card border-border text-foreground flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">{viewingDoc?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Documento da empresa</DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4">
            {viewingDoc?.file_type?.startsWith('image/') ? (
              <img src={viewingDoc.url} alt={viewingDoc.name} className="w-full h-full object-contain" />
            ) : viewingDoc?.file_type === 'application/pdf' ? (
              <iframe src={viewingDoc.url} className="w-full h-full border-0" title={viewingDoc.name}></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-24 h-24 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-foreground">Visualização não suportada</p>
                <p className="text-muted-foreground mb-4">O tipo de arquivo '{viewingDoc?.file_type}' não pode ser exibido aqui.</p>
                <Button onClick={() => handleDownload(viewingDoc.file_path, viewingDoc.name, viewingDoc.id)}>
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

export default DocumentsPage;