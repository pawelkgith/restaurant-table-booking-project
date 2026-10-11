import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { client, token } = useAuth();

  if(!client || !token) {
    return <Navigate to="/login" replace />
  }
  return children;
}

