import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/react-quill-custom.css';

const WikiArticleVersions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: articleData } = await supabase.from('wiki_articles').select('id, title').eq('id', id).single();
      if (articleData) {
        setArticle(articleData);
        const { data: versionsData } = await supabase
          .from('wiki_article_versions')
          .select('*, profiles(name)')
          .eq('article_id', id)
          .order('created_at', { ascending: false });
        setVersions(versionsData || []);
      } else {
        toast({ title: "Erro", description: "Artigo não encontrado.", variant: "destructive" });
        navigate('/dashboard/content-manager/articles');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const handleViewVersion = (version) => {
    setSelectedVersion(version);
    setIsModalOpen(true);
  };

  const handleRestoreVersion = async (version) => {
    const { error } = await supabase
      .from('wiki_articles')
      .update({ content: version.content })
      .eq('id', id);

    if (error) {
      toast({ title: "Erro ao restaurar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Versão restaurada com sucesso." });
      navigate(`/dashboard/content-manager/articles/edit/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate('/dashboard/content-manager/articles')} className="mb-4 text-blue-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Artigos
        </Button>
        <h1 className="text-3xl font-bold text-white">Histórico de Versões</h1>
        <p className="text-blue-200 mt-1">Artigo: "{article?.title}"</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="p-6">
          {loading ? (
            <p className="text-center text-blue-200">Carregando histórico...</p>
          ) : versions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {versions.map((version, index) => (
                <motion.div key={version.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                  <div>
                    <p className="text-white font-semibold">Versão de {new Date(version.created_at).toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-blue-200">Autor: {version.profiles?.name || 'Desconhecido'}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleViewVersion(version)} className="text-blue-300 hover:text-white hover:bg-white/10">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRestoreVersion(version)} className="text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      <History className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-blue-400" />
              <h3 className="mt-2 text-xl font-semibold text-white">Nenhum histórico encontrado</h3>
              <p className="mt-1 text-blue-200">Nenhuma versão anterior foi salva para este artigo.</p>
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-blue-400 text-white max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Visualizando Versão</DialogTitle>
            <DialogDescription className="text-blue-300">
              Versão de {selectedVersion ? new Date(selectedVersion.created_at).toLocaleString('pt-BR') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto mt-4 pr-2">
            <ReactQuill
              value={selectedVersion?.content || ''}
              readOnly={true}
              theme="bubble"
              className="text-white"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WikiArticleVersions;