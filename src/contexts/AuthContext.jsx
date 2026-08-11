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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(!!supabase);
  
  const loginInProgress = useRef(false);

  useEffect(() => {
    // Task 1: NO automatic requests on mount. Set loading to false immediately.
    setLoading(false);
    
    if (!supabase) {
      console.warn("[AuthContext] Supabase credentials missing. Auth state set to null. No connection will be attempted.");
      setUser(null);
      return;
    }
    
    // We intentionally do NOT call supabase.auth.getSession() here to prevent any fetch loops on mount.
    // The user will only be authenticated via manual login or manual session restore trigger.
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
          message: "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.",
          category: 'config',
        } 
      };
    }

    try {
      console.log('[AuthContext] Attempting manual login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      setUser(data.user);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo à intranet corporativa.",
      });
      
      loginInProgress.current = false;
      setLoading(false);
      return { error: null };
      
    } catch (err) {
      console.error("[AuthContext] Login attempt failed:", err);
      
      loginInProgress.current = false;
      setLoading(false);
      return { error: { message: err.message || "Falha ao conectar com o servidor.", category: 'server' } };
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
        toast({
          title: "Erro no logout",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUser(null);
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
    } catch (err) {
      console.error("[AuthContext] Logout error:", err);
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
    isConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};