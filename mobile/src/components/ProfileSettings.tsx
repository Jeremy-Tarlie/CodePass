import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { X, Mail, Lock, Shield, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { profileService, UserProfile } from '../services/profileService';

interface ProfileSettingsProps {
  onClose: () => void;
  initialTab?: 'email' | 'password' | 'backup';
}

type TabType = 'email' | 'password' | 'backup';

const ProfileSettings = ({ onClose, initialTab = 'email' }: ProfileSettingsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPassword, setBackupPassword] = useState('');

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
      setBackupEmail(userProfile.backupEmail || '');
    } catch {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
      const result = await profileService.updateEmail({ newEmail, currentPassword: emailPassword });
      toast.success(result.message);
      setNewEmail('');
      setEmailPassword('');
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\]!@#$%^&*()_+\-=[{};':"\\|,.<>/?~`])/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial');
      return;
    }
    try {
      setIsLoading(true);
      const result = await profileService.updatePassword({ currentPassword, newPassword });
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

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
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Mail }[] = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'password', label: 'Mot de passe', icon: Lock },
    { id: 'backup', label: 'Email secours', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Mon Profil</h2>
              <p className="text-slate-400 text-sm">{profile?.email || 'Chargement...'}</p>
            </div>
            <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" disabled={isLoading}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
                disabled={isLoading}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {isLoadingProfile ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-violet-500 animate-spin" />
              <p className="mt-4 text-slate-500">Chargement du profil...</p>
            </div>
          ) : (
            <>
              {activeTab === 'email' && (
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nouvel email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nouveau@email.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3"
                      disabled={isLoading}
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Mettre à jour l'email</>}
                  </button>
                </form>
              )}
              {activeTab === 'password' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3"
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3"
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3"
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading || (confirmPassword !== '' && newPassword !== confirmPassword)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Mettre à jour le mot de passe</>}
                  </button>
                </form>
              )}
              {activeTab === 'backup' && (
                <form onSubmit={handleUpdateBackupEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email de secours</label>
                    <input
                      type="email"
                      value={backupEmail}
                      onChange={(e) => setBackupEmail(e.target.value)}
                      placeholder="secours@email.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500 mt-1">Laissez vide pour supprimer.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3"
                      disabled={isLoading}
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Mettre à jour</>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
