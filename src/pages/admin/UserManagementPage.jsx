import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ShieldCheck, Trash2, Plus, Eye, EyeOff, Edit, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { logAction } from '@/lib/auditLog';

const UserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    department: user?.department || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditing} />
        </div>
      </div>
      {!isEditing && (
        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required minLength="6" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Cargo</Label>
          <Input id="role" value={formData.role} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="department">Departamento</Label>
          <Input id="department" value={formData.department} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input id="location" value={formData.location} onChange={handleChange} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) {
      toast({ title: "Erro ao buscar usuários", description: error.message, variant: "destructive" });
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (formData) => {
    if (editingUser) { // Editing existing user
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          location: formData.location,
        })
        .eq('id', editingUser.id);

      if (error) {
        toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
      } else {
        await logAction('user_updated', { userId: editingUser.id, name: formData.name });
        toast({ title: "Sucesso!", description: `Usuário ${formData.name} atualizado.` });
        handleCloseModal();
        fetchUsers();
      }
    } else { // Creating new user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          user_metadata: {
            name: formData.name,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`,
            role: formData.role,
            department: formData.department,
            phone: formData.phone,
            location: formData.location,
          }
        }
      });

      if (error || data.error) {
        toast({ title: "Erro ao criar usuário", description: error?.message || data.error.msg, variant: "destructive" });
      } else {
        await logAction('user_created', { userId: data.user.id, email: formData.email });
        toast({ title: "Sucesso!", description: `Usuário ${formData.name} criado.` });
        
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: JSON.stringify({
            to: formData.email,
            subject: 'Bem-vindo à Intranet!',
            html: `
              <h1>Olá, ${formData.name}!</h1>
              <p>Sua conta na nossa intranet foi criada com sucesso.</p>
              <p>Seu login é: <strong>${formData.email}</strong></p>
              <p>Acesse a plataforma para começar a colaborar com sua equipe.</p>
            `,
          }),
        });

        if (emailError) {
          toast({
            title: "Aviso",
            description: "Usuário criado, mas houve um erro ao enviar o email de boas-vindas.",
            variant: "default",
          });
        }

        handleCloseModal();
        fetchUsers();
      }
    }
  };

  const toggleAdmin = async (user) => {
    if (user.id === currentUser.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover sua própria permissão de administrador.",
        variant: "destructive",
      });
      return;
    }

    const newAdminStatus = !user.is_admin;
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newAdminStatus })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Erro ao atualizar permissão", description: error.message, variant: "destructive" });
    } else {
      await logAction('permission_changed', { userId: user.id, name: user.name, isAdmin: newAdminStatus });
      toast({ title: "Sucesso!", description: `Permissão de ${user.name} atualizada.` });
      fetchUsers();
    }
  };
  
  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser.id) {
      toast({ title: "Ação não permitida", description: "Você não pode excluir sua própria conta.", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userIdToDelete: userToDelete.id }
    });

    if (error) {
      toast({ title: "Erro ao excluir usuário", description: error.message, variant: "destructive" });
    } else {
      await logAction('user_deleted', { userId: userToDelete.id, name: userToDelete.name });
      toast({ title: "Sucesso!", description: `Usuário ${userToDelete.name} excluído.` });
      fetchUsers();
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Visualize, crie e gerencie os usuários da intranet.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-foreground">Usuário</th>
              <th className="p-4 font-semibold text-foreground">Email</th>
              <th className="p-4 font-semibold text-foreground">Cargo</th>
              <th className="p-4 font-semibold text-foreground">Permissão</th>
              <th className="p-4 font-semibold text-foreground text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center text-muted-foreground">Carregando usuários...</td></tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-secondary">
                  <td className="p-4 text-foreground font-medium flex items-center space-x-3">
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'U'}`} alt={user.name} className="w-8 h-8 rounded-full" />
                    <span>{user.name}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4 text-muted-foreground">{user.role || 'N/A'}</td>
                  <td className="p-4 text-muted-foreground">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_admin ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                      {user.is_admin ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/employees/${user.id}`)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                        <User className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Alteração de Permissão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Você tem certeza que deseja {user.is_admin ? 'remover a permissão de administrador' : 'conceder permissão de administrador'} para {user.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleAdmin(user)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500/80 hover:text-red-500 hover:bg-red-500/10" disabled={user.id === currentUser.id}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {user.name}. Tem certeza?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-4 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize os dados do funcionário.' : 'Preencha os dados para adicionar um novo funcionário.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm user={editingUser} onSave={handleSaveUser} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;