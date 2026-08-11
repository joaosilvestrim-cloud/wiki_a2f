import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Waypoints } from 'lucide-react';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';

const WaterfallView = ({ project, members }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*, assignee:assignee_id(id, name, avatar_url)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      toast({ title: 'Erro ao buscar tarefas', description: error.message, variant: 'destructive' });
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [...prev, newTask]);
    fetchTasks(); // Refetch to ensure order and consistency
  };

  return (
    <div className="bg-card p-6 rounded-lg border h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Waypoints className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Plano do Projeto</h2>
        </div>
        <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Nova Tarefa</DialogTitle></DialogHeader>
            <TaskForm 
              project={project} 
              members={members}
              onTaskCreated={handleTaskCreated}
              onFinished={() => setIsTaskFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold text-foreground">Nenhuma tarefa ainda</h3>
              <p className="text-muted-foreground mt-1">Crie a primeira tarefa para começar o planejamento.</p>
            </div>
          )}
        </div>
      )}
      <p className="text-center text-muted-foreground text-sm mt-8">
        Em breve: Visualização em Gráfico de Gantt.
      </p>
    </div>
  );
};

export default WaterfallView;