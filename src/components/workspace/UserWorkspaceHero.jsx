'use client';

import { Link } from 'react-router-dom';

export default function UserWorkspaceHero({
  eyebrow = 'Pipeline',
  title = 'Your workspace',
  description = 'Create leads, collaborate on updates, and see who created each record — all in one place.',
  leadsHref = '/leads',
  showLeadsLink = true,
}) {
  return (
    <div className="lms-hero lms-hero--user d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <p className="small text-uppercase fw-bold text-secondary mb-1 lms-hero__eyebrow">{eyebrow}</p>
        <h1 className="h4 mb-2 lms-hero__title">{title}</h1>
        <p className="text-muted small mb-0 lms-hero__desc">{description}</p>
      </div>
      {showLeadsLink && (
        <Link className="btn lms-btn-ghost btn-sm flex-shrink-0" to={leadsHref}>
          Open full table →
        </Link>
      )}
    </div>
  );
}
