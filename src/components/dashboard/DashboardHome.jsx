import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Newspaper, Users, FolderKanban, FileText, Calendar, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const StatCard = ({ title, value, icon, color, link }) => (
  <Link to={link}>
    <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {React.cloneElement(icon, { className: `h-5 w-5 ${color}` })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  </Link>
);

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('company_events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(3);
      
      if (!error) {
        setEvents(data);
      }
    };
    fetchEvents();
  }, []);

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const options = { hour: '2-digit', minute: '2-digit' };

    if (date.toDateString() === now.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', options)}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Amanhã às ${date.toLocaleTimeString('pt-BR', options)}`;
    }
    return date.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Calendar className="mr-2 h-5 w-5" /> Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-start space-x-4 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-shrink-0 h-12 w-12 bg-primary/10 text-primary rounded-lg flex flex-col items-center justify-center">
                  <span className="text-sm font-bold">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' })}</span>
                  <span className="text-xl font-bold">{new Date(event.event_date).getDate()}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{formatEventDate(event.event_date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhum evento programado.</p>
        )}
      </CardContent>
    </Card>
  );
};

const QuickLinks = () => (
  <Card>
    <CardHeader>
      <CardTitle>Acesso Rápido</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-4">
      <Link to="/dashboard/my-documents">
        <Button variant="outline" className="w-full h-20 flex-col justify-center">
          <FileText className="h-6 w-6 mb-1" />
          <span>Meus Docs</span>
        </Button>
      </Link>
      <Link to="/dashboard/page/mural">
        <Button variant="outline" className="w-full h-20 flex-col justify-center">
          <Newspaper className="h-6 w-6 mb-1" />
          <span>Mural</span>
        </Button>
      </Link>
      <Link to="/dashboard/employees">
        <Button variant="outline" className="w-full h-20 flex-col justify-center">
          <Users className="h-6 w-6 mb-1" />
          <span>Funcionários</span>
        </Button>
      </Link>
      <Link to="/dashboard/projects">
        <Button variant="outline" className="w-full h-20 flex-col justify-center">
          <FolderKanban className="h-6 w-6 mb-1" />
          <span>Projetos</span>
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profile:profiles(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error) {
        setActivities(data);
      }
    };
    fetchActivities();
  }, []);

  const getIconForAction = (action) => {
    switch (action) {
      case 'user_login': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'document_uploaded': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'mural_post_created': return <Newspaper className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className="p-2 bg-secondary rounded-full">
                {getIconForAction(activity.action)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {activity.profile?.name || 'Usuário'} {activity.action.replace('_', ' ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, projects: 0, documents: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: projects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      const { count: documents } = await supabase.from('documents').select('*', { count: 'exact', head: true });
      setStats({ users, projects, documents });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Bem-vindo(a) de volta, {user?.name || 'Usuário'}!</h1>
        <p className="text-muted-foreground mt-1">Aqui está um resumo da sua intranet hoje.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard title="Total de Funcionários" value={stats.users} icon={<Users />} color="text-primary" link="/dashboard/employees" />
        <StatCard title="Projetos Ativos" value={stats.projects} icon={<FolderKanban />} color="text-orange-500" link="/dashboard/projects" />
        <StatCard title="Documentos Compartilhados" value={stats.documents} icon={<FileText />} color="text-green-500" link="/dashboard/documents" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <UpcomingEvents />
        </div>
        <div>
          <QuickLinks />
        </div>
      </motion.div>

      {user?.is_admin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RecentActivity />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;