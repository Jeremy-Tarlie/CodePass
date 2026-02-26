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
import { passwordService, PasswordEntry, CreatePasswordData, UpdatePasswordData } from "../../services/passwordService";
import { profileService, UserProfile } from "../../services/profileService";
import ProfileSettings from "../../components/ProfileSettings";
import PasswordChangeReminderPopup, { shouldShowPasswordReminder } from "../../components/PasswordChangeReminderPopup";
import UpdateNotification from "../../components/UpdateNotification";

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
  
  const colorPalette = useMemo(() => [
    { lock: "text-indigo-600", url: "text-indigo-600", bg: "bg-indigo-50" },
    { lock: "text-blue-600", url: "text-blue-600", bg: "bg-blue-50" },
    { lock: "text-green-600", url: "text-green-600", bg: "bg-green-50" },
    { lock: "text-purple-600", url: "text-purple-600", bg: "bg-purple-50" },
    { lock: "text-teal-600", url: "text-teal-600", bg: "bg-teal-50" },
    { lock: "text-amber-600", url: "text-amber-600", bg: "bg-amber-50" },
    { lock: "text-fuchsia-600", url: "text-fuchsia-600", bg: "bg-fuchsia-50" },
    { lock: "text-rose-600", url: "text-rose-600", bg: "bg-rose-50" },
  ], []);

  const [popUp, setPopUp] = useState<boolean>(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);

  // Récupérer les mots de passe depuis la base de données
  const fetchPasswords = useCallback(async () => {
    try {
      setIsLoading(true);
      const passwordsData = await passwordService.getAllPasswords();
      setPasswords(passwordsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des mots de passe:', error);
      toast.error('Erreur lors du chargement des mots de passe');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [formData, setFormData] = useState<PasswordForm>({
    title: "",
    username: "",
    url: "",
    password: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string | null;
    title: string;
  }>({
    id: null,
    title: "",
  });
  const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileSettingsInitialTab, setProfileSettingsInitialTab] = useState<'email' | 'password'>('email');

  const fetchProfile = useCallback(async () => {
    try {
      const p = await profileService.getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showPasswordReminder =
    profile !== null &&
    !showProfileSettings &&
    shouldShowPasswordReminder(profile.passwordChangedAt ?? null);

  const filteredPasswords = useMemo(() => {
    return passwords.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.url && p.url.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [passwords, searchTerm]);

  const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);

  const getPaginationRange = useCallback(() => {
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    const range = [];
    const addEllipsis = (key: string) => range.push(<span key={key}>...</span>);
    range.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
          currentPage === 1
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-300"
        }`}
        aria-label="Page 1"
      >
        1
      </button>
    );
    if (left > 2) addEllipsis("left");
    for (let i = left; i <= right; i++) {
      range.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
            currentPage === i
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-300"
          }`}
          aria-label={`Page ${i}`}
        >
          {i}
        </button>
      );
    }
    if (right < totalPages - 1) addEllipsis("right");
    if (totalPages > 1) {
      range.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
            currentPage === totalPages
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-300"
          }`}
          aria-label={`Page ${totalPages}`}
        >
          {totalPages}
        </button>
      );
    }
    return range;
  }, [currentPage, totalPages]);

  const paginatedPasswords = useMemo(() => {
    return filteredPasswords.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPasswords, currentPage, itemsPerPage]);


  const isValidUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // MODIFIER ICI

  const handleSubmit = useCallback(async () => {
    if (!formData.title || !formData.username || !formData.password) {
      toast.error(
        "Veuillez remplir les champs obligatoires (Titre, Nom d'utilisateur, Mot de passe)."
      );
      return;
    }
    if (formData.url && !isValidUrl(formData.url)) {
      toast.error("Veuillez entrer une URL valide (ex: https://exemple.com).");
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (editingId) {
        // Mise à jour d'un mot de passe existant
        const updateData: UpdatePasswordData = {
          id: editingId,
          title: formData.title,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          notes: formData.notes,
        };
        
        await passwordService.updatePassword(updateData);
        toast.success("Mot de passe mis à jour avec succès !");
      } else {
        // Création d'un nouveau mot de passe
        const createData: CreatePasswordData = {
          title: formData.title,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          notes: formData.notes,
        };
        
        await passwordService.createPassword(createData);
        toast.success("Mot de passe ajouté avec succès !");
      }
      
      // Recharger la liste des mots de passe
      await fetchPasswords();
      
      setPopUp(false);
      setFormData({
        title: "",
        username: "",
        url: "",
        password: "",
        notes: "",
      });
      setEditingId(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingId, isValidUrl, fetchPasswords]);

  const confirmDeletePassword = useCallback((id: string, title: string) => {
    setConfirmDelete({ id, title });
  }, []);

  const deletePassword = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await passwordService.deletePassword(id);
      toast.success("Mot de passe supprimé avec succès.");
      // Recharger la liste des mots de passe
      await fetchPasswords();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error instanceof Error ? error.message : "Échec de la suppression.");
    } finally {
      setIsLoading(false);
      setConfirmDelete({ id: null, title: "" });
    }
  }, [fetchPasswords]);

  const copyPassword = useCallback((password: string) => {
    navigator.clipboard
      .writeText(password)
      .then(() => toast.success("Mot de passe copié !"));
  }, []);

  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const getRandomColor = useCallback((id: string) => {
    if (!id || colorPalette.length === 0) {
      // Retourner une couleur par défaut si l'ID est invalide ou si la palette est vide
      return { lock: "text-gray-600", url: "text-gray-600", bg: "bg-gray-50" };
    }
    const index = parseInt(id) % colorPalette.length;
    return colorPalette[index];
  }, [colorPalette]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="text-indigo-600" /> CodePass
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestionnaire de mots de passe sécurisé
              </p>
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  Connecté en tant que: {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileSettings(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                disabled={isLoading}
                aria-label="Paramètres du profil"
              >
                <User size={18} /> Profil
              </button>
              <button
                onClick={() => {
                  setFormData({
                    title: "",
                    username: "",
                    url: "",
                    password: "",
                    notes: "",
                  });
                  setEditingId(null);
                  setPopUp(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                disabled={isLoading}
                aria-label="Ajouter un nouveau mot de passe"
              >
                <Plus size={18} /> Nouveau mot de passe
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                    toast.error('Erreur lors de la déconnexion');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                aria-label="Se déconnecter"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-4xl mb-6">
          <div className="relative bg-white rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un site, un nom d'utilisateur ou un mot de passe..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-1 focus:outline-none transition-all duration-200"
              disabled={isLoading}
              aria-label="Rechercher un mot de passe"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-6xl mx-auto mb-6">
          <div className="divide-y divide-gray-100">
            {paginatedPasswords.length > 0
              ? paginatedPasswords.map((item) => {
                  const color = getRandomColor(item.id!) || { lock: "text-gray-600", url: "text-gray-600", bg: "bg-gray-50" };
                  return (
                    <div
                      key={item.id}
                      className="p-5 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${color.bg}`}>
                            <Lock className={color.lock} size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                              {item.title}
                              {item.notes && (
                                <span
                                  className="text-gray-400 hover:text-gray-600 cursor-help"
                                  title={item.notes}
                                >
                                  <Info
                                    size={16}
                                    aria-label="Notes disponibles"
                                  />
                                </span>
                              )}
                            </h3>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${color.url} hover:underline text-sm flex items-center gap-1`}
                              >
                                <Globe size={14} aria-hidden="true" />{" "}
                                {new URL(item.url).hostname}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ">
                          {/* Nom d'utilisateur cliquable pour copier */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.username);
                              toast.success("Nom d'utilisateur copié !");
                            }}
                            className="flex items-center md:min-w-[180px] sm:min-w-[10px] max-w-[180px] gap-2 sm:mr-4 md:mr-0 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            title="Copier le nom d'utilisateur"
                            disabled={isLoading}
                          >
                            <Mail
                              className="text-gray-500 flex-shrink-0"
                              size={16}
                            />
                            <span className="text-sm text-gray-700 truncate text-left  md:block sm:hidden">
                              {item.username}
                            </span>
                          </button>

                          {/* Mot de passe */}
                          <div className="relative flex-1 min-w-[200px]">
                            <input
                              type={
                                visiblePasswords[item.id!] ? "text" : "password"
                              }
                              value={item.password}
                              readOnly
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 w-full"
                              aria-label={`Mot de passe pour ${item.title}`}
                            />
                            <button
                              onClick={() => togglePasswordVisibility(item.id!)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                              disabled={isLoading}
                              aria-label={
                                visiblePasswords[item.id!]
                                  ? "Masquer le mot de passe"
                                  : "Afficher le mot de passe"
                              }
                            >
                              {visiblePasswords[item.id!] ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>

                          {/* Actions pour le mot de passe */}
                          <div className="flex gap-1 sm:ml-2">
                            <button
                              onClick={() => copyPassword(item.password)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              title="Copier le mot de passe"
                              disabled={isLoading}
                              aria-label="Copier le mot de passe"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              onClick={() => openEditPopup(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier le mot de passe"
                              disabled={isLoading}
                              aria-label="Modifier le mot de passe"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                confirmDeletePassword(item.id!, item.title)
                              }
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer le mot de passe"
                              disabled={isLoading}
                              aria-label="Supprimer le mot de passe"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : !isLoading && (
                  <div className="py-12 text-center">
                    <Lock
                      className="mx-auto text-gray-300 mb-4"
                      size={48}
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium text-gray-900">
                      Aucun mot de passe trouvé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? "Aucun résultat pour votre recherche"
                        : "Commencez par ajouter un mot de passe"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setPopUp(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isLoading}
                        aria-label="Ajouter un mot de passe"
                      >
                        <Plus size={16} className="mr-2" aria-hidden="true" />{" "}
                        Ajouter un mot de passe
                      </button>
                    )}
                  </div>
                )}
          </div>
        </div>

        {filteredPasswords.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                aria-label="Nombre d'éléments par page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">éléments par page</span>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Page précédente"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                {getPaginationRange()}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Page suivante"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {confirmDelete.id && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center">
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900 opacity-50 cursor-pointer"
            onClick={() => setConfirmDelete({ id: null, title: "" })}
          />
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 fixed">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-red-50 text-red-600">
                <Trash2 size={24} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Supprimer "{confirmDelete.title}" ?
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Cette action est irréversible. Le mot de passe sera
                définitivement supprimé.
              </p>
              <div className="flex gap-3 mt-4 w-full">
                <button
                  onClick={() => setConfirmDelete({ id: null, title: "" })}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={() => deletePassword(confirmDelete.id!)}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium text-white focus:outline-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-4 w-4 mx-auto text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    "Supprimer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popUp && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center">
          <div
            className="absolute top-0 left-0 right-0 bottom-0 inset-0 bg-gray-100 opacity-90 cursor-pointer"
            onClick={() => !isLoading && setPopUp(false)}
          />
          <div className="relative mx-auto max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <div className="flex items-start justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Modifier le mot de passe" : "Nouveau site"}
              </h3>
              <button
                type="button"
                onClick={() => !isLoading && setPopUp(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 cursor-pointer"
                disabled={isLoading}
                aria-label="Fermer la fenêtre"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ex: Gmail, Facebook..."
                    disabled={isLoading}
                    aria-label="Titre du site"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="nom_utilisateur"
                    disabled={isLoading}
                    aria-label="Nom d'utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL (optionnelle)
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, url: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://exemple.com"
                    disabled={isLoading}
                    aria-label="URL du site"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Votre mot de passe"
                      disabled={isLoading}
                      aria-label="Mot de passe"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 whitespace-nowrap"
                      disabled={isLoading}
                      aria-label="Générer un mot de passe aléatoire"
                    >
                      <RefreshCw size={18} aria-hidden="true" /> Générer
                    </button>
                    <button
                      type="button"
                      onClick={() => copyPassword(formData.password)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 whitespace-nowrap"
                      disabled={isLoading}
                      aria-label="Copier le mot de passe généré"
                    >
                      <Copy size={18} aria-hidden="true" /> Copier
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Le générateur crée un mot de passe de 18 caractères avec
                    majuscules, minuscules, chiffres et symboles
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnelles)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Notes ou informations supplémentaires..."
                    disabled={isLoading}
                    aria-label="Notes du mot de passe"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 p-4 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => !isLoading && setPopUp(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                  aria-label="Annuler"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2"
                  disabled={isLoading}
                  aria-label={
                    editingId
                      ? "Mettre à jour le mot de passe"
                      : "Enregistrer le mot de passe"
                  }
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      En cours...
                    </>
                  ) : editingId ? (
                    "Mettre à jour"
                  ) : (
                    "Enregistrer"
                  )}
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
            setProfileSettingsInitialTab('email');
            fetchProfile();
          }}
        />
      )}

      {showPasswordReminder && (
        <PasswordChangeReminderPopup
          onOpenSettings={() => setShowProfileSettings(true)}
          onOpenPasswordTab={() => {
            setProfileSettingsInitialTab('password');
            setShowProfileSettings(true);
          }}
        />
      )}

      <UpdateNotification />

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        closeButton={true}
      />
    </div>
  );
};

export default Accueil;
