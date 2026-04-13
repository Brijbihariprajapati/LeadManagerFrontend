'use client';

import { useEffect, useState } from 'react';
import LeadsListSection from '@/components/leads/LeadsListSection';
import { LMS_USER_LEADS_REFRESH } from '@/lib/adminEvents';

/** /leads — my leads table only (create from header). */
export default function LeadsHubContent() {
  const [tableKey, setTableKey] = useState(0);

  useEffect(() => {
    const bump = () => setTableKey((k) => k + 1);
    window.addEventListener(LMS_USER_LEADS_REFRESH, bump);
    return () => window.removeEventListener(LMS_USER_LEADS_REFRESH, bump);
  }, []);

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-user-dashboard py-1">
      <LeadsListSection
        tableKey={tableKey}
        title="My leads"
        readOnly={false}
        mineOnly
        headingVariant="hidden"
      />
    </div>
  );
}
