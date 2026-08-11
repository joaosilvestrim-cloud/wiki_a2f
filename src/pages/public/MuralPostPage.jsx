import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react';
import { Helmet } from 'react-helmet';

const MuralPostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from('mural_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError || !postData) {
        console.error("Error fetching post:", postError);
        setLoading(false);
        return;
      }
      
      setPost(postData);

      if (postData.author_id) {
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', postData.author_id)
          .single();
        
        if (!authorError) {
          setAuthor(authorData);
        }
      }
      
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-16 h-16 text-primary animate-spin" /></div>;
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Post não encontrado</h2>
        <p className="text-muted-foreground mt-2">O post que você está procurando não existe ou foi removido.</p>
        <Link to="/dashboard/page/mural" className="mt-6 inline-block text-primary hover:underline">
          Voltar ao Mural
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | Mural de Notícias</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto py-8 px-4"
      >
        <div className="mb-8">
          <Link to="/dashboard/page/mural" className="flex items-center text-primary hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Mural
          </Link>
        </div>

        <article className="card overflow-hidden">
          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="w-full h-96 object-cover" />
          )}
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{post.title}</h1>
            
            <div className="flex items-center space-x-4 text-muted-foreground mb-8 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(post.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {author && (
                <div className="flex items-center">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt={author.name} className="w-6 h-6 rounded-full mr-2" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  <span>{author.name}</span>
                </div>
              )}
            </div>

            <div 
              className="ql-content prose dark:prose-invert max-w-none prose-lg prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        </article>
      </motion.div>
    </>
  );
};

export default MuralPostPage;