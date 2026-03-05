import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Lock, ExternalLink, Key, CheckCircle, X } from 'lucide-react';

function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = password.length; i < 18; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

interface PasswordChangeReminderPopupProps {
  onOpenSettings: () => void;
  onOpenPasswordTab: () => void;
  onClose?: () => void;
}

export default function PasswordChangeReminderPopup({
  onOpenSettings,
  onOpenPasswordTab,
  onClose,
}: PasswordChangeReminderPopupProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showGenerated, setShowGenerated] = useState(false);

  const handleGeneratePassword = useCallback(() => {
    const pwd = generateSecurePassword();
    setGeneratedPassword(pwd);
    setShowGenerated(true);
    navigator.clipboard.writeText(pwd).then(
      () => toast.success('Mot de passe copié'),
      () => toast.error('Impossible de copier')
    );
  }, []);

  const copyGenerated = useCallback(() => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Copié !');
    }
  }, [generatedPassword]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Lock className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Rappel de sécurité</h2>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-700">
            Il est recommandé de changer votre mot de passe tous les <strong>6 mois</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={onOpenSettings} className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
              <ExternalLink className="w-5 h-5" /> Ouvrir les paramètres
            </button>
            <button type="button" onClick={handleGeneratePassword} className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 border border-slate-200">
              <Key className="w-5 h-5" /> Générer un mot de passe
            </button>
            {showGenerated && generatedPassword && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <code className="text-sm font-mono truncate flex-1">{generatedPassword}</code>
                <button type="button" onClick={copyGenerated} className="text-indigo-600 text-sm font-medium whitespace-nowrap">Copier</button>
              </div>
            )}
            <button type="button" onClick={onOpenPasswordTab} className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700">
              <CheckCircle className="w-5 h-5" /> J'ai modifié mon mot de passe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
