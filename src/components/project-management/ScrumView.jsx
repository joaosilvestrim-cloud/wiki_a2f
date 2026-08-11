import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';

const ScrumView = ({ project, members }) => {
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*, assignee:assignee_id(id, name, avatar_url)')
      .eq('project_id', project.id)
      .is('sprint_id', null);
      
    if (error) {
      toast({ title: 'Erro ao buscar backlog', description: error.message, variant: 'destructive' });
    } else {
      setBacklogTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    // Fetch sprint tasks would go here
  }, [project.id]);

  const handleTaskCreated = (newTask) => {
     if (newTask.sprint_id) {
        setSprintTasks(prev => [...prev, newTask]);
     } else {
        setBacklogTasks(prev => [...prev, newTask]);
     }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Visão Scrum</h2>
        <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova História</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Item no Backlog</DialogTitle></DialogHeader>
            <TaskForm 
              project={project} 
              members={members}
              onTaskCreated={handleTaskCreated}
              onFinished={() => setIsTaskFormOpen(false)} 
              isScrum={true}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-secondary rounded-lg p-4">
          <h3 className="font-bold mb-4 text-center">Product Backlog ({backlogTasks.length})</h3>
           {loading ? <Loader2 className="animate-spin mx-auto"/> : (
            <div className="space-y-3 min-h-[300px]">
              {backlogTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
           )}
        </div>
        <div className="bg-secondary rounded-lg p-4">
          <h3 className="font-bold mb-4 text-center">Sprint Ativa (Em breve)</h3>
          <div className="space-y-3 min-h-[300px]">
             {/* Placeholder for sprint items */}
            <div className="bg-card p-3 rounded-md shadow-sm border text-center text-muted-foreground">
              <p>O quadro da sprint será exibido aqui.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrumView;