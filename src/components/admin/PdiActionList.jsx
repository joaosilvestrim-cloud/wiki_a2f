import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Loader2, ListChecks, Info } from 'lucide-react';

const PdiActionList = ({ objectiveId }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  const initialActionState = {
    description: '',
    action_type: '',
    resources_needed: '',
    deadline: '',
    status: 'A Fazer',
  };

  const [actionData, setActionData] = useState(initialActionState);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdi_actions')
        .select('*')
        .eq('objective_id', objectiveId)
        .order('created_at');
      if (error) throw error;
      setActions(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar ações', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [objectiveId]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setActionData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setActionData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (action = null) => {
    setCurrentAction(action);
    if (action) {
      setActionData({
        description: action.description || '',
        action_type: action.action_type || '',
        resources_needed: action.resources_needed || '',
        deadline: action.deadline ? new Date(action.deadline).toISOString().split('T')[0] : '',
        status: action.status || 'A Fazer',
      });
    } else {
      setActionData(initialActionState);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!actionData.description) {
      toast({ title: 'Descrição é obrigatória', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...actionData, deadline: actionData.deadline || null };
      if (currentAction) {
        const { error } = await supabase.from('pdi_actions').update(dataToSubmit).eq('id', currentAction.id);
        if (error) throw error;
        toast({ title: 'Ação atualizada com sucesso!' });
      } else {
        const { error } = await supabase.from('pdi_actions').insert([{ ...dataToSubmit, objective_id: objectiveId }]);
        if (error) throw error;
        toast({ title: 'Ação criada com sucesso!' });
      }
      fetchActions();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao salvar ação', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (actionId) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação?')) {
      try {
        const { error } = await supabase.from('pdi_actions').delete().eq('id', actionId);
        if (error) throw error;
        toast({ title: 'Ação excluída com sucesso!' });
        fetchActions();
      } catch (error) {
        toast({ title: 'Erro ao excluir ação', description: error.message, variant: 'destructive' });
      }
    }
  };
  
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
    switch (status) {
      case 'Em Andamento': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Concluída': return `${baseClasses} bg-green-100 text-green-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary" /> Plano de Ação</h3>
        <Button variant="outline" size="sm" onClick={() => handleOpenForm()}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Ação</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map(action => (
            <motion.div key={action.id} className="p-3 border rounded-lg bg-background" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{action.description}</p>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Tipo: {action.action_type || 'N/A'}</span>
                    <span>Prazo: {action.deadline ? new Date(action.deadline).toLocaleDateString() : 'N/A'}</span>
                    <span className="flex items-center gap-1.5">Status: <span className={getStatusBadge(action.status)}>{action.status}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenForm(action)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => handleDelete(action.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Info className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold text-foreground">Nenhuma ação planejada</h4>
            <p className="mt-1 text-sm text-muted-foreground">Adicione a primeira ação para este objetivo.</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentAction ? 'Editar' : 'Adicionar'} Ação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="action_description">Descrição da Ação</label>
              <Textarea id="action_description" name="description" value={actionData.description} onChange={handleFormChange} placeholder="Ex: Realizar o curso online 'Liderança Inspiradora'" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="action_type">Tipo de Ação</label>
                <Input id="action_type" name="action_type" value={actionData.action_type} onChange={handleFormChange} placeholder="Ex: Curso Online, Leitura..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="deadline">Prazo</label>
                <Input id="deadline" name="deadline" type="date" value={actionData.deadline} onChange={handleFormChange} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="resources_needed">Recursos Necessários</label>
              <Input id="resources_needed" name="resources_needed" value={actionData.resources_needed} onChange={handleFormChange} placeholder="Ex: Orçamento para o curso" />
            </div>
            <div className="space-y-2">
              <label htmlFor="status">Status</label>
              <Select name="status" value={actionData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A Fazer">A Fazer</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdiActionList;