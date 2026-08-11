import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Lock, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { logAction } from '@/lib/auditLog';

const PasswordResetForcePage = () => {
  const { user, updateUserProfile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A confirmação de senha não coincide com a nova senha.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      // 2. Atualiza o perfil para remover o flag de senha temporária
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ needs_password_change: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Registra a ação na auditoria
      await logAction('user_changed_temp_password', { email: user.email });

      toast({
        title: 'Senha atualizada com sucesso!',
        description: 'Sua conta está protegida. Bem-vindo à intranet!',
      });

      // 4. Atualiza o estado global para desbloquear o acesso
      updateUserProfile({ needs_password_change: false });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundPatternClass = `bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]`;

  return (
    <>
      <Helmet>
        <title>Alteração de Senha Obrigatória - Intranet A2F</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
        {/* Ambient background glow matching login theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-950">
          <div className={`absolute inset-0 opacity-20 ${backgroundPatternClass}`}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-blue-950/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-blue-800/50">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-yellow-500/10 text-yellow-400 mb-4 border border-yellow-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Alterar Senha Provisória</h1>
              <p className="text-sm text-blue-200">
                Para a sua segurança, você precisa definir uma senha definitiva no primeiro acesso.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-blue-200">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-blue-900/30 border-blue-800/50 text-white placeholder-blue-300 focus:ring-primary focus:border-transparent rounded-lg"
                    placeholder="Nova senha (min. 6 caracteres)"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-blue-200">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 bg-blue-900/30 border-blue-800/50 text-white placeholder-blue-300 focus:ring-primary focus:border-transparent rounded-lg"
                    placeholder="Repita a nova senha"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Salvando...
                  </div>
                ) : (
                  'Salvar e Acessar Intranet'
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PasswordResetForcePage;
