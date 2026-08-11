import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { logAction } from '@/lib/auditLog';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Junta o usuario do auth com o perfil (name, role, is_admin, avatar_url...) da tabela profiles.
const hydrateUser = async (authUser) => {
  if (!authUser) return null;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    return profile ? { ...authUser, ...profile } : authUser;
  } catch (err) {
    console.error('[AuthContext] Falha ao carregar perfil:', err);
    return authUser;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(!!supabase);
  const [connectionStatus, setConnectionStatus] = useState({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    supabaseConnected: !!supabase,
  });

  const loginInProgress = useRef(false);

  // Estado de conexao (usado pelo indicador no header).
  useEffect(() => {
    const update = () =>
      setConnectionStatus({
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        supabaseConnected: !!supabase,
      });
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.warn('[AuthContext] Supabase nao configurado.');
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;

    // Restaura a sessao persistida e carrega o perfil.
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hydrated = await hydrateUser(session?.user ?? null);
        if (active) setUser(hydrated);
      } catch (err) {
        console.error('[AuthContext] Erro ao restaurar sessao:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();

    // Mantem o estado em sincronia (refresh de token, logout em outra aba...).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        if (active) setUser(null);
        return;
      }
      // adia a consulta para nao travar o callback do supabase-js
      setTimeout(async () => {
        const hydrated = await hydrateUser(session.user);
        if (active) setUser(hydrated);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (loginInProgress.current) {
      return { error: { message: 'Login em andamento...', category: 'duplicate' } };
    }

    loginInProgress.current = true;
    setLoading(true);

    if (!supabase) {
      loginInProgress.current = false;
      setLoading(false);
      return {
        error: {
          message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
          category: 'config',
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const hydrated = await hydrateUser(data.user);
      setUser(hydrated);

      logAction('user_login', { email }).catch(() => {});

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo à intranet corporativa.',
      });

      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Login attempt failed:', err);
      return { error: { message: err.message || 'Falha ao conectar com o servidor.', category: 'server' } };
    } finally {
      loginInProgress.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (user) {
        await logAction('user_logout', { email: user.email }).catch(console.error);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: 'Erro no logout', description: error.message, variant: 'destructive' });
      } else {
        setUser(null);
        toast({ title: 'Logout realizado', description: 'Você foi desconectado com sucesso.' });
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = useCallback((updatedFields) => {
    setUser(currentUser => ({ ...currentUser, ...updatedFields }));
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    updateUserProfile,
    isConfigured,
    connectionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
