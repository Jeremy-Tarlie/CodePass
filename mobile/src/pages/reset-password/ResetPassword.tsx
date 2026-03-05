import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Check, X, ArrowLeft } from "lucide-react";
import { API_CONFIG, getDefaultHeaders } from "../../config/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const hasMinLength = newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
  const isPasswordValid = hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecialChar;

  const validateToken = async (t: string, csrf: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/password-reset/validate?token=${t}&csrf=${csrf}`,
        { method: "GET", headers: getDefaultHeaders() }
      );
      const data = await response.json();
      if (data.success && data.valid) {
        setUserEmail(data.email || "");
        setSuccess("Token valide. Définissez votre nouveau mot de passe.");
      } else {
        setError(data.message || "Token invalide ou expiré.");
      }
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const csrfParam = searchParams.get("csrf");
    if (!tokenParam || !csrfParam) {
      setError("Lien invalide. Veuillez refaire une demande.");
      setIsValidating(false);
      return;
    }
    setToken(tokenParam);
    setCsrfToken(csrfParam);
    validateToken(tokenParam, csrfParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères.");
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
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify({ token, csrfToken, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess("Mot de passe réinitialisé ! Vous pouvez vous connecter.");
        setTimeout(() => navigate("/connexion"), 3000);
      } else {
        setError(data.message || "Erreur lors de la réinitialisation.");
      }
    } catch {
      setError("Erreur. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Validation du lien...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 space-y-6">
          <button onClick={() => navigate("/connexion")} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft size={20} /> Retour à la connexion
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Nouveau mot de passe</h2>
          {userEmail && <p className="text-gray-600">Pour : <span className="font-medium">{userEmail}</span></p>}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <X className="text-red-500 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="text-green-500 mt-0.5" size={20} />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg"
                    placeholder="Nouveau mot de passe"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg"
                    placeholder="Confirmer"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                <div className={hasMinLength ? "text-green-600" : "text-gray-500"}>{hasMinLength ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} 8 caractères min</div>
                <div className={hasLowercase ? "text-green-600" : "text-gray-500"}>{hasLowercase ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} Minuscule</div>
                <div className={hasUppercase ? "text-green-600" : "text-gray-500"}>{hasUppercase ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} Majuscule</div>
                <div className={hasNumber ? "text-green-600" : "text-gray-500"}>{hasNumber ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} Chiffre</div>
                <div className={hasSpecialChar ? "text-green-600" : "text-gray-500"}>{hasSpecialChar ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} Caractère spécial</div>
                <div className={passwordsMatch ? "text-green-600" : "text-gray-500"}>{passwordsMatch ? <Check size={16} className="inline" /> : <X size={16} className="inline" />} Correspondance</div>
              </div>
              <button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
