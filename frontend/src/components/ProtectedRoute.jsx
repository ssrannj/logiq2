import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roleRequired }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in
    return <Navigate to="/auth" />;
  }

  if (roleRequired && user.role !== roleRequired) {
    // Insufficient permissions
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
