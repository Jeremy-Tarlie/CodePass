import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-bold text-indigo-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Page non trouvée</h1>
        <p className="text-gray-600 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <Link to="/" className="w-full bg-white text-indigo-600 py-3 px-6 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2">
            <Home className="w-5 h-5" /> Accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
