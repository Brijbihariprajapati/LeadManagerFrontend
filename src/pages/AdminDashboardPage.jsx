import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import * as api from '@/services/api';
import SummaryCards from '@/components/SummaryCards';
import LeadCardsReadOnly from '@/components/LeadCardsReadOnly';
import { safeSummary } from '@/lib/apiSafe';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(safeSummary(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <main className="container-fluid px-3 px-xl-4 lms-page">
      <div className="lms-hero">
        <p className="small text-uppercase fw-bold text-secondary mb-1" style={{ letterSpacing: '0.12em' }}>
          Administration
        </p>
        <h1 className="h4 mb-2 fw-bold" style={{ letterSpacing: '-0.02em' }}>
          Admin dashboard
        </h1>
        <p className="text-muted small mb-0" style={{ maxWidth: '40rem' }}>
          Read-only lead insight on this page. Manage users from{' '}
          <Link to="/admin/team" className="link-light text-decoration-underline">
            Team management
          </Link>
          . Team members handle lead creation and updates.
        </p>
      </div>

      <SummaryCards summary={summary} loading={loading} />

      <h2 className="h5 mb-3 fw-bold" style={{ letterSpacing: '-0.01em' }}>
        Leads overview
      </h2>
      <p className="text-muted small mb-3">
        Cards show name, interest, email, and creator. Filters use the full lead record (including
        pipeline). Only users can create, edit, or delete leads.
      </p>
      <LeadCardsReadOnly />
    </main>
  );
}
