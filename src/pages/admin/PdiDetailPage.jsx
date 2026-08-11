import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Target, ArrowLeft, Info, PlusCircle, Edit, Trash2, Settings } from 'lucide-react';
import PdiActionList from '@/components/admin/PdiActionList';
import PdiCheckinList from '@/components/admin/PdiCheckinList';

const PdiDetailPage = () => {
  const { id } = useParams();
  const [pdi, setPdi] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isObjectiveFormOpen, setIsObjectiveFormOpen] = useState(false);
  const [isPdiFormOpen, setIsPdiFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentObjective, setCurrentObjective] = useState(null);
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);

  const initialObjectiveState = { description: '', justification: '', success_metric: '' };
  const [objectiveData, setObjectiveData] = useState(initialObjectiveState);
  const [pdiData, setPdiData] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, name, is_admin').order('name');
      if (error) throw error;
      setUsers(data);
      setManagers(data.filter(u => u.is_admin));
    } catch (error) {
      toast({ title: 'Erro ao buscar usuários', description: error.message, variant: 'destructive' });
    }
  };

  const fetchPdiDetails = useCallback(async () => {
    try {
      const { data: pdiData, error: pdiError } = await supabase
        .from('pdi')
        .select(`*, user:profiles!pdi_user_id_fkey(name, avatar_url), manager:profiles!pdi_manager_id_fkey(name)`)
        .eq('id', id)
        .single();
      if (pdiError) throw pdiError;
      setPdi(pdiData);
      setPdiData({
        ...pdiData,
        start_date: new Date(pdiData.start_date).toISOString().split('T')[0],
        end_date: new Date(pdiData.end_date).toISOString().split('T')[0],
      });

      const { data: objectivesData, error: objectivesError } = await supabase
        .from('pdi_objectives')
        .select('*')
        .eq('pdi_id', id)
        .order('created_at');
      if (objectivesError) throw objectivesError;
      setObjectives(objectivesData);

    } catch (error) {
      toast({ title: 'Erro ao buscar detalhes do PDI', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchPdiDetails();
    fetchUsers();
  }, [fetchPdiDetails]);

  const handleObjectiveFormChange = (e) => {
    const { name, value } = e.target;
    setObjectiveData(prev => ({ ...prev, [name]: value }));
  };

  const handlePdiFormChange = (e) => {
    const { name, value } = e.target;
    setPdiData(prev => ({ ...prev, [name]: value }));
  };

  const handlePdiSelectChange = (name, value) => {
    setPdiData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenObjectiveForm = (objective = null) => {
    setCurrentObjective(objective);
    setObjectiveData(objective ? { description: objective.description, justification: objective.justification || '', success_metric: objective.success_metric || '' } : initialObjectiveState);
    setIsObjectiveFormOpen(true);
  };

  const handleObjectiveSubmit = async () => {
    if (!objectiveData.description) {
      toast({ title: 'Descrição é obrigatória', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = currentObjective
        ? await supabase.from('pdi_objectives').update(objectiveData).eq('id', currentObjective.id)
        : await supabase.from('pdi_objectives').insert([{ ...objectiveData, pdi_id: id }]);
      if (error) throw error;
      toast({ title: `Objetivo ${currentObjective ? 'atualizado' : 'criado'} com sucesso!` });
      fetchPdiDetails();
      setIsObjectiveFormOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao salvar objetivo', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdiSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { id: pdiId, user, manager, ...updateData } = pdiData;
      const { error } = await supabase.from('pdi').update(updateData).eq('id', pdiId);
      if (error) throw error;
      toast({ title: 'PDI atualizado com sucesso!' });
      fetchPdiDetails();
      setIsPdiFormOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao atualizar PDI', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObjective = async (objectiveId) => {
    if (window.confirm('Tem certeza que deseja excluir este objetivo? Ações associadas também serão excluídas.')) {
      try {
        const { error } = await supabase.from('pdi_objectives').delete().eq('id', objectiveId);
        if (error) throw error;
        toast({ title: 'Objetivo excluído com sucesso!' });
        fetchPdiDetails();
      } catch (error) {
        toast({ title: 'Erro ao excluir objetivo', description: error.message, variant: 'destructive' });
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!pdi) return <div className="text-center">PDI não encontrado.</div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/dashboard/pdi" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Gestão de PDI
        </Link>
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={pdi.user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pdi.user.name}`} alt={pdi.user.name} className="w-16 h-16 rounded-full border-4 border-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{pdi.user.name}</h1>
                <p className="text-muted-foreground">Plano de Desenvolvimento Individual</p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="text-sm text-muted-foreground space-y-1 text-left sm:text-right">
                <p><strong>Gestor:</strong> {pdi.manager?.name || 'N/A'}</p>
                <p><strong>Período:</strong> {new Date(pdi.start_date).toLocaleDateString()} a {new Date(pdi.end_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {pdi.status}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPdiFormOpen(true)}><Settings className="w-4 h-4 mr-2" /> Editar PDI</Button>
            </div>
          </div>
        </div>
      </motion.div>

      <PdiCheckinList pdiId={id} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Objetivos de Desenvolvimento</h2>
          <Button onClick={() => handleOpenObjectiveForm()}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Objetivo</Button>
        </div>
        <div className="space-y-4">
          {objectives.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {objectives.map(obj => (
                <AccordionItem key={obj.id} value={`item-${obj.id}`} className="card border mb-4 rounded-lg overflow-hidden">
                  <AccordionTrigger className="p-4 hover:no-underline bg-muted/20">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-semibold text-left flex-1">{obj.description}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenObjectiveForm(obj); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteObjective(obj.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-2">
                    <div className="space-y-6">
                      <div><h4 className="font-semibold text-sm mb-1">Justificativa / Alinhamento</h4><p className="text-muted-foreground text-sm">{obj.justification || 'Não informado'}</p></div>
                      <div><h4 className="font-semibold text-sm mb-1">Métrica de Sucesso</h4><p className="text-muted-foreground text-sm">{obj.success_metric || 'Não informado'}</p></div>
                      <div className="border-t pt-4"><PdiActionList objectiveId={obj.id} /></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg"><Info className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum objetivo definido</h3><p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro objetivo para este PDI.</p></div>
          )}
        </div>
      </div>

      <Dialog open={isObjectiveFormOpen} onOpenChange={setIsObjectiveFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{currentObjective ? 'Editar' : 'Adicionar'} Objetivo</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><label htmlFor="description">Descrição do Objetivo</label><Textarea id="description" name="description" value={objectiveData.description} onChange={handleObjectiveFormChange} placeholder="Ex: Desenvolver habilidades de liderança..." /></div>
            <div className="space-y-2"><label htmlFor="justification">Justificativa / Alinhamento</label><Textarea id="justification" name="justification" value={objectiveData.justification} onChange={handleObjectiveFormChange} placeholder="Ex: Preparação para futuras posições..." /></div>
            <div className="space-y-2"><label htmlFor="success_metric">Métrica de Sucesso</label><Textarea id="success_metric" name="success_metric" value={objectiveData.success_metric} onChange={handleObjectiveFormChange} placeholder="Ex: Concluir curso e aplicar conhecimentos..." /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleObjectiveSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar Objetivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPdiFormOpen} onOpenChange={setIsPdiFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar PDI</DialogTitle></DialogHeader>
          {pdiData && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><label>Colaborador</label><Select name="user_id" value={pdiData.user_id} onValueChange={(v) => handlePdiSelectChange('user_id', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><label>Gestor</label><Select name="manager_id" value={pdiData.manager_id || ''} onValueChange={(v) => handlePdiSelectChange('manager_id', v)}><SelectTrigger><SelectValue placeholder="Nenhum gestor selecionado" /></SelectTrigger><SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label>Data de Início</label><Input name="start_date" type="date" value={pdiData.start_date} onChange={handlePdiFormChange} /></div>
                <div className="space-y-2"><label>Data de Término</label><Input name="end_date" type="date" value={pdiData.end_date} onChange={handlePdiFormChange} /></div>
              </div>
              <div className="space-y-2"><label>Status</label><Select name="status" value={pdiData.status} onValueChange={(v) => handlePdiSelectChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Não Iniciado">Não Iniciado</SelectItem><SelectItem value="Em Andamento">Em Andamento</SelectItem><SelectItem value="Concluído">Concluído</SelectItem><SelectItem value="Cancelado">Cancelado</SelectItem></SelectContent></Select></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handlePdiSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdiDetailPage;