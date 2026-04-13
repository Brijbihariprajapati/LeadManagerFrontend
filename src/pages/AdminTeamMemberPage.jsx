import { Suspense } from 'react';
import TeamUserDetail from '@/components/admin/TeamUserDetail';

function Fallback() {
  return (
    <div className="container-fluid px-3 px-xl-4 lms-page py-4">
      <p className="text-muted mb-0">Loading…</p>
    </div>
  );
}

export default function AdminTeamMemberPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <TeamUserDetail />
    </Suspense>
  );
}
