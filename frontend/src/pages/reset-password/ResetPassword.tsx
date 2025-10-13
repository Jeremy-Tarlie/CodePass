import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Check, X, ArrowLeft } from "lucide-react";
import { API_CONFIG, getDefaultHeaders } from "../../config/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string>("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const isPasswordValid = hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecialChar;

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const csrfParam = searchParams.get('csrf');
    
    if (!tokenParam || !csrfParam) {
      setError("Lien de réinitialisation invalide. Veuillez refaire une demande.");
      setIsValidating(false);
      return;
    }
    
    setToken(tokenParam);
    setCsrfToken(csrfParam);
    validateToken(tokenParam, csrfParam);
  }, [searchParams]);

  // Écouter les deep links depuis Electron
  useEffect(() => {
    if (window.ipcRenderer?.onDeepLinkResetPassword) {
      window.ipcRenderer.onDeepLinkResetPassword((data: { token: string; csrf: string }) => {
        console.log('🔗 Deep link reçu dans React:', data);
        
        // Réinitialiser les états
        setError("");
        setSuccess("");
        setIsValidating(true);
        
        // Mettre à jour les tokens
        setToken(data.token);
        setCsrfToken(data.csrf);
        
        // Valider le token
        validateToken(data.token, data.csrf);
      });
    }

    // Cleanup
    return () => {
      if (window.ipcRenderer?.removeDeepLinkResetPasswordListener) {
        window.ipcRenderer.removeDeepLinkResetPasswordListener();
      }
    };
  }, []);

  const validateToken = async (token: string, csrf: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/password-reset/validate?token=${token}&csrf=${csrf}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success && data.valid) {
        setUserEmail(data.email || "");
        setSuccess("Token valide. Vous pouvez maintenant définir votre nouveau mot de passe.");
      } else {
        setError(data.message || "Token invalide ou expiré. Veuillez refaire une demande.");
      }
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
      } else {
        setError("Erreur lors de la validation du token. Veuillez réessayer.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    
    if (!passwordsMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/password-reset/reset`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          token,
          csrfToken,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.");
        setTimeout(() => {
          navigate('/connexion');
        }, 3000);
      } else {
        setError(data.message || "Erreur lors de la réinitialisation du mot de passe.");
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
      } else {
        setError("Erreur lors de la réinitialisation. Veuillez réessayer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Validation du lien...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous validons votre lien de réinitialisation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center py-20">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="p-8">
          <div className="space-y-6">
            <button
              onClick={() => navigate('/connexion')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span>Retour à la connexion</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nouveau mot de passe
              </h2>
              {userEmail && (
                <p className="text-gray-600 mb-6">
                  Réinitialisation pour : <span className="font-medium">{userEmail}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <X className="text-red-500 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-800 font-medium">Erreur</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="text-green-500 mt-0.5" size={20} />
                <div>
                  <h3 className="text-green-800 font-medium">Succès</h3>
                  <p className="text-green-700 text-sm mt-1">{success}</p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Entrez votre nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Confirmez votre nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Critères de sécurité :</h4>
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasMinLength ? <Check size={16} /> : <X size={16} />}
                      Au moins 8 caractères
                    </div>
                    <div className={`flex items-center gap-2 ${hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasLowercase ? <Check size={16} /> : <X size={16} />}
                      Une lettre minuscule
                    </div>
                    <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasUppercase ? <Check size={16} /> : <X size={16} />}
                      Une lettre majuscule
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasNumber ? <Check size={16} /> : <X size={16} />}
                      Un chiffre
                    </div>
                    <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasSpecialChar ? <Check size={16} /> : <X size={16} />}
                      Un caractère spécial (@$!%*?&)
                    </div>
                    <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordsMatch ? <Check size={16} /> : <X size={16} />}
                      Les mots de passe correspondent
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
