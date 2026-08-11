import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  FolderKanban, 
  BookOpen, 
  Shield, 
  Receipt, 
  Users, 
  Newspaper, 
  FileArchive, 
  ArrowRight, 
  LogOut, 
  User as UserIcon, 
  Sparkles,
  Lock,
  ExternalLink,
  ChevronDown,
  Layers,
  Calendar,
  Compass
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const ModulesHubPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!user?.is_admin;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleModuleClick = (module) => {
    if (module.adminOnly && !isAdmin) {
      return;
    }
    if (module.external) {
      window.open(module.path, '_blank');
      return;
    }
    navigate(module.path);
  };

  // Módulos organizados no padrão visual do launcher
  const featuredModules = [
    {
      id: 'projects',
      category: 'PROJETOS & OPERAÇÕES',
      title: 'Projetos & Operações',
      description: 'Gestão de projetos internos, quadros Kanban, tarefas, apontamento e sprints.',
      icon: FolderKanban,
      path: '/dashboard/project-management',
      color: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
      arrowBg: 'bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-white',
      badge: 'Ativo',
    },
    {
      id: 'wiki',
      category: 'CONHECIMENTO & PROCESSOS',
      title: 'Base de Conhecimento & Wiki',
      description: 'Artigos técnicos, manuais operacionais, documentação corporativa e processos da empresa.',
      icon: BookOpen,
      path: isAdmin ? '/dashboard/content-manager' : '/dashboard/page/mural',
      color: 'from-teal-500 to-cyan-600',
      borderColor: 'border-teal-500/30 hover:border-teal-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.25)]',
      iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
      arrowBg: 'bg-teal-500/20 text-teal-300 group-hover:bg-teal-500 group-hover:text-white',
    },
  ];

  const adminModule = {
    id: 'admin',
    category: 'ADMINISTRAÇÃO',
    title: 'Console de Administração',
    description: 'Governança corporativa, gestão de usuários, logs de auditoria, monitoramento e configurações.',
    icon: Shield,
    path: '/dashboard/users',
    adminOnly: true,
    color: 'from-blue-600 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    glowColor: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
    iconBg: 'bg-blue-500/10 text-cyan-400 border border-blue-500/30',
    arrowBg: 'bg-blue-500/20 text-cyan-300 group-hover:bg-blue-500 group-hover:text-white',
  };

  const secondaryModules = [
    {
      id: 'financeiro',
      category: 'FINANCEIRO',
      title: 'Monitoramento de NFs',
      description: 'Controle mensal de emissão de notas fiscais, status de envio e relatórios de conformidade.',
      icon: Receipt,
      path: isAdmin ? '/dashboard/invoice-monitoring' : '/dashboard/my-documents',
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      arrowBg: 'bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white',
    },
    {
      id: 'pessoas',
      category: 'PESSOAS & CARREIRA',
      title: 'Portal do Colaborador & PDI',
      description: 'Meu Plano de Desenvolvimento Individual (PDI), metas, histórico de check-ins e perfil.',
      icon: Users,
      path: '/dashboard/my-pdi',
      color: 'from-green-500 to-cyan-600',
      borderColor: 'border-green-500/30 hover:border-green-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(34,197,94,0.25)]',
      iconBg: 'bg-green-500/10 text-green-400 border border-green-500/30',
      arrowBg: 'bg-green-500/20 text-green-300 group-hover:bg-green-500 group-hover:text-white',
    },
    {
      id: 'mural',
      category: 'COMUNICAÇÃO',
      title: 'Mural & Eventos',
      description: 'Mural de comunicados oficiais, novidades da equipe, aniversários e calendário corporativo.',
      icon: Newspaper,
      path: '/dashboard/page/mural',
      color: 'from-cyan-500 to-teal-500',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
      arrowBg: 'bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-white',
    },
    {
      id: 'documentos',
      category: 'DOCUMENTOS',
      title: 'Gestão de Documentos',
      description: 'Modelos, contratos, manuais e repositório centralizado de arquivos corporativos.',
      icon: FileArchive,
      path: '/dashboard/documents',
      color: 'from-teal-500 to-emerald-500',
      borderColor: 'border-teal-500/30 hover:border-teal-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(20,184,166,0.25)]',
      iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
      arrowBg: 'bg-teal-500/20 text-teal-300 group-hover:bg-teal-500 group-hover:text-white',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Central de Módulos - A2F / DriveData</title>
        <meta name="description" content="Selecione o módulo corporativo que deseja acessar" />
      </Helmet>

      <div className="min-h-screen bg-[#060B18] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-cyan-500 selection:text-white font-sans">
        
        {/* Background Glows & Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[120px] rounded-full"></div>
          <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-blue-700/10 blur-[140px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 blur-[150px] rounded-full"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>

        {/* Top Floating Bar / User info */}
        <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              A2F • DriveData Hub
            </span>
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-slate-200">{user?.name || user?.email}</span>
              {isAdmin && (
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Admin
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-300 hover:bg-red-500/10 rounded-full px-3 text-xs gap-1.5 border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex-1 flex flex-col items-center justify-center">
          
          {/* Logo & Main Title */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-10 flex flex-col items-center"
          >
            {/* 3D-styled Glowing Logo Icon */}
            <div className="relative mb-4 group cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-500"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0D1D38] to-[#081224] p-0.5 border border-cyan-400/40 shadow-2xl flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" fill="none">
                  <path d="M25 20C25 20 50 15 70 30C90 45 85 75 65 85C45 95 25 80 25 80" stroke="url(#logo-grad-1)" strokeWidth="12" strokeLinecap="round" />
                  <path d="M40 35C40 35 55 30 68 40C80 50 78 68 65 74C52 80 40 70 40 70" stroke="url(#logo-grad-2)" strokeWidth="10" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#4facfe" />
                    </linearGradient>
                    <linearGradient id="logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38ef7d" />
                      <stop offset="100%" stopColor="#11998e" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              DriveData <span className="text-cyan-400 font-light text-xl sm:text-2xl">| A2F</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400/80 uppercase mt-1">
              Plataforma Corporativa Integrada
            </p>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Selecione o módulo que deseja acessar
            </p>

            {/* Quick selectors bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Ambiente de Produção
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                🌐 Português (BR)
              </span>
            </div>
          </motion.div>

          {/* Section Divider: MÓDULOS */}
          <div className="w-full max-w-5xl mb-5 flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              Módulos
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 via-white/10 to-transparent"></div>
          </div>

          {/* Modules Grid */}
          <div className="w-full max-w-5xl space-y-4">
            
            {/* Top Featured Cards (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredModules.map((mod, idx) => {
                const IconComponent = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                    onClick={() => handleModuleClick(mod)}
                    className={`group relative cursor-pointer rounded-2xl bg-[#091224]/85 border ${mod.borderColor} p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${mod.glowColor} flex flex-col justify-between overflow-hidden shadow-xl`}
                  >
                    {/* Top ambient highlight */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100"></div>

                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl ${mod.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase block">
                              {mod.category}
                            </span>
                            <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                              {mod.title}
                            </h3>
                          </div>
                        </div>

                        {/* Arrow Action Button */}
                        <div className={`w-9 h-9 rounded-full ${mod.arrowBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0`}>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>

                      <p className="text-slate-300/80 text-sm leading-relaxed mb-4">
                        {mod.description}
                      </p>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>Acesso Rápido Disponível</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Admin Console Card (Featured or Full Width) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              onClick={() => handleModuleClick(adminModule)}
              className={`group relative cursor-pointer rounded-2xl bg-[#091224]/85 border ${adminModule.borderColor} p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${adminModule.glowColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden shadow-xl ${
                !isAdmin ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${adminModule.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0 shadow-lg`}>
                  <adminModule.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
                      {adminModule.category}
                    </span>
                    {isAdmin ? (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold uppercase">
                        Acesso Liberado
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Requer Admin
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {adminModule.title}
                  </h3>
                  <p className="text-slate-300/80 text-sm mt-0.5">
                    {adminModule.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className={`w-9 h-9 rounded-full ${adminModule.arrowBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0`}>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>

            {/* Bottom 4 Secondary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {secondaryModules.map((mod, idx) => {
                const IconComponent = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + 0.08 * idx, duration: 0.4 }}
                    onClick={() => handleModuleClick(mod)}
                    className={`group relative cursor-pointer rounded-2xl bg-[#091224]/85 border ${mod.borderColor} p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${mod.glowColor} flex flex-col justify-between overflow-hidden shadow-lg`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${mod.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className={`w-7 h-7 rounded-full ${mod.arrowBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>

                      <span className="text-[9px] font-bold tracking-wider text-cyan-400/90 uppercase block mb-1">
                        {mod.category}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors mb-2 leading-tight">
                        {mod.title}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {mod.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

        </main>

        {/* Footer / Bottom Status bar */}
        <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>DriveData &copy; {new Date().getFullYear()} • Sistema Integrado de Gestão & Wiki A2F</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer" onClick={() => navigate('/dashboard')}>Ir direto ao Dashboard &rarr;</span>
          </div>
        </footer>

      </div>
    </>
  );
};

export default ModulesHubPage;
