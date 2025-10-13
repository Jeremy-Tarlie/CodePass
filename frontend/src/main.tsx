import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Import tes pages
import Accueil from "./pages/accueil/Accueil";
import Connexion from "./pages/connexion/Connexion";
import ResetPassword from "./pages/reset-password/ResetPassword";
import NotFound from "./pages/not-found/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";
import UpdateNotification from "./components/UpdateNotification";
import { AuthProvider } from "./contexts/AuthContext";

const router = createHashRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Accueil />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/connexion",
    element: <Connexion />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <UpdateNotification />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
