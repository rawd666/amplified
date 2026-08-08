import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

/** Keeps unauthenticated visitors out of /admin/* and remembers where they wanted to go. */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { admin, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="empty">Checking your session…</div>;
  if (!admin) return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
