import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Target, Info, MessageSquare, CheckCircle, Circle, Zap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MyPdiPage = () => {
  const { user } = useAuth();
  const [pdi, setPdi] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: pdiData, error: pdiError } = await supabase
        .from('pdi')
        .select(`*, manager:profiles!pdi_manager_id_fkey(name)`)
        .eq('user_id', user.id)
        .in('status', ['Não Iniciado', 'Em Andamento'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pdiError && pdiError.code !== 'PGRST116') throw pdiError;
      
      if (pdiData) {
        setPdi(pdiData);
        const { data: objectivesData, error: objectivesError } = await supabase
          .from('pdi_objectives')
          .select('*, pdi_actions(*)')
          .eq('pdi_id', pdiData.id)
          .order('created_at');
        if (objectivesError) throw objectivesError;
        setObjectives(objectivesData);

        const { data: checkinsData, error: checkinsError } = await supabase
          .from('pdi_checkins')
          .select('*, author:profiles!created_by(name, avatar_url)')
          .eq('pdi_id', pdiData.id)
          .order('checkin_date', { ascending: false });
        if (checkinsError) throw checkinsError;
        setCheckins(checkinsData);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar seu PDI', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActionStatusChange = async (actionId, newStatus) => {
    const originalObjectives = JSON.parse(JSON.stringify(objectives));
    
    const updatedObjectives = objectives.map(obj => ({
      ...obj,
      pdi_actions: obj.pdi_actions.map(act => act.id === actionId ? { ...act, status: newStatus } : act)
    }));
    setObjectives(updatedObjectives);

    try {
      const { error } = await supabase
        .from('pdi_actions')
        .update({ status: newStatus })
        .eq('id', actionId);
      if (error) throw error;
      toast({ title: 'Status da ação atualizado!' });
    } catch (error) {
      setObjectives(originalObjectives);
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1.5";
    switch (status) {
      case 'Em Andamento': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Concluída': return `${baseClasses} bg-green-100 text-green-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!pdi) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">Nenhum PDI ativo encontrado</h3>
        <p className="mt-2 text-md text-muted-foreground">Converse com seu gestor para iniciar seu Plano de Desenvolvimento Individual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary" />
                Meu Plano de Desenvolvimento
              </h1>
              <p className="text-muted-foreground mt-1">Sua jornada de crescimento profissional.</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 text-left sm:text-right">
              <p><strong>Gestor:</strong> {pdi.manager?.name || 'N/A'}</p>
              <p><strong>Período:</strong> {new Date(pdi.start_date).toLocaleDateString()} a {new Date(pdi.end_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className="font-bold text-primary">{pdi.status}</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4"><Target className="w-6 h-6 text-primary" /> Meus Objetivos</h2>
        {objectives.length > 0 ? (
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
            {objectives.map((obj, index) => (
              <AccordionItem key={obj.id} value={`item-${index}`} className="card border rounded-lg overflow-hidden p-0">
                <AccordionTrigger className="p-4 hover:no-underline bg-muted/20">
                  <span className="font-semibold text-left flex-1 text-lg">{obj.description}</span>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-2">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-md mb-2">Plano de Ação</h4>
                      <div className="space-y-3">
                        {obj.pdi_actions.length > 0 ? obj.pdi_actions.map(action => (
                          <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                            <div className="flex-1">
                              <p className="font-medium">{action.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Prazo: {action.deadline ? new Date(action.deadline).toLocaleDateString() : 'Não definido'}</p>
                            </div>
                            <div className="w-40 ml-4">
                              <Select value={action.status} onValueChange={(newStatus) => handleActionStatusChange(action.id, newStatus)}>
                                <SelectTrigger className={getStatusBadge(action.status)}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A Fazer"><Circle className="w-3 h-3 mr-2 text-gray-500" />A Fazer</SelectItem>
                                  <SelectItem value="Em Andamento"><Loader2 className="w-3 h-3 mr-2 text-blue-500 animate-spin" />Em Andamento</SelectItem>
                                  <SelectItem value="Concluída"><CheckCircle className="w-3 h-3 mr-2 text-green-500" />Concluída</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">Nenhuma ação definida para este objetivo.</p>}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg"><Info className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum objetivo definido</h3><p className="mt-1 text-sm text-muted-foreground">Seu gestor ainda não definiu objetivos para este PDI.</p></div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4"><MessageSquare className="w-6 h-6 text-primary" /> Acompanhamentos e Feedbacks</h2>
        {checkins.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {checkins.map(checkin => (
              <motion.div key={checkin.id} className="p-4 border rounded-lg bg-background" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start gap-3">
                  <img src={checkin.author.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${checkin.author.name}`} alt={checkin.author.name} className="w-10 h-10 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold">{checkin.author.name}</span>
                      <span className="text-muted-foreground"> em {new Date(checkin.checkin_date).toLocaleDateString()}</span>
                    </div>
                    {checkin.comments && <div><h4 className="font-semibold text-sm">Comentários</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{checkin.comments}</p></div>}
                    {checkin.manager_feedback && <div><h4 className="font-semibold text-sm">Feedback do Gestor</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{checkin.manager_feedback}</p></div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><Info className="mx-auto h-8 w-8 text-muted-foreground" /><h4 className="mt-2 text-sm font-semibold text-foreground">Nenhum check-in registrado</h4><p className="mt-1 text-sm text-muted-foreground">As conversas de acompanhamento aparecerão aqui.</p></div>
        )}
      </div>
    </div>
  );
};

export default MyPdiPage;