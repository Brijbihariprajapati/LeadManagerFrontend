import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import {
  INTEREST_OPTIONS,
  PIPELINE_OPTIONS,
  PIPELINE_OPTIONS_ACTIVE,
  interestBadgeClass,
  interestSelectClass,
  pipelineBadgeClass,
  pipelineSelectClass,
} from '@/utils/status';
import { formatLeadDateTime } from '@/utils/dateFormat';
import { LeadsTableSkeletonRows } from '@/components/leads/LeadsTableSkeleton';
import LeadSourceFilterSelect from '@/components/leads/LeadSourceFilterSelect';
import { safeLeadsArray, safePagination } from '@/lib/apiSafe';

const PAGE_SIZE = 20;

function creatorName(lead) {
  const c = lead.createdBy;
  if (typeof c === 'object' && c?.name) return c.name;
  return '—';
}

function leadInterest(lead) {
  return lead.interest || 'Interested';
}

function leadPipeline(lead) {
  return lead.pipeline || 'Pending';
}

function leadSourceLabel(lead) {
  const s = lead.sourceName;
  if (s != null && String(s).trim() !== '') return String(s).trim();
  return '—';
}

/**
 * @param {'full' | 'manage'} variant — manage: leads you created (`mine=1`), fewer columns
 * @param {boolean} readOnly — Admin: view only
 */
export default function LeadsTable({
  readOnly = false,
  onRefresh,
  variant = 'full',
  mineOnly = false,
}) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const filterRef = useRef({ search: '', interestFilter: '', pipelineFilter: '', sourceFilter: '' });
  const nextPageRef = useRef(1);
  const loadMoreSentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const paginationRef = useRef(pagination);
  const initialLoadingRef = useRef(initialLoading);

  const isManage = variant === 'manage';
  const rowNavigate = !readOnly;

  const hasMore = pagination.pages > 0 && pagination.page < pagination.pages;

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);
  useEffect(() => {
    initialLoadingRef.current = initialLoading;
  }, [initialLoading]);

  const goLeadDetail = useCallback(
    (id) => {
      navigate(`/leads/${id}`);
    },
    [navigate]
  );

  const buildParams = useCallback(
    (pageNum) => ({
      page: pageNum,
      limit: PAGE_SIZE,
      search: search || undefined,
      interest: interestFilter || undefined,
      pipeline: pipelineFilter || undefined,
      source: sourceFilter || undefined,
      mine: mineOnly ? '1' : undefined,
    }),
    [search, interestFilter, pipelineFilter, sourceFilter, mineOnly]
  );

  const fetchFirstPage = useCallback(async () => {
    setInitialLoading(true);
    nextPageRef.current = 1;
    try {
      const data = await api.getLeads(buildParams(1));
      const list = safeLeadsArray(data);
      setLeads(list);
      const pag = safePagination(data, PAGE_SIZE);
      setPagination(pag);
      paginationRef.current = pag;
      nextPageRef.current = pag.page + 1;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setInitialLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (initialLoadingRef.current || loadingMoreRef.current) return;
    const pag = paginationRef.current;
    if (pag.pages <= 0 || pag.page >= pag.pages) return;

    const p = nextPageRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await api.getLeads(buildParams(p));
      const list = safeLeadsArray(data);
      setLeads((prev) => [...prev, ...list]);
      const pag = safePagination(data, PAGE_SIZE);
      setPagination(pag);
      paginationRef.current = pag;
      nextPageRef.current = pag.page + 1;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load leads');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const prev = filterRef.current;
    const filterChanged =
      prev.search !== search ||
      prev.interestFilter !== interestFilter ||
      prev.pipelineFilter !== pipelineFilter ||
      prev.sourceFilter !== sourceFilter;
    filterRef.current = { search, interestFilter, pipelineFilter, sourceFilter };

    const delay =
      filterChanged && (search || interestFilter || pipelineFilter || sourceFilter) ? 320 : 0;
    const t = setTimeout(() => {
      void fetchFirstPage();
    }, delay);
    return () => clearTimeout(t);
  }, [search, interestFilter, pipelineFilter, sourceFilter, mineOnly, fetchFirstPage]);

  useEffect(() => {
    if (initialLoading) return undefined;
    const el = loadMoreSentinelRef.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (initialLoadingRef.current || loadingMoreRef.current) return;
        const p = paginationRef.current;
        if (p.pages <= 0 || p.page >= p.pages) return;
        void loadMore();
      },
      { root: null, rootMargin: '120px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [initialLoading, loadMore, pagination.page, pagination.pages]);

  const reloadAfterMutation = useCallback(() => {
    void fetchFirstPage();
    onRefresh?.();
  }, [fetchFirstPage, onRefresh]);

  const onOutcomeChange = async (lead, interest, pipeline) => {
    try {
      await api.updateLeadOutcome(lead._id, { interest, pipeline });
      toast.success('Updated');
      reloadAfterMutation();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  const onInterestChange = (lead, newInterest) => {
    let pipeline = leadPipeline(lead);
    if (newInterest === 'Not Interested') {
      pipeline = 'Not pursuing';
    } else if (pipeline === 'Not pursuing') {
      pipeline = 'Pending';
    }
    return onOutcomeChange(lead, newInterest, pipeline);
  };

  const onPipelineChange = (lead, newPipeline) => {
    return onOutcomeChange(lead, leadInterest(lead), newPipeline);
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this lead permanently?')) return;
    try {
      await api.deleteLead(id);
      toast.success('Lead removed');
      reloadAfterMutation();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const colCount = isManage ? 8 : readOnly ? 9 : 10;

  const pipelineChoices = (interest) =>
    interest === 'Not Interested' ? ['Not pursuing'] : PIPELINE_OPTIONS_ACTIVE;

  const showSkeletonInitial = initialLoading && leads.length === 0;
  const showEmpty = !initialLoading && leads.length === 0;

  return (
    <div className="lms-leads-table-root">
      <div className="row g-2 mb-3">
        <div className="col-12 col-lg-3">
          <input
            type="search"
            className="form-control"
            placeholder="Search name, email, source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <select
            className="form-select"
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
          >
            <option value="">All interest levels</option>
            {INTEREST_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <select
            className="form-select"
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
          >
            <option value="">All deal stages</option>
            {PIPELINE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <LeadSourceFilterSelect value={sourceFilter} onChange={setSourceFilter} />
        </div>
      </div>

      {isManage && (
        <p className="small text-muted mb-2">
          Showing leads <strong>you created</strong>. Update <strong>interest status</strong> and{' '}
          <strong>deal stage</strong> to match follow-ups, meetings, and next steps.
        </p>
      )}

      <div className="table-responsive lms-card lms-data-table">
        <table className="table table-hover align-middle mb-0 lms-table-leads">
          <thead className="lms-table-head">
            <tr>
              <th>Lead name</th>
              <th>Source</th>
              <th>Email</th>
              <th>Interest status</th>
              <th>Deal stage</th>
              <th>Proposal</th>
              {!isManage && <th>Added by</th>}
              <th>Last updated</th>
              {!readOnly && !isManage && (
                <th className="text-center lms-th-action" title="Delete lead">
                  Action
                </th>
              )}
              <th className="lms-th-sr text-center">Sr. No.</th>
            </tr>
          </thead>
          <tbody>
            {showSkeletonInitial && <LeadsTableSkeletonRows rows={10} cols={colCount} />}
            {showEmpty && (
              <tr>
                <td colSpan={colCount} className="text-center py-4 text-muted">
                  No leads match your filters.
                </td>
              </tr>
            )}
            {!showSkeletonInitial &&
              leads.map((lead, idx) => {
                const interest = leadInterest(lead);
                const pipeline = leadPipeline(lead);
                const serial = idx + 1;
                return (
                  <tr
                    key={lead._id}
                    className={rowNavigate ? 'lms-leads-row--clickable' : undefined}
                    tabIndex={rowNavigate ? 0 : undefined}
                    role={rowNavigate ? 'button' : undefined}
                    onClick={() => rowNavigate && goLeadDetail(lead._id)}
                    onKeyDown={(e) => {
                      if (!rowNavigate) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goLeadDetail(lead._id);
                      }
                    }}
                  >
                    <td className="lms-td-name">
                      <span className="lms-td-ellipsis fw-medium" title={lead.name || ''}>
                        {lead.name}
                      </span>
                    </td>
                    <td className="small lms-td-source">
                      <span className="lms-td-ellipsis" title={leadSourceLabel(lead)}>
                        {leadSourceLabel(lead)}
                      </span>
                    </td>
                    <td className="small lms-td-contact">
                      {lead.email ? (
                        <div className="lms-td-ellipsis" title={lead.email}>
                          {lead.email}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="lms-td-interest" onClick={(e) => e.stopPropagation()}>
                      {readOnly ? (
                        <span className={`${interestBadgeClass(interest)} lms-inline-pill-ellipsis`} title={interest}>
                          {interest}
                        </span>
                      ) : (
                        <select
                          className={`form-select form-select-sm lms-table-td-select ${interestSelectClass(interest)}`}
                          value={interest}
                          onChange={(e) => onInterestChange(lead, e.target.value)}
                          aria-label={`Interest status for ${lead.name}`}
                        >
                          {INTEREST_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="lms-td-pipeline" onClick={(e) => e.stopPropagation()}>
                      {readOnly ? (
                        <span className={`${pipelineBadgeClass(pipeline)} lms-inline-pill-ellipsis`} title={pipeline}>
                          {pipeline}
                        </span>
                      ) : (
                        <select
                          className={`form-select form-select-sm lms-table-td-select ${pipelineSelectClass(pipeline)}`}
                          value={interest === 'Not Interested' ? 'Not pursuing' : pipeline}
                          onChange={(e) => onPipelineChange(lead, e.target.value)}
                          disabled={interest === 'Not Interested'}
                          aria-label={`Deal stage for ${lead.name}`}
                        >
                          {pipelineChoices(interest).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="small text-nowrap lms-td-proposal">
                      {lead.hasProposal ? (
                        <span className="text-success">Proposal created</span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    {!isManage && (
                      <td className="small lms-td-created-by">
                        <span className="lms-td-ellipsis" title={creatorName(lead)}>
                          {creatorName(lead)}
                        </span>
                      </td>
                    )}
                    <td className="small text-muted lms-td-updated">
                      {lead.updatedAt ? formatLeadDateTime(lead.updatedAt) : '—'}
                    </td>
                    {!readOnly && !isManage && (
                      <td className="text-center lms-td-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger lms-btn-icon-td"
                          onClick={() => onDelete(lead._id)}
                          aria-label={`Delete ${lead.name || 'lead'}`}
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    )}
                    <td className="lms-td-sr text-muted small text-center">{serial}</td>
                  </tr>
                );
              })}
            {loadingMore && !showSkeletonInitial && (
              <LeadsTableSkeletonRows rows={3} cols={colCount} />
            )}
          </tbody>
        </table>
      </div>

      <div ref={loadMoreSentinelRef} className="lms-infinite-sentinel" aria-hidden style={{ height: 1 }} />

      {!showSkeletonInitial && leads.length > 0 && (
        <p className="text-muted small mt-2 mb-0">
          Showing {leads.length} of {pagination.total} leads
          {hasMore ? ' · Scroll for more' : ''}
        </p>
      )}
    </div>
  );
}
