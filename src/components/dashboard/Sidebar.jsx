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
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const Sidebar = ({ isOpen, onClose, isDesktop }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    { name: 'Central de Módulos', path: '/hub', icon: LayoutGrid },
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

  const SidebarLink = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        `a2f-sidebar-link group ${isActive ? 'a2f-sidebar-link-active' : 'a2f-sidebar-link-idle'}`
      }
      onClick={!isDesktop ? onClose : undefined}
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`w-5 h-5 mr-3 transition-colors ${
              isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-300'
            }`}
          />
          <span>{item.name}</span>
        </>
      )}
    </NavLink>
  );

  const PageLinkRecursive = ({ page, level = 0 }) => {
    const location = useLocation();
    const hasChildren = page.children && page.children.length > 0;
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(
      location.pathname.includes(`/dashboard/page/${page.slug}`)
    );
    const isActive = location.pathname === `/dashboard/page/${page.slug}`;

    return (
      <div className="relative">
        <div 
          className="absolute left-0 top-0 h-full w-px bg-cyan-400/25" 
          style={{ marginLeft: `${12 + level * 16}px` }}
        ></div>
        <div className="flex items-center group">
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-px w-4 bg-cyan-400/25"
            style={{ left: `${12 + level * 16}px` }}
          ></div>
          <NavLink
            to={`/dashboard/page/${page.slug}`}
            className={`flex-grow flex items-center py-2 text-sm font-medium transition-colors rounded-r-md ${
              isActive
                ? 'text-white bg-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            style={{ paddingLeft: `${36 + level * 16}px` }}
            onClick={!isDesktop ? onClose : undefined}
          >
            <span>{page.title}</span>
          </NavLink>
          {hasChildren && (
            <button onClick={() => setIsSubMenuOpen(!isSubMenuOpen)} className="p-1 rounded-md hover:bg-white/10 mr-2">
              <ChevronRight className={`w-4 h-4 transition-transform text-slate-400 ${isSubMenuOpen ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        {hasChildren && (
          <AnimatePresence initial={false}>
            {isSubMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } }}
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

  const sidebarContent = (
    <div className="flex flex-col h-full a2f-sidebar text-slate-200 border-r border-white/5">
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <img src="https://horizons-cdn.hostinger.com/d3ba95b5-e5fd-4cdf-8fb4-fbdb2a8481f8/23d00d06a1d2f2071eebdfd37f83aad4.png" alt="A2F Logo" className="h-8" />
        </div>
        {!isDesktop && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-6 h-6" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wider text-cyan-300/70 uppercase">Principal</p>
        {mainNavItems.map(item => <SidebarLink key={item.name} item={item} />)}
        
        {user?.is_admin && adminNavItems.map(item => <SidebarLink key={item.name} item={item} />)}

        <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wider text-cyan-300/70 uppercase">Navegação</p>
        <SidebarLink item={{ name: 'Mural', path: '/dashboard/page/mural', icon: Newspaper }} />
        <SidebarLink item={{ name: 'Conheça a Equipe', path: '/dashboard/page/conheca-a-equipe', icon: Users2 }} />

        <button
          onClick={() => setOpenPagesMenu(!openPagesMenu)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-white/5 hover:text-white group"
        >
          <div className="flex items-center">
            <Compass className="w-5 h-5 mr-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            <span>Outras Páginas</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${openPagesMenu ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {openPagesMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {loadingPages ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white" /></div> : sitePages.map((page) => <PageLinkRecursive key={page.id} page={page} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {user?.is_admin && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wider text-cyan-300/70 uppercase">Admin</p>
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

      <div className="p-3 border-t border-white/20">
        <SidebarLink item={{ name: 'Configurações', path: '/dashboard/settings', icon: Settings }} />
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-red-500/80 hover:text-white px-3 py-2.5"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="w-64 flex-shrink-0">
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
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 z-50"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;