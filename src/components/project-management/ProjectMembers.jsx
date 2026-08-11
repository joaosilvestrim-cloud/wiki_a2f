import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Crown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';

const ProjectMembers = ({ project, projectId, initialMembers, isLeader, onMembersUpdate }) => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState(initialMembers);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, name, email');
      if (error) {
        toast({ title: 'Erro ao buscar usuários', description: error.message, variant: 'destructive' });
      } else {
        const memberIds = new Set(members.map(m => m.id));
        setAllUsers(data.filter(u => !memberIds.has(u.id)));
      }
    };
    fetchAllUsers();
  }, [members]);

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast({ title: 'Nenhum usuário selecionado', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    const { error } = await supabase.from('project_module_users').insert({
      project_id: projectId,
      user_id: selectedUser,
    });

    if (error) {
      toast({ title: 'Erro ao adicionar membro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Membro adicionado com sucesso!' });
      onMembersUpdate();
      setSelectedUser('');
    }
    setIsAdding(false);
  };

  const handleRemoveMember = async (userIdToRemove) => {
    if (userIdToRemove === currentUser.id) {
       toast({ title: 'Você não pode remover a si mesmo.', variant: 'destructive' });
       return;
    }
    const { error } = await supabase
      .from('project_module_users')
      .delete()
      .match({ project_id: projectId, user_id: userIdToRemove });
    
    if (error) {
      toast({ title: 'Erro ao remover membro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Membro removido com sucesso!' });
      onMembersUpdate();
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-xl font-bold mb-4">Membros do Projeto</h3>
      
      {isLeader && (
        <div className="flex gap-2 mb-6 pb-6 border-b">
          <Select onValueChange={setSelectedUser} value={selectedUser}>
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Selecione um usuário para adicionar" />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddMember} disabled={!selectedUser || isAdding}>
            {isAdding ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Adicionar
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.avatar_url} alt={member.name} />
                <AvatarFallback>{member.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold flex items-center">{member.name} {member.id === project?.leader_id && <Crown className="w-4 h-4 ml-2 text-yellow-500"/>}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            {isLeader && member.id !== project?.leader_id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá permanentemente {member.name} deste projeto.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectMembers;