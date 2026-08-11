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
    role: user?.role || '',
    department: user?.department || '',
    phone: user?.phone || '',
    location: user?.location || '',
    is_admin: user?.is_admin || false,
    needs_password_change: user?.needs_password_change || false,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-foreground">Nome Completo</Label>
          <Input id="name" value={formData.name} onChange={handleChange} required placeholder="Ex: João da Silva" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditing} placeholder="Ex: joao@a2f.com.br" className="mt-1" />
        </div>
      </div>
      
      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha Provisória</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required minLength="6" placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="needs_password_change"
              checked={formData.needs_password_change}
              onChange={(e) => setFormData(prev => ({ ...prev, needs_password_change: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <Label htmlFor="needs_password_change" className="text-sm font-medium text-foreground cursor-pointer">
              Exigir alteração no primeiro login (Senha Temporária)
            </Label>
          </div>
        </div>
      ) : (
        <div className="border-t border-border pt-4 mt-2">
          <p className="text-sm font-semibold text-foreground mb-3">Segurança e Senha</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Redefinir Senha (deixe em branco para manter)</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} minLength="6" placeholder="Definir nova senha" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {formData.password && (
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="needs_password_change"
                  checked={formData.needs_password_change}
                  onChange={(e) => setFormData(prev => ({ ...prev, needs_password_change: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="needs_password_change" className="text-sm font-medium text-foreground cursor-pointer">
                  Definir como Senha Temporária (Exigir alteração)
                </Label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permission Selection - Custom interactive cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Nível de Permissão</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_admin: false }))}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              !formData.is_admin
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${!formData.is_admin ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Colaborador</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Acesso padrão aos módulos e conteúdos.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_admin: true }))}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              formData.is_admin
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${formData.is_admin ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Administrador</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Acesso completo para gerenciar toda a intranet.</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <Label htmlFor="role" className="text-sm font-medium text-foreground">Cargo</Label>
          <Input id="role" value={formData.role} onChange={handleChange} placeholder="Ex: Analista Financeiro" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="department" className="text-sm font-medium text-foreground">Departamento</Label>
          <Input id="department" value={formData.department} onChange={handleChange} placeholder="Ex: Financeiro" className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">Telefone</Label>
          <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ex: (11) 99999-9999" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-foreground">Localização</Label>
          <Input id="location" value={formData.location} onChange={handleChange} placeholder="Ex: São Paulo - SP" className="mt-1" />
        </div>
      </div>

      <DialogFooter className="border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border hover:bg-secondary">Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
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
      // 1. Update basic profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          location: formData.location,
          is_admin: formData.is_admin,
          needs_password_change: formData.password ? formData.needs_password_change : editingUser.needs_password_change,
        })
        .eq('id', editingUser.id);

      if (error) {
        toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
        return;
      }

      // 2. If password was set, update it using Edge Function
      if (formData.password) {
        const { error: pwError } = await supabase.functions.invoke('update-user-password', {
          body: { userId: editingUser.id, password: formData.password }
        });
        if (pwError) {
          toast({ title: "Erro ao atualizar senha", description: pwError.message, variant: "destructive" });
          return;
        }
      }

      await logAction('user_updated', { userId: editingUser.id, name: formData.name, isAdmin: formData.is_admin });
      toast({ title: "Sucesso!", description: `Usuário ${formData.name} atualizado.` });
      handleCloseModal();
      fetchUsers();
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
        toast({ title: "Erro ao criar usuário", description: error?.message || data.error?.msg || "Erro desconhecido", variant: "destructive" });
      } else {
        // Se is_admin ou needs_password_change forem setados, atualizamos profiles
        const updates = {};
        if (formData.is_admin) updates.is_admin = true;
        if (formData.needs_password_change) updates.needs_password_change = true;

        if (Object.keys(updates).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.user.id);
          if (profileError) {
            console.error("Erro ao configurar permissões/senha temporária:", profileError);
          }
        }

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
              ${formData.needs_password_change ? `<p>Sua senha provisória é: <strong>${formData.password}</strong> (será solicitada a alteração no primeiro login).</p>` : ''}
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
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Visualize, crie e gerencie os usuários da intranet.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-secondary/50">
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
                <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors">
                  <td className="p-4 text-foreground font-medium flex items-center space-x-3">
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'U'}`} alt={user.name} className="w-8 h-8 rounded-full border border-border" />
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      {user.needs_password_change && (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-0.5 w-max">
                          Senha Temporária
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4 text-muted-foreground">{user.role || 'N/A'}</td>
                  <td className="p-4 text-muted-foreground">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.is_admin 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {user.is_admin ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/employees/${user.id}`)} className="text-muted-foreground hover:text-foreground hover:bg-secondary" title="Ver Perfil">
                        <User className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)} className="text-muted-foreground hover:text-foreground hover:bg-secondary" title="Editar Usuário">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" title="Alterar Permissão">
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirmar Alteração de Permissão</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Você tem certeza que deseja {user.is_admin ? 'remover a permissão de administrador' : 'conceder permissão de administrador'} para {user.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleAdmin(user)} className="bg-primary text-primary-foreground hover:bg-primary/90">Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500/80 hover:text-red-500 hover:bg-red-500/10" disabled={user.id === currentUser.id} title="Excluir Usuário">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {user.name} da base. Tem certeza?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
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
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingUser ? 'Atualize os dados e nível de acesso do colaborador.' : 'Preencha os dados e escolha o nível de permissão.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm user={editingUser} onSave={handleSaveUser} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;