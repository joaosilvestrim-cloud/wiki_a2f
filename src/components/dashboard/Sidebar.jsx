import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText as FileTextIcon, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight, 
  ChevronDown,
  FileArchive, 
  Newspaper, 
  Users2, 
  Compass, 
  FolderTree as FileTree, 
  Loader2, 
  Image,
  Shield,
  History,
  Calendar,
  FileCog,
  Target,
  KanbanSquare,
  Activity,
  Receipt,
  Sparkles,
  Circle,
  ChevronsLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const Sidebar = ({ isOpen, onClose, isDesktop }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openPagesMenu, setOpenPagesMenu] = useState(true);
  const [sitePages, setSitePages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchSitePages = useCallback(async () => {
    setLoadingPages(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('wiki_categories')
        .select('id')
        .eq('name', 'Páginas do Site')
        .single();

      if (catError || !catData) {
        setSitePages([]);
        return;
      }

      const { data, error } = await supabase
        .from('wiki_articles')
        .select('id, title, slug, parent_id')
        .not('slug', 'in', '("mural", "conheca-a-equipe")')
        .eq('category_id', catData.id)
        .order('title', { ascending: true });

      if (error) {
        throw error;
      }

      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({ ...item, children: buildTree(items, item.id) }));
      };

      setSitePages(buildTree(data));
    } catch (error) {
      toast({ title: "Erro ao carregar páginas", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    fetchSitePages();
  }, [fetchSitePages]);

  const mainNavItems = [
    { name: 'Início', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meu PDI', path: '/dashboard/my-pdi', icon: Target },
    { name: 'Meus Documentos', path: '/dashboard/my-documents', icon: FileTextIcon },
  ];
  
  const adminNavItems = [
    { name: 'Funcionários', path: '/dashboard/employees', icon: Users },
    { name: 'Projetos (Legado)', path: '/dashboard/projects', icon: FolderKanban },
    { name: 'Gestão de Projetos', path: '/dashboard/project-management', icon: KanbanSquare },
    { name: 'Documentos', path: '/dashboard/documents', icon: FileArchive },
  ];

  /* ---- Styled Sidebar Link ---- */
  const SidebarLink = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
          isActive
            ? 'a2f-sidebar-link-active'
            : 'a2f-sidebar-link-idle'
        }`
      }
      onClick={!isDesktop ? onClose : undefined}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-sm shadow-cyan-500/10' 
              : 'bg-white/0 group-hover:bg-white/5'
          }`}>
            <item.icon
              className={`w-[18px] h-[18px] transition-all duration-200 ${
                isActive ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
          </div>
          <span className={`transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
          }`}>
            {item.name}
          </span>
        </>
      )}
    </NavLink>
  );

  /* ---- Section Label ---- */
  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-2 px-3 pt-5 pb-2">
      <span className="text-[10px] font-bold tracking-[0.18em] text-cyan-400/60 uppercase">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
    </div>
  );

  /* ---- Page Link Recursive ---- */
  const PageLinkRecursive = ({ page, level = 0 }) => {
    const hasChildren = page.children && page.children.length > 0;
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(
      location.pathname.includes(`/dashboard/page/${page.slug}`)
    );
    const isActive = location.pathname === `/dashboard/page/${page.slug}`;

    return (
      <div className="relative">
        {/* Tree connector */}
        <div 
          className="absolute left-0 top-0 h-full w-px bg-cyan-500/15" 
          style={{ marginLeft: `${14 + level * 16}px` }}
        />
        <div className="flex items-center group">
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-px w-3 bg-cyan-500/15"
            style={{ left: `${14 + level * 16}px` }}
          />
          <NavLink
            to={`/dashboard/page/${page.slug}`}
            className={`flex-grow flex items-center py-2 text-[13px] font-medium transition-all duration-200 rounded-lg mx-1 ${
              isActive
                ? 'text-white bg-white/8'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
            }`}
            style={{ paddingLeft: `${36 + level * 16}px` }}
            onClick={!isDesktop ? onClose : undefined}
          >
            <Circle className={`w-1.5 h-1.5 mr-2.5 transition-colors ${isActive ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`} />
            <span>{page.title}</span>
          </NavLink>
          {hasChildren && (
            <button 
              onClick={() => setIsSubMenuOpen(!isSubMenuOpen)} 
              className="p-1 rounded-md hover:bg-white/10 mr-2 transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 ${isSubMenuOpen ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        {hasChildren && (
          <AnimatePresence initial={false}>
            {isSubMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                className="overflow-hidden"
              >
                <div className="relative">
                  {page.children.map((child) => (
                    <PageLinkRecursive 
                      key={child.id} 
                      page={child} 
                      level={level + 1} 
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  /* ======= SIDEBAR CONTENT ======= */
  const sidebarContent = (
    <div className="flex flex-col h-full a2f-sidebar-v2 text-slate-200 relative overflow-hidden">
      
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-cyan-500/8 via-blue-500/4 to-transparent pointer-events-none" />
      <div className="absolute top-6 -left-10 w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />
      
      {/* Logo Area */}
      <div className="relative z-10 flex items-center justify-between h-16 px-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src="https://horizons-cdn.hostinger.com/d3ba95b5-e5fd-4cdf-8fb4-fbdb2a8481f8/23d00d06a1d2f2071eebdfd37f83aad4.png" 
              alt="A2F Logo" 
              className="h-8 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]" 
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-[9px] font-bold tracking-[0.15em] text-cyan-400/70 uppercase">Intranet</span>
          </div>
        </div>
        {!isDesktop && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="relative z-10 mx-3 mt-3 mb-1">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
          <div className="relative">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}&backgroundColor=0c4a6e&textColor=22d3ee`}
              alt={user?.name}
              className="w-9 h-9 rounded-lg border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0a1628] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name || 'Colaborador'}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.is_admin ? (
                <span className="text-cyan-400">Administrador</span>
              ) : (
                user?.role || user?.email
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div className="relative z-10 flex-1 px-2 py-1 space-y-0.5 overflow-y-auto sidebar-scroll">
        
        <SectionLabel>Principal</SectionLabel>
        {mainNavItems.map(item => <SidebarLink key={item.name} item={item} />)}
        
        {user?.is_admin && (
          <>
            <SectionLabel>Gestão</SectionLabel>
            {adminNavItems.map(item => <SidebarLink key={item.name} item={item} />)}
          </>
        )}

        <SectionLabel>Navegação</SectionLabel>
        <SidebarLink item={{ name: 'Mural', path: '/dashboard/page/mural', icon: Newspaper }} />
        <SidebarLink item={{ name: 'Conheça a Equipe', path: '/dashboard/page/conheca-a-equipe', icon: Users2 }} />

        {/* Collapsible Pages Section */}
        <button
          onClick={() => setOpenPagesMenu(!openPagesMenu)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium rounded-xl text-slate-300 hover:bg-white/5 hover:text-white group transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/0 group-hover:bg-white/5 transition-all">
              <Compass className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-200 transition-colors" />
            </div>
            <span>Outras Páginas</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${openPagesMenu ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {openPagesMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {loadingPages ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-cyan-400/60 w-5 h-5" />
                </div>
              ) : (
                sitePages.map((page) => <PageLinkRecursive key={page.id} page={page} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Section */}
        {user?.is_admin && (
          <>
            <SectionLabel>Administração</SectionLabel>
            <SidebarLink item={{ name: 'Monitoramento de Func.', path: '/dashboard/employee-monitoring', icon: Activity }} />
            <SidebarLink item={{ name: 'Monitoramento de NFs', path: '/dashboard/invoice-monitoring', icon: Receipt }} />
            <SidebarLink item={{ name: 'Gerenciar Usuários', path: '/dashboard/users', icon: Shield }} />
            <SidebarLink item={{ name: 'Gestão de PDI', path: '/dashboard/pdi', icon: Target }} />
            <SidebarLink item={{ name: 'Docs. Funcionários', path: '/dashboard/employee-documents', icon: FileArchive }} />
            <SidebarLink item={{ name: 'Config. Documentos', path: '/dashboard/document-settings', icon: FileCog }} />
            <SidebarLink item={{ name: 'Gerenciar Páginas', path: '/dashboard/page-manager', icon: FileTree }} />
            <SidebarLink item={{ name: 'Gerenciar Eventos', path: '/dashboard/events-manager', icon: Calendar }} />
            <SidebarLink item={{ name: 'Gerenciar Mídia', path: '/dashboard/media-manager', icon: Image }} />
            <SidebarLink item={{ name: 'Logs de Auditoria', path: '/dashboard/audit-logs', icon: History }} />
            <SidebarLink item={{ name: 'Gerenciar Conteúdo', path: '/dashboard/content-manager', icon: FileTree }} />
          </>
        )}
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 p-3 border-t border-white/8 space-y-1">
        <SidebarLink item={{ name: 'Configurações', path: '/dashboard/settings', icon: Settings }} />
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
          onClick={handleLogout}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-red-500/10 transition-all">
            <LogOut className="w-[18px] h-[18px] transition-colors" />
          </div>
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="w-[270px] flex-shrink-0">
        {sidebarContent}
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[270px] z-50"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;