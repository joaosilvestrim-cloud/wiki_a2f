import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, FileText, GripVertical, ChevronRight, Lock, Newspaper, Users2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [flatPages, setFlatPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({ title: '', slug: '', parent_id: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSitePagesCategory = useCallback(async () => {
    const categoryName = 'Páginas do Site';
    let { data: category } = await supabase.from('wiki_categories').select('id').eq('name', categoryName).single();
    if (!category) {
      const { data: newCategory, error } = await supabase.from('wiki_categories').insert({ name: categoryName, description: 'Páginas de conteúdo do site.' }).select('id').single();
      if (error) throw error;
      category = newCategory;
    }
    return category;
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const category = await getSitePagesCategory();
      const { data, error } = await supabase
        .from('wiki_articles')
        .select('*')
        .eq('category_id', category.id)
        .not('slug', 'in', '("mural", "conheca-a-equipe")')
        .order('position');
      if (error) throw error;

      setFlatPages(data);
      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .sort((a, b) => a.position - b.position)
          .map(item => ({ ...item, children: buildTree(items, item.id) }));
      };
      setPages(buildTree(data));
    } catch (error) {
      toast({ title: "Erro ao buscar páginas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getSitePagesCategory]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: generateSlug(newTitle)
    }));
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', parent_id: null });
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({ title: page.title, slug: page.slug, parent_id: page.parent_id });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (['mural', 'conheca-a-equipe'].includes(formData.slug)) {
      toast({ title: "Slug inválido", description: "Este slug é reservado para uma página padrão.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const category = await getSitePagesCategory();
      const pageData = {
        ...formData,
        parent_id: formData.parent_id === 'null' ? null : formData.parent_id,
        category_id: category.id,
        author_id: user.id,
      };

      let error;
      if (editingPage) {
        ({ error } = await supabase.from('wiki_articles').update(pageData).eq('id', editingPage.id));
      } else {
        const { count } = await supabase.from('wiki_articles').select('*', { count: 'exact', head: true }).eq('category_id', category.id);
        pageData.position = count || 0;
        ({ error } = await supabase.from('wiki_articles').insert(pageData));
      }

      if (error) throw error;

      toast({ title: "Sucesso!", description: `Página ${editingPage ? 'atualizada' : 'criada'}.` });
      handleCloseModal();
      fetchPages();
    } catch (error) {
      toast({ title: "Erro ao salvar página", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pageId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta página e todas as suas subpáginas?")) return;
    
    const { error } = await supabase.from('wiki_articles').delete().eq('id', pageId);
    if (error) {
      toast({ title: "Erro ao deletar página", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Página deletada com sucesso." });
      fetchPages();
    }
  };

  const handleReorder = async (newOrder) => {
    setPages(newOrder);
    const updates = newOrder.map((page, index) => 
      supabase.from('wiki_articles').update({ position: index }).eq('id', page.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some(res => res.error);
    if (hasError) {
      toast({ title: "Erro ao reordenar páginas", description: "Não foi possível salvar a nova ordem.", variant: "destructive" });
      fetchPages(); // Revert on error
    } else {
      toast({ title: "Ordem salva com sucesso!" });
    }
  };

  const PageItem = ({ page, level = 0, dragControls }) => {
    const isDraggable = level === 0;
    return (
      <div className="flex items-center bg-card p-2 rounded-lg hover:bg-secondary transition-colors group">
        <div className="flex items-center flex-grow" style={{ paddingLeft: `${level * 1.5}rem` }}>
          {isDraggable && dragControls && <GripVertical className="w-5 h-5 mr-3 text-muted-foreground cursor-grab" onPointerDown={(e) => dragControls.start(e)} />}
          {!isDraggable && <ChevronRight className="w-4 h-4 mr-2 text-muted-foreground" />}
          <FileText className="w-5 h-5 mr-3 text-primary" />
          <span className="font-medium text-foreground">{page.title}</span>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pages/edit/${page.id}`)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(page)}><Settings2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(page.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  };

  const ReorderablePageItem = ({ page, level = 0 }) => {
    const dragControls = useDragControls();
    const isDraggable = level === 0;

    const itemContent = (
      <div>
        <PageItem page={page} level={level} dragControls={isDraggable ? dragControls : null} />
        {page.children && page.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {page.children.map(child => <ReorderablePageItem key={child.id} page={child} level={level + 1} />)}
          </div>
        )}
      </div>
    );

    if (isDraggable) {
      return (
        <Reorder.Item
          value={page}
          dragListener={false}
          dragControls={dragControls}
          className="mb-2"
        >
          {itemContent}
        </Reorder.Item>
      );
    }
    
    return <div className="mb-2">{itemContent}</div>;
  };

  const DefaultPageItem = ({ title, slug, icon: Icon }) => (
    <div className="flex items-center bg-card p-2 rounded-lg hover:bg-secondary transition-colors group mb-2">
      <div className="flex items-center flex-grow">
        <Icon className="w-5 h-5 mr-3 text-primary" />
        <span className="font-medium text-foreground">{title}</span>
        <Lock className="w-3 h-3 ml-2 text-muted-foreground" />
      </div>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pages/edit/${slug}`)}><Edit className="w-4 h-4" /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciador de Páginas</h1>
          <p className="text-muted-foreground mt-1">Crie, edite e organize a estrutura de páginas do site.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Nova Página
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
      ) : (
        <div>
          <DefaultPageItem title="Mural" slug="mural" icon={Newspaper} />
          <DefaultPageItem title="Conheça a Equipe" slug="conheca-a-equipe" icon={Users2} />
          <Reorder.Group axis="y" values={pages} onReorder={handleReorder}>
            {pages.map(page => <ReorderablePageItem key={page.id} page={page} />)}
          </Reorder.Group>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Editar Página' : 'Nova Página'}</DialogTitle>
            <DialogDescription>Preencha as informações da página.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              placeholder="Título da Página"
              value={formData.title}
              onChange={handleTitleChange}
              required
            />
            <Input
              id="slug"
              placeholder="Slug (URL amigável)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <Select onValueChange={(value) => setFormData({ ...formData, parent_id: value })} value={formData.parent_id || 'null'}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a página pai (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nenhuma (Página Principal)</SelectItem>
                {flatPages.filter(p => p.id !== editingPage?.id).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageManager;