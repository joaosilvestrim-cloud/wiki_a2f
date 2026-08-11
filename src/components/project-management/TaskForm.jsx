import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const TaskForm = ({ project, members, onTaskCreated, onFinished, isScrum = false }) => {
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue } = useForm({
    defaultValues: {
      type: 'Tarefa',
      priority: 'Medium',
      status: isScrum ? 'Backlog' : 'A Fazer',
    }
  });

  const onSubmit = async (formData) => {
    let taskKey = '';
    
    try {
        const { data: countData, error: countError } = await supabase
            .from('project_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id);

        if (countError) throw countError;

        taskKey = `${project.prefix}-${(countData?.count || 0) + 1}`;
    } catch (error) {
        toast({ title: 'Erro ao gerar chave da tarefa', description: error.message, variant: 'destructive' });
        return;
    }

    const { data: newTask, error } = await supabase
      .from('project_tasks')
      .insert({ 
        ...formData, 
        project_id: project.id,
        task_key: taskKey
       })
      .select('*, assignee:assignee_id(id, name, avatar_url)')
      .single();

    if (error) {
      toast({ title: 'Erro ao criar tarefa', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa criada com sucesso!' });
      onTaskCreated(newTask);
      onFinished();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register('title', { required: 'Título é obrigatório' })} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select onValueChange={v => setValue('type', v)} defaultValue="Tarefa">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="História">História de Usuário</SelectItem>
              <SelectItem value="Tarefa">Tarefa</SelectItem>
              <SelectItem value="Bug">Bug</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Prioridade</Label>
          <Select onValueChange={v => setValue('priority', v)} defaultValue="Medium">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">Alta</SelectItem>
              <SelectItem value="Medium">Média</SelectItem>
              <SelectItem value="Low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Responsável</Label>
          <Select onValueChange={v => setValue('assignee_id', v)}>
            <SelectTrigger><SelectValue placeholder="Não atribuído"/></SelectTrigger>
            <SelectContent>
                <SelectItem value={null}>Não atribuído</SelectItem>
              {members && members.map(member => (
                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="story_points">Story Points</Label>
          <Input id="story_points" type="number" {...register('story_points', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Tarefa
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;