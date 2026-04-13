'use client';

import LeadsTable from '@/components/LeadsTable';

/**
 * Leads you created — quick updates to interest + pipeline.
 */
export default function ManageLeadsSection({ onRefresh, tableKey = 0 }) {
  return (
    <section className="lms-panel lms-panel--manage" aria-labelledby="manage-leads-heading">
      <h2 id="manage-leads-heading" className="h5 lms-section-title mb-2">
        Manage your leads
      </h2>
      <p className="text-muted small mb-3">
        Only leads <strong>you created</strong>. Set <strong>Interest</strong> (yes/no) and{' '}
        <strong>Pipeline</strong> (follow-up, meeting scheduled, confirmed, proposal, etc.) like a real
        sales workflow.
      </p>
      <LeadsTable
        key={tableKey}
        onRefresh={onRefresh}
        variant="manage"
        mineOnly
        readOnly={false}
      />
    </section>
  );
}
