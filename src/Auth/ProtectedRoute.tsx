import { ReactElement } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./Context/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export default ProtectedRoute;
