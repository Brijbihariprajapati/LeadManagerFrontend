import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/components/Providers';
import CreateLeadForm from '@/components/CreateLeadForm';
import { LMS_USER_LEADS_REFRESH } from '@/lib/adminEvents';

export default function NewLeadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/public', { replace: true });
    }
  }, [user, navigate]);

  const onCreated = () => {
    window.dispatchEvent(new CustomEvent(LMS_USER_LEADS_REFRESH));
    navigate('/leads');
  };

  if (user === undefined) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page py-4">
        <p className="text-muted mb-0">Loading…</p>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page py-4">
        <p className="text-muted mb-0">Opening All leads…</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-user-dashboard py-3">
      <nav className="mb-3" aria-label="Back">
        <Link to="/leads" className="small lms-lead-detail__back d-inline-flex align-items-center gap-1">
          <span aria-hidden>←</span> Back to My leads
        </Link>
      </nav>
      <CreateLeadForm onCreated={onCreated} />
    </div>
  );
}
