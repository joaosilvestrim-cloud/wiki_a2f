import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DocumentSettingsPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('document_categories').select('*').order('name');
    if (error) {
      toast({ title: 'Erro ao buscar categorias', description: error.message, variant: 'destructive' });
    } else {
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('document_categories').insert({ name: newCategory.trim() });
    if (error) {
      toast({ title: 'Erro ao adicionar categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria adicionada!' });
      setNewCategory('');
      fetchCategories();
    }
    setIsSubmitting(false);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('document_categories').update({ name: editingCategory.name.trim() }).eq('id', editingCategory.id);
    if (error) {
      toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria atualizada!' });
      setEditingCategory(null);
      fetchCategories();
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id) => {
    const { error } = await supabase.from('document_categories').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao deletar categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria deletada!' });
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Configurações de Documentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie as categorias de documentos para os funcionários.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Adicionar Nova Categoria</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Nome da categoria"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategory.trim()}>
            {isSubmitting && !editingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Adicionar
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Categorias Existentes</h2>
        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                {editingCategory?.id === cat.id ? (
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="flex-grow"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                  />
                ) : (
                  <span className="text-foreground">{cat.name}</span>
                )}
                <div className="flex gap-1">
                  {editingCategory?.id === cat.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={handleUpdateCategory} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingCategory(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => setEditingCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a categoria "{cat.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma categoria encontrada.</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DocumentSettingsPage;