import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Search, Target, Calendar, Loader2, Trash2 } from 'lucide-react';

const PdiManagerPage = () => {
  const [pdis, setPdis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newPdi, setNewPdi] = useState({
    user_id: '',
    manager_id: '',
    start_date: '',
    end_date: '',
    status: 'Não Iniciado',
  });
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchPdis = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pdi')
        .select(`
          id,
          start_date,
          end_date,
          status,
          user:profiles!pdi_user_id_fkey(id, name, avatar_url),
          manager:profiles!pdi_manager_id_fkey(id, name)
        `);

      if (statusFilter !== 'Todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // A busca por nome precisa ser feita no frontend pois o RLS impede o join com ilike em outra tabela
      const filteredData = searchTerm
        ? data.filter(pdi => pdi.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : data;

      setPdis(filteredData);
    } catch (error) {
      toast({ title: 'Erro ao buscar PDIs', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, is_admin')
        .order('name');
      if (error) throw error;
      setUsers(data);
      setManagers(data.filter(u => u.is_admin));
    } catch (error) {
      toast({ title: 'Erro ao buscar usuários', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchPdis();
    if (users.length === 0) {
      fetchUsers();
    }
  }, [fetchPdis, users.length]);

  const handleCreatePdi = async () => {
    if (!newPdi.user_id || !newPdi.start_date || !newPdi.end_date) {
      toast({ title: 'Campos obrigatórios', description: 'Colaborador, data de início e término são obrigatórios.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pdi')
        .insert([newPdi]);
      
      if (error) throw error;

      toast({ title: 'PDI criado com sucesso!' });
      setIsFormOpen(false);
      setNewPdi({ user_id: '', manager_id: '', start_date: '', end_date: '', status: 'Não Iniciado' });
      fetchPdis();
    } catch (error) {
      toast({ title: 'Erro ao criar PDI', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePdi = async (pdiId) => {
    try {
      // A exclusão em cascata deve ser configurada no banco de dados
      const { error } = await supabase.from('pdi').delete().eq('id', pdiId);
      if (error) throw error;
      toast({ title: 'PDI excluído com sucesso!' });
      fetchPdis();
    } catch (error) {
      toast({ title: 'Erro ao excluir PDI', description: "Verifique se há dependências ou contate o suporte.", variant: 'destructive' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-500';
      case 'Concluído': return 'bg-green-500';
      case 'Cancelado': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const PdiCard = ({ pdi }) => (
    <motion.div
      className="card p-4 flex flex-col justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="flex items-center mb-3">
          <img
            src={pdi.user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pdi.user.name}`}
            alt={pdi.user.name}
            className="w-12 h-12 rounded-full mr-4 border-2 border-primary"
          />
          <div>
            <p className="font-bold text-lg text-foreground">{pdi.user.name}</p>
            <p className="text-sm text-muted-foreground">Gestor: {pdi.manager?.name || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{new Date(pdi.start_date).toLocaleDateString()} - {new Date(pdi.end_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(pdi.status)}`}></span>
          <span className="text-sm font-medium">{pdi.status}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/dashboard/pdi/${pdi.id}`)}
        >
          Ver Detalhes
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este PDI? Esta ação é irreversível e removerá todos os objetivos e ações associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeletePdi(pdi.id)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Gestão de PDI
            </h1>
            <p className="text-muted-foreground mt-1">Crie e acompanhe os Planos de Desenvolvimento Individual.</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Novo PDI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo PDI</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select onValueChange={(value) => setNewPdi({ ...newPdi, user_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select onValueChange={(value) => setNewPdi({ ...newPdi, manager_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o Gestor (Opcional)" /></SelectTrigger>
                  <SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" placeholder="Data de Início" onChange={(e) => setNewPdi({ ...newPdi, start_date: e.target.value })} />
                <Input type="date" placeholder="Data de Término" onChange={(e) => setNewPdi({ ...newPdi, end_date: e.target.value })} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleCreatePdi} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar PDI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pdis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdis.map(pdi => <PdiCard key={pdi.id} pdi={pdi} />)}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum PDI encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crie um novo PDI para começar.</p>
        </div>
      )}
    </div>
  );
};

export default PdiManagerPage;