import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Check, X, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";

type Tab = "connexion" | "register" | "forgotPassword" | "emailSent";

const Connexion = () => {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<Tab>("connexion");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerEmailError, setRegisterEmailError] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  const hasMinLength = registerPassword.length >= 10;
  const hasLowercase = /[a-z]/.test(registerPassword);
  const hasUppercase = /[A-Z]/.test(registerPassword);
  const hasNumber = /\d/.test(registerPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(registerPassword);
  const passwordsMatch = registerPassword === confirmPassword && confirmPassword !== "";

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidEmail(loginEmail)) {
      setLoginEmailError("Veuillez entrer un email valide");
      return;
    }
    if (!loginPassword) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }
    setLoginEmailError("");
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword, loginRemember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      setForgotEmailError("Veuillez entrer un email valide");
      return;
    }
    setForgotEmailError("");
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/password-reset/request`, {
        method: "POST",
        headers: { "x-api-key": API_CONFIG.API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setForgotEmailSent(true);
        setSuccess("Email envoyé ! Vérifiez votre boîte de réception.");
      } else {
        setError(data.message || "Erreur lors de l'envoi de l'email");
      }
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidEmail(registerEmail)) {
      setRegisterEmailError("Veuillez entrer un email valide");
      return;
    }
    if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar || !passwordsMatch) {
      setError("Veuillez respecter tous les critères du mot de passe");
      return;
    }
    setRegisterEmailError("");
    setIsSubmitting(true);
    try {
      await register(registerEmail, registerPassword);
      setSuccess("Compte créé ! Vous pouvez vous connecter.");
      setActiveTab("connexion");
      setLoginEmail(registerEmail);
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-400"}`}>
      {met ? <Check size={16} /> : <X size={16} />}
      <span>{text}</span>
    </div>
  );

  if (forgotEmailSent) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Email envoyé !</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Un email de réinitialisation a été envoyé à <strong className="break-all">{forgotEmail}</strong>.
          </p>
          <button
            onClick={() => {
              setForgotEmailSent(false);
              setActiveTab("connexion");
              setForgotEmail("");
            }}
            className="w-full min-h-[48px] bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 font-medium touch-target"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const apiNotConfigured = !API_CONFIG.BASE_URL || !API_CONFIG.API_KEY;

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center py-6 sm:py-12 px-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        {apiNotConfigured && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-3 flex items-start gap-2 safe-area-top">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800 break-words">
              <strong>API non configurée.</strong> Renseignez <code className="bg-amber-200/70 px-1 rounded">VITE_API_URL</code> et <code className="bg-amber-200/70 px-1 rounded">VITE_API_KEY</code> dans <code className="bg-amber-200/70 px-1 rounded">mobile/.env</code>, puis refaites <code className="bg-amber-200/70 px-1 rounded">npm run build</code> et <code className="bg-amber-200/70 px-1 rounded">npx cap sync android</code>.
            </div>
          </div>
        )}
        {activeTab !== "forgotPassword" && (
          <div className="flex bg-gray-50 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("connexion")}
              className={`flex-1 min-h-[48px] py-3.5 font-semibold touch-target ${activeTab === "connexion" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500"}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 min-h-[48px] py-3.5 font-semibold touch-target ${activeTab === "register" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500"}`}
            >
              Inscription
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">
          {activeTab === "forgotPassword" ? (
            <div className="space-y-6">
              <button onClick={() => setActiveTab("connexion")} className="flex items-center gap-2 min-h-[44px] text-gray-600 touch-target">
                <ArrowLeft size={20} /> Retour
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mot de passe oublié ?</h2>
              <p className="text-gray-600">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(""); }}
                      className={`w-full pl-10 pr-4 py-3.5 min-h-[48px] border rounded-xl text-base ${forgotEmailError ? "border-red-500" : "border-gray-300"}`}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  {forgotEmailError && <p className="text-red-500 text-sm mt-1">{forgotEmailError}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full min-h-[48px] bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 font-semibold disabled:opacity-50 touch-target">
                  Envoyer le lien
                </button>
              </form>
            </div>
          ) : activeTab === "connexion" ? (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Bon retour !</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setLoginEmailError(""); }}
                      className={`w-full pl-10 pr-4 py-3.5 min-h-[48px] border rounded-xl text-base ${loginEmailError ? "border-red-500" : "border-gray-300"}`}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  {loginEmailError && <p className="text-red-500 text-sm mt-1">{loginEmailError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3.5 min-h-[48px] border border-gray-300 rounded-xl text-base"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 rounded-lg hover:bg-gray-100 touch-target">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input type="checkbox" checked={loginRemember} onChange={(e) => setLoginRemember(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                    <span className="text-sm text-gray-700">Rester connecté</span>
                  </label>
                  <button type="button" className="text-sm text-indigo-600 font-medium min-h-[44px] flex items-center touch-target" onClick={() => { setActiveTab("forgotPassword"); setForgotEmail(loginEmail); }}>
                    Mot de passe oublié ?
                  </button>
                </div>
                <button type="submit" disabled={isSubmitting || isLoading} className="w-full min-h-[48px] bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 font-semibold disabled:opacity-50 touch-target">
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Créer un compte</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => { setRegisterEmail(e.target.value); setRegisterEmailError(""); }}
                    className={`w-full pl-10 pr-4 py-3.5 min-h-[48px] border rounded-xl text-base ${registerEmailError ? "border-red-500" : "border-gray-300"}`}
                    placeholder="votre@email.com"
                    required
                  />
                  {registerEmailError && <p className="text-red-500 text-sm mt-1">{registerEmailError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3.5 min-h-[48px] border border-gray-300 rounded-xl text-base"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 rounded-lg hover:bg-gray-100 touch-target">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3.5 min-h-[48px] border border-gray-300 rounded-xl text-base"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 rounded-lg hover:bg-gray-100 touch-target">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {registerPassword && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <PasswordRequirement met={hasMinLength} text="Au moins 10 caractères" />
                    <PasswordRequirement met={hasLowercase} text="Une lettre minuscule" />
                    <PasswordRequirement met={hasUppercase} text="Une lettre majuscule" />
                    <PasswordRequirement met={hasNumber} text="Un chiffre" />
                    <PasswordRequirement met={hasSpecialChar} text="Un caractère spécial" />
                    {confirmPassword && <PasswordRequirement met={passwordsMatch} text="Les mots de passe correspondent" />}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidEmail(registerEmail) || !hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar || !passwordsMatch}
                  className="w-full min-h-[48px] bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 font-semibold disabled:opacity-50 touch-target"
                >
                  {isSubmitting ? "Inscription..." : "S'inscrire"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connexion;
