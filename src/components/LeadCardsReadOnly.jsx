'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import { INTEREST_OPTIONS, PIPELINE_OPTIONS } from '@/utils/status';
import AdminLeadCard from '@/components/admin/AdminLeadCard';
import { safeLeadsArray, safePagination } from '@/lib/apiSafe';

/** Admin dashboard: org-wide leads with filters (read-only cards). */
export default function LeadCardsReadOnly() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [page, setPage] = useState(1);
  const filterRef = useRef({ search: '', interestFilter: '', pipelineFilter: '' });
  const leadsRef = useRef([]);
  leadsRef.current = leads;

  const load = useCallback(async (p, s, intF, pipeF, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getLeads({
        page: p,
        limit: 9,
        search: s || undefined,
        interest: intF || undefined,
        pipeline: pipeF || undefined,
      });
      setLeads(safeLeadsArray(data));
      setPagination(safePagination(data, 9));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load leads');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const prev = filterRef.current;
    const filterChanged =
      prev.search !== search ||
      prev.interestFilter !== interestFilter ||
      prev.pipelineFilter !== pipelineFilter;
    filterRef.current = { search, interestFilter, pipelineFilter };

    const pageToUse = filterChanged ? 1 : page;
    if (filterChanged && page !== 1) {
      setPage(1);
    }

    const delay = filterChanged && (search || interestFilter || pipelineFilter) ? 320 : 0;
    const silent = leadsRef.current.length > 0;
    const t = setTimeout(() => {
      void load(pageToUse, search, interestFilter, pipelineFilter, silent);
    }, delay);
    return () => clearTimeout(t);
  }, [page, search, interestFilter, pipelineFilter, load]);

  const handlePage = (next) => {
    if (next < 1 || next > pagination.pages) return;
    setPage(next);
  };

  return (
    <div>
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            type="search"
            className="form-control"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
          >
            <option value="">All interest</option>
            {INTEREST_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
          >
            <option value="">All pipeline</option>
            {PIPELINE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && leads.length === 0 && (
        <p className="text-muted py-4 text-center">Loading…</p>
      )}

      {!loading && leads.length === 0 && (
        <p className="text-muted py-4 text-center">No leads to show.</p>
      )}

      <div className="row g-3">
        {leads.map((lead) => (
          <div key={lead._id} className="col-md-6 col-xl-4">
            <AdminLeadCard lead={lead} />
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <nav className="mt-4 d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => handlePage(page - 1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= pagination.pages}
              onClick={() => handlePage(page + 1)}
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
