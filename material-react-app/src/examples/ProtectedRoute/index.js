import { Navigate, useLocation } from "react-router-dom";

const publicRoutes = ["/auth/reset-password", "/auth/forget-password",];

const ProtectedRoute = ({ isAuthenticated, redirectPath = "/auth/login", children }) => {
  const location = useLocation();

  // Autoriser l'accès à certaines routes publiques même si l'utilisateur n'est pas connecté
  if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
