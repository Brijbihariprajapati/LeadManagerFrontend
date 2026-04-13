'use client';

import CreateLeadForm from '@/components/CreateLeadForm';

/**
 * Isolated “Create lead” block — sits above the leads table in scrollable main content.
 */
export default function CreateLeadSection({ onCreated }) {
  return (
    <section className="lms-panel lms-panel--create" aria-label="Create a new lead">
      <CreateLeadForm onCreated={onCreated} />
    </section>
  );
}
