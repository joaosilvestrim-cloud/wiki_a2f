import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, History } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const WikiArticleManagement = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from('wiki_articles')
        .select('id, title, updated_at, author_id, category_id, wiki_categories(name)')
        .not('wiki_categories.name', 'eq', 'Páginas do Site')
        .order('updated_at', { ascending: false });

      if (articlesError) throw articlesError;

      if (articlesData && articlesData.length > 0) {
        const authorIds = [...new Set(articlesData.map(a => a.author_id).filter(id => id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', authorIds);

        if (profilesError) throw profilesError;

        const profilesMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});

        const enrichedArticles = articlesData.map(article => ({
          ...article,
          author_name: profilesMap[article.author_id] || 'N/A',
          category_name: article.wiki_categories?.name || 'N/A',
        }));

        setArticles(enrichedArticles);
        setFilteredArticles(enrichedArticles);
      } else {
        setArticles([]);
        setFilteredArticles([]);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({ title: "Erro ao buscar artigos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const results = articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author_name && article.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredArticles(results);
  }, [searchTerm, articles]);

  const handleOpenAlert = (article) => {
    setArticleToDelete(article);
    setIsAlertOpen(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    
    await supabase.from('wiki_article_versions').delete().eq('article_id', articleToDelete.id);
    await supabase.from('wiki_attachments').delete().eq('article_id', articleToDelete.id);
    
    const { error } = await supabase.from('wiki_articles').delete().eq('id', articleToDelete.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Artigo "${articleToDelete.title}" excluído.` });
      fetchArticles();
    }
    setIsAlertOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciamento de Artigos da Wiki</h1>
          <p className="text-blue-200 mt-1">Visualize e gerencie todos os artigos da base de conhecimento.</p>
        </div>
        <Link to="/dashboard/content-manager/articles/new" className="mt-4 sm:mt-0">
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Novo Artigo
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-transparent border-0 rounded-lg text-white placeholder-blue-200 focus:outline-none"
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 font-semibold text-white">Título</th>
              <th className="p-4 font-semibold text-white hidden md:table-cell">Autor</th>
              <th className="p-4 font-semibold text-white hidden lg:table-cell">Categoria</th>
              <th className="p-4 font-semibold text-white hidden md:table-cell">Última Atualização</th>
              <th className="p-4 font-semibold text-white text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center text-blue-200">Carregando artigos...</td></tr>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <tr key={article.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{article.title}</td>
                  <td className="p-4 text-blue-200 hidden md:table-cell">{article.author_name}</td>
                  <td className="p-4 text-blue-200 hidden lg:table-cell">{article.category_name}</td>
                  <td className="p-4 text-blue-200 hidden md:table-cell">{new Date(article.updated_at).toLocaleString('pt-BR')}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Link to={`/dashboard/content-manager/articles/versions/${article.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-white/10">
                          <History className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`/dashboard/content-manager/articles/edit/${article.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-white/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenAlert(article)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-4 text-center text-blue-200">Nenhum artigo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-red-500 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-300">
              Esta ação excluirá permanentemente o artigo "{articleToDelete?.title}" e todos os seus anexos e histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WikiArticleManagement;