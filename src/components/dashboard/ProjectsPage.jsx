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
        <Label htmlFor="name" className="text-white">Nome do Projeto</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/10 border-white/20 text-white" />
      </div>
      <div>
        <Label htmlFor="description" className="text-white">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/10 border-white/20 text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status" className="text-white">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority" className="text-white">Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="priority" className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-500 to-indigo-500">
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
      case 'Alta': return 'text-red-400 bg-red-500/20';
      case 'Média': return 'text-yellow-400 bg-yellow-500/20';
      case 'Baixa': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projetos</h1>
          <p className="text-purple-200 mt-1">Gerencie todos os projetos da empresa</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Projeto</DialogTitle>
            </DialogHeader>
            <ProjectForm onSave={handleSaveProject} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input type="text" placeholder="Buscar projetos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                    </div>
                    <p className="text-purple-200 text-sm">{project.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleAction('Menu do Projeto', project)} className="text-purple-300 hover:text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></div>
                      <span className="text-white text-sm font-medium">{project.status}</span>
                    </div>
                    <span className="text-purple-200 text-sm">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-4 text-sm text-purple-200">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Início: {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Fim: {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <div className="flex -space-x-2">
                      {project.team.length === 0 && <span className="text-xs text-purple-300">Sem equipe</span>}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAction('Ver Projeto', project)} className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-white hover:border-purple-400/50" variant="outline">
                    Ver Detalhes
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredProjects.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum projeto encontrado</h3>
              <p className="text-purple-200">Crie um novo projeto para começar.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsPage;