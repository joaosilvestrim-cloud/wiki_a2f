import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Newspaper, Calendar, User, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const MuralViewer = () => {
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchPostsAndAuthors = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from('mural_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postError) {
        console.error("Error fetching mural posts:", postError);
        setLoading(false);
        return;
      }
      
      setPosts(postData);

      const authorIds = [...new Set(postData.map(p => p.author_id).filter(id => id))];
      if (authorIds.length > 0) {
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', authorIds);

        if (!authorError) {
          const authorMap = authorData.reduce((acc, author) => {
            acc[author.id] = author;
            return acc;
          }, {});
          setAuthors(authorMap);
        }
      }
      setLoading(false);
    };
    fetchPostsAndAuthors();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  const getAuthor = (authorId) => authors[authorId];

  return (
    <Dialog open={!!selectedPost} onOpenChange={(isOpen) => !isOpen && setSelectedPost(null)}>
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Mural de Notícias</h1>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden flex flex-col h-full hover:ring-2 hover:ring-primary transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <h2 className="text-xl font-bold text-foreground mb-2">{post.title}</h2>
                  <div 
                    className="ql-content prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground flex-grow mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                  />
                  <p className="text-xs text-muted-foreground/80 mt-auto pt-4 border-t border-border">
                    Publicado em {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card">
            <Newspaper className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground">O mural está vazio.</h2>
            <p className="text-muted-foreground mt-2">Nenhuma notícia ou postagem foi adicionada ainda. Volte em breve!</p>
          </div>
        )}
      </div>

      {selectedPost && (
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-foreground">{selectedPost.title}</DialogTitle>
             <DialogClose asChild>
                <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-6 w-6" />
                  <span className="sr-only">Fechar</span>
                </button>
              </DialogClose>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
            {selectedPost.image_url && (
              <img src={selectedPost.image_url} alt={selectedPost.title} className="w-full h-96 object-cover" />
            )}
            <div className="p-8">
              <div className="flex items-center space-x-4 text-muted-foreground mb-8 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(selectedPost.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                {getAuthor(selectedPost.author_id) && (
                  <div className="flex items-center">
                    {getAuthor(selectedPost.author_id).avatar_url ? (
                      <img src={getAuthor(selectedPost.author_id).avatar_url} alt={getAuthor(selectedPost.author_id).name} className="w-6 h-6 rounded-full mr-2" />
                    ) : (
                      <User className="w-4 h-4 mr-2" />
                    )}
                    <span>{getAuthor(selectedPost.author_id).name}</span>
                  </div>
                )}
              </div>
              <div 
                className="ql-content prose dark:prose-invert max-w-none prose-lg prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }} 
              />
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default MuralViewer;