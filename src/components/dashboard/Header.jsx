import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'wiki', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-lg border-b px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:bg-secondary"
        >
          <Menu className="w-6 h-6" />
        </Button>
        
        <div className="hidden md:flex items-center space-x-2 bg-secondary rounded-lg px-3 py-2 min-w-[300px]">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar na intranet..."
            className="bg-transparent text-foreground placeholder-muted-foreground outline-none flex-1 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <ConnectionStatus />
        


        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-secondary relative rounded-full"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4 border-b">
              <h4 className="font-medium text-sm">Notificações</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className={`p-4 border-b text-sm ${!notification.is_read ? 'bg-secondary/50' : ''}`}>
                    <Link to={notification.link || '#'} onClick={() => markAsRead(notification.id)}>
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-muted-foreground text-xs">{notification.message}</p>
                      <p className="text-muted-foreground text-xs mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground p-8">Nenhuma notificação nova.</p>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-2 border-t">
                <Button variant="link" size="sm" className="w-full" onClick={markAllAsRead}>
                  Marcar todas como lidas
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 p-1 rounded-full">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full border-2 border-primary/50"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.is_admin ? 'Administrador' : user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;