import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Loader2, ArrowLeft, Type, Image as ImageIcon, Divide, ChevronsUpDown, Code, Columns, Youtube, Folder } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import MuralEditor from '@/components/admin/MuralEditor';
import TeamEditor from '@/components/admin/TeamEditor';
import BlockEditor from '@/components/admin/BlockEditor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SitePageEditor = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDefaultPage, setIsDefaultPage] = useState(false);

  const ensureDefaultPageExists = useCallback(async (slug, title) => {
    let { data: category } = await supabase.from('wiki_categories').select('id').eq('name', 'Páginas do Site').single();
    if (!category) {
      const { data: newCategory, error: newCatError } = await supabase.from('wiki_categories').insert({ name: 'Páginas do Site', description: 'Páginas de conteúdo do site.' }).select('id').single();
      if (newCatError) throw newCatError;
      category = newCategory;
    }
    let { data: article, error } = await supabase.from('wiki_articles').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!article) {
      const { data: newArticle, error: newArtError } = await supabase.from('wiki_articles').insert({ title, slug, category_id: category.id, author_id: user.id, content: '[]' }).select('*').single();
      if (newArtError && newArtError.code !== '23505') throw newArtError;
      article = newArticle || (await supabase.from('wiki_articles').select('*').eq('slug', slug).single()).data;
    }
    return article;
  }, [user]);

  const fetchPageContent = useCallback(async () => {
    setLoading(true);
    try {
      let pageData, error;
      const isSlug = ['mural', 'conheca-a-equipe'].includes(pageId);
      setIsDefaultPage(isSlug);
      if (isSlug) {
        pageData = await ensureDefaultPageExists(pageId, pageId === 'mural' ? 'Mural' : 'Conheça a Equipe');
      } else {
        ({ data: pageData, error } = await supabase.from('wiki_articles').select('id, title, slug, content').eq('id', pageId).single());
      }
      if (error) throw error;
      setPage(pageData);
      
      let parsedContent = [];
      try {
        parsedContent = JSON.parse(pageData?.content || '[]');
        if (!Array.isArray(parsedContent)) parsedContent = [];
      } catch (e) {
        parsedContent = [];
      }
      setBlocks(parsedContent);

    } catch (error) {
      toast({ title: "Erro ao carregar conteúdo", description: error.message, variant: "destructive" });
      navigate('/dashboard/page-manager');
    } finally {
      setLoading(false);
    }
  }, [pageId, navigate, ensureDefaultPageExists]);

  useEffect(() => {
    if (user) fetchPageContent();
  }, [fetchPageContent, user]);

  const handleSave = async () => {
    if (isDefaultPage) {
      toast({ title: "Ação não necessária", description: "As alterações para estas páginas são salvas automaticamente." });
      return;
    }
    setSaving(true);
    try {
      const content = JSON.stringify(blocks);
      const { error } = await supabase.from('wiki_articles').update({ content, author_id: user.id }).eq('id', page.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Página "${page.title}" salva.` });
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type, props = {}) => {
    const newBlock = { id: uuidv4(), type, ...props };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id, newProps) => {
    setBlocks(prev => prev.map(block => block.id === id ? { ...block, ...newProps } : block));
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
    if (page?.slug === 'mural') return <MuralEditor />;
    if (page?.slug === 'conheca-a-equipe') return <TeamEditor />;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-9 bg-card border border-border rounded-xl p-4 sm:p-6 min-h-[60vh]"
        >
          <BlockEditor blocks={blocks} setBlocks={setBlocks} onUpdateBlock={updateBlock} onRemoveBlock={removeBlock} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="sticky top-24 space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Inserir</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('text', { content: '<p>Novo texto...</p>' })}>
                <Type className="w-6 h-6 mb-1" />
                <span className="text-xs">Caixa de texto</span>
              </Button>
              <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('image', { src: '', alt: '' })}>
                <ImageIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Imagens</span>
              </Button>
              <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('youtube', { url: '' })}>
                <Youtube className="w-6 h-6 mb-1" />
                <span className="text-xs">Vídeo Youtube</span>
              </Button>
              <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('embed', { code: '' })}>
                <Code className="w-6 h-6 mb-1" />
                <span className="text-xs">Incorporar</span>
              </Button>
               <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('google_drive', { url: '' })}>
                <Folder className="w-6 h-6 mb-1" />
                <span className="text-xs">Google Drive</span>
              </Button>
              <Button variant="outline" className="flex-col h-20" onClick={() => addBlock('divider')}>
                <Divide className="w-6 h-6 mb-1" />
                <span className="text-xs">Divisor</span>
              </Button>
            </div>
            <h4 className="font-semibold text-md text-foreground pt-4">Blocos de Conteúdo</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => addBlock('collapsible', { title: 'Título Recolhível', content: '<p>Conteúdo...</p>' })}>
                <ChevronsUpDown className="w-4 h-4 mr-2" /> Grupo Recolhível
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Columns className="w-4 h-4 mr-2" /> Layout de Colunas
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="flex flex-col space-y-1">
                    <Button variant="ghost" className="justify-start" onClick={() => addBlock('layout', { columns: [[], []] })}>2 Colunas</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => addBlock('layout', { columns: [[], [], []] })}>3 Colunas</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/page-manager')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Editando: {page?.title}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="bg-gradient-to-r from-primary to-accent text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </motion.div>
      
      {renderContent()}
    </div>
  );
};

export default SitePageEditor;