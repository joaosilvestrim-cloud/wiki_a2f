import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Loader2, KanbanSquare, GitBranch, Waypoints, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectForm } from '@/components/project-management/ProjectForm';
import { Input } from '@/components/ui/input';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const getIcon = (methodology) => {
    switch (methodology) {
      case 'Scrum': return <GitBranch className="h-8 w-8 text-blue-400" />;
      case 'Kanban': return <KanbanSquare className="h-8 w-8 text-purple-400" />;
      case 'Waterfall': return <Waypoints className="h-8 w-8 text-green-400" />;
      default: return <Folder className="h-8 w-8 text-gray-400" />;
    }
  };

  const handleViewProject = () => {
    navigate(`/dashboard/project-management/${project.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring' }}
      className="bg-card border rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col"
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-secondary p-3 rounded-lg">
              {getIcon(project.methodology)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{project.name} [{project.prefix}]</h3>
              <p className="text-sm text-muted-foreground">{project.methodology}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Líder: {project.leader?.name || 'Não definido'}</p>
        </div>
      </div>
      <div className="bg-secondary/50 px-6 py-4 border-t rounded-b-xl flex justify-end">
        <Button variant="outline" onClick={handleViewProject}>Ver Projeto</Button>
      </div>
    </motion.div>
  );
};

const ProjectManagementPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('projects_module')
      .select('*, leader:leader_id(id, name, avatar_url)');

    if (error) {
      toast({ title: 'Erro ao buscar projetos', description: error.message, variant: 'destructive' });
    } else {
      setProjects(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSaveProject = async (projectData, leaderId) => {
    const { data: newProject, error } = await supabase
      .from('projects_module')
      .insert([{ ...projectData, leader_id: leaderId }])
      .select()
      .single();
      
    if (error) {
      toast({ title: 'Erro ao criar projeto', description: error.message, variant: 'destructive' });
      return;
    }

    const { error: memberError } = await supabase
      .from('project_module_users')
      .insert([
        { project_id: newProject.id, user_id: user.id },
        ...(leaderId && leaderId !== user.id ? [{ project_id: newProject.id, user_id: leaderId }] : [])
      ]);
    
    if (memberError) {
      toast({ title: 'Erro ao adicionar membros ao projeto', description: memberError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Projeto criado com sucesso!' });
      setIsFormOpen(false);
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.methodology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Projetos</h1>
          <p className="text-muted-foreground mt-1">Sua central de comando para todos os projetos.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <ProjectForm onSave={handleSaveProject} onFinished={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar projetos por nome, prefixo ou metodologia..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      )}

      {!loading && filteredProjects.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <h3 className="text-xl font-semibold text-foreground">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? `Nenhum resultado para "${searchTerm}".` : 'Crie seu primeiro projeto para começar.'}
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Criar Projeto
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementPage;