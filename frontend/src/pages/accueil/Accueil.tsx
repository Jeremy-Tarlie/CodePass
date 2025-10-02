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
} from "lucide-react";

type PasswordForm = {
  id?: string;
  title: string;
  email: string;
  url?: string;
  password: string;
  description: string;
};

const Accueil = () => {
  const colorPalette = [
    { lock: "text-indigo-600", url: "text-indigo-600", bg: "bg-indigo-50" },
    { lock: "text-blue-600", url: "text-blue-600", bg: "bg-blue-50" },
    { lock: "text-green-600", url: "text-green-600", bg: "bg-green-50" },
    { lock: "text-purple-600", url: "text-purple-600", bg: "bg-purple-50" },
    { lock: "text-teal-600", url: "text-teal-600", bg: "bg-teal-50" },
    { lock: "text-amber-600", url: "text-amber-600", bg: "bg-amber-50" },
    { lock: "text-fuchsia-600", url: "text-fuchsia-600", bg: "bg-fuchsia-50" },
    { lock: "text-rose-600", url: "text-rose-600", bg: "bg-rose-50" },
  ];

  const [popUp, setPopUp] = useState<boolean>(false);
  const [passwords, setPasswords] = useState<PasswordForm[]>([]);

  // Initialize informations from database

  // MODIFIER ICI
  useEffect(() => {
    // Récupérer dans la database les mots de passe
    setPasswords([
      {
        id: "1",
        title: "Gmail",
        email: "user@gmail.com",
        url: "https://gmail.com",
        password: "MyP@ssw0rd123!",
        description: "Mon compte email principal",
      },
      {
        id: "2",
        title: "GitHub",
        email: "dev@github.com",
        password: "Gh@Secur3Pass456",
        description: "",
      },
      {
        id: "3",
        title: "Facebook",
        email: "me@facebook.com",
        url: "https://facebook.com",
        password: "Fb!Conn3ct2024",
        description: "Profil personnel",
      },
      {
        id: "4",
        title: "Twitter",
        email: "tweet@twitter.com",
        url: "https://twitter.com",
        password: "Tw1tt3r#Feed89",
        description: "Compte de micro-blogging",
      },
      {
        id: "5",
        title: "LinkedIn",
        email: "pro@linkedin.com",
        url: "https://linkedin.com",
        password: "Lnkd!NProf33",
        description: "Réseau pro",
      },
      {
        id: "6",
        title: "Dropbox",
        email: "files@dropbox.com",
        url: "https://dropbox.com",
        password: "Dr0pB0x_Sync!!",
        description: "Stockage fichiers",
      },
      {
        id: "7",
        title: "Slack",
        email: "work@slack.com",
        url: "https://slack.com",
        password: "Sl@ck-Work2022",
        description: "Workspace principal",
      },
      {
        id: "8",
        title: "Spotify",
        email: "music@spotify.com",
        url: "https://spotify.com",
        password: "Sp0t!fyTune77",
        description: "Streaming musique",
      },
      {
        id: "9",
        title: "Netflix",
        email: "family@netflix.com",
        url: "https://netflix.com",
        password: "N3tfl!xBinge9",
        description: "Compte famille",
      },
      {
        id: "10",
        title: "Amazon",
        email: "shop@amazon.com",
        url: "https://amazon.com",
        password: "Am@z0nShop#55",
        description: "Boutique en ligne",
      },
      {
        id: "11",
        title: "Twitch",
        email: "gaming@twitch.com",
        url: "https://twitch.com",
        password: "Tw!tchGaming!!",
        description: "Streaming jeux",
      },
    ]);
  }, []);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [formData, setFormData] = useState<PasswordForm>({
    title: "",
    email: "",
    url: "",
    password: "",
    description: "",
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

  const filteredPasswords = useMemo(() => {
    return passwords.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        className={`px-3 py-1 rounded-md text-sm ${
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
          className={`px-3 py-1 rounded-md text-sm ${
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
          className={`px-3 py-1 rounded-md text-sm ${
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

  const isValidEmail = useCallback((email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

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
    if (!formData.title || !formData.email || !formData.password) {
      toast.error(
        "Veuillez remplir les champs obligatoires (Titre, Email, Mot de passe)."
      );
      return;
    }
    if (formData.url && !isValidUrl(formData.url)) {
      toast.error("Veuillez entrer une URL valide (ex: https://exemple.com).");
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error("Veuillez entrer un email valide.");
      return;
    }
    try {
      // MODIFIER ICI POUR AJOUTER L'AJOUT EN BDD ET GERER L'ERREUR
      setIsLoading(true);
      const newPassword = {
        ...formData,
        id: editingId || Date.now().toString(),
      };
      setPasswords((prev) =>
        editingId
          ? prev.map((p) => (p.id === editingId ? newPassword : p))
          : [...prev, newPassword]
      );
      toast.success(
        `Mot de passe ${editingId ? "mis à jour" : "ajouté"} avec succès !`
      );
      setPopUp(false);
      setFormData({
        title: "",
        email: "",
        url: "",
        password: "",
        description: "",
      });
      setEditingId(null);
    } catch (error) {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingId]);

  const confirmDeletePassword = useCallback((id: string, title: string) => {
    setConfirmDelete({ id, title });
  }, []);

  const deletePassword = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      // MODIFIER ICI POUR SUPPRIMER EN BDD LE SITE
      setPasswords((prev) => prev.filter((p) => p.id !== id));
      toast.success("Mot de passe supprimé.");
    } catch (error) {
      toast.error("Échec de la suppression.");
    } finally {
      setIsLoading(false);
      setConfirmDelete({ id: null, title: "" });
    }
  }, []);

  const copyPassword = useCallback((password: string) => {
    navigator.clipboard
      .writeText(password)
      .then(() => toast.success("Mot de passe copié !"));
  }, []);

  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openEditPopup = useCallback((password: PasswordForm) => {
    setFormData({ ...password });
    setEditingId(password.id!);
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
    const index = parseInt(id) % colorPalette.length;
    return colorPalette[index];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="text-indigo-600" /> CodePath
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestionnaire de mots de passe sécurisé
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  title: "",
                  email: "",
                  url: "",
                  password: "",
                  description: "",
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
              placeholder="Rechercher un site, un email ou un mot de passe..."
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
                  const color = getRandomColor(item.id!);
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
                              {item.description && (
                                <span
                                  className="text-gray-400 hover:text-gray-600 cursor-help"
                                  title={item.description}
                                >
                                  <Info
                                    size={16}
                                    aria-label="Description disponible"
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
                          {/* Email cliquable pour copier */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.email);
                              toast.success("Email copié !");
                            }}
                            className="flex items-center md:min-w-[180px] sm:min-w-[10px] max-w-[180px] gap-2 sm:mr-4 md:mr-0 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Copier l'email"
                            disabled={isLoading}
                          >
                            <Mail
                              className="text-gray-500 flex-shrink-0"
                              size={16}
                            />
                            <span className="text-sm text-gray-700 truncate text-left  md:block sm:hidden">
                              {item.email}
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Copier le mot de passe"
                              disabled={isLoading}
                              aria-label="Copier le mot de passe"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              onClick={() => openEditPopup(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed"
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
                  className="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed"
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
            className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900 opacity-50"
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
            className="absolute top-0 left-0 right-0 bottom-0 inset-0 bg-gray-100 opacity-90"
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
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="votre@email.com"
                    disabled={isLoading}
                    aria-label="Email associé"
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
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Notes ou informations supplémentaires..."
                    disabled={isLoading}
                    aria-label="Description du mot de passe"
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
