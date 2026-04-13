'use client';

import { interestBadgeClass } from '@/utils/status';

function creatorLabel(lead) {
  const c = lead.createdBy;
  if (typeof c === 'object' && c?.name) return c.name;
  return '—';
}

/** Read-only admin dashboard lead tile: headline row + email / creator only. */
export default function AdminLeadCard({ lead }) {
  const interest = lead.interest || 'Interested';

  return (
    <article className="card lms-lead-mini-card h-100 lms-admin-lead-card">
      <div className="card-body d-flex flex-column">
        <div className="lms-admin-lead-card__head">
          <span className="lms-admin-lead-card__eyebrow">Lead</span>
          <h3 className="lms-admin-lead-card__name text-break">{lead.name}</h3>
          <span className={interestBadgeClass(interest)}>{interest}</span>
        </div>
        <dl className="lms-admin-lead-card__meta mb-0">
          <div className="lms-admin-lead-card__row">
            <dt>Source</dt>
            <dd>{lead.sourceName?.trim() ? lead.sourceName.trim() : '—'}</dd>
          </div>
          <div className="lms-admin-lead-card__row">
            <dt>Email</dt>
            <dd className="text-break">{lead.email?.trim() || '—'}</dd>
          </div>
          <div className="lms-admin-lead-card__row">
            <dt>Created by</dt>
            <dd>{creatorLabel(lead)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
