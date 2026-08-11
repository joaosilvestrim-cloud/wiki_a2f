import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AlertCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import PasswordResetForcePage from '@/pages/PasswordResetForcePage';
import '@/index.css';
import '@/styles/react-quill-custom.css';

const ConfigWarning = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border border-border text-center space-y-4">
      <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Configuração Incompleta</h2>
      <p className="text-muted-foreground">
        O sistema requer conexão com o Supabase. Por favor, certifique-se de configurar as variáveis <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">VITE_SUPABASE_URL</code> e <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">VITE_SUPABASE_ANON_KEY</code> no seu arquivo <strong>.env.local</strong> para utilizar o painel de controle.
      </p>
      <div className="pt-4">
        <a href="/login" className="text-primary hover:underline text-sm font-medium">Voltar para o Login</a>
      </div>
    </div>
  </div>
);

function AppContent() {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Force password reset if temporary password is active
  if (user && user.needs_password_change) {
    return <PasswordResetForcePage />;
  }

  const renderDashboard = () => {
    if (!isConfigured) return <ConfigWarning />;
    if (!user) return <Navigate to="/login" replace />;
    return <Dashboard />;
  };

  return (
    <>
      <Helmet>
        <title>Intranet Corporativa • A2F / DriveData</title>
        <meta name="description" content="Sistema de intranet corporativa e plataforma integrada moderna" />
      </Helmet>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/dashboard/*" 
          element={renderDashboard()} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;