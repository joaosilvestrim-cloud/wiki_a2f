import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { logAction } from '@/lib/auditLog';

const EventsManager = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_events')
      .select('*, author:profiles(name)')
      .order('event_date', { ascending: true });
    if (error) {
      toast({ title: 'Erro ao buscar eventos', description: error.message, variant: 'destructive' });
    } else {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({ title: '', description: '', event_date: '' });
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      const localDate = new Date(event.event_date).toISOString().slice(0, 16);
      setFormData({ title: event.title, description: event.description || '', event_date: localDate });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        created_by: user.id,
      };

      let error;
      if (editingEvent) {
        ({ error } = await supabase.from('company_events').update(eventData).eq('id', editingEvent.id));
        if (!error) await logAction('event_updated', { eventId: editingEvent.id, title: eventData.title });
      } else {
        ({ error } = await supabase.from('company_events').insert(eventData));
        if (!error) await logAction('event_created', { title: eventData.title });
      }

      if (error) throw error;

      toast({ title: 'Sucesso!', description: `Evento ${editingEvent ? 'atualizado' : 'criado'}.` });
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      toast({ title: 'Erro ao salvar evento', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (!window.confirm(`Tem certeza que deseja deletar o evento "${eventTitle}"?`)) return;
    
    const { error } = await supabase.from('company_events').delete().eq('id', eventId);
    if (error) {
      toast({ title: 'Erro ao deletar evento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evento deletado com sucesso.' });
      await logAction('event_deleted', { eventId, title: eventTitle });
      fetchEvents();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciador de Eventos</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie os eventos da empresa.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Evento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Evento</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(event.event_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(event)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(event.id, event.title)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {events.length === 0 && (
            <div className="text-center py-16">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground">Clique em "Novo Evento" para criar o primeiro.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>Preencha as informações do evento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Evento</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="event_date">Data e Hora</Label>
              <Input id="event_date" type="datetime-local" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsManager;