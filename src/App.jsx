import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/components/Providers';
import AdminAppShell from '@/components/layout/AdminAppShell';
import UserAppShell from '@/components/layout/UserAppShell';
import LeadsRoleShell from '@/components/layout/LeadsRoleShell';
import LoginPage from '@/pages/LoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import AdminTeamPage from '@/pages/AdminTeamPage';
import AdminTeamMemberPage from '@/pages/AdminTeamMemberPage';
import UserDashboardPage from '@/pages/UserDashboardPage';
import UserAnalyticsPage from '@/pages/UserAnalyticsPage';
import LeadsPage from '@/pages/LeadsPage';
import NewLeadPage from '@/pages/NewLeadPage';
import LeadDetailPage from '@/pages/LeadDetailPage';
import LeadProposalPreviewPage from '@/pages/LeadProposalPreviewPage';
import PublicLeadsPage from '@/pages/PublicLeadsPage';
import PublicLeadPage from '@/pages/PublicLeadPage';
import NotFoundPage from '@/pages/NotFoundPage';

function AuthLoading() {
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
}

function RequireAuth() {
  const { user } = useAuth();
  if (user === undefined) return <AuthLoading />;
  if (user === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useAuth();
  if (user.role !== 'admin') return <Navigate to="/user" replace />;
  return <Outlet />;
}

function RequireUserRole() {
  const { user } = useAuth();
  if (user.role !== 'user') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function LoginGate() {
  const { user } = useAuth();
  if (user === undefined) return <AuthLoading />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
  return <LoginPage />;
}

function RootRedirect() {
  const { user } = useAuth();
  if (user === undefined) return <AuthLoading />;
  if (user === null) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGate />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<RequireAuth />}>
        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminAppShell />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="team/:userId" element={<AdminTeamMemberPage />} />
          </Route>
        </Route>

        <Route path="user" element={<RequireUserRole />}>
          <Route element={<UserAppShell />}>
            <Route index element={<UserDashboardPage />} />
            <Route path="analytics" element={<UserAnalyticsPage />} />
          </Route>
        </Route>

        <Route element={<LeadsRoleShell />}>
          <Route path="leads/new" element={<NewLeadPage />} />
          <Route path="leads/:id/proposal/preview" element={<LeadProposalPreviewPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="public/:id" element={<PublicLeadPage />} />
          <Route path="public" element={<PublicLeadsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
