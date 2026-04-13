import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import { normalizeProposalDoc } from '@/utils/proposalNormalize';
import { useAuth } from '@/components/Providers';
import {
  INTEREST_OPTIONS,
  PIPELINE_OPTIONS_ACTIVE,
  interestBadgeClass,
  interestSelectClass,
  pipelineBadgeClass,
  pipelineSelectClass,
} from '@/utils/status';
import { formatLeadDateTime } from '@/utils/dateFormat';
import LeadCustomFieldsEditor from '@/components/leads/LeadCustomFieldsEditor';
import SourceNameAutocomplete from '@/components/leads/SourceNameAutocomplete';
import { safeLeadRecord } from '@/lib/apiSafe';

function creatorName(lead) {
  const c = lead.createdBy;
  if (typeof c === 'object' && c?.name) return c.name;
  return '—';
}

function creatorId(lead) {
  const c = lead?.createdBy;
  if (c == null) return null;
  if (typeof c === 'object' && c._id != null) return String(c._id);
  return String(c);
}

function naVal(v) {
  if (v == null || String(v).trim() === '') return 'N/A';
  return String(v).trim();
}

function emptyDraft() {
  return {
    name: '',
    email: '',
    phone: '',
    interest: 'Interested',
    pipeline: 'Pending',
    notes: '',
    sourceName: '',
    clientBudget: 'N/A',
    ourPitch: 'N/A',
    customFields: [],
  };
}

function draftMatchesLead(draft, lead) {
  if (!lead || !draft) return true;
  const a = JSON.stringify(draft.customFields || []);
  const b = JSON.stringify(Array.isArray(lead.customFields) ? lead.customFields : []);
  return (
    (draft.name || '').trim() === (lead.name || '').trim() &&
    (draft.email || '').trim() === (lead.email || '').trim() &&
    (draft.phone || '').trim() === (lead.phone || '').trim() &&
    draft.interest === (lead.interest || 'Interested') &&
    draft.pipeline === (lead.pipeline || 'Pending') &&
    (draft.notes || '') === (lead.notes ?? '') &&
    (draft.sourceName || '').trim() === (lead.sourceName || '').trim() &&
    naVal(draft.clientBudget) === naVal(lead.clientBudget) &&
    naVal(draft.ourPitch) === naVal(lead.ourPitch) &&
    a === b
  );
}

function DetailField({ label, children, mono }) {
  return (
    <div className="lms-detail-field">
      <div className="lms-detail-field__label">{label}</div>
      <div className={`lms-detail-field__value ${mono ? 'lms-detail-field__value--mono' : ''}`}>{children}</div>
    </div>
  );
}

export default function LeadDetailView({ leadId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [savingEdit, setSavingEdit] = useState(false);
  const [proposalExists, setProposalExists] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalJsonDraft, setProposalJsonDraft] = useState('');
  const [savingProposal, setSavingProposal] = useState(false);
  const proposalModalTitleId = useId();

  const canEdit = useMemo(() => {
    if (!user || !lead) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'user') return creatorId(lead) === String(user.id);
    return false;
  }, [user, lead]);

  const readOnly = !canEdit;
  const editDirty = editMode && !draftMatchesLead(draft, lead);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLead(leadId);
      const leadObj = safeLeadRecord(data);
      if (!leadObj) {
        toast.error('Lead not found');
        navigate('/leads');
        return;
      }
      setLead(leadObj);
      try {
        const pr = await api.getLeadProposal(leadId);
        setProposalExists(Boolean(pr.success && pr.proposal));
      } catch {
        setProposalExists(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load lead');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  }, [leadId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setEditMode(false);
  }, [leadId]);

  const refresh = () => {
    void load();
  };

  const beginEdit = () => {
    if (!lead || !canEdit) return;
    setDraft({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      interest: lead.interest || 'Interested',
      pipeline: lead.pipeline || 'Pending',
      notes: lead.notes ?? '',
      sourceName: lead.sourceName ?? '',
      clientBudget: naVal(lead.clientBudget),
      ourPitch: naVal(lead.ourPitch),
      customFields: Array.isArray(lead.customFields)
        ? lead.customFields.map((x) => ({ ...x }))
        : [],
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const applyDraftOutcome = (interest, pipeline) => {
    setDraft((d) => ({ ...d, interest, pipeline }));
  };

  const onDraftInterestChange = (interest) => {
    if (interest === 'Not Interested') {
      applyDraftOutcome('Not Interested', 'Not pursuing');
    } else {
      setDraft((d) => {
        const pipe =
          d.pipeline === 'Not pursuing' ? 'Pending' : d.pipeline || 'Pending';
        return { ...d, interest, pipeline: pipe };
      });
    }
  };

  const onDraftPipelineChange = (pipeline) => {
    setDraft((d) => ({ ...d, pipeline }));
  };

  const onSaveEdit = async () => {
    if (!lead || !canEdit || !editMode) return;
    const payload = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      interest: draft.interest,
      pipeline: draft.pipeline,
      notes: draft.notes,
      sourceName: draft.sourceName.trim(),
      clientBudget: draft.clientBudget.trim() || 'N/A',
      ourPitch: draft.ourPitch.trim() || 'N/A',
      customFields: draft.customFields
        .filter((r) => r.label.trim() || r.value.trim())
        .map((r) => ({
          id: r.id,
          label: r.label.trim(),
          value: r.value.trim(),
        })),
    };
    if (!payload.name) {
      toast.error('Name is required');
      return;
    }
    if (!payload.email && !payload.phone) {
      toast.error('Provide at least email or phone');
      return;
    }
    setSavingEdit(true);
    try {
      await api.updateLead(lead._id, payload);
      toast.success('Lead saved');
      setEditMode(false);
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save lead');
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async () => {
    if (!lead || !canEdit) return;
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return;
    try {
      await api.deleteLead(lead._id);
      toast.success('Lead removed');
      navigate('/leads');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const openProposalModal = async () => {
    setProposalModalOpen(true);
    if (proposalExists) {
      setProposalJsonDraft('');
      try {
        const pr = await api.getLeadProposal(leadId);
        if (pr.success && pr.proposal?.data != null) {
          setProposalJsonDraft(JSON.stringify(pr.proposal.data, null, 2));
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not load proposal');
      }
    } else {
      setProposalJsonDraft('');
    }
  };

  const onProposalModalDone = async () => {
    if (!lead || !canEdit) return;
    let parsed;
    try {
      parsed = JSON.parse(proposalJsonDraft.trim());
    } catch {
      toast.error('Invalid JSON');
      return;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      toast.error('Proposal must be a JSON object (not an array)');
      return;
    }
    const normalized = normalizeProposalDoc(parsed);
    setSavingProposal(true);
    try {
      await api.saveLeadProposal(lead._id, normalized);
      toast.success('Proposal saved');
      setProposalExists(true);
      setProposalModalOpen(false);
      setProposalJsonDraft('');
      navigate(`/leads/${lead._id}/proposal/preview`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save proposal');
    } finally {
      setSavingProposal(false);
    }
  };

  if (loading || !lead) {
    return (
      <div className="container-fluid px-3 px-xl-4 lms-page lms-lead-detail py-4">
        <div className="lms-detail-skeleton placeholder-glow">
          <span className="placeholder col-6 col-md-4 mb-3 d-block rounded-2" style={{ height: 14 }} />
          <span className="placeholder col-10 col-md-6 mb-4 d-block rounded-2" style={{ height: 36 }} />
          <div className="row g-3">
            <div className="col-md-6">
              <span className="placeholder w-100 rounded-3 d-block" style={{ height: 180 }} />
            </div>
            <div className="col-md-6">
              <span className="placeholder w-100 rounded-3 d-block" style={{ height: 180 }} />
            </div>
            <div className="col-12">
              <span className="placeholder w-100 rounded-3 d-block" style={{ height: 220 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summary =
    editMode && canEdit
      ? `${draft.interest || 'Interested'} · ${draft.pipeline || 'Pending'}`
      : lead.displayLabel || `${lead.interest || 'Interested'} · ${lead.pipeline || 'Pending'}`;

  const glancePhone =
    editMode && canEdit ? draft.phone?.trim() || '—' : lead.phone?.trim() || '—';
  const glancePipeline =
    editMode && canEdit ? draft.pipeline || 'Pending' : lead.pipeline || 'Pending';
  const glanceNotesPreview = (() => {
    const raw = editMode && canEdit ? draft.notes ?? '' : lead.notes ?? '';
    const t = String(raw).trim();
    if (!t) return '—';
    return t.length > 80 ? `${t.slice(0, 80)}…` : t;
  })();

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-lead-detail py-3">
      <nav
        className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 lms-lead-detail__toolbar"
        aria-label="Lead navigation"
      >
        <Link to="/leads" className="small lms-lead-detail__back d-inline-flex align-items-center gap-1">
          <span aria-hidden>←</span> Back to leads
        </Link>
        {canEdit && (
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 ms-auto">
            {!editMode ? (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => beginEdit()}>
                  Edit
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDelete()}>
                  Delete lead
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={savingEdit || !editDirty}
                  onClick={() => onSaveEdit()}
                >
                  {savingEdit ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={savingEdit}
                  onClick={() => cancelEdit()}
                >
                  Cancel
                </button>
                {editDirty && (
                  <span className="badge rounded-pill text-bg-warning text-dark fw-semibold">Unsaved changes</span>
                )}
              </>
            )}
          </div>
        )}
      </nav>

      <header className="lms-hero lms-hero--user lms-detail-hero mb-4">
        <div className="lms-detail-hero__headrow">
          <p className="small text-uppercase fw-bold text-secondary mb-0 lms-hero__eyebrow">Lead</p>
          {editMode && canEdit ? (
            <input
              type="text"
              className="form-control form-control-lg lms-detail-hero__name-input mb-2"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              aria-label="Lead name"
            />
          ) : (
            <h1 className="h3 mb-0 lms-hero__title text-break lms-detail-hero__name">{lead.name}</h1>
          )}
          <div className="lms-detail-hero__chips">
            <span className="lms-detail-chip" title="Current summary">
              {summary}
            </span>
          </div>
        </div>
        <p className="text-muted small mb-0 lms-detail-hero__hint mt-2">
          {readOnly
            ? 'View-only — you can only edit leads you created.'
            : editMode
              ? 'Change any field below, then Save — or Cancel to discard.'
              : 'Click Edit to change contact details, status, notes, and custom fields.'}
        </p>
      </header>

      <section className="lms-public-at-a-glance lms-detail-at-a-glance mb-4" aria-label="Lead summary">
        <div className="row g-2 g-md-3">
          <div className="col-6 col-lg-3">
            <div className="lms-public-glance-item">
              <div className="lms-public-glance-item__label">Phone</div>
              <div className="lms-public-glance-item__value text-break">{glancePhone}</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="lms-public-glance-item">
              <div className="lms-public-glance-item__label">Deal stage</div>
              <div className="lms-public-glance-item__value">
                <span className={pipelineBadgeClass(glancePipeline)}>{glancePipeline}</span>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="lms-public-glance-item">
              <div className="lms-public-glance-item__label">Last updated</div>
              <div className="lms-public-glance-item__value lms-public-glance-item__value--mono">
                {lead.updatedAt ? formatLeadDateTime(lead.updatedAt) : '—'}
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="lms-public-glance-item">
              <div className="lms-public-glance-item__label">Notes</div>
              <div className="lms-public-glance-item__value lms-public-glance-notes-preview">{glanceNotesPreview}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card lms-create-card mb-4" aria-label="Proposal">
        <div className="card-body py-3 d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold me-1">Proposal</span>
          {canEdit && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void openProposalModal()}>
              {proposalExists ? 'Edit proposal' : 'Create proposal'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={!proposalExists}
            onClick={() => navigate(`/leads/${lead._id}/proposal/preview`)}
          >
            View proposal
          </button>
          {!proposalExists && (
            <span className="small text-muted ms-md-2">Save a proposal first to view it here.</span>
          )}
        </div>
      </section>

      <div className="row g-4 lms-detail-grid">
        <div className="col-lg-5">
          <section className="card lms-create-card lms-detail-section h-100" aria-labelledby="detail-contact-heading">
            <div className="card-header lms-detail-section__head" id="detail-contact-heading">
              <span className="lms-detail-section__mark lms-detail-section__mark--blue" aria-hidden />
              Contact &amp; ownership
            </div>
            <div className="card-body lms-detail-section__body">
              {readOnly || !editMode ? (
                <>
                  <DetailField label="Source name">
                    {lead.sourceName?.trim() ? lead.sourceName.trim() : '—'}
                  </DetailField>
                  <DetailField label="Email">{lead.email?.trim() ? lead.email : '—'}</DetailField>
                  <DetailField label="Phone">{lead.phone?.trim() ? lead.phone : '—'}</DetailField>
                  <DetailField label="Added by">{creatorName(lead)}</DetailField>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label lms-form-label mb-1" htmlFor="detail-source-name">
                      Source name
                    </label>
                    <SourceNameAutocomplete
                      id="detail-source-name"
                      value={draft.sourceName}
                      onChange={(v) => setDraft((d) => ({ ...d, sourceName: v }))}
                    />
                    <p className="small text-muted mb-0 mt-1">Visible to everyone on lead lists.</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label lms-form-label mb-1" htmlFor="detail-email">
                      Email
                    </label>
                    <input
                      id="detail-email"
                      type="email"
                      className="form-control"
                      value={draft.email}
                      onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label lms-form-label mb-1" htmlFor="detail-phone">
                      Phone
                    </label>
                    <input
                      id="detail-phone"
                      type="tel"
                      className="form-control"
                      value={draft.phone}
                      onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <DetailField label="Added by">{creatorName(lead)}</DetailField>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="col-lg-7">
          <section className="card lms-create-card lms-detail-section h-100" aria-labelledby="detail-status-heading">
            <div className="card-header lms-detail-section__head" id="detail-status-heading">
              <span className="lms-detail-section__mark lms-detail-section__mark--amber" aria-hidden />
              Interest &amp; deal stage
            </div>
            <div className="card-body lms-detail-section__body">
              {readOnly || !editMode ? (
                <dl className="mb-0">
                  <dt className="small text-muted mb-1">Interest status</dt>
                  <dd className="mb-3">
                    <span className={interestBadgeClass(lead.interest || 'Interested')}>
                      {lead.interest || 'Interested'}
                    </span>
                  </dd>
                  <dt className="small text-muted mb-1">Deal stage</dt>
                  <dd className="mb-0">
                    <span className={pipelineBadgeClass(lead.pipeline || 'Pending')}>
                      {lead.pipeline || 'Pending'}
                    </span>
                  </dd>
                </dl>
              ) : (
                <>
                  <p className="small text-muted mb-3 lms-detail-hint">
                    <strong>Interest</strong> is whether they want to proceed. <strong>Deal stage</strong> is where they
                    are in your process (follow-up, meeting, proposal, etc.).
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label lms-form-label mb-1" htmlFor="detail-interest">
                        Interest status
                      </label>
                      <select
                        id="detail-interest"
                        className={`form-select lms-detail-select ${interestSelectClass(draft.interest || 'Interested')}`}
                        value={draft.interest || 'Interested'}
                        onChange={(e) => onDraftInterestChange(e.target.value)}
                      >
                        {INTEREST_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label lms-form-label mb-1" htmlFor="detail-pipeline">
                        Deal stage
                      </label>
                      <select
                        id="detail-pipeline"
                        className={`form-select lms-detail-select ${pipelineSelectClass(draft.pipeline || 'Pending')}`}
                        value={draft.interest === 'Not Interested' ? 'Not pursuing' : draft.pipeline || 'Pending'}
                        onChange={(e) => onDraftPipelineChange(e.target.value)}
                        disabled={draft.interest === 'Not Interested'}
                      >
                        {(draft.interest === 'Not Interested' ? ['Not pursuing'] : PIPELINE_OPTIONS_ACTIVE).map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="col-12">
          <section
            className="card lms-create-card lms-detail-section"
            aria-labelledby="detail-budget-pitch-heading"
          >
            <div className="card-header lms-detail-section__head" id="detail-budget-pitch-heading">
              <span className="lms-detail-section__mark lms-detail-section__mark--slate" aria-hidden />
              Client budget &amp; our pitch
            </div>
            <div className="card-body lms-detail-section__body">
              <p className="small text-muted mb-3">
                Visible only to you and admins — not on the public board or for other users in lists.
              </p>
              {readOnly || !editMode ? (
                <div className="row g-3">
                  <div className="col-md-6">
                    <DetailField label="Client budget">{naVal(lead.clientBudget)}</DetailField>
                  </div>
                  <div className="col-md-6">
                    <DetailField label="Our pitch">{naVal(lead.ourPitch)}</DetailField>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label lms-form-label mb-1" htmlFor="detail-client-budget">
                      Client budget
                    </label>
                    <textarea
                      id="detail-client-budget"
                      className="form-control"
                      rows={3}
                      value={draft.clientBudget}
                      onChange={(e) => setDraft((d) => ({ ...d, clientBudget: e.target.value }))}
                      placeholder="N/A"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label lms-form-label mb-1" htmlFor="detail-our-pitch">
                      Our pitch
                    </label>
                    <textarea
                      id="detail-our-pitch"
                      className="form-control"
                      rows={3}
                      value={draft.ourPitch}
                      onChange={(e) => setDraft((d) => ({ ...d, ourPitch: e.target.value }))}
                      placeholder="N/A"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="col-12">
          <section className="card lms-create-card lms-detail-section" aria-labelledby="detail-notes-heading">
            <div className="card-header lms-detail-section__head d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="d-inline-flex align-items-center gap-2">
                <span className="lms-detail-section__mark lms-detail-section__mark--green" aria-hidden />
                <span id="detail-notes-heading">Notes</span>
              </span>
            </div>
            <div className="card-body lms-detail-section__body">
              {readOnly || !editMode ? (
                <div className="lms-notes-readonly text-break">{lead.notes?.trim() ? lead.notes : '—'}</div>
              ) : (
                <div className="lms-notes-editor">
                  <textarea
                    id="detail-notes"
                    className="form-control lms-notes-textarea"
                    rows={12}
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Meetings, requirements, follow-up dates, objections, next steps…"
                    aria-describedby="notes-help"
                  />
                  <p id="notes-help" className="small text-muted mb-0">
                    Visible only inside the app. Included when you click Save in the header.
                  </p>
                  <div className="lms-notes-editor__bar">
                    <span className="small text-muted">{draft.notes.length} characters</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {(canEdit || (Array.isArray(lead.customFields) && lead.customFields.length > 0)) && (
          <div className="col-12">
            <section
              className="card lms-create-card lms-detail-section"
              aria-labelledby="detail-custom-fields-heading"
            >
              <div className="card-header lms-detail-section__head d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="lms-detail-section__mark lms-detail-section__mark--slate" aria-hidden />
                  <span id="detail-custom-fields-heading">Custom fields</span>
                </span>
              </div>
              <div className="card-body lms-detail-section__body">
                {readOnly || !editMode ? (
                  <LeadCustomFieldsEditor
                    readOnly
                    value={lead.customFields || []}
                    compact
                    showInnerTitle={false}
                  />
                ) : (
                  <LeadCustomFieldsEditor
                    idPrefix="detail-cf"
                    value={draft.customFields}
                    onChange={(next) => setDraft((d) => ({ ...d, customFields: next }))}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {proposalModalOpen && (
        <div
          className="modal show d-block lms-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={proposalModalTitleId}
          onClick={() => !savingProposal && setProposalModalOpen(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-body border border-secondary">
              <div className="modal-header border-secondary">
                <h2 id={proposalModalTitleId} className="modal-title h5 mb-0">
                  {proposalExists ? 'Edit proposal' : 'Create proposal'}
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  disabled={savingProposal}
                  onClick={() => setProposalModalOpen(false)}
                />
              </div>
              <div className="modal-body pt-0">
                <p className="small text-muted">
                  Paste your proposal JSON below. It will be normalized, saved to this lead, then you can preview and
                  download a PDF.
                </p>
                <label className="form-label small" htmlFor="lms-proposal-json">
                  Proposal JSON
                </label>
                <textarea
                  id="lms-proposal-json"
                  className="form-control font-monospace small"
                  rows={14}
                  value={proposalJsonDraft}
                  onChange={(e) => setProposalJsonDraft(e.target.value)}
                  placeholder='{ "title": "…", "sections": [ … ] }'
                  spellCheck={false}
                />
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={savingProposal}
                  onClick={() => setProposalModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" disabled={savingProposal} onClick={() => onProposalModalDone()}>
                  {savingProposal ? 'Saving…' : 'Save proposal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
