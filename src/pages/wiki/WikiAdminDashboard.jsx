import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book, Layers, Plus, Activity, Users, Eye } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const StatCard = ({ icon, title, value, color, delay, href }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Link to={href} className="block bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Link>
  </motion.div>
);

const WikiAdminDashboard = () => {
  const [stats, setStats] = useState({ articles: 0, categories: 0, users: 0, mostViewed: 'N/A' });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { count: articlesCount } = await supabase.from('wiki_articles').select('*', { count: 'exact', head: true });
        const { count: categoriesCount } = await supabase.from('wiki_categories').select('*', { count: 'exact', head: true });
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        const { data: activityData, error: activityError } = await supabase
          .from('wiki_articles')
          .select('id, title, updated_at, author_id')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (activityError) throw activityError;

        if (activityData && activityData.length > 0) {
          const authorIds = [...new Set(activityData.map(a => a.author_id).filter(id => id))];
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', authorIds);

          if (profilesError) throw profilesError;

          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.name;
            return acc;
          }, {});

          const enrichedActivity = activityData.map(activity => ({
            ...activity,
            author_name: profilesMap[activity.author_id] || 'Usuário desconhecido',
          }));
          setRecentActivity(enrichedActivity);
        } else {
          setRecentActivity([]);
        }

        setStats({ articles: articlesCount || 0, categories: categoriesCount || 0, users: usersCount || 0, mostViewed: 'N/A' });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Gerenciador de Conteúdo</h1>
        <p className="text-blue-200 mt-1">Visão geral do conteúdo e atividades.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Book className="w-6 h-6 text-white" />} title="Total de Artigos" value={loading ? '...' : stats.articles} color="from-blue-500 to-cyan-500" delay={0.1} href="/dashboard/content-manager/articles" />
        <StatCard icon={<Layers className="w-6 h-6 text-white" />} title="Total de Categorias" value={loading ? '...' : stats.categories} color="from-purple-500 to-pink-500" delay={0.2} href="/dashboard/content-manager/categories" />
        <StatCard icon={<Users className="w-6 h-6 text-white" />} title="Total de Usuários" value={loading ? '...' : stats.users} color="from-green-500 to-emerald-500" delay={0.3} href="/dashboard/users" />
        <StatCard icon={<Eye className="w-6 h-6 text-white" />} title="Artigo Mais Visto" value={stats.mostViewed} color="from-amber-500 to-orange-500" delay={0.4} href="#" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-1 space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link to="/dashboard/content-manager/articles/new">
                <button className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105">
                  <Plus className="w-5 h-5 mr-2" /> Criar Novo Artigo
                </button>
              </Link>
              <Link to="/dashboard/content-manager/categories">
                <button className="w-full flex items-center justify-center p-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 font-semibold rounded-lg transition-all">
                  <Layers className="w-5 h-5 mr-2" /> Gerenciar Categorias
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-300" /> Log de Atividade Recente</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-blue-200">Carregando atividades...</p>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Link to={`/dashboard/content-manager/articles/edit/${activity.id}`} key={activity.id} className="block p-3 rounded-lg hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">"{activity.title}" foi atualizado</p>
                      <p className="text-sm text-blue-200">por {activity.author_name}</p>
                    </div>
                    <p className="text-sm text-blue-300">{new Date(activity.updated_at).toLocaleString('pt-BR')}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-blue-200">Nenhuma atividade recente.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WikiAdminDashboard;