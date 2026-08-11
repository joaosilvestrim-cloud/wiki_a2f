import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Upload, Paperclip, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';
import { v4 as uuidv4 } from 'uuid';
import 'react-quill/dist/quill.snow.css';
import '@/styles/react-quill-custom.css';
import { sanitizeFileName } from '@/lib/utils';

const WikiArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isEditing = !!id;

  const fetchArticleData = async () => {
    if (!isEditing) return;
    setLoading(true);
    const { data: articleData, error: articleError } = await supabase.from('wiki_articles').select('*').eq('id', id).single();
    if (articleData) {
      setTitle(articleData.title);
      setContent(articleData.content || '');
      setCategoryId(articleData.category_id);
    } else {
      toast({ title: "Erro", description: "Artigo não encontrado.", variant: "destructive" });
      navigate('/dashboard/content-manager/articles');
    }

    const { data: attachmentData, error: attachmentError } = await supabase.from('wiki_attachments').select('*').eq('article_id', id);
    if (attachmentData) {
      setAttachments(attachmentData);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('wiki_categories').select('id, name').not('name', 'eq', 'Páginas do Site');
      if (data) setCategories(data);
    };
    fetchCategories();
    if (isEditing) {
      fetchArticleData();
    }
  }, [id, isEditing]);

  const generateSlug = (str) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const handleSave = async () => {
    if (!title || !categoryId) {
      toast({ title: "Erro", description: "Título e categoria são obrigatórios.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const articleData = {
      title,
      slug: generateSlug(title),
      content,
      category_id: categoryId,
      author_id: user.id,
    };

    let result;
    if (isEditing) {
      result = await supabase.from('wiki_articles').update(articleData).eq('id', id).select().single();
    } else {
      result = await supabase.from('wiki_articles').insert([articleData]).select().single();
    }

    if (result.error) {
      toast({ title: "Erro ao salvar", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Artigo salvo com sucesso." });
      navigate('/dashboard/content-manager/articles');
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !isEditing) return;

    setUploading(true);
    const sanitizedFileName = sanitizeFileName(file.name);
    const fileName = `${uuidv4()}-${sanitizedFileName}`;
    const filePath = `${user.id}/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('wiki_attachments').upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erro no Upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('wiki_attachments').getPublicUrl(filePath);

    const attachmentData = {
      article_id: id,
      file_name: file.name,
      file_path: publicUrlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
    };

    const { error: dbError } = await supabase.from('wiki_attachments').insert([attachmentData]);

    if (dbError) {
      toast({ title: "Erro ao salvar anexo", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Anexo adicionado." });
      fetchArticleData();
    }
    setUploading(false);
  };

  const handleDeleteAttachment = async (attachmentId, filePath) => {
    const { error: dbError } = await supabase.from('wiki_attachments').delete().eq('id', attachmentId);
    if (dbError) {
      toast({ title: "Erro ao excluir", description: dbError.message, variant: "destructive" });
      return;
    }
    
    const pathParts = new URL(filePath).pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('wiki_attachments') + 1).join('/');
    await supabase.storage.from('wiki_attachments').remove([storagePath]);

    toast({ title: "Sucesso!", description: "Anexo removido." });
    fetchArticleData();
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">{isEditing ? 'Editar Artigo da Wiki' : 'Criar Novo Artigo da Wiki'}</h1>
        <p className="text-blue-200 mt-1">Dê vida ao seu conteúdo.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <label htmlFor="title" className="text-sm font-medium text-white block mb-2">Título do Artigo</label>
            <input id="title" type="text" placeholder="Digite o título aqui..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-white/20 focus:border-blue-400 text-white placeholder-blue-300 focus:outline-none pb-2" />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white" />
          </motion.div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Publicação</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white block mb-2">Categoria da Wiki</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-blue-400 text-white">{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                <Save className="w-4 h-4 mr-2" /> {loading ? 'Salvando...' : 'Salvar Artigo'}
              </Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Anexos</h2>
            <div className="space-y-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current.click()} disabled={!isEditing || uploading} variant="outline" className="w-full border-dashed border-white/30 text-white hover:bg-white/10">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </Button>
              {!isEditing && <p className="text-xs text-center text-blue-300">Salve o artigo antes de adicionar anexos.</p>}
              {attachments.length > 0 ? (
                attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                    <a href={file.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-4 h-4 text-blue-300" />
                      <span className="text-sm text-white truncate hover:underline">{file.file_name}</span>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAttachment(file.id, file.file_path)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))
              ) : (
                isEditing && <p className="text-sm text-center text-blue-200">Nenhum arquivo anexado.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WikiArticleEditor;