'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import SummaryCards from '@/components/SummaryCards';
import LeadsListSection from '@/components/leads/LeadsListSection';
import UserWorkspaceHero from '@/components/workspace/UserWorkspaceHero';
import { LMS_USER_LEADS_REFRESH } from '@/lib/adminEvents';
import { safeSummary } from '@/lib/apiSafe';

/** User dashboard: hero + stats + my leads table (create from header). */
export default function UserDashboardContent() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableKey, setTableKey] = useState(0);

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(safeSummary(data));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refreshAfterLeadChange = useCallback(() => {
    loadSummary();
    setTableKey((k) => k + 1);
  }, [loadSummary]);

  useEffect(() => {
    window.addEventListener(LMS_USER_LEADS_REFRESH, refreshAfterLeadChange);
    return () => window.removeEventListener(LMS_USER_LEADS_REFRESH, refreshAfterLeadChange);
  }, [refreshAfterLeadChange]);

  return (
    <div className="container-fluid px-3 px-xl-4 lms-page lms-user-dashboard py-1">
      <UserWorkspaceHero />

      <SummaryCards summary={summary} loading={loading} />

      <LeadsListSection
        tableKey={tableKey}
        title="My leads"
        readOnly={false}
        mineOnly
        onRefresh={loadSummary}
        headingVariant="default"
      />
    </div>
  );
}
