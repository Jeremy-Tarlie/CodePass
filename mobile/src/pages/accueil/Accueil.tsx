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
import PasswordChangeReminderPopup from "../../components/PasswordChangeReminderPopup";
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

  const showPasswordReminder =
    profile !== null &&
    !showProfileSettings &&
    shouldShowPasswordReminder(profile.passwordChangedAt ?? null);

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
    range.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-300"}`}
      >
        1
      </button>
    );
    if (left > 2) range.push(<span key="l">...</span>);
    for (let i = left; i <= right; i++) {
      range.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm ${currentPage === i ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-300"}`}
        >
          {i}
        </button>
      );
    }
    if (right < totalPages - 1) range.push(<span key="r">...</span>);
    if (totalPages > 1) {
      range.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-300"}`}
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="text-indigo-600" /> CodePass
              </h1>
              {user && <p className="text-xs text-gray-500">{user.email}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfileSettings(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                disabled={isLoading}
              >
                <User size={18} /> Profil
              </button>
              <button
                onClick={() => {
                  setFormData({ title: "", username: "", url: "", password: "", notes: "" });
                  setEditingId(null);
                  setPopUp(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                disabled={isLoading}
              >
                <Plus size={18} /> Nouveau
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                    toast.error("Erreur lors de la déconnexion");
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 pb-8">
        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="relative bg-white rounded-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-6xl mx-auto divide-y divide-gray-100">
          {paginatedPasswords.length > 0 ? (
            paginatedPasswords.map((item) => {
              const color = getRandomColor(item.id);
              return (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${color.bg}`}>
                        <Lock className={color.lock} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {item.title}
                          {item.notes && (
                            <span className="text-gray-400" title={item.notes}>
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
                            <Globe size={14} /> {getHostname(item.url)}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.username);
                          toast.success("Nom d'utilisateur copié !");
                        }}
                        className="flex items-center gap-2 py-2 text-sm text-gray-700"
                      >
                        <Mail size={16} className="text-gray-500" />
                        <span className="truncate max-w-[120px]">{item.username}</span>
                      </button>
                      <div className="relative flex-1 min-w-[140px]">
                        <input
                          type={visiblePasswords.get(item.id) ? "text" : "password"}
                          value={item.password}
                          readOnly
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50"
                        />
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          disabled={isLoading}
                        >
                          {visiblePasswords.get(item.id) ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyPassword(item.password)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Copier">
                          <Copy size={18} />
                        </button>
                        <button onClick={() => openEditPopup(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => confirmDeletePassword(item.id, item.title)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 size={18} />
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
                    className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                    disabled={isLoading}
                  >
                    <Plus size={16} className="mr-2" /> Ajouter un mot de passe
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {filteredPasswords.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto mt-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
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
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                </button>
                {getPaginationRange()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 disabled:opacity-50"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {confirmDelete.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setConfirmDelete({ id: null, title: "" })} />
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-red-50 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Supprimer &quot;{confirmDelete.title}&quot; ?
              </h3>
              <p className="text-sm text-gray-600 text-center">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDelete({ id: null, title: "" })}
                  className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={() => deletePassword(confirmDelete.id!)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-gray-100/90" onClick={() => !isLoading && setPopUp(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Modifier le mot de passe" : "Nouveau mot de passe"}
              </h3>
              <button type="button" onClick={() => !isLoading && setPopUp(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100" disabled={isLoading}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: Gmail, Facebook..."
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="nom_utilisateur"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (optionnel)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://exemple.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="flex-1 min-w-[120px] border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Mot de passe"
                    disabled={isLoading}
                  />
                  <button type="button" onClick={generatePassword} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2" disabled={isLoading}>
                    <RefreshCw size={18} /> Générer
                  </button>
                  <button type="button" onClick={() => copyPassword(formData.password)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2" disabled={isLoading}>
                    <Copy size={18} /> Copier
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes..."
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => !isLoading && setPopUp(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" disabled={isLoading}>
                  Annuler
                </button>
                <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center gap-2" disabled={isLoading}>
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

      {showPasswordReminder && (
        <PasswordChangeReminderPopup
          onOpenSettings={() => setShowProfileSettings(true)}
          onOpenPasswordTab={() => {
            setProfileSettingsInitialTab("password");
            setShowProfileSettings(true);
          }}
        />
      )}

      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} />
    </div>
  );
};

export default Accueil;
