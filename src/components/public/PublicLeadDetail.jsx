import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import { useAuth } from '@/components/Providers';
import { interestBadgeClass, pipelineBadgeClass } from '@/utils/status';
import { formatLeadDateTime } from '@/utils/dateFormat';
import LeadCustomFieldsEditor from '@/components/leads/LeadCustomFieldsEditor';
import { safeLeadRecord } from '@/lib/apiSafe';

export default function PublicLeadDetail({ leadId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (user?.role === 'admin') {
      navigate(`/leads/${leadId}`, { replace: true });
    }
  }, [user, leadId, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPublicLead(leadId);
      setLead(safeLeadRecord(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load this lead');
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (user === undefined || user?.role === 'admin') return;
    void load();
  }, [load, user]);

  if (user === undefined || user?.role === 'admin') {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page lms-page--public py-4">
        <p className="text-muted mb-0">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page lms-page--public py-4">
        <p className="text-muted mb-0">Loading…</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page lms-page--public py-4">
        <p className="text-muted mb-3">Lead not found or no longer public.</p>
        <Link to="/public" className="lms-lead-detail__back">
          ← Back to public board
        </Link>
      </div>
    );
  }

  const isOwnLead =
    user?.role === 'user' &&
    lead.createdById != null &&
    String(user.id) === String(lead.createdById);

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-page--public lms-public-detail py-3">
      <nav className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <Link to="/public" className="small lms-lead-detail__back d-inline-flex align-items-center gap-1">
          <span aria-hidden>←</span> Back to public board
        </Link>
        {isOwnLead && (
          <Link to={`/leads/${leadId}`} className="btn btn-primary btn-sm">
            Edit lead
          </Link>
        )}
      </nav>

      <header className="lms-hero mb-3">
        <p className="small text-uppercase fw-bold text-secondary mb-2 lms-hero__eyebrow">Public lead</p>
        <h1 className="h4 mb-0">{lead.name}</h1>
      </header>

      {/* Status + key fields once; notes only in the Notes card below */}
      <div className="lms-public-header-data mb-4">
        <div className="lms-public-header-data__scroll" role="region" aria-label="Lead summary">
          <div className="lms-public-header-data__row">
            <div className="lms-public-header-data__cell">
              <span className="lms-public-header-data__label">Phone</span>
              <span className="lms-public-header-data__value text-break">{lead.phone?.trim() || '—'}</span>
            </div>
            <div className="lms-public-header-data__cell">
              <span className="lms-public-header-data__label">Source</span>
              <span className="lms-public-header-data__value text-break">
                {lead.sourceName?.trim() ? lead.sourceName.trim() : '—'}
              </span>
            </div>
            <div className="lms-public-header-data__cell">
              <span className="lms-public-header-data__label">Interest</span>
              <span className="lms-public-header-data__value">
                <span className={interestBadgeClass(lead.interest || 'Interested')}>
                  {lead.interest || 'Interested'}
                </span>
              </span>
            </div>
            <div className="lms-public-header-data__cell lms-public-header-data__cell--wide">
              <span className="lms-public-header-data__label">Deal stage</span>
              <span className="lms-public-header-data__value">
                <span className={pipelineBadgeClass(lead.pipeline || 'Pending')}>
                  {lead.pipeline || 'Pending'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-lg-4 lms-public-detail-panels">
        <div className="col-lg-6">
          <div className="card lms-create-card lms-public-panel h-100">
            <div className="card-header fw-semibold py-3">Contact</div>
            <div className="card-body pt-3">
              <dl className="lms-public-panel-dl mb-0">
                <dt>Email</dt>
                <dd className="text-break">{lead.email?.trim() || '—'}</dd>
                <dt>Added by</dt>
                <dd className="text-break">{lead.createdByName || '—'}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card lms-create-card lms-public-panel h-100">
            <div className="card-header fw-semibold py-3">Activity</div>
            <div className="card-body pt-3">
              <dl className="lms-public-panel-dl mb-0">
                <dt>Created</dt>
                <dd className="lms-public-panel-dl__value-mono">
                  {lead.createdAt ? formatLeadDateTime(lead.createdAt) : '—'}
                </dd>
                <dt>Last updated</dt>
                <dd className="lms-public-panel-dl__value-mono">
                  {lead.updatedAt ? formatLeadDateTime(lead.updatedAt) : '—'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="col-12" id="public-notes">
          <div className="card lms-create-card lms-public-panel">
            <div className="card-header fw-semibold py-3">Notes</div>
            <div className="card-body pt-3">
              <div className="lms-public-notes-full text-break">
                {lead.notes?.trim() ? (
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {lead.notes}
                  </p>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {Array.isArray(lead.customFields) && lead.customFields.length > 0 && (
          <div className="col-12">
            <div className="card lms-create-card lms-public-panel">
              <div className="card-header fw-semibold py-3">Custom fields</div>
              <div className="card-body pt-3">
                <LeadCustomFieldsEditor
                  readOnly
                  value={lead.customFields}
                  compact
                  showInnerTitle={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
