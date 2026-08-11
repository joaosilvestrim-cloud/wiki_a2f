import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import MuralViewer from '@/components/public/MuralViewer';
import TeamViewer from '@/components/public/TeamViewer';
import BlockRenderer from '@/components/public/BlockRenderer';

const pageTitles = {
  mural: "Mural",
  comercial: "Comercial",
  'conheca-a-equipe': "Conheça a Nossa Equipe",
  'visao-geral-empresa': "Visão Geral da Empresa",
  'politicas-procedimentos': "Políticas e Procedimentos",
  'recursos-humanos': "Recursos Humanos",
  'colaboracao-ferramentas': "Colaboração e Ferramentas",
  'conteudo-educacional': "Conteúdo Educacional",
  faq: "FAQ",
};

const PublicPageViewer = () => {
  const { pageSlug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageTitle = pageTitles[pageSlug] || pageSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  useEffect(() => {
    const fetchPage = async () => {
      if (pageSlug === 'mural' || pageSlug === 'conheca-a-equipe') {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data: catData, error: catError } = await supabase
          .from('wiki_categories')
          .select('id')
          .eq('name', 'Páginas do Site')
          .single();

        if (catError || !catData) {
          setPageData(null);
          return;
        }

        const { data, error: articleError } = await supabase
          .from('wiki_articles')
          .select('title, content, updated_at')
          .eq('slug', pageSlug)
          .eq('category_id', catData.id)
          .single();

        if (articleError && articleError.code !== 'PGRST116') {
          throw articleError;
        }
        
        setPageData(data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageSlug]);

  const renderContent = () => {
    if (pageSlug === 'mural') {
      return <MuralViewer />;
    }
    if (pageSlug === 'conheca-a-equipe') {
      return <TeamViewer />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Erro ao carregar a página</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (pageData) {
      let blocks = [];
      try {
        blocks = JSON.parse(pageData.content || '[]');
        if (!Array.isArray(blocks)) {
          // Fallback for old plain HTML content
          return (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">{pageData.title}</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Última atualização: {new Date(pageData.updated_at).toLocaleString('pt-BR')}
              </p>
              <div 
                className="ql-content prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: pageData.content }} 
              />
            </>
          );
        }
      } catch (e) {
        // Fallback for old plain HTML content
        return (
          <>
            <h1 className="text-4xl font-bold text-foreground mb-4">{pageData.title}</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Última atualização: {new Date(pageData.updated_at).toLocaleString('pt-BR')}
            </p>
            <div 
              className="ql-content prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: pageData.content }} 
            />
          </>
        );
      }

      return (
        <>
          <h1 className="text-4xl font-bold text-foreground mb-4">{pageData.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: {new Date(pageData.updated_at).toLocaleString('pt-BR')}
          </p>
          <BlockRenderer blocks={blocks} />
        </>
      );
    }

    return (
      <div className="text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Página em Construção</h2>
        <p>O conteúdo para "{pageTitle}" ainda não foi criado.</p>
        <Link to="/dashboard">
          <Button className="mt-6">
            Ir para o Início
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Intranet A2F</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-6 sm:p-8"
      >
        {renderContent()}
      </motion.div>
    </>
  );
};

export default PublicPageViewer;