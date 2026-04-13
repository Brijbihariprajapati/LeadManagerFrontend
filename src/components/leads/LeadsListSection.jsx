'use client';

import LeadsTable from '@/components/LeadsTable';

/**
 * Searchable leads table — separate from create form for clarity and layout.
 * @param {'default' | 'tab' | 'hidden'} headingVariant — `tab`/`hidden`: visually hidden H2 for a11y only.
 */
export default function LeadsListSection({
  title = 'My leads',
  readOnly = false,
  onRefresh,
  tableKey = 0,
  headingVariant = 'default',
  mineOnly = true,
}) {
  const headingId = 'section-leads-list-heading';
  const hideHeading = headingVariant === 'tab' || headingVariant === 'hidden';

  return (
    <section className="lms-panel lms-panel--leads-table" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={hideHeading ? 'visually-hidden' : 'h5 lms-section-title mb-3'}
      >
        {title}
      </h2>
      <LeadsTable key={tableKey} readOnly={readOnly} onRefresh={onRefresh} mineOnly={mineOnly} />
    </section>
  );
}
