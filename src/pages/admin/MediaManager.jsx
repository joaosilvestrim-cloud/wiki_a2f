import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, Trash2, Copy, Check, FolderPlus, Folder, FileImage } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MediaManager = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef(null);

  const listFilesAndFolders = async (path) => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('company_documents').list(path, {
      limit: 500,
    });

    if (error) {
      toast({ title: "Erro ao buscar arquivos", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const fetchedFolders = [];
    const fetchedFiles = [];

    for (const item of data) {
      if (!item.id) { // It's a folder
        fetchedFolders.push(item.name);
      } else if (item.name !== '.emptyFolderPlaceholder') { // It's a file
        const { data: urlData } = supabase.storage.from('company_documents').getPublicUrl(`${path ? path + '/' : ''}${item.name}`);
        fetchedFiles.push({ ...item, publicURL: urlData.publicUrl });
      }
    }
    
    // Ensure 'fotos_site' folder exists
    if (path === '' && !fetchedFolders.includes('fotos_site')) {
      await createFolder('fotos_site', '');
      fetchedFolders.push('fotos_site');
    }

    setFolders(fetchedFolders.sort());
    setFiles(fetchedFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
  };

  useEffect(() => {
    listFilesAndFolders(currentPath);
  }, [currentPath]);

  const createFolder = async (folderName, path) => {
    if (!folderName) {
      toast({ title: "Nome da pasta inválido", variant: "destructive" });
      return;
    }
    const fullPath = `${path ? path + '/' : ''}${folderName}/.emptyFolderPlaceholder`;
    try {
      const { error } = await supabase.storage.from('company_documents').upload(fullPath, new Blob(['']), {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      toast({ title: "Pasta criada com sucesso!" });
      setNewFolderName('');
      await listFilesAndFolders(path);
    } catch (error) {
      toast({ title: "Erro ao criar pasta", description: error.message, variant: "destructive" });
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    const sanitizedFileName = sanitizeFileName(selectedFile.name);
    const filePath = `${currentPath ? currentPath + '/' : ''}${uuidv4()}-${sanitizedFileName}`;

    try {
      const { error } = await supabase.storage.from('company_documents').upload(filePath, selectedFile);
      if (error) throw error;
      toast({ title: "Upload concluído!" });
      await listFilesAndFolders(currentPath);
    } catch (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileName) => {
    const filePath = `${currentPath ? currentPath + '/' : ''}${fileName}`;
    try {
      const { error } = await supabase.storage.from('company_documents').remove([filePath]);
      if (error) throw error;
      toast({ title: "Arquivo deletado" });
      await listFilesAndFolders(currentPath);
    } catch (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const breadcrumbs = ['Início', ...currentPath.split('/')].filter(Boolean);

  return (
    <div className="p-6 bg-background rounded-lg shadow-md h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Gerenciador de Mídia</h1>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span
                className="cursor-pointer hover:text-primary"
                onClick={() => {
                  const newPath = breadcrumbs.slice(1, index + 1).join('/');
                  setCurrentPath(newPath);
                }}
              >
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline"><FolderPlus className="w-4 h-4 mr-2" /> Nova Pasta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Criar nova pasta</AlertDialogTitle>
                <AlertDialogDescription>
                  <Input 
                    placeholder="Nome da pasta" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="mt-4"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => createFolder(newFolderName, currentPath)}>Criar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
          <Input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto border rounded-lg p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map(folder => (
              <div key={folder} onClick={() => setCurrentPath(`${currentPath ? currentPath + '/' : ''}${folder}`)} className="cursor-pointer flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors">
                <Folder className="w-12 h-12 text-primary mb-2" /> {/* Changed to Folder icon */}
                <p className="text-sm font-medium text-center truncate w-full">{folder}</p>
              </div>
            ))}
            {files.map(file => (
              <div key={file.id} className="group relative border rounded-lg overflow-hidden aspect-square">
                <img src={file.publicURL} alt={file.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-end p-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{file.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDelete(file.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-7 w-7" onClick={() => handleCopy(file.publicURL)}>
                        {copiedUrl === file.publicURL ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && folders.length === 0 && files.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <FileImage className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Pasta vazia</h3>
                <p>Faça upload de um arquivo para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaManager;