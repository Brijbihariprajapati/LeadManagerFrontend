import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import SummaryCards from '@/components/SummaryCards';
import { interestBadgeClass, pipelineBadgeClass } from '@/utils/status';
import { formatLeadDateTime } from '@/utils/dateFormat';
import LeadSourceFilterSelect from '@/components/leads/LeadSourceFilterSelect';
import TeamUserSettingsForm from '@/components/admin/TeamUserSettingsForm';
import { useAuth } from '@/components/Providers';
import { LMS_ADMIN_USERS_CHANGED } from '@/lib/adminEvents';
import { safeLeadsArray, safePagination, safeSummary, safeUserRecord } from '@/lib/apiSafe';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Leads' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

export default function TeamUserDetail() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const userId = params.userId;
  const isSelf = authUser?.id && String(authUser.id) === String(userId);

  const tab = searchParams.get('tab') || 'overview';
  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'overview') next.delete('tab');
    else next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [page, setPage] = useState(1);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const data = await api.getUser(userId);
      setUser(safeUserRecord(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'User not found');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await api.getUserLeadSummary(userId);
      setSummary(safeSummary(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load analytics');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [userId]);

  const loadLeads = useCallback(
    async (p = 1) => {
      setLoadingLeads(true);
      try {
        const data = await api.getLeadsByUser(userId, {
          page: p,
          limit: 15,
          source: sourceFilter || undefined,
        });
        setLeads(safeLeadsArray(data));
        const pag = safePagination(data, 15);
        setPagination(pag);
        setPage(pag.page);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not load leads');
        setLeads([]);
      } finally {
        setLoadingLeads(false);
      }
    },
    [userId, sourceFilter]
  );

  useEffect(() => {
    void loadUser();
    void loadSummary();
  }, [loadUser, loadSummary]);

  const onDeactivate = async () => {
    if (!confirm('Deactivate this user? They will not be able to sign in until reactivated.')) return;
    setStatusBusy(true);
    try {
      await api.deactivateUser(userId);
      toast.success('User deactivated');
      await loadUser();
      window.dispatchEvent(new CustomEvent(LMS_ADMIN_USERS_CHANGED));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setStatusBusy(false);
    }
  };

  const onActivate = async () => {
    setStatusBusy(true);
    try {
      await api.activateUser(userId);
      toast.success('User activated');
      await loadUser();
      window.dispatchEvent(new CustomEvent(LMS_ADMIN_USERS_CHANGED));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setStatusBusy(false);
    }
  };

  useEffect(() => {
    if (tab === 'leads') void loadLeads(page);
  }, [tab, page, loadLeads]);

  if (loadingUser && !user) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page py-4">
        <p className="text-muted mb-0">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page py-4">
        <p className="text-muted mb-3">User not found.</p>
        <Link to="/admin/team" className="lms-lead-detail__back">
          ← Back to team
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-admin-team-user py-3">
      <nav className="mb-3">
        <Link to="/admin/team" className="small lms-lead-detail__back d-inline-flex align-items-center gap-1">
          <span aria-hidden>←</span> Team management
        </Link>
      </nav>

      <header className="lms-admin-team-user__hero mb-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div className="min-w-0">
            <p className="small text-uppercase fw-bold text-secondary mb-1 lms-admin-team-user__eyebrow">
              Team member
            </p>
            <h1 className="h4 mb-2 text-break">{user.name}</h1>
            <p className="text-muted small mb-2 text-break">{user.email}</p>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="lms-detail-chip text-uppercase" style={{ fontSize: '0.72rem' }}>
                {user.role}
              </span>
              {user.isActive ? (
                <span className="lms-pill lms-pill--interested">Active</span>
              ) : (
                <span className="lms-pill lms-pill--pending">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="lms-admin-team-user__tabs nav nav-pills gap-2 mb-4 flex-wrap" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`nav-link lms-admin-team-user__tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'leads') setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <section className="lms-admin-team-user__panel" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="h6 fw-bold mb-3">
            Profile
          </h2>
          <div className="card lms-card border-secondary">
            <div className="card-body">
              <dl className="row mb-0 small">
                <dt className="col-sm-3 text-muted">Name</dt>
                <dd className="col-sm-9">{user.name}</dd>
                <dt className="col-sm-3 text-muted">Email</dt>
                <dd className="col-sm-9 text-break">{user.email}</dd>
                <dt className="col-sm-3 text-muted">Role</dt>
                <dd className="col-sm-9 text-uppercase">{user.role}</dd>
                <dt className="col-sm-3 text-muted">Status</dt>
                <dd className="col-sm-9">{user.isActive ? 'Active' : 'Inactive'}</dd>
                <dt className="col-sm-3 text-muted">Joined</dt>
                <dd className="col-sm-9 text-muted">
                  {user.createdAt ? formatLeadDateTime(user.createdAt) : '—'}
                </dd>
              </dl>
            </div>
          </div>
          <p className="text-muted small mt-3 mb-0">
            Open the <strong>Leads</strong> tab to see every lead they created, <strong>Analytics</strong> for
            funnel counts, or <strong>Settings</strong> to edit their account.
          </p>
        </section>
      )}

      {tab === 'settings' && (
        <section aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="h6 fw-bold mb-3">
            Account settings
          </h2>
          <div className="card lms-card border-secondary">
            <div className="card-body">
              <TeamUserSettingsForm
                user={user}
                userId={userId}
                onSaved={(u) => setUser(u)}
              />
            </div>
          </div>

          {user.role === 'user' && (
            <div className="card lms-card border-secondary mt-3">
              <div className="card-body">
                <h3 className="h6 fw-bold mb-2">Account access</h3>
                <p className="text-muted small mb-3">
                  Deactivated users cannot log in. You can turn access back on anytime with Activate.
                </p>
                {isSelf ? (
                  <p className="small text-warning mb-0">
                    You cannot deactivate your own account from this screen.
                  </p>
                ) : user.isActive ? (
                  <button
                    type="button"
                    className="btn btn-outline-warning rounded-pill px-4"
                    disabled={statusBusy}
                    onClick={onDeactivate}
                  >
                    {statusBusy ? 'Working…' : 'Deactivate user'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-success rounded-pill px-4"
                    disabled={statusBusy}
                    onClick={onActivate}
                  >
                    {statusBusy ? 'Working…' : 'Activate user'}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'analytics' && (
        <section aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" className="h6 fw-bold mb-3">
            Lead analytics
          </h2>
          <p className="text-muted small mb-3">
            Counts include only leads created by <strong>{user.name}</strong>.
          </p>
          <SummaryCards summary={summary} loading={loadingSummary} />
        </section>
      )}

      {tab === 'leads' && (
        <section aria-labelledby="leads-heading">
          <h2 id="leads-heading" className="h6 fw-bold mb-3">
            Leads created
          </h2>
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-5 col-lg-4">
              <LeadSourceFilterSelect
                value={sourceFilter}
                onChange={(v) => {
                  setSourceFilter(v);
                  setPage(1);
                }}
              />
            </div>
          </div>
          {loadingLeads && leads.length === 0 ? (
            <p className="text-muted">Loading…</p>
          ) : leads.length === 0 ? (
            <p className="text-muted">
              {sourceFilter ? 'No leads match this source filter.' : 'No leads yet for this user.'}
            </p>
          ) : (
            <>
              <div className="table-responsive lms-card border border-secondary rounded-3 lms-roster-table-wrap">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="lms-table-head">
                    <tr>
                      <th>Lead</th>
                      <th>Source</th>
                      <th>Interest</th>
                      <th>Pipeline</th>
                      <th>Proposal</th>
                      <th>Updated</th>
                      <th className="text-end">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const id = lead._id || lead.id;
                      return (
                        <tr key={id}>
                          <td className="fw-medium">{lead.name}</td>
                          <td className="small text-muted">
                            {lead.sourceName?.trim() ? lead.sourceName.trim() : '—'}
                          </td>
                          <td>
                            <span className={interestBadgeClass(lead.interest || 'Interested')}>
                              {lead.interest || 'Interested'}
                            </span>
                          </td>
                          <td>
                            <span className={pipelineBadgeClass(lead.pipeline || 'Pending')}>
                              {lead.pipeline || 'Pending'}
                            </span>
                          </td>
                          <td className="small text-nowrap">
                            {lead.hasProposal ? (
                              <span className="text-success">Proposal created</span>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td className="small text-muted text-nowrap">
                            {lead.updatedAt ? formatLeadDateTime(lead.updatedAt) : '—'}
                          </td>
                          <td className="text-end">
                            <Link to={`/leads/${id}`} className="btn btn-sm btn-outline-primary rounded-pill">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagination.pages > 1 && (
                <nav className="mt-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    Page {page} / {pagination.pages} ({pagination.total} leads)
                  </span>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={page <= 1 || loadingLeads}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={page >= pagination.pages || loadingLeads}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
