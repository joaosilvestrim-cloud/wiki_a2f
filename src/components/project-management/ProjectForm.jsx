import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, KanbanSquare, GitBranch, Waypoints } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const ProjectForm = ({ onSave, onFinished }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, control, setValue } = useForm();
  const [users, setUsers] = useState([]);

  const methodology = watch('methodology');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, name');
      if (error) {
        toast({ title: 'Erro ao buscar usuários', variant: 'destructive' });
      } else {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    const { leader_id, ...projectData } = data;
    await onSave(projectData, leader_id);
    onFinished();
  };

  const methodologyOptions = [
    { value: 'Scrum', label: 'Scrum', icon: <GitBranch className="h-5 w-5 mr-2" /> },
    { value: 'Kanban', label: 'Kanban', icon: <KanbanSquare className="h-5 w-5 mr-2" /> },
    { value: 'Waterfall', label: 'Waterfall', icon: <Waypoints className="h-5 w-5 mr-2" /> },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Projeto</Label>
        <Input id="name" {...register('name', { required: 'O nome é obrigatório' })} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefix">Prefixo (3-5 letras)</Label>
        <Input id="prefix" {...register('prefix', { 
          required: 'O prefixo é obrigatório',
          pattern: { value: /^[A-Z]{3,5}$/, message: 'Use 3 a 5 letras maiúsculas' }
        })} placeholder="EX: PROJ" />
        {errors.prefix && <p className="text-sm text-destructive">{errors.prefix.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label>Metodologia</Label>
        <div className="grid grid-cols-3 gap-2">
          {methodologyOptions.map(opt => (
            <Button
              key={opt.value}
              type="button"
              variant={methodology === opt.value ? 'default' : 'outline'}
              className="h-20 flex-col"
              onClick={() => setValue('methodology', opt.value, { shouldValidate: true })}
            >
              {opt.icon}
              {opt.label}
            </Button>
          ))}
        </div>
         <input type="hidden" {...register('methodology', { required: 'Selecione uma metodologia' })} />
         {errors.methodology && <p className="text-sm text-destructive">{errors.methodology.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="leader_id">Líder do Projeto</Label>
        <Select onValueChange={(value) => setValue('leader_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um líder" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Projeto
        </Button>
      </div>
    </form>
  );
};