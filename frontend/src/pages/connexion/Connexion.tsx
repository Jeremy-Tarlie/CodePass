import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Check, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Connexion = () => {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  type Tab = "connexion" | "register" | "forgotPassword" | "emailSent";
  const [activeTab, setActiveTab] = useState<Tab>("connexion");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Connexion form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState("");

  // Register form
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerRemember, setRegisterRemember] = useState(false);
  const [registerEmailError, setRegisterEmailError] = useState("");

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  // Password validation
  const hasMinLength = registerPassword.length >= 10;
  const hasLowercase = /[a-z]/.test(registerPassword);
  const hasUppercase = /[A-Z]/.test(registerPassword);
  const hasNumber = /\d/.test(registerPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(registerPassword);
  const passwordsMatch =
    registerPassword === confirmPassword && confirmPassword !== "";

  // Email validation function
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname || "/";
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
      // La redirection sera gérée par le useEffect ci-dessus
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion");
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
      const API_URL = import.meta.env.VITE_API_URL;
      const API_KEY = import.meta.env.VITE_API_KEY;
      
      const response = await fetch(`${API_URL}/api/password-reset/request`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setForgotEmailSent(true);
        setSuccess("Email envoyé ! Un email de réinitialisation de mot de passe a été envoyé à " + forgotEmail + ". Veuillez vérifier votre boîte de réception.");
      } else {
        setError(data.message || "Erreur lors de l'envoi de l'email");
        setForgotEmailSent(false); // S'assurer que le formulaire reste affiché
      }
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
      } else {
        setError("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
      }
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
    
    if (
      !hasMinLength ||
      !hasLowercase ||
      !hasUppercase ||
      !hasNumber ||
      !hasSpecialChar ||
      !passwordsMatch
    ) {
      setError("Veuillez respecter tous les critères du mot de passe");
      return;
    }
    
    setRegisterEmailError("");
    setIsSubmitting(true);
    
    try {
      await register(registerEmail, registerPassword);
      setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      setActiveTab("connexion");
      // Pré-remplir l'email dans le formulaire de connexion
      setLoginEmail(registerEmail);
      // Réinitialiser le formulaire d'inscription
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div
      className={`flex items-center gap-2 text-sm transition-colors ${
        met ? "text-green-600" : "text-gray-400"
      }`}
    >
      {met ? <Check size={16} /> : <X size={16} />}
      <span>{text}</span>
    </div>
  );

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Email envoyé !
          </h2>
          <p className="text-gray-600 mb-6">
            Un email de confirmation a été envoyé à{" "}
            <strong>{registerEmail}</strong>. Veuillez vérifier votre boîte de
            réception pour activer votre compte.
          </p>
          <button
            onClick={() => {
              setEmailSent(false);
              setActiveTab("connexion");
              setRegisterEmail("");
              setRegisterPassword("");
              setConfirmPassword("");
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (forgotEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Email envoyé !
          </h2>
          <p className="text-gray-600 mb-6">
            Un email de réinitialisation de mot de passe a été envoyé à{" "}
            <strong>{forgotEmail}</strong>. Veuillez vérifier votre boîte de
            réception.
          </p>
          <button
            onClick={() => {
              setForgotEmailSent(false);
              setActiveTab("connexion");
              setForgotEmail("");
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center py-20">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md h-full">
        {activeTab !== "forgotPassword" && (
          <>
            {/* Tabs - Only shown for connexion/register */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("connexion")}
                className={`flex-1 py-4 font-semibold transition-all duration-300 relative ${
                  activeTab === "connexion"
                    ? "text-indigo-600 bg-white"
                    : "text-gray-500 bg-slate-100 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                Connexion
                {activeTab === "connexion" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-4 font-semibold transition-all duration-300 relative ${
                  activeTab === "register"
                    ? "text-indigo-600 bg-white"
                    : "text-gray-500 bg-slate-100 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                Inscription
                {activeTab === "register" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
            </div>
          </>
        )}

        <div className="p-8">
          {activeTab === "forgotPassword" ? (
            // Forgot Password Form
            <div className="space-y-6">
              <button
                onClick={() => setActiveTab("connexion")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
                <span>Retour à la connexion</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Mot de passe oublié ?
              </h2>
              <p className="text-gray-600 mb-6">
                Entrez votre adresse email et nous vous enverrons un lien pour
                réinitialiser votre mot de passe.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotEmailError) setForgotEmailError("");
                      }}
                      className={`w-full pl-10 pr-4 py-3 border ${
                        forgotEmailError ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition`}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  {forgotEmailError && (
                    <p className="text-red-500 text-sm mt-1">
                      {forgotEmailError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Envoyer le lien de réinitialisation
                </button>
              </form>
            </div>
          ) : activeTab === "connexion" ? (
            // Login Form
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Bon retour parmi nous !
              </h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginEmailError) setLoginEmailError("");
                    }}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      loginEmailError ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition`}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                {loginEmailError && (
                  <p className="text-red-500 text-sm mt-1">{loginEmailError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
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
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Rester connecté</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  onClick={() => {
                    setActiveTab("forgotPassword");
                    setForgotEmail(loginEmail);
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <button
                onClick={handleLoginSubmit}
                disabled={isSubmitting || isLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </div>
          ) : (
            // Register Form
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Créer un compte
              </h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      if (registerEmailError) setRegisterEmailError("");
                    }}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      registerEmailError ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition`}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                {registerEmailError && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerEmailError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
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
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
              {registerPassword && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Critères du mot de passe :
                  </p>
                  <PasswordRequirement
                    met={hasMinLength}
                    text="Au moins 10 caractères"
                  />
                  <PasswordRequirement
                    met={hasLowercase}
                    text="Une lettre minuscule"
                  />
                  <PasswordRequirement
                    met={hasUppercase}
                    text="Une lettre majuscule"
                  />
                  <PasswordRequirement met={hasNumber} text="Un chiffre" />
                  <PasswordRequirement
                    met={hasSpecialChar}
                    text="Un caractère spécial (!@#$%...)"
                  />
                  {confirmPassword && (
                    <PasswordRequirement
                      met={passwordsMatch}
                      text="Les mots de passe correspondent"
                    />
                  )}
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registerRemember}
                  onChange={(e) => setRegisterRemember(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Rester connecté</span>
              </label>
              <button
                onClick={handleRegisterSubmit}
                disabled={
                  isSubmitting ||
                  !isValidEmail(registerEmail) ||
                  !hasMinLength ||
                  !hasLowercase ||
                  !hasUppercase ||
                  !hasNumber ||
                  !hasSpecialChar ||
                  !passwordsMatch
                }
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connexion;
