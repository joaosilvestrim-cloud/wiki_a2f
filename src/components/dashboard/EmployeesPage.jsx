import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Mail, Phone, MapPin, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';

const EmployeesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role, department, phone, location');

      if (error) {
        toast({
          title: 'Erro ao buscar funcionários',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setEmployees(data.map(p => ({...p, status: 'online' }))); // Mocking status for UI
      }
      setLoading(false);
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    (employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.role && employee.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewProfile = (employee) => {
    navigate(`/dashboard/employees/${employee.id}`);
  };

  const handleAction = (action) => {
    toast({
      title: `🚧 ${action}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua equipe e colaboradores</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/users')}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Gerenciar Usuários
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => handleAction('Filtros')}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-card rounded-xl p-6 border border-border hover:bg-secondary transition-all group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <img
                      src={employee.avatar_url || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                      alt={employee.name}
                      className="w-16 h-16 rounded-full border-2 border-primary"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(employee.status)} rounded-full border-2 border-card`}></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{employee.name}</h3>
                    <p className="text-muted-foreground text-sm">{employee.role || 'Usuário'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Briefcase className="w-4 h-4 mr-2 text-primary/80" />
                    <span className="truncate">{employee.department || 'Não especificado'}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Mail className="w-4 h-4 mr-2 text-primary/80" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Phone className="w-4 h-4 mr-2 text-primary/80" />
                    <span>{employee.phone || 'Não especificado'}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-primary/80" />
                    <span>{employee.location || 'Não especificado'}</span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewProfile(employee)}
                    className="flex-1"
                    variant="outline"
                  >
                    Ver Perfil
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction('Enviar Mensagem')}
                    className="bg-gradient-to-r from-primary to-indigo-500"
                  >
                    Mensagem
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum funcionário encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar os termos de busca ou adicione novos usuários.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeesPage;