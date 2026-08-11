import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, KanbanSquare, GitBranch, Waypoints, Folder, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanBoard from '@/components/project-management/KanbanBoard';
import ScrumView from '@/components/project-management/ScrumView';
import WaterfallView from '@/components/project-management/WaterfallView';
import ProjectMembers from '@/components/project-management/ProjectMembers';
import { useAuth } from '@/contexts/AuthContext';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  const fetchProjectData = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects_module')
      .select('*, leader:leader_id(id, name)')
      .eq('id', projectId)
      .single();
    
    if (error) {
      toast({ title: "Erro ao buscar projeto", description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    
    setProject(data);
    setIsLeader(data.leader_id === user.id || user.is_admin);

    const { data: membersData, error: membersError } = await supabase
      .from('project_module_users')
      .select('profiles(*)')
      .eq('project_id', projectId);

    if (membersError) {
      toast({ title: "Erro ao buscar membros", description: membersError.message, variant: 'destructive' });
    } else {
      setMembers(membersData.map(m => m.profiles));
    }

    setLoading(false);
  }, [projectId, user.id, user.is_admin]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const getIcon = (methodology, props) => {
    switch (methodology) {
      case 'Scrum': return <GitBranch {...props} />;
      case 'Kanban': return <KanbanSquare {...props} />;
      case 'Waterfall': return <Waypoints {...props} />;
      default: return <Folder {...props} />;
    }
  };

  const getBoardName = (methodology) => {
    switch (methodology) {
        case 'Kanban': return 'Quadro Kanban';
        case 'Scrum': return 'Sprint';
        default: return 'Quadro';
    }
  }

  const renderContentByMethodology = () => {
    switch (project.methodology) {
      case 'Kanban':
        return <KanbanBoard project={project} members={members} />;
      case 'Scrum':
        return <ScrumView project={project} members={members} />;
      case 'Waterfall':
        return <WaterfallView project={project} members={members} />;
      default:
        return <p>Metodologia de projeto não suportada.</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Link to="/dashboard/project-management" className="text-primary hover:underline mt-4 inline-block">
          Voltar para a lista de projetos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <Link to="/dashboard/project-management" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para todos os projetos
        </Link>
        <div className="flex items-center">
            {getIcon(project.methodology, { className: "h-6 w-6 mr-2" })}
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
        </div>
        <p className="text-muted-foreground mt-1">Líder do Projeto: {project.leader?.name || 'Não definido'}</p>
      </div>
      
      <Tabs defaultValue="board" className="flex-grow flex flex-col">
        <TabsList>
          <TabsTrigger value="board">
            {getIcon(project.methodology, {className: "w-4 h-4 mr-2"})}
            {getBoardName(project.methodology)}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Membros
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="flex-grow mt-4">
          {renderContentByMethodology()}
        </TabsContent>
        <TabsContent value="members" className="flex-grow mt-4">
          <ProjectMembers 
            project={project}
            projectId={projectId} 
            initialMembers={members} 
            isLeader={isLeader}
            onMembersUpdate={fetchProjectData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailPage;