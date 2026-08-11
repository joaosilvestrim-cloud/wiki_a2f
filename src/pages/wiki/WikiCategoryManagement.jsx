import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const WikiCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wiki_categories').select('*').not('name', 'eq', 'Páginas do Site').order('name', { ascending: true });
    if (error) {
      toast({ title: "Erro ao buscar categorias", description: error.message, variant: "destructive" });
    } else {
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    setCurrentCategory(category ? { ...category } : { name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!currentCategory.name) {
      toast({ title: "Erro de Validação", description: "O nome da categoria é obrigatório.", variant: "destructive" });
      return;
    }

    const { error } = currentCategory.id
      ? await supabase.from('wiki_categories').update({ name: currentCategory.name, description: currentCategory.description }).eq('id', currentCategory.id)
      : await supabase.from('wiki_categories').insert([{ name: currentCategory.name, description: currentCategory.description }]);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Categoria ${currentCategory.id ? 'atualizada' : 'criada'} com sucesso.` });
      setIsModalOpen(false);
      fetchCategories();
    }
  };

  const handleOpenAlert = (category) => {
    setCategoryToDelete(category);
    setIsAlertOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const { count } = await supabase.from('wiki_articles').select('*', { count: 'exact', head: true }).eq('category_id', categoryToDelete.id);

    if (count > 0) {
      toast({ title: "Ação Bloqueada", description: "Não é possível excluir categorias com artigos associados.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }

    const { error } = await supabase.from('wiki_categories').delete().eq('id', categoryToDelete.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Categoria "${categoryToDelete.name}" excluída.` });
      fetchCategories();
    }
    setIsAlertOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Categorias da Wiki</h1>
          <p className="text-blue-200 mt-1">Crie e organize as seções da sua base de conhecimento.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nova Categoria
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 font-semibold text-white">Nome</th>
              <th className="p-4 font-semibold text-white hidden md:table-cell">Descrição</th>
              <th className="p-4 font-semibold text-white text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="p-4 text-center text-blue-200">Carregando categorias...</td></tr>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{category.name}</td>
                  <td className="p-4 text-blue-200 hidden md:table-cell">{category.description || 'Sem descrição'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(category)} className="text-blue-300 hover:text-white hover:bg-white/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenAlert(category)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="p-4 text-center text-blue-200">Nenhuma categoria encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-blue-400 text-white">
          <DialogHeader>
            <DialogTitle>{currentCategory?.id ? 'Editar' : 'Criar'} Categoria</DialogTitle>
            <DialogDescription className="text-blue-300">
              Preencha os detalhes da categoria abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              placeholder="Nome da Categoria"
              value={currentCategory?.name || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={currentCategory?.description || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/20 text-white hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSaveCategory} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-red-500 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-300">
              Esta ação não pode ser desfeita. A categoria "{categoryToDelete?.name}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WikiCategoryManagement;