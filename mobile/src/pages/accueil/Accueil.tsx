import { useState, useMemo, useCallback, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  Lock,
  Plus,
  Search,
  Globe,
  Info,
  Edit2,
  X,
  ArrowLeft,
  ArrowRight,
  Mail,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { passwordService, PasswordEntry } from "../../services/passwordService";
import { profileService, UserProfile } from "../../services/profileService";
import ProfileSettings from "../../components/ProfileSettings";
import { shouldShowPasswordReminder } from "../../utils/passwordReminder";

type PasswordForm = {
  id?: string;
  title: string;
  username: string;
  url?: string;
  password: string;
  notes: string;
};

const Accueil = () => {
  const { user, logout } = useAuth();
  const colorPalette = useMemo(
    () => [
      { lock: "text-indigo-600", url: "text-indigo-600", bg: "bg-indigo-50" },
      { lock: "text-blue-600", url: "text-blue-600", bg: "bg-blue-50" },
      { lock: "text-green-600", url: "text-green-600", bg: "bg-green-50" },
      { lock: "text-purple-600", url: "text-purple-600", bg: "bg-purple-50" },
      { lock: "text-teal-600", url: "text-teal-600", bg: "bg-teal-50" },
      { lock: "text-amber-600", url: "text-amber-600", bg: "bg-amber-50" },
      { lock: "text-fuchsia-600", url: "text-fuchsia-600", bg: "bg-fuchsia-50" },
      { lock: "text-rose-600", url: "text-rose-600", bg: "bg-rose-50" },
    ],
    []
  );

  const [popUp, setPopUp] = useState(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Map<string, boolean>>(new Map());
  const [formData, setFormData] = useState<PasswordForm>({
    title: "",
    username: "",
    url: "",
    password: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | null; title: string }>({ id: null, title: "" });
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileSettingsInitialTab, setProfileSettingsInitialTab] = useState<"email" | "password">("email");

  const fetchPasswords = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await passwordService.getAllPasswords();
      setPasswords(data);
    } catch {
      toast.error("Erreur lors du chargement des mots de passe");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await profileService.getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const passwordOverdue =
    profile !== null && shouldShowPasswordReminder(profile.passwordChangedAt ?? null);

  const filteredPasswords = useMemo(
    () =>
      passwords.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.url && p.url.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [passwords, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filteredPasswords.length / itemsPerPage));
  const paginatedPasswords = useMemo(
    () =>
      filteredPasswords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredPasswords, currentPage, itemsPerPage]
  );

  const getPaginationRange = useCallback(() => {
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    const range: (JSX.Element | string)[] = [];
    const btnClass = "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-sm font-medium touch-target";
    range.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`${btnClass} ${currentPage === 1 ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
      >
        1
      </button>
    );
    if (left > 2) range.push(<span key="l" className="self-center text-gray-400">...</span>);
    for (let i = left; i <= right; i++) {
      range.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`${btnClass} ${currentPage === i ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
        >
          {i}
        </button>
      );
    }
    if (right < totalPages - 1) range.push(<span key="r" className="self-center text-gray-400">...</span>);
    if (totalPages > 1) {
      range.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`${btnClass} ${currentPage === totalPages ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
        >
          {totalPages}
        </button>
      );
    }
    return range;
  }, [currentPage, totalPages]);

  const isValidUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.title || !formData.username || !formData.password) {
      toast.error("Remplissez les champs obligatoires (Titre, Nom d'utilisateur, Mot de passe).");
      return;
    }
    if (formData.url && !isValidUrl(formData.url)) {
      toast.error("URL invalide (ex: https://exemple.com).");
      return;
    }
    try {
      setIsLoading(true);
      if (editingId) {
        await passwordService.updatePassword({
          id: editingId,
          title: formData.title,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          notes: formData.notes,
        });
        toast.success("Mot de passe mis à jour !");
      } else {
        await passwordService.createPassword({
          title: formData.title,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          notes: formData.notes,
        });
        toast.success("Mot de passe ajouté !");
      }
      await fetchPasswords();
      setPopUp(false);
      setFormData({ title: "", username: "", url: "", password: "", notes: "" });
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingId, isValidUrl, fetchPasswords]);

  const confirmDeletePassword = useCallback((id: string, title: string) => {
    setConfirmDelete({ id, title });
  }, []);

  const deletePassword = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        await passwordService.deletePassword(id);
        toast.success("Mot de passe supprimé.");
        await fetchPasswords();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Échec de la suppression.");
      } finally {
        setIsLoading(false);
        setConfirmDelete({ id: null, title: "" });
      }
    },
    [fetchPasswords]
  );

  const copyPassword = useCallback((password: string) => {
    navigator.clipboard.writeText(password).then(() => toast.success("Mot de passe copié !"));
  }, []);

  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Map(prev);
      next.set(id, !next.get(id));
      return next;
    });
  }, []);

  const openEditPopup = useCallback((password: PasswordEntry) => {
    setFormData({
      id: password.id,
      title: password.title,
      username: password.username,
      url: password.url || "",
      password: password.password,
      notes: password.notes,
    });
    setEditingId(password.id);
    setPopUp(true);
  }, []);

  const generatePassword = useCallback(() => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = password.length; i < 18; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    setFormData((prev) => ({ ...prev, password }));
  }, []);

  const getRandomColor = useCallback(
    (id: string) => {
      const index = parseInt(id, 10) % colorPalette.length;
      const safeIndex = Math.max(0, Math.min(index, colorPalette.length - 1));
      return colorPalette[safeIndex] ?? { lock: "text-gray-600", url: "text-gray-600", bg: "bg-gray-50" };
    },
    [colorPalette]
  );

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-indigo-50 to-blue-100">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10 safe-area-top border-b border-gray-100">
        <div className="container-mobile py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                <Lock className="text-indigo-600 flex-shrink-0" size={22} /> CodePass
              </h1>
              {user && <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>}
              {passwordOverdue && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileSettingsInitialTab("password");
                    setShowProfileSettings(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 active:scale-[0.98] transition-transform touch-target"
                  title="Changer votre mot de passe"
                >
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  Mot de passe &gt; 6 mois
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowProfileSettings(true)}
                className="touch-target min-h-[44px] bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                disabled={isLoading}
              >
                <User size={20} /> <span className="hidden sm:inline">Profil</span>
              </button>
              <button
                onClick={() => {
                  setFormData({ title: "", username: "", url: "", password: "", notes: "" });
                  setEditingId(null);
                  setPopUp(true);
                }}
                className="touch-target min-h-[44px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                disabled={isLoading}
              >
                <Plus size={20} /> <span className="hidden sm:inline">Nouveau</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                    toast.error("Erreur lors de la déconnexion");
                  }
                }}
                className="touch-target min-h-[44px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut size={20} /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-mobile py-4 pb-8 safe-area-bottom">
        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="relative bg-white rounded-xl shadow-sm border border-gray-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3.5 min-h-[48px] border-0 rounded-xl text-base"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-4xl mx-auto divide-y divide-gray-100 overflow-hidden">
          {paginatedPasswords.length > 0 ? (
            paginatedPasswords.map((item) => {
              const color = getRandomColor(item.id);
              return (
                <div key={item.id} className="p-4 sm:p-4 hover:bg-gray-50 active:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${color.bg}`}>
                        <Lock className={color.lock} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 truncate">
                          {item.title}
                          {item.notes && (
                            <span className="text-gray-400 flex-shrink-0" title={item.notes}>
                              <Info size={14} />
                            </span>
                          )}
                        </h3>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${color.url} text-sm flex items-center gap-1 truncate`}
                          >
                            <Globe size={14} className="flex-shrink-0" /> <span className="truncate">{getHostname(item.url)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.username);
                          toast.success("Nom d'utilisateur copié !");
                        }}
                        className="flex items-center gap-2 py-2.5 px-2 text-sm text-gray-700 min-h-[44px] rounded-lg hover:bg-gray-100 active:bg-gray-200"
                      >
                        <Mail size={18} className="text-gray-500 flex-shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{item.username}</span>
                      </button>
                      <div className="relative flex-1 min-w-[120px] sm:min-w-[160px]">
                        <input
                          type={visiblePasswords.get(item.id) ? "text" : "password"}
                          value={item.password}
                          readOnly
                          className="w-full h-[44px] border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono bg-gray-50"
                        />
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 rounded-lg hover:bg-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          disabled={isLoading}
                          type="button"
                        >
                          {visiblePasswords.get(item.id) ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyPassword(item.password)} className="touch-target min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl active:scale-95" title="Copier">
                          <Copy size={20} />
                        </button>
                        <button onClick={() => openEditPopup(item)} className="touch-target min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl active:scale-95" title="Modifier">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => confirmDeletePassword(item.id, item.title)} className="touch-target min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl active:scale-95" title="Supprimer">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            !isLoading && (
              <div className="py-12 text-center">
                <Lock className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900">Aucun mot de passe</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Aucun résultat" : "Ajoutez un mot de passe pour commencer"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setPopUp(true)}
                    className="mt-4 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium touch-target"
                    disabled={isLoading}
                  >
                    <Plus size={20} /> Ajouter un mot de passe
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {filteredPasswords.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl mx-auto mt-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2.5 min-h-[44px] text-sm bg-white touch-target"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 touch-target"
                >
                  <ArrowLeft size={20} />
                </button>
                {getPaginationRange()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 touch-target"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {confirmDelete.id && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setConfirmDelete({ id: null, title: "" })} aria-hidden />
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full relative safe-area-bottom">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-red-50 text-red-600">
                <Trash2 size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Supprimer &quot;{confirmDelete.title}&quot; ?
              </h3>
              <p className="text-sm text-gray-600 text-center">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDelete({ id: null, title: "" })}
                  className="flex-1 min-h-[48px] py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 active:bg-gray-100 font-medium touch-target"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={() => deletePassword(confirmDelete.id!)}
                  className="flex-1 min-h-[48px] py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl text-white font-medium touch-target"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popUp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-gray-900/60 sm:bg-gray-100/90" onClick={() => !isLoading && setPopUp(false)} aria-hidden />
          <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl safe-area-bottom">
            <div className="sticky top-0 bg-white p-4 sm:p-5 border-b flex justify-between items-center gap-3 safe-area-top z-10">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {editingId ? "Modifier le mot de passe" : "Nouveau mot de passe"}
              </h3>
              <button type="button" onClick={() => !isLoading && setPopUp(false)} className="touch-target min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 flex-shrink-0" disabled={isLoading}>
                <X size={22} />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 pb-[env(safe-area-inset-bottom)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 min-h-[48px] text-base"
                  placeholder="Ex: Gmail, Facebook..."
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 min-h-[48px] text-base"
                  placeholder="nom_utilisateur"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL (optionnel)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 min-h-[48px] text-base"
                  placeholder="https://exemple.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 min-h-[48px] text-base"
                    placeholder="Mot de passe"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={generatePassword} className="flex-1 min-h-[48px] bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-medium touch-target" disabled={isLoading}>
                      <RefreshCw size={20} /> Générer
                    </button>
                    <button type="button" onClick={() => copyPassword(formData.password)} className="flex-1 min-h-[48px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-medium touch-target" disabled={isLoading}>
                      <Copy size={20} /> Copier
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base min-h-[100px]"
                  rows={3}
                  placeholder="Notes..."
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => !isLoading && setPopUp(false)} className="min-h-[48px] px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 active:bg-gray-100 font-medium touch-target" disabled={isLoading}>
                  Annuler
                </button>
                <button type="button" onClick={handleSubmit} className="min-h-[48px] px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl flex items-center gap-2 font-medium touch-target" disabled={isLoading}>
                  {isLoading ? "..." : editingId ? "Mettre à jour" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileSettings && (
        <ProfileSettings
          initialTab={profileSettingsInitialTab}
          onClose={() => {
            setShowProfileSettings(false);
            setProfileSettingsInitialTab("email");
            fetchProfile();
          }}
        />
      )}

      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} />
    </div>
  );
};

export default Accueil;
