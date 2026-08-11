import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, Trash2, Copy, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';

const MediaSelector = ({ isOpen, onClose, onSelect, basePath = '' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('company_documents').list(basePath, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      toast({ title: "Erro ao buscar arquivos", description: error.message, variant: "destructive" });
    } else {
      const filesWithUrls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder') // Filter out placeholder
        .map(file => {
          const { data: urlData } = supabase.storage.from('company_documents').getPublicUrl(`${basePath ? basePath + '/' : ''}${file.name}`);
          return { ...file, publicURL: urlData.publicUrl };
        });
      setFiles(filesWithUrls);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, basePath]);

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    const sanitizedFileName = sanitizeFileName(selectedFile.name);
    const filePath = `${basePath ? basePath + '/' : ''}${uuidv4()}-${sanitizedFileName}`;

    try {
      const { error } = await supabase.storage.from('company_documents').upload(filePath, selectedFile);
      if (error) throw error;
      toast({ title: "Upload concluído!", description: "Seu arquivo foi enviado com sucesso." });
      await fetchFiles();
    } catch (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileName) => {
    const filePath = `${basePath ? basePath + '/' : ''}${fileName}`;
    try {
      const { error } = await supabase.storage.from('company_documents').remove([filePath]);
      if (error) throw error;
      toast({ title: "Arquivo deletado", description: "O arquivo foi removido com sucesso." });
      await fetchFiles();
    } catch (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciador de Mídia ({basePath || 'Raiz'})</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-4 bg-secondary/50 rounded-md">
          {loading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : files.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nenhum arquivo encontrado. Comece fazendo um upload!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map(file => (
                <div key={file.id} className="group relative border rounded-lg overflow-hidden aspect-square bg-card">
                  <img src={file.publicURL} alt={file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-between p-2">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(file.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{file.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Button size="sm" className="w-full text-xs" onClick={() => onSelect(file.publicURL)}>Selecionar</Button>
                        <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopy(file.publicURL)}>
                          {copiedUrl === file.publicURL ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="border-t pt-4">
          <Input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;