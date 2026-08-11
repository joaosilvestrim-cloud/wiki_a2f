import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Loader2, MessageSquare, Info } from 'lucide-react';

const PdiCheckinList = ({ pdiId }) => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState(null);

  const initialCheckinState = {
    checkin_date: new Date().toISOString().split('T')[0],
    comments: '',
    manager_feedback: '',
  };

  const [checkinData, setCheckinData] = useState(initialCheckinState);

  const fetchCheckins = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdi_checkins')
        .select('*, author:profiles!created_by(name, avatar_url)')
        .eq('pdi_id', pdiId)
        .order('checkin_date', { ascending: false });
      if (error) throw error;
      setCheckins(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar check-ins', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pdiId]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCheckinData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (checkin = null) => {
    setCurrentCheckin(checkin);
    if (checkin) {
      setCheckinData({
        checkin_date: new Date(checkin.checkin_date).toISOString().split('T')[0],
        comments: checkin.comments || '',
        manager_feedback: checkin.manager_feedback || '',
      });
    } else {
      setCheckinData(initialCheckinState);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!checkinData.checkin_date) {
      toast({ title: 'Data do check-in é obrigatória', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...checkinData, pdi_id: pdiId, created_by: user.id };
      if (currentCheckin) {
        const { error } = await supabase.from('pdi_checkins').update(dataToSubmit).eq('id', currentCheckin.id);
        if (error) throw error;
        toast({ title: 'Check-in atualizado com sucesso!' });
      } else {
        const { error } = await supabase.from('pdi_checkins').insert([dataToSubmit]);
        if (error) throw error;
        toast({ title: 'Check-in registrado com sucesso!' });
      }
      fetchCheckins();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao salvar check-in', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (checkinId) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de check-in?')) {
      try {
        const { error } = await supabase.from('pdi_checkins').delete().eq('id', checkinId);
        if (error) throw error;
        toast({ title: 'Check-in excluído com sucesso!' });
        fetchCheckins();
      } catch (error) {
        toast({ title: 'Erro ao excluir check-in', description: error.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" /> Acompanhamento e Feedback</h2>
        <Button onClick={() => handleOpenForm()}><PlusCircle className="w-4 h-4 mr-2" /> Registrar Check-in</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : checkins.length > 0 ? (
        <div className="space-y-4">
          {checkins.map(checkin => (
            <motion.div key={checkin.id} className="p-4 border rounded-lg bg-background" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <img src={checkin.author.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${checkin.author.name}`} alt={checkin.author.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <span className="font-semibold">{checkin.author.name}</span>
                      <span className="text-muted-foreground"> em {new Date(checkin.checkin_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {checkin.comments && <div><h4 className="font-semibold text-sm">Comentários do Colaborador/Gestor</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{checkin.comments}</p></div>}
                  {checkin.manager_feedback && <div><h4 className="font-semibold text-sm">Feedback do Gestor</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{checkin.manager_feedback}</p></div>}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenForm(checkin)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => handleDelete(checkin.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Info className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold text-foreground">Nenhum check-in registrado</h4>
            <p className="mt-1 text-sm text-muted-foreground">Registre a primeira conversa de acompanhamento.</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentCheckin ? 'Editar' : 'Registrar'} Check-in</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="checkin_date">Data do Check-in</label>
              <Input id="checkin_date" name="checkin_date" type="date" value={checkinData.checkin_date} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <label htmlFor="comments">Comentários (Colaborador/Gestor)</label>
              <Textarea id="comments" name="comments" value={checkinData.comments} onChange={handleFormChange} placeholder="Progresso, desafios, próximos passos..." />
            </div>
            <div className="space-y-2">
              <label htmlFor="manager_feedback">Feedback do Gestor</label>
              <Textarea id="manager_feedback" name="manager_feedback" value={checkinData.manager_feedback} onChange={handleFormChange} placeholder="Orientações, avaliação..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdiCheckinList;