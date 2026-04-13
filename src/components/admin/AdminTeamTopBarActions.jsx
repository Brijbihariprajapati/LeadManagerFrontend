'use client';

import { useState } from 'react';
import AdminCreateUserModal from '@/components/admin/AdminCreateUserModal';

function IconPlus({ className = '' }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function AdminTeamTopBarActions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 lms-admin-create-user-trigger"
        onClick={() => setOpen(true)}
      >
        <IconPlus />
        <span>Create user</span>
      </button>
      <AdminCreateUserModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
