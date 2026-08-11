import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Save,
  Eye,
  EyeOff,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    bio: user?.bio || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    systemAlerts: false,
    weeklyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false
  });

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'appearance', name: 'Aparência', icon: Palette },
    { id: 'system', name: 'Sistema', icon: Database }
  ];

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company_documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      updateUserProfile({ avatar_url: publicUrl });
      toast({ title: "Foto de perfil atualizada com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao atualizar foto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (section) => {
    setIsSaving(true);
    if (section === 'Perfil') {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            phone: profileData.phone,
            department: profileData.department,
            bio: profileData.bio,
          })
          .eq('id', user.id);

        if (error) throw error;

        updateUserProfile(profileData);
        toast({ title: "Perfil atualizado com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (section === 'Segurança') {
        const { newPassword, confirmPassword } = securitySettings;

        if (!newPassword || !confirmPassword) {
            toast({ title: "Erro", description: "Por favor, preencha a nova senha e a confirmação.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        if (newPassword.length < 6) {
            toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            toast({ title: "Senha alterada com sucesso!" });
            setSecuritySettings({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                twoFactorAuth: securitySettings.twoFactorAuth
            });
        } catch (error) {
            toast({
                title: "Erro ao alterar senha",
                description: error.message,
                variant: "destructive",
            });
        }
    } else {
      toast({
        title: `🚧 Salvar ${section}`,
        description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
      });
    }
    setIsSaving(false);
  };

  const handleAction = (action) => {
    toast({
      title: `🚧 ${action}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`}
            alt={user?.name}
            className="w-24 h-24 rounded-full border-4 border-primary object-cover"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/png, image/jpeg, image/gif"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </Button>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome Completo</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={profileData.email}
            disabled
            className="form-input bg-muted/50 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Departamento</label>
          <select
            value={profileData.department}
            onChange={(e) => setProfileData({...profileData, department: e.target.value})}
            className="form-input"
          >
            <option value="">Selecione...</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Recursos Humanos">Recursos Humanos</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Biografia</label>
        <textarea
          value={profileData.bio}
          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
          rows={4}
          className="form-input resize-none"
        />
      </div>

      <Button
        onClick={() => handleSave('Perfil')}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Alterações
      </Button>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {Object.entries(notificationSettings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
            <div>
              <h4 className="text-foreground font-medium">
                {key === 'emailNotifications' && 'Notificações por Email'}
                {key === 'pushNotifications' && 'Notificações Push'}
                {key === 'projectUpdates' && 'Atualizações de Projetos'}
                {key === 'systemAlerts' && 'Alertas do Sistema'}
                {key === 'weeklyReports' && 'Relatórios Semanais'}
              </h4>
              <p className="text-muted-foreground text-sm">
                {key === 'emailNotifications' && 'Receber notificações por email'}
                {key === 'pushNotifications' && 'Receber notificações push no navegador'}
                {key === 'projectUpdates' && 'Notificações sobre atualizações de projetos'}
                {key === 'systemAlerts' && 'Alertas importantes do sistema'}
                {key === 'weeklyReports' && 'Relatórios semanais de atividades'}
              </p>
            </div>
            <button
              onClick={() => setNotificationSettings({...notificationSettings, [key]: !value})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={() => handleSave('Notificações')}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Preferências
      </Button>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Alterar Senha</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nova Senha</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={securitySettings.newPassword}
              onChange={(e) => setSecuritySettings({...securitySettings, newPassword: e.target.value})}
              className="form-input pr-12"
              placeholder="Digite sua nova senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
          <input
            type="password"
            value={securitySettings.confirmPassword}
            onChange={(e) => setSecuritySettings({...securitySettings, confirmPassword: e.target.value})}
            className="form-input"
            placeholder="Confirme sua nova senha"
          />
        </div>
      </div>

      <div className="p-4 bg-secondary/50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-foreground font-medium">Autenticação de Dois Fatores</h4>
            <p className="text-muted-foreground text-sm">Adicione uma camada extra de segurança</p>
          </div>
          <button
            onClick={() => setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              securitySettings.twoFactorAuth ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <Button
        onClick={() => handleSave('Segurança')}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Tema Visual</h3>
        <p className="text-sm text-muted-foreground">O sistema está configurado no tema claro padrão.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Idioma</h3>
        <select className="form-input" defaultValue="pt-BR">
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </div>

      <Button
        onClick={() => handleSave('Aparência')}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Preferências
      </Button>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-secondary/50 rounded-lg border">
          <h4 className="text-foreground font-medium mb-2">Versão do Sistema</h4>
          <p className="text-muted-foreground">v2.1.0</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-lg border">
          <h4 className="text-foreground font-medium mb-2">Última Atualização</h4>
          <p className="text-muted-foreground">22 de Setembro, 2025</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => handleAction('Verificar Atualizações')}
          variant="outline"
          className="w-full"
        >
          Verificar Atualizações
        </Button>
        <Button
          onClick={() => handleAction('Exportar Dados')}
          variant="outline"
          className="w-full"
        >
          Exportar Dados
        </Button>
        <Button
          onClick={() => handleAction('Limpar Cache')}
          variant="outline"
          className="w-full"
        >
          Limpar Cache
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e configurações</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="card p-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'system' && renderSystemTab()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;