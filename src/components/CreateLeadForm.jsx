'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import LeadCustomFieldsEditor from '@/components/leads/LeadCustomFieldsEditor';
import SourceNameAutocomplete from '@/components/leads/SourceNameAutocomplete';
import { INTEREST_OPTIONS, PIPELINE_OPTIONS_ACTIVE } from '@/utils/status';

export default function CreateLeadForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'Interested',
    pipeline: 'Pending',
    notes: '',
    sourceName: '',
    clientBudget: 'N/A',
    ourPitch: 'N/A',
  });
  const [customFields, setCustomFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const setInterest = (interest) => {
    setForm((f) => ({
      ...f,
      interest,
      pipeline:
        interest === 'Not Interested'
          ? 'Not pursuing'
          : f.pipeline === 'Not pursuing'
            ? 'Pending'
            : f.pipeline,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Provide at least an email or phone number');
      return;
    }
    setSubmitting(true);
    try {
      const payloadFields = customFields
        .filter((r) => r.label.trim() || r.value.trim())
        .map((r) => ({
          id: r.id,
          label: r.label.trim(),
          value: r.value.trim(),
        }));
      await api.createLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        interest: form.interest,
        pipeline: form.interest === 'Not Interested' ? 'Not pursuing' : form.pipeline,
        notes: form.notes,
        customFields: payloadFields,
        sourceName: form.sourceName.trim(),
        clientBudget: form.clientBudget.trim() || 'N/A',
        ourPitch: form.ourPitch.trim() || 'N/A',
      });
      toast.success('Lead created');
      setForm({
        name: '',
        email: '',
        phone: '',
        interest: 'Interested',
        pipeline: 'Pending',
        notes: '',
        sourceName: '',
        clientBudget: 'N/A',
        ourPitch: 'N/A',
      });
      setCustomFields([]);
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const pipelineChoices =
    form.interest === 'Not Interested' ? ['Not pursuing'] : PIPELINE_OPTIONS_ACTIVE;

  return (
    <div className="card lms-create-card">
      <div className="card-header d-flex align-items-center gap-2">
        <span className="lms-create-badge">+</span>
        Create new lead
      </div>
      <div className="card-body">
        <form onSubmit={submit}>
          <p className="lms-form-section">Contact details</p>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label lms-form-label" htmlFor="lead-name">
                Name
              </label>
              <input
                id="lead-name"
                className="form-control"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                required
                autoComplete="name"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label lms-form-label" htmlFor="lead-email">
                Email
              </label>
              <input
                id="lead-email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label lms-form-label" htmlFor="lead-phone">
                Phone
              </label>
              <input
                id="lead-phone"
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 …"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label lms-form-label" htmlFor="lead-source-name">
                Source name
              </label>
              <SourceNameAutocomplete
                id="lead-source-name"
                value={form.sourceName}
                onChange={(v) => setForm((f) => ({ ...f, sourceName: v }))}
              />
              <p className="small text-muted mb-0 mt-1">
                Choose a preset or type your own (e.g. Facebook, Google, Reference).
              </p>
            </div>
          </div>

          <p className="lms-form-section">Interest & next step</p>
          <p className="small text-muted mb-3">
            First choose whether the lead is interested; then set the realistic pipeline stage (follow-up,
            meeting, etc.).
          </p>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label lms-form-label" htmlFor="lead-interest">
                Interest
              </label>
              <select
                id="lead-interest"
                className="form-select"
                value={form.interest}
                onChange={(e) => setInterest(e.target.value)}
              >
                {INTEREST_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label lms-form-label" htmlFor="lead-pipeline">
                Pipeline / next step
              </label>
              <select
                id="lead-pipeline"
                className="form-select"
                value={form.interest === 'Not Interested' ? 'Not pursuing' : form.pipeline}
                onChange={(e) => setForm((f) => ({ ...f, pipeline: e.target.value }))}
                disabled={form.interest === 'Not Interested'}
              >
                {pipelineChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label lms-form-label" htmlFor="lead-notes">
              Notes
            </label>
            <textarea
              id="lead-notes"
              className="form-control"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Context, follow-up time, requirements…"
            />
          </div>

          <p className="lms-form-section">Private (creator &amp; admins only)</p>
          <p className="small text-muted mb-3">
            Not shown on the public board or to other team members in lead lists.
          </p>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label lms-form-label" htmlFor="lead-client-budget">
                Client budget
              </label>
              <textarea
                id="lead-client-budget"
                className="form-control"
                rows={2}
                value={form.clientBudget}
                onChange={(e) => setForm((f) => ({ ...f, clientBudget: e.target.value }))}
                placeholder="N/A"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label lms-form-label" htmlFor="lead-our-pitch">
                Our pitch
              </label>
              <textarea
                id="lead-our-pitch"
                className="form-control"
                rows={2}
                value={form.ourPitch}
                onChange={(e) => setForm((f) => ({ ...f, ourPitch: e.target.value }))}
                placeholder="N/A"
              />
            </div>
          </div>

          <div className="mb-4 pt-2 border-top border-secondary">
            <LeadCustomFieldsEditor
              idPrefix="create-cf"
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 pt-1">
            <button type="submit" className="btn lms-btn-create" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create lead'}
            </button>
            <span className="small text-muted">Fields validate before submit.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
