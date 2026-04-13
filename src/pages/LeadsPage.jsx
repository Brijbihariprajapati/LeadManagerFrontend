import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Providers';
import LeadsHubContent from '@/components/workspace/LeadsHubContent';

export default function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/public', { replace: true });
    }
  }, [user, navigate]);

  if (user === undefined) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page py-4">
        <p className="text-muted">Loading…</p>
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

  return <LeadsHubContent />;
}
