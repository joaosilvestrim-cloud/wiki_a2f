import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [errorCategory, setErrorCategory] = useState(null);
  
  const { login, isConfigured } = useAuth();
  
  // Task 2: No useEffect making automatic connectivity checks.
  // We only react to explicit user interaction.

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    setErrorCategory(null);
    
    try {
      const result = await login(email, password);
      
      if (result && result.error) {
        setLoginError(result.error.message);
        setErrorCategory(result.error.category);
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setLoginError('Ocorreu um erro inesperado durante o login. Verifique sua conexão e tente novamente.');
      setErrorCategory('unknown');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const backgroundPatternClass = `bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]`;

  return (
    <>
      <Helmet>
        <title>Login - Intranet A2F</title>
        <meta name="description" content="Acesse sua conta na intranet corporativa A2F" />
      </Helmet>
      
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(216 50% 14%) 0%, hsl(221 60% 9%) 55%, hsl(224 64% 6%) 100%)' }}
      >
        <div className={`absolute inset-0 opacity-[0.12] ${backgroundPatternClass}`}></div>
        <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-blue-600/20 blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="relative rounded-2xl border border-cyan-400/15 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"></div>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <img
                  src="https://horizons-cdn.hostinger.com/d3ba95b5-e5fd-4cdf-8fb4-fbdb2a8481f8/cad90785a5af22ee54db4db7fd734163.png"
                  alt="A2F Logo"
                  className="h-14 drop-shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                />
              </motion.div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Intranet A2F</h1>
              <p className="text-slate-300/80 text-sm mt-1">Acesse sua conta corporativa</p>
            </div>

            {!isConfigured && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-yellow-100">
                  <span className="font-semibold text-yellow-200 block mb-1">Atenção</span>
                  Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className={`border rounded-lg p-3 ${errorCategory === 'config' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                    <div className="flex items-start gap-3">
                      {errorCategory === 'config' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className={`font-semibold block mb-1 text-sm ${errorCategory === 'config' ? 'text-yellow-200' : 'text-red-200'}`}>
                          {errorCategory === 'config' ? 'Configuração Ausente' : 'Erro de Autenticação'}
                        </span>
                        <p className={`text-sm ${errorCategory === 'config' ? 'text-yellow-100' : 'text-red-200'}`}>{loginError}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                    disabled={isLoggingIn || !isConfigured}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                    disabled={isLoggingIn || !isConfigured}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
                    disabled={isLoggingIn || !isConfigured}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn || !isConfigured}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Autenticando...
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </motion.form>

            <p className="mt-6 text-center text-xs text-slate-400/70">
              Painel interno · Uso restrito da equipe A2F
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;