import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, User, ImagePlus } from 'lucide-react';
import MediaSelector from '@/components/admin/MediaSelector';

const TeamEditor = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', bio: '', avatar_url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Erro ao buscar membros", description: error.message, variant: "destructive" });
    } else {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setEditingMember(null);
    setFormData({ name: '', role: '', bio: '', avatar_url: '' });
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({ name: member.name, role: member.role, bio: member.bio || '', avatar_url: member.avatar_url || '' });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSelectImage = (url) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
    setIsMediaSelectorOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = editingMember
        ? await supabase.from('team_members').update(formData).eq('id', editingMember.id)
        : await supabase.from('team_members').insert(formData);

      if (error) throw error;

      toast({ title: "Sucesso!", description: `Membro ${editingMember ? 'atualizado' : 'adicionado'} com sucesso.` });
      handleCloseModal();
      await fetchMembers();

    } catch (error) {
      toast({ title: "Erro ao salvar membro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (memberId) => {
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) {
      toast({ title: "Erro ao deletar membro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membro deletado com sucesso." });
      await fetchMembers();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Equipe</h2>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Novo Membro
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {members.map(member => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card text-center p-6"
                >
                  <img src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover bg-secondary" />
                  <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{member.bio}</p>
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(member)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(member.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Editar Membro' : 'Novo Membro da Equipe'}</DialogTitle>
              <DialogDescription>Preencha as informações do membro da equipe.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-24 h-24">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={() => setIsMediaSelectorOpen(true)}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Selecionar Imagem
                </Button>
              </div>
              <Input
                id="name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                id="role"
                placeholder="Cargo"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />
              <Textarea
                id="bio"
                placeholder="Pequena biografia (opcional)"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
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
      <MediaSelector
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={handleSelectImage}
        basePath="fotos_site"
      />
    </>
  );
};

export default TeamEditor;