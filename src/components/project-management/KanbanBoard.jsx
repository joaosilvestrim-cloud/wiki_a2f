import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';

const KanbanBoard = ({ project, members }) => {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*, assignee:assignee_id(id, name, avatar_url)')
        .eq('project_id', project.id);

      if (error) {
        toast({ title: 'Erro ao buscar tarefas', description: error.message, variant: 'destructive' });
      } else {
        setTasks(data);
        const newColumns = {
          'Backlog': { id: 'Backlog', title: 'Backlog', taskIds: data.filter(t => t.status === 'Backlog').map(t => t.id) },
          'A Fazer': { id: 'A Fazer', title: 'A Fazer', taskIds: data.filter(t => t.status === 'A Fazer').map(t => t.id) },
          'Em Andamento': { id: 'Em Andamento', title: 'Em Andamento', taskIds: data.filter(t => t.status === 'Em Andamento').map(t => t.id) },
          'Concluído': { id: 'Concluído', title: 'Concluído', taskIds: data.filter(t => t.status === 'Concluído').map(t => t.id) },
        };
        setColumns(newColumns);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [project.id]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];
    
    if (start === finish) {
      // Reordering within the same column (optional, not implemented for simplicity)
      return;
    }

    // Moving from one list to another
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };
    
    const newColumns = { ...columns, [newStart.id]: newStart, [newFinish.id]: newFinish };
    setColumns(newColumns);

    // Update database
    const { error } = await supabase
      .from('project_tasks')
      .update({ status: destination.droppableId })
      .eq('id', draggableId);

    if (error) {
      toast({ title: 'Erro ao mover tarefa', description: error.message, variant: 'destructive' });
      // Revert state if DB update fails
      const revertedColumns = { ...columns };
      setColumns(revertedColumns);
    } else {
      toast({ title: 'Tarefa movida com sucesso!' });
      const updatedTasks = tasks.map(t => t.id === draggableId ? {...t, status: destination.droppableId} : t);
      setTasks(updatedTasks);
    }
  };

  const handleTaskCreated = (newTask) => {
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    
    const columnId = newTask.status;
    const column = columns[columnId];
    const newTaskIds = Array.from(column.taskIds);
    newTaskIds.push(newTask.id);

    const newColumn = { ...column, taskIds: newTaskIds };
    setColumns({ ...columns, [columnId]: newColumn });
  };

  if (loading || !columns) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  const columnOrder = ['Backlog', 'A Fazer', 'Em Andamento', 'Concluído'];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex justify-end mb-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columnOrder.map(columnId => {
          const column = columns[columnId];
          const columnTasks = column.taskIds.map(taskId => tasks.find(t => t.id === taskId)).filter(Boolean);

          return (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-secondary rounded-lg p-3 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/20' : ''}`}
                >
                  <h3 className="font-bold mb-4 text-center text-secondary-foreground">{column.title} ({columnTasks.length})</h3>
                  <div className="space-y-3 min-h-[400px]">
                    {columnTasks.map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;