import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, Users, MoreVertical, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProjectForm = ({ onSave, project }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'Planejamento');
  const [priority, setPriority] = useState(project?.priority || 'Média');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave({ name, description, status, priority });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-foreground">Nome do Projeto</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border text-foreground" />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border text-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status" className="text-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority" className="text-foreground">Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="priority" className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Projeto
        </Button>
      </DialogFooter>
    </form>
  );
};

const ProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao buscar projetos', description: error.message, variant: 'destructive' });
    } else {
      setProjects(data.map(p => ({...p, team: []}))); // Mocking team for now
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSaveProject = async (projectData) => {
    const { error } = await supabase.from('projects').insert([projectData]);
    if (error) {
      toast({ title: 'Erro ao salvar projeto', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Projeto salvo com sucesso!' });
      setIsFormOpen(false);
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (action, project = null) => {
    const message = project ? `${action} - ${project.name}` : action;
    toast({
      title: `🚧 ${message}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-500';
      case 'Planejamento': return 'bg-yellow-500';
      case 'Concluído': return 'bg-green-500';
      case 'Pausado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-500/10 font-semibold';
      case 'Média': return 'text-yellow-600 bg-yellow-500/10 font-semibold';
      case 'Baixa': return 'text-green-600 bg-green-500/10 font-semibold';
      default: return 'text-gray-600 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os projetos da empresa</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Projeto</DialogTitle>
            </DialogHeader>
            <ProjectForm onSave={handleSaveProject} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar projetos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{project.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleAction('Menu do Projeto', project)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></div>
                      <span className="text-foreground text-sm font-medium">{project.status}</span>
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-indigo-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-primary" />
                    <span>Início: {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-primary" />
                    <span>Fim: {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex -space-x-2">
                      {project.team.length === 0 && <span className="text-xs text-muted-foreground">Sem equipe</span>}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAction('Ver Projeto', project)} className="border-border text-foreground hover:bg-secondary" variant="outline">
                    Ver Detalhes
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredProjects.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground">Crie um novo projeto para começar.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsPage;