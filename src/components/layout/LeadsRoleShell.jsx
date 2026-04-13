import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Providers';
import AdminAppShell from './AdminAppShell';
import UserAppShell from './UserAppShell';

/** Picks admin vs user shell for shared routes (`/leads`, `/public`). */
export default function LeadsRoleShell() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminAppShell />;
  }

  return <UserAppShell />;
}
