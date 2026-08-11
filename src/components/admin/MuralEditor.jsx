import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, X, Share2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';
import { logAction } from '@/lib/auditLog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MuralEditor = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mural_posts')
      .select('*, author:profiles(name)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao buscar posts', description: error.message, variant: 'destructive' });
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentPost(null);
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (post) => {
    setIsEditing(true);
    setCurrentPost(post);
    setTitle(post.title);
    setContent(post.content);
    setImagePreview(post.image_url);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imageUrl = currentPost?.image_url || null;

    if (imageFile) {
      const sanitizedFileName = sanitizeFileName(imageFile.name);
      const fileName = `mural/${uuidv4()}-${sanitizedFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company_documents')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: isEditing,
        });

      if (uploadError) {
        toast({ title: 'Erro no upload da imagem', description: uploadError.message, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('company_documents').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const postData = {
      title,
      content,
      image_url: imageUrl,
      author_id: user.id,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('mural_posts').update(postData).eq('id', currentPost.id));
      if (!error) await logAction('mural_post_updated', { postId: currentPost.id, title });
    } else {
      const { data: newPost, error: insertError } = await supabase.from('mural_posts').insert(postData).select().single();
      error = insertError;
      if (!error) {
        await logAction('mural_post_created', { postId: newPost.id, title });
        const { data: usersToNotify } = await supabase.from('profiles').select('email').eq('is_admin', false);
        if (usersToNotify) {
          for (const u of usersToNotify) {
            await supabase.functions.invoke('send-email', {
              body: JSON.stringify({
                to: u.email,
                subject: `Novo Post no Mural: ${title}`,
                html: `
                  <h1>${title}</h1>
                  <p>Um novo post foi adicionado ao mural da empresa. Acesse a intranet para ver!</p>
                  <div class="ql-content">${content}</div>
                `,
              }),
            });
          }
        }
      }
    }

    if (error) {
      toast({ title: 'Erro ao salvar post', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Post ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
      resetForm();
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Tem certeza que deseja deletar este post?')) {
      const { error } = await supabase.from('mural_posts').delete().eq('id', postId);
      if (error) {
        toast({ title: 'Erro ao deletar post', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Post deletado com sucesso' });
        await logAction('mural_post_deleted', { postId });
        fetchPosts();
      }
    }
  };

  const handleShareOnWhatsApp = (post) => {
    const postUrl = `${window.location.origin}/dashboard/mural/${post.id}`;
    const message = `Confira o novo post no mural da empresa: *${post.title}*!\n\n${postUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Post' : 'Novo Post no Mural'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Título do Post" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="bg-background rounded-lg border border-input">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={quillModules}
              placeholder="Conteúdo do Post"
            />
          </div>
          
          <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <Input type="file" id="image-upload" className="hidden" onChange={handleImageChange} accept="image/*" />
            <label htmlFor="image-upload" className="cursor-pointer text-primary hover:underline">
              <ImageIcon className="mx-auto mb-2 w-8 h-8 text-muted-foreground" />
              {imageFile ? `Arquivo selecionado: ${imageFile.name}` : 'Clique para selecionar uma imagem de capa'}
            </label>
          </div>

          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-cover rounded-lg" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {isEditing && <Button type="button" variant="outline" onClick={resetForm}>Cancelar Edição</Button>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Publicar Post'}
            </Button>
          </div>
        </form>
      </motion.div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Posts Existentes</h2>
        {loading ? <Loader2 className="animate-spin" /> : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="p-4 border rounded-lg flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">Por {post.author?.name || 'Desconhecido'} em {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleShareOnWhatsApp(post)}><Share2 className="w-4 h-4 text-green-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MuralEditor;