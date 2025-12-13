import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { X, Mail, Lock, Shield, Eye, EyeOff, Save, Loader2, Power, PowerOff, Zap, User, Settings, ChevronRight } from 'lucide-react';
import { profileService, UserProfile } from '../services/profileService';

interface ProfileSettingsProps {
  onClose: () => void;
}

type TabType = 'email' | 'password' | 'backup' | 'startup';

const ProfileSettings = ({ onClose }: ProfileSettingsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // États pour le formulaire email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  
  // États pour le formulaire mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // États pour le formulaire email de secours
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPassword, setBackupPassword] = useState('');

  // États pour le démarrage automatique
  const [isAutoStartupEnabled, setIsAutoStartupEnabled] = useState<boolean>(false);
  const [isAutoStartupLoading, setIsAutoStartupLoading] = useState<boolean>(false);

  // Charger le profil
  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
      setBackupEmail(userProfile.backupEmail || '');
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Vérifier le statut du démarrage automatique
  useEffect(() => {
    const checkAutoStartupStatus = async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getAutoStartupStatus();
          setIsAutoStartupEnabled(result.enabled);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    loadProfile();
    checkAutoStartupStatus();
  }, [loadProfile]);

  // Toggle démarrage automatique
  const toggleAutoStartup = async () => {
    if (!window.electronAPI) {
      toast.error('Fonctionnalité non disponible dans cette version');
      return;
    }

    setIsAutoStartupLoading(true);
    try {
      const newStatus = !isAutoStartupEnabled;
      await window.electronAPI.setAutoStartup(newStatus);
      setIsAutoStartupEnabled(newStatus);
      
      if (newStatus) {
        toast.success('Démarrage automatique activé !');
      } else {
        toast.success('Démarrage automatique désactivé !');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du démarrage automatique:', error);
      toast.error('Erreur lors de la modification des paramètres');
    } finally {
      setIsAutoStartupLoading(false);
    }
  };

  // Mettre à jour l'email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !emailPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!newEmail.includes('@')) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.updateEmail({
        newEmail,
        currentPassword: emailPassword,
      });
      
      toast.success(result.message);
      setNewEmail('');
      setEmailPassword('');
      await loadProfile();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le mot de passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial');
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.updatePassword({
        currentPassword,
        newPassword,
      });
      
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour l'email de secours
  const handleUpdateBackupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backupPassword) {
      toast.error('Veuillez entrer votre mot de passe');
      return;
    }

    if (backupEmail && !backupEmail.includes('@')) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    if (backupEmail && profile && backupEmail.toLowerCase() === profile.email.toLowerCase()) {
      toast.error("L'email de secours ne peut pas être identique à l'email principal");
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.updateBackupEmail({
        backupEmail: backupEmail || null,
        currentPassword: backupPassword,
      });
      
      toast.success(result.message);
      setBackupPassword('');
      await loadProfile();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'email' as TabType, label: 'Email', icon: Mail, color: 'from-cyan-500 to-blue-500' },
    { id: 'password' as TabType, label: 'Mot de passe', icon: Lock, color: 'from-violet-500 to-purple-500' },
    { id: 'backup' as TabType, label: 'Email secours', icon: Shield, color: 'from-amber-500 to-orange-500' },
    { id: 'startup' as TabType, label: 'Démarrage', icon: Zap, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop avec effet de flou */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up">
        {/* Header avec dégradé dynamique */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Mon Profil
                  </h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {profile?.email || 'Chargement...'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 group"
                disabled={isLoading}
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="px-4 py-2">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 group
                    ${activeTab === tab.id
                      ? 'bg-white text-slate-800 shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                    }`}
                  disabled={isLoading}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id 
                      ? `bg-gradient-to-br ${tab.color} shadow-sm` 
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}>
                    <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight size={14} className="text-slate-400 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8 max-h-[55vh] overflow-y-auto bg-gradient-to-b from-white to-slate-50">
          {isLoadingProfile ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
              </div>
              <p className="mt-4 text-slate-500 font-medium">Chargement du profil...</p>
            </div>
          ) : (
            <>
              {/* Email Tab */}
              {activeTab === 'email' && (
                <form onSubmit={handleUpdateEmail} className="space-y-6">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email actuel</p>
                        <p className="text-lg font-bold text-slate-800">{profile?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nouvel email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="nouveau@email.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-cyan-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-cyan-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-1 bg-amber-200 rounded-lg flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-sm text-amber-800">
                      Un email de confirmation sera envoyé à votre ancienne et nouvelle adresse.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Mettre à jour l'email
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-violet-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-violet-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Min. 8 caractères avec minuscule, majuscule, chiffre et caractère spécial.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full pl-12 pr-14 py-4 bg-slate-50 border-2 rounded-xl focus:ring-0 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 ${
                            confirmPassword && newPassword !== confirmPassword 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-slate-200 focus:border-violet-500'
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <X size={12} /> Les mots de passe ne correspondent pas
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || (confirmPassword !== '' && newPassword !== confirmPassword)}
                    className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Backup Email Tab */}
              {activeTab === 'backup' && (
                <form onSubmit={handleUpdateBackupEmail} className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">Email de secours</h3>
                        <p className="text-sm text-slate-600">
                          Permet de récupérer votre compte et reçoit les alertes de sécurité.
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile?.backupEmail && (
                    <div className="bg-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Actuel</p>
                        <p className="text-sm font-medium text-slate-700">{profile.backupEmail}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {profile?.backupEmail ? 'Nouvel email de secours' : 'Email de secours'}
                      </label>
                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                          type="email"
                          value={backupEmail}
                          onChange={(e) => setBackupEmail(e.target.value)}
                          placeholder="secours@email.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-amber-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Laissez vide pour supprimer l'email de secours.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                          type="password"
                          value={backupPassword}
                          onChange={(e) => setBackupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-amber-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        {backupEmail ? 'Mettre à jour' : 'Supprimer l\'email de secours'}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Startup Tab */}
              {activeTab === 'startup' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-all duration-300 ${
                          isAutoStartupEnabled 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' 
                            : 'bg-slate-200'
                        }`}>
                          {isAutoStartupEnabled ? (
                            <Power className="w-6 h-6 text-white" />
                          ) : (
                            <PowerOff className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            Démarrage automatique
                          </h3>
                          <p className="text-sm text-slate-600">
                            {isAutoStartupEnabled 
                              ? 'CodePass démarre avec votre ordinateur'
                              : 'CodePass ne démarre pas automatiquement'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={toggleAutoStartup}
                        disabled={isAutoStartupLoading}
                        className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
                          isAutoStartupEnabled 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' 
                            : 'bg-slate-300'
                        } ${isAutoStartupLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                      >
                        <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                          isAutoStartupEnabled ? 'left-8' : 'left-1'
                        }`}>
                          {isAutoStartupLoading ? (
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                          ) : isAutoStartupEnabled ? (
                            <Power className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <PowerOff className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-2xl p-5">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-500" />
                      Comment ça fonctionne ?
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-600">W</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-sm">Windows</p>
                          <p className="text-xs text-slate-500">Entrée dans le registre Windows</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white"></span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-sm">macOS</p>
                          <p className="text-xs text-slate-500">Éléments de connexion système</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-600">L</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-sm">Linux</p>
                          <p className="text-xs text-slate-500">Fichier .desktop dans ~/.config/autostart/</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-1 bg-cyan-200 rounded-lg flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-cyan-700" />
                    </div>
                    <p className="text-sm text-cyan-800">
                      <strong>Astuce :</strong> Activez le démarrage automatique pour que vos mots de passe soient toujours accessibles dès que vous allumez votre ordinateur.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
